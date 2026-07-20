#!/bin/bash
#
# Run Python tests using pytest and collect results
# Supported Frameworks: pytest (default), unittest (auto-discovered by pytest)
# Generates HTML report, JUnit XML, and summary metrics
#
set -e

_log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [TEST-PY] $*"; }

REPORT_DIR="${1:-.}/reports"
export REPORT_DIR                  # export so Python subprocess can read it
PYTHON_SRC="${2:-.}"
mkdir -p "$REPORT_DIR/python-sources"

_log "Collecting Python test files..."
find "$PYTHON_SRC/project-sources/py-src" \
  -type f -name '*.py' 2>/dev/null | while read f; do
  cp "$f" "$REPORT_DIR/python-sources/$(basename "$f")"
done

_log "Collecting test file list..."
find "$PYTHON_SRC/project-sources/py-src/tests" \
  -type f \( -name 'test_*.py' -o -name '*_test.py' \) 2>/dev/null | sort > "$REPORT_DIR/pytest-files.txt"

if [ ! -s "$REPORT_DIR/pytest-files.txt" ]; then
  echo "::error::[TEST-PY] No test files discovered in project-sources/py-src/tests/" >&2
  echo "::error::Ensure test files follow naming convention: test_*.py or *_test.py" >&2
  exit 1
fi

NTEST=$(wc -l < "$REPORT_DIR/pytest-files.txt")
_log "Discovered $NTEST test file(s)."

# ── Step 1: JUnit XML only (primary — no extra plugins needed) ────────────
_log "Running pytest for metrics (JUnit XML)..."
python3 -m pytest \
  --junit-xml="$REPORT_DIR/pytest-junit-report.xml" \
  -v --tb=short \
  $(cat "$REPORT_DIR/pytest-files.txt" | tr '\n' ' ') \
  2>&1 | tee "$REPORT_DIR/pytest-run.log" || true

# ── Step 2: HTML report (optional — requires pytest-html) ─────────────────
if python3 -c "import pytest_html" 2>/dev/null; then
  _log "Generating HTML report (pytest-html available)..."
  python3 -m pytest \
    --html="$REPORT_DIR/pytest-report.html" --self-contained-html \
    --no-header -q \
    $(cat "$REPORT_DIR/pytest-files.txt" | tr '\n' ' ') \
    2>/dev/null || true
else
  _log "WARNING: pytest-html not installed, skipping HTML report generation"
fi

# ── Step 3: Parse JUnit XML and write metrics to GITHUB_OUTPUT ───────────
_log "Parsing JUnit results for metrics..."
python3 << 'PY'
import xml.etree.ElementTree as ET
import os
from pathlib import Path

total = passed = failed = errors = skipped = 0
report_dir = os.environ.get("REPORT_DIR", "reports")
junit_file = Path(report_dir) / "pytest-junit-report.xml"

if junit_file.exists():
    try:
        root = ET.parse(junit_file).getroot()
        suites = [root] if root.tag == "testsuite" else root.findall("testsuite")
        for suite in suites:
            total   += int(suite.attrib.get("tests",    0))
            failed  += int(suite.attrib.get("failures", 0))
            errors  += int(suite.attrib.get("errors",   0))
            skipped += int(suite.attrib.get("skipped",  0))
        print(f"JUnit XML parsed: {junit_file}")
    except Exception as exc:
        print(f"WARNING: Could not parse JUnit XML ({junit_file}): {exc}")
else:
    print(f"WARNING: JUnit XML not found at {junit_file} — metrics will be zero")

passed = max(total - failed - errors - skipped, 0)

# Write to GITHUB_OUTPUT (GitHub Actions) or stdout (local)
gh_output = os.environ.get("GITHUB_OUTPUT")
if gh_output:
    with open(gh_output, "a", encoding="utf-8") as fh:
        fh.write(f"total={total}\npassed={passed}\nfailed={failed}\nerrors={errors}\nskipped={skipped}\n")
else:
    print("(local run — GITHUB_OUTPUT not set, metrics not written to step outputs)")

print(f"pytest: total={total} passed={passed} failed={failed} errors={errors} skipped={skipped}")
PY

_log "Pytest complete"
