#!/bin/bash
#
# Lint Python code using flake8
# Generates HTML report and summary output
#
set -e

_log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [LINT] $*"; }

REPORT_DIR="${1:-.}/reports/flake8-html"
mkdir -p "$REPORT_DIR"

_log "Scanning Python files in project-sources..."
PY_FILES=$(find project-sources -type f -name '*.py' 2>/dev/null | sort | tr '\n' ' ')

if [ -z "$PY_FILES" ]; then
  _log "WARNING: No Python files found in project-sources — creating placeholder report"
  python3 -c "
from pathlib import Path
Path('$REPORT_DIR/index.html').write_text(
    '<html><body><h1>No Python files found to lint.</h1></body></html>', encoding='utf-8')"
else
  _log "Running flake8 on $(echo $PY_FILES | wc -w) files..."
  flake8 $PY_FILES --format=html --htmldir="$REPORT_DIR" --statistics --count || true
fi

_log "Report generated at $REPORT_DIR"
