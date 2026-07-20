#!/bin/bash
#
# Compile and run C++ tests
# Supported Frameworks: gtest_mock.h (default), Google Test, Catch2, custom
# Generates metrics: files, compile_pass, compile_fail, run_pass, run_fail
#
# Framework detection:
#   - gtest_mock.h: Custom GoogleTest-compatible framework (default)
#   - gtest/gtest.h: Official Google Test framework
#   - catch_amalgamated.hpp: Catch2 testing framework
#   - Custom: Any framework that respects exit codes (0=pass, non-zero=fail)
#
set +e

REPORT_DIR="${1:-.}/reports"
PROJECT_ROOT="${2:-.}"
mkdir -p "$REPORT_DIR/cpp-sources"

echo "[TEST-CPP] Collecting C++ source files..."
find "$PROJECT_ROOT/project-sources/cpp-src" -type f \( -name '*.cpp' -o -name '*.cc' -o -name '*.h' -o -name '*.hpp' \) \
  2>/dev/null | while read f; do cp "$f" "$REPORT_DIR/cpp-sources/$(basename "$f")"; done

echo "[TEST-CPP] Collecting C++ test file list..."
find "$PROJECT_ROOT/project-sources/cpp-src/test" -type f \( -name 'test_*.cpp' -o -name 'test_*.cc' \) \
  | sort > "$REPORT_DIR/cpp-test-files.txt"

echo "[TEST-CPP] Detecting test frameworks..."
FRAMEWORK="gtest_mock.h"
TEST_FILE=$(head -1 "$REPORT_DIR/cpp-test-files.txt" 2>/dev/null)
if [ -n "$TEST_FILE" ] && grep -q '#include.*<gtest/gtest.h>' "$TEST_FILE" 2>/dev/null; then
  FRAMEWORK="Google Test (libgtest)"
elif [ -n "$TEST_FILE" ] && grep -q '#include.*catch_amalgamated.hpp' "$TEST_FILE" 2>/dev/null; then
  FRAMEWORK="Catch2"
elif [ -n "$TEST_FILE" ] && grep -q '#include.*gtest_mock.h' "$TEST_FILE" 2>/dev/null; then
  FRAMEWORK="gtest_mock.h (custom)"
fi
echo "[TEST-CPP] Detected framework: $FRAMEWORK"
echo "=== C++ test files (Framework: $FRAMEWORK) ===" && cat "$REPORT_DIR/cpp-test-files.txt" || true

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
