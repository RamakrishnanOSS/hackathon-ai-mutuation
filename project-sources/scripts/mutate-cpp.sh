#!/bin/bash
#
# C++ mutation testing using universalmutator
# Generates mutants and tests them
#
set +e

REPORT_DIR="${1:-.}/reports"
PROJECT_ROOT="${2:-.}"
mkdir -p "$REPORT_DIR/cpp-mutants"

echo "[MUTATE-CPP] Running C++ mutation testing..."
LOG="$REPORT_DIR/cpp-mutation.log"; : > "$LOG"
KILLED=0; SURVIVED=0; TOTAL=0

SRC_FILES=$(find "$PROJECT_ROOT/project-sources/c-src" -type f \( -name '*.cpp' -o -name '*.cc' \) \
  ! -name 'test_*' 2>/dev/null | sort)

if [ -z "$SRC_FILES" ]; then
  echo "No C++ source files to mutate." | tee -a "$LOG"
else
  for SRC in $SRC_FILES; do
    STEM_FULL=$(basename "$SRC"); STEM="${STEM_FULL%.*}"; DIR=$(dirname "$SRC")
    TEST_FILE=""
    for TRY in "$DIR/test_${STEM}.cpp" "$DIR/test_${STEM}.cc"; do
      [ -f "$TRY" ] && TEST_FILE="$TRY" && break
    done
    if [ -z "$TEST_FILE" ]; then
      echo "SKIP (no test): $SRC" | tee -a "$LOG"; continue
    fi
    
    MUTANT_DIR="$REPORT_DIR/cpp-mutants/${STEM}"
    mkdir -p "$MUTANT_DIR"
    INCLUDES="-I. -I${DIR} -I$(dirname "$DIR")"
    
    echo "========================================" | tee -a "$LOG"
    echo "Mutating: $SRC | Test: $TEST_FILE" | tee -a "$LOG"
    
    mutate "$SRC" --mutantDir "$MUTANT_DIR" >> "$LOG" 2>&1 || true
    MCOUNT=$(find "$MUTANT_DIR" \( -name '*.cpp' -o -name '*.cc' \) | wc -l)
    echo "Generated $MCOUNT mutants" | tee -a "$LOG"
    
    g++ -std=c++17 -Wall $INCLUDES -o /tmp/orig_cpp_test "$SRC" "$TEST_FILE" >> "$LOG" 2>&1
    if [ $? -ne 0 ]; then
      echo "BASELINE COMPILE FAIL — skip" | tee -a "$LOG"; continue
    fi
    
    /tmp/orig_cpp_test >> "$LOG" 2>&1; BASELINE=$?
    echo "Baseline exit: $BASELINE" | tee -a "$LOG"
    
    for MUTANT in "$MUTANT_DIR"/*.{cpp,cc}; do
      [ -f "$MUTANT" ] || continue
      TOTAL=$((TOTAL + 1))
      MID=$(basename "$MUTANT")
      g++ -std=c++17 -Wall $INCLUDES -o /tmp/mut_cpp_test "$MUTANT" "$TEST_FILE" >> "$LOG" 2>&1
      if [ $? -ne 0 ]; then
        KILLED=$((KILLED + 1)); echo "[KILLED-COMPILE] $MID" | tee -a "$LOG"; continue
      fi
      /tmp/mut_cpp_test >> "$LOG" 2>&1; RUN_EXIT=$?
      if [ "$RUN_EXIT" -ne "$BASELINE" ]; then
        KILLED=$((KILLED + 1)); echo "[KILLED] $MID" | tee -a "$LOG"
      else
        SURVIVED=$((SURVIVED + 1)); echo "[SURVIVED] $MID" | tee -a "$LOG"
        diff "$SRC" "$MUTANT" > "$MUTANT_DIR/${MID}.diff" 2>/dev/null || true
      fi
    done
  done
fi

SCORE=$(python3 -c "print(round($KILLED/$TOTAL*100,2) if $TOTAL>0 else 0.0)" || echo 0)
echo "C++ mutation: killed=$KILLED survived=$SURVIVED total=$TOTAL score=$SCORE%" | tee -a "$LOG"
{ echo "killed=$KILLED"; echo "survived=$SURVIVED"; echo "total=$TOTAL"; echo "score=$SCORE"; } >> "$GITHUB_OUTPUT"

set -e
