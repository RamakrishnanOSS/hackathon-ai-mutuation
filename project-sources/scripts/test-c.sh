#!/bin/bash
#
# Compile and run C tests
# Supported Frameworks: assert.h (default), Check, custom
# Generates metrics: files, compile_pass, compile_fail, run_pass, run_fail
#
set +e

_log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [TEST-C] $*"; }

REPORT_DIR="${1:-.}/reports"
PROJECT_ROOT="${2:-.}"
mkdir -p "$REPORT_DIR/c-sources"

_log "Collecting C source files..."
find "$PROJECT_ROOT/project-sources/c-src" -type f \( -name '*.c' -o -name '*.h' \) 2>/dev/null | while read f; do
  cp "$f" "$REPORT_DIR/c-sources/$(basename "$f")"
done

_log "Collecting C test file list..."
find "$PROJECT_ROOT/project-sources/c-src/test" -type f -name 'test_*.c' | sort > "$REPORT_DIR/c-test-files.txt"

if [ ! -s "$REPORT_DIR/c-test-files.txt" ]; then
  echo "::error::[TEST-C] No C test files discovered in project-sources/c-src/test/" >&2
  echo "::error::Ensure test files follow naming convention: test_*.c" >&2
  exit 1
fi

_log "Detecting test framework..."
FRAMEWORK="assert.h"
FIRST_TEST=$(head -1 "$REPORT_DIR/c-test-files.txt" 2>/dev/null)
if [ -n "$FIRST_TEST" ] && grep -q '#include.*<check\.h>' "$FIRST_TEST" 2>/dev/null; then
  FRAMEWORK="Check"
fi
_log "Detected framework: $FRAMEWORK"
_log "Test files discovered:"
cat "$REPORT_DIR/c-test-files.txt"

_log "Compiling and running C tests..."
LOG="$REPORT_DIR/c-build.log"; : > "$LOG"
FILES=0; COMPILE_PASS=0; COMPILE_FAIL=0; RUN_PASS=0; RUN_FAIL=0

while read -r TEST_FILE; do
  [ -z "$TEST_FILE" ] && continue
  FILES=$((FILES + 1))
  BASENAME=$(basename "$TEST_FILE")
  STEM="${BASENAME#test_}"; STEM="${STEM%.c}"
  DIR=$(dirname "$TEST_FILE")
  SRC=""; [ -f "$DIR/../src/${STEM}.c" ] && SRC="$DIR/../src/${STEM}.c"
  [ -z "$SRC" ] && [ -f "$DIR/${STEM}.c" ] && SRC="$DIR/${STEM}.c"
  OUT="/tmp/${STEM}_c_test"
  INCLUDES="-I. -I${DIR} -I$(dirname "$DIR") -I$(dirname "$DIR")/include -I$(dirname "$DIR")/src"

  echo "========================================" | tee -a "$LOG"
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] C TEST : $TEST_FILE | SRC: ${SRC:-none}" | tee -a "$LOG"

  if [ -n "$SRC" ]; then
    gcc -std=c11 -Wall $INCLUDES -o "$OUT" "$SRC" "$TEST_FILE" >> "$LOG" 2>&1
  else
    gcc -std=c11 -Wall $INCLUDES -o "$OUT" "$TEST_FILE" >> "$LOG" 2>&1
  fi

  if [ $? -eq 0 ]; then
    COMPILE_PASS=$((COMPILE_PASS + 1))
    echo "[BUILD PASS] $TEST_FILE" | tee -a "$LOG"
    "$OUT" >> "$LOG" 2>&1
    if [ $? -eq 0 ]; then
      RUN_PASS=$((RUN_PASS + 1)); echo "[RUN PASS]" | tee -a "$LOG"
    else
      RUN_FAIL=$((RUN_FAIL + 1)); echo "[RUN FAIL]" | tee -a "$LOG"
    fi
  else
    COMPILE_FAIL=$((COMPILE_FAIL + 1))
    echo "[BUILD FAIL] $TEST_FILE" | tee -a "$LOG"
  fi
done < "$REPORT_DIR/c-test-files.txt"

_log "Summary: files=$FILES compile_pass=$COMPILE_PASS compile_fail=$COMPILE_FAIL run_pass=$RUN_PASS run_fail=$RUN_FAIL"
[ -n "$GITHUB_OUTPUT" ] && { echo "files=$FILES"; echo "compile_pass=$COMPILE_PASS"; echo "compile_fail=$COMPILE_FAIL"
  echo "run_pass=$RUN_PASS"; echo "run_fail=$RUN_FAIL"; } >> "$GITHUB_OUTPUT"

set -e
