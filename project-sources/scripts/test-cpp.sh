#!/bin/bash
#
# Compile and run C++ tests
# Supported Frameworks: gtest_mock.h (default), Google Test, Catch2, custom
# Generates metrics: files, compile_pass, compile_fail, run_pass, run_fail
#
set +e

_log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [TEST-CPP] $*"; }

REPORT_DIR="${1:-.}/reports"
PROJECT_ROOT="${2:-.}"
mkdir -p "$REPORT_DIR/cpp-sources"

_log "Collecting C++ source files..."
find "$PROJECT_ROOT/project-sources/cpp-src" -type f \( -name '*.cpp' -o -name '*.cc' -o -name '*.h' -o -name '*.hpp' \) \
  2>/dev/null | while read f; do cp "$f" "$REPORT_DIR/cpp-sources/$(basename "$f")"; done

_log "Collecting C++ test file list..."
find "$PROJECT_ROOT/project-sources/cpp-src/test" -type f \( -name 'test_*.cpp' -o -name 'test_*.cc' \) \
  | sort > "$REPORT_DIR/cpp-test-files.txt"

if [ ! -s "$REPORT_DIR/cpp-test-files.txt" ]; then
  echo "::error::[TEST-CPP] No C++ test files discovered in project-sources/cpp-src/test/" >&2
  echo "::error::Ensure test files follow naming convention: test_*.cpp or test_*.cc" >&2
  exit 1
fi

_log "Detecting test framework..."
FRAMEWORK="gtest_mock.h"
FIRST_TEST=$(head -1 "$REPORT_DIR/cpp-test-files.txt" 2>/dev/null)
if [ -n "$FIRST_TEST" ] && grep -q '#include.*<gtest/gtest\.h>' "$FIRST_TEST" 2>/dev/null; then
  FRAMEWORK="Google Test (libgtest)"
elif [ -n "$FIRST_TEST" ] && grep -q '#include.*catch_amalgamated\.hpp' "$FIRST_TEST" 2>/dev/null; then
  FRAMEWORK="Catch2"
elif [ -n "$FIRST_TEST" ] && grep -q '#include.*gtest_mock\.h' "$FIRST_TEST" 2>/dev/null; then
  FRAMEWORK="gtest_mock.h (custom)"
fi
_log "Detected framework: $FRAMEWORK"
_log "Test files discovered:"
cat "$REPORT_DIR/cpp-test-files.txt"

_log "Compiling and running C++ tests..."
LOG="$REPORT_DIR/cpp-build.log"; : > "$LOG"
FILES=0; COMPILE_PASS=0; COMPILE_FAIL=0; RUN_PASS=0; RUN_FAIL=0

while read -r TEST_FILE; do
  [ -z "$TEST_FILE" ] && continue
  FILES=$((FILES + 1))
  BASENAME=$(basename "$TEST_FILE")
  STEM_FULL="${BASENAME%.*}"; DIR=$(dirname "$TEST_FILE")
  STEM="${STEM_FULL#test_}"

  SRC=""
  [ -f "$DIR/../src/${STEM}.cpp" ] && SRC="$DIR/../src/${STEM}.cpp"
  [ -z "$SRC" ] && [ -f "$DIR/../src/${STEM}.cc" ] && SRC="$DIR/../src/${STEM}.cc"
  [ -z "$SRC" ] && [ -f "$DIR/${STEM}.cpp" ] && SRC="$DIR/${STEM}.cpp"
  OUT="/tmp/${STEM}_cpp_test"
  INCLUDES="-I. -I${DIR} -I$(dirname "$DIR") -I$(dirname "$DIR")/include -I$(dirname "$DIR")/src"

  echo "========================================" | tee -a "$LOG"
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] C++ TEST: $TEST_FILE | SRC: ${SRC:-none}" | tee -a "$LOG"

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

_log "Summary: files=$FILES compile_pass=$COMPILE_PASS compile_fail=$COMPILE_FAIL run_pass=$RUN_PASS run_fail=$RUN_FAIL"
[ -n "$GITHUB_OUTPUT" ] && { echo "files=$FILES"; echo "compile_pass=$COMPILE_PASS"; echo "compile_fail=$COMPILE_FAIL"
  echo "run_pass=$RUN_PASS"; echo "run_fail=$RUN_FAIL"; } >> "$GITHUB_OUTPUT"

set -e
