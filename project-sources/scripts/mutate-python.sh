#!/bin/bash
#
# Python mutation testing using mutmut
# Scans Python source files for mutations
#
set -e

_log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [MUTATE-PY] $*"; }

SCOPE="${1:-project-sources}"
REPORT_DIR="${2:-.}/reports"
PROJECT_ROOT="${3:-.}"
mkdir -p "$REPORT_DIR/mutants"

_log "Scanning project-sources/py-src for Python files..."
LOG="$REPORT_DIR/mutmut-run.log"; : > "$LOG"

TESTS_DIR="$PROJECT_ROOT/project-sources/py-src/tests"

if [ ! -d "$TESTS_DIR" ]; then
  echo "::error::[MUTATE-PY] Tests directory not found: $TESTS_DIR" >&2
  exit 1
fi

_log "Running mutmut (tests: $TESTS_DIR)..."
python3 -m mutmut run \
  --paths-to-mutate="project-sources/py-src" \
  --tests-dir="$TESTS_DIR" \
  --result-json="$REPORT_DIR/mutmut-results.json" \
  >> "$LOG" 2>&1 || true

_log "Generating results..."
python3 -m mutmut results --json >> "$REPORT_DIR/mutmut-results.log" 2>&1 || true

_log "Parsing mutation metrics..."
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
            (r"\U0001f389\s*(\d+)", "killed"),
            (r"\U0001f641\s*(\d+)", "survived"),
            (r"\u23f0\s*(\d+)", "timeout"),
        ]:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                val = int(m.group(1))
                if key == "killed":   killed   = max(killed,   val)
                if key == "survived": survived = max(survived, val)
                if key == "timeout":  timeout  = max(timeout,  val)

total = killed + survived + timeout
score = round((killed / total) * 100, 2) if total > 0 else 0.0

gh_output = os.environ.get("GITHUB_OUTPUT")
if gh_output:
    with open(gh_output, "a", encoding="utf-8") as f:
        f.write(f"killed={killed}\nsurvived={survived}\ntimeout={timeout}\n")
        f.write(f"total_mutants={total}\nmutation_score={score}\n")
print(f"[MUTATE-PY] killed={killed} survived={survived} timeout={timeout} total={total} score={score}%")
PY

_log "Mutation testing complete"
