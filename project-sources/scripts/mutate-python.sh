#!/bin/bash
#
# Python mutation testing using mutmut
# Scans Python source files for mutations
#
set -e

SCOPE="${1:-project-sources}"
REPORT_DIR="${2:-.}/reports"
PROJECT_ROOT="${3:-.}"
mkdir -p "$REPORT_DIR/mutants"

echo "[MUTATE-PY] Scanning $SCOPE for Python files..."
LOG="$REPORT_DIR/mutmut-run.log"; : > "$LOG"

# Test directory is always project-sources/py-src/tests
TESTS_DIR="$PROJECT_ROOT/project-sources/py-src/tests"

echo "[MUTATE-PY] Running mutmut on project-sources/py-src (tests: $TESTS_DIR)..."
python3 -m mutmut run \
  --paths-to-mutate="project-sources/py-src" \
  --tests-dir="$TESTS_DIR" \
  --result-json="$REPORT_DIR/mutmut-results.json" \
  >> "$LOG" 2>&1 || true

echo "[MUTATE-PY] Generating results..."
python3 -m mutmut results --json >> "$REPORT_DIR/mutmut-results.log" 2>&1 || true

echo "[MUTATE-PY] Parsing mutation metrics..."
python3 << 'PY'
import re, os
from pathlib import Path

killed = survived = timeout = 0
counts_file = Path(os.environ.get("REPORT_DIR", "reports")) / "mutmut-counts.txt"

if counts_file.exists():
    for line in counts_file.read_text().splitlines():
        k, _, v = line.partition("=")
        if v.strip().isdigit():
            if k == "killed":   killed   = int(v)
            if k == "survived": survived = int(v)
            if k == "timeout":  timeout  = int(v)

if killed == 0 and survived == 0:
    log = Path(os.environ.get("REPORT_DIR", "reports")) / "mutmut-run.log"
    if log.exists():
        text = log.read_text(errors="ignore")
        for pat, key in [
            (r"(\d+)\s+killed", "killed"), (r"(\d+)\s+survived", "survived"),
            (r"(\d+)\s+timed?\s*out", "timeout"),
            (r"🎉\s*(\d+)", "killed"), (r"🙁\s*(\d+)", "survived"), (r"⏰\s*(\d+)", "timeout"),
        ]:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                val = int(m.group(1))
                if key == "killed":   killed   = max(killed,   val)
                if key == "survived": survived = max(survived, val)
                if key == "timeout":  timeout  = max(timeout,  val)

total = killed + survived + timeout
score = round((killed / total) * 100, 2) if total > 0 else 0.0

with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as f:
    f.write(f"killed={killed}\nsurvived={survived}\ntimeout={timeout}\n")
    f.write(f"total_mutants={total}\nmutation_score={score}\n")
print(f"Python mutation — killed={killed} survived={survived} timeout={timeout} total={total} score={score}%")
PY

echo "[MUTATE-PY] Mutation testing complete"
