#!/bin/bash
#
# Compile and run C tests
# Generates metrics: files, compile_pass, compile_fail, run_pass, run_fail
#
set +e

REPORT_DIR="${1:-.}/reports"
PROJECT_ROOT="${2:-.}"
mkdir -p "$REPORT_DIR/c-sources"

echo "[TEST-C] Collecting C source files..."
find "$PROJECT_ROOT/project-sources/c-src" -type f \( -name '*.c' -o -name '*.h' \) 2>/dev/null | while read f; do
  cp "$f" "$REPORT_DIR/c-sources/$(basename "$f")"
done

echo "[TEST-C] Collecting C test file list..."
find "$PROJECT_ROOT/project-sources/c-src/test" -type f -name 'test_*.c' | sort > "$REPORT_DIR/c-test-files.txt"
echo "=== C test files ===" && cat "$REPORT_DIR/c-test-files.txt" || true

echo "[TEST-C] Compiling and running C tests..."
LOG="$REPORT_DIR/c-build.log"; : > "$LOG"
FILES=0; COMPILE_PASS=0; COMPILE_FAIL=0; RUN_PASS=0; RUN_FAIL=0

if [ ! -s "$REPORT_DIR/c-test-files.txt" ]; then
  echo "No C test files discovered." | tee -a "$LOG"
else
  while read -r TEST_FILE; do
    [ -z "$TEST_FILE" ] && continue
    FILES=$((FILES + 1))
    BASENAME=$(basename "$TEST_FILE")
    STEM="${BASENAME#test_}"; STEM="${STEM%.c}"
    DIR=$(dirname "$TEST_FILE")
    SRC=""; [ -f "$DIR/${STEM}.c" ] && SRC="$DIR/${STEM}.c"
    OUT="/tmp/${STEM}_c_test"
    INCLUDES="-I. -I${DIR} -I$(dirname "$DIR")"
    
    echo "========================================" | tee -a "$LOG"
    echo "C TEST : $TEST_FILE | SRC: ${SRC:-none}" | tee -a "$LOG"
    
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
fi

echo "[TEST-C] Summary: files=$FILES pass=$COMPILE_PASS fail=$COMPILE_FAIL"
{ echo "files=$FILES"; echo "compile_pass=$COMPILE_PASS"; echo "compile_fail=$COMPILE_FAIL"
  echo "run_pass=$RUN_PASS"; echo "run_fail=$RUN_FAIL"; } >> "$GITHUB_OUTPUT"

set -e
