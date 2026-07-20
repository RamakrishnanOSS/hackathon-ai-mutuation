#!/bin/bash
#
# Lint Python code using flake8
# Generates HTML report and summary output
#
set -e

REPORT_DIR="${1:-.}/reports/flake8-html"
mkdir -p "$REPORT_DIR"

echo "[LINT] Scanning Python files in project-sources and mutation-engine..."
PY_FILES=$(find project-sources mutation-engine -type f -name '*.py' 2>/dev/null | sort | tr '\n' ' ')
ROOT_PY=$(find . -maxdepth 1 -type f -name '*.py' 2>/dev/null | sort | tr '\n' ' ')

if [ -z "$PY_FILES$ROOT_PY" ]; then
  echo "[LINT] No Python files found, creating placeholder report"
  python3 -c "
from pathlib import Path
Path('$REPORT_DIR/index.html').write_text(
    '<html><body><h1>No Python files found to lint.</h1></body></html>', encoding='utf-8')"
else
  echo "[LINT] Running flake8 with HTML output..."
  flake8 $PY_FILES $ROOT_PY --format=html --htmldir="$REPORT_DIR" --statistics --count || true
fi

echo "[LINT] Report generated at $REPORT_DIR"
