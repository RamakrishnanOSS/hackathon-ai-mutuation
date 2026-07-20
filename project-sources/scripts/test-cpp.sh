#!/bin/bash
#
# Compile and run C++ tests
# Generates metrics: files, compile_pass, compile_fail, run_pass, run_fail
#
set +e

REPORT_DIR="${1:-.}/reports"
PROJECT_ROOT="${2:-.}"
mkdir -p "$REPORT_DIR/cpp-sources"

echo "[TEST-CPP] Collecting C++ source files..."
find "$PROJECT_ROOT/project-sources/c-src" -type f \( -name '*.cpp' -o -name '*.cc' -o -name '*.h' -o -name '*.hpp' \) \
  2>/dev/null | while read f; do cp "$f" "$REPORT_DIR/cpp-sources/$(basename "$f")"; done

echo "[TEST-CPP] Collecting C++ test file list..."
find "$PROJECT_ROOT/project-sources/c-src/test" -type f \( -name 'test_*.cpp' -o -name 'test_*.cc' \) \
  | sort > "$REPORT_DIR/cpp-test-files.txt"
echo "=== C++ test files ===" && cat "$REPORT_DIR/cpp-test-files.txt" || true

echo "[TEST-CPP] Compiling and running C++ tests..."
LOG="$REPORT_DIR/cpp-build.log"; : > "$LOG"
FILES=0; COMPILE_PASS=0; COMPILE_FAIL=0; RUN_PASS=0; RUN_FAIL=0

if [ ! -s "$REPORT_DIR/cpp-test-files.txt" ]; then
  echo "No C++ test files discovered." | tee -a "$LOG"
else
  while read -r TEST_FILE; do
    [ -z "$TEST_FILE" ] && continue
    FILES=$((FILES + 1))
    BASENAME=$(basename "$TEST_FILE")
    STEM_FULL="${BASENAME%.*}"; DIR=$(dirname "$TEST_FILE")
    STEM="${STEM_FULL#test_}"
    
    SRC=""; [ -f "$DIR/${STEM}.cpp" ] && SRC="$DIR/${STEM}.cpp" || [ -f "$DIR/${STEM}.cc" ] && SRC="$DIR/${STEM}.cc"
    OUT="/tmp/${STEM}_cpp_test"
    INCLUDES="-I. -I${DIR} -I$(dirname "$DIR")"
    
    echo "========================================" | tee -a "$LOG"
    echo "C++ TEST: $TEST_FILE | SRC: ${SRC:-none}" | tee -a "$LOG"
    
    if [ -n "$SRC" ]; then
      g++ -std=c++17 -Wall $INCLUDES -o "$OUT" "$SRC" "$TEST_FILE" >> "$LOG" 2>&1
    else
      g++ -std=c++17 -Wall $INCLUDES -o "$OUT" "$TEST_FILE" >> "$LOG" 2>&1
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
  done < "$REPORT_DIR/cpp-test-files.txt"
fi

echo "[TEST-CPP] Summary: files=$FILES pass=$COMPILE_PASS fail=$COMPILE_FAIL"
{ echo "files=$FILES"; echo "compile_pass=$COMPILE_PASS"; echo "compile_fail=$COMPILE_FAIL"
  echo "run_pass=$RUN_PASS"; echo "run_fail=$RUN_FAIL"; } >> "$GITHUB_OUTPUT"

set -e
