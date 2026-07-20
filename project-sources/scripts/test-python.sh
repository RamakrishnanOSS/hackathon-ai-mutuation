#!/bin/bash
#
# Run Python tests using pytest and collect results
# Generates HTML report, JUnit XML, and summary metrics
#
set -e

REPORT_DIR="${1:-.}/reports"
PYTHON_SRC="${2:-.}"
mkdir -p "$REPORT_DIR/python-sources"

echo "[TEST-PY] Collecting Python test files..."
find "$PYTHON_SRC/project-sources/py-src" "$PYTHON_SRC/mutation-engine/tests" \
  -type f -name '*.py' 2>/dev/null | while read f; do
  cp "$f" "$REPORT_DIR/python-sources/$(basename "$f")"
done

echo "[TEST-PY] Collecting test file list..."
find "$PYTHON_SRC/project-sources/py-src/tests" "$PYTHON_SRC/mutation-engine/tests" \
  -type f \( -name 'test_*.py' -o -name '*_test.py' \) 2>/dev/null | sort > "$REPORT_DIR/pytest-files.txt"

if [ ! -s "$REPORT_DIR/pytest-files.txt" ]; then
  echo "[TEST-PY] No test files found, skipping pytest"
  exit 0
fi

echo "[TEST-PY] Running pytest with HTML and JUnit output..."
python3 -m pytest \
  --html="$REPORT_DIR/pytest-report.html" --self-contained-html \
  --junit-xml="$REPORT_DIR/pytest-junit-report.html" \
  -v --tb=short \
  $(cat "$REPORT_DIR/pytest-files.txt" | tr '\n' ' ') \
  2>&1 | tee "$REPORT_DIR/pytest-run.log" || true

echo "[TEST-PY] Parsing JUnit results for metrics..."
python3 << 'PY'
import xml.etree.ElementTree as ET
import os
from pathlib import Path

total = passed = failed = errors = skipped = 0
junit_file = Path(os.environ.get("REPORT_DIR", "reports")) / "pytest-junit-report.html"
if junit_file.with_suffix(".xml").exists():
    junit_file = junit_file.with_suffix(".xml")

if junit_file.exists():
    try:
        root = ET.parse(junit_file).getroot()
        suites = [root] if root.tag == "testsuite" else root.findall("testsuite")
        for suite in suites:
            total   += int(suite.attrib.get("tests",    0))
            failed  += int(suite.attrib.get("failures", 0))
            errors  += int(suite.attrib.get("errors",   0))
            skipped += int(suite.attrib.get("skipped",  0))
    except Exception as e:
        print(f"Warning: Could not parse JUnit: {e}")

passed = max(total - failed - errors - skipped, 0)
with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as f:
    f.write(f"total={total}\npassed={passed}\nfailed={failed}\nerrors={errors}\nskipped={skipped}\n")
print(f"pytest: total={total} passed={passed} failed={failed}")
PY

echo "[TEST-PY] Pytest complete"
