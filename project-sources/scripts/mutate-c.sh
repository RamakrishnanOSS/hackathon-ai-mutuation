#!/bin/bash
#
# C mutation testing using universalmutator
# Generates mutants and tests them
#
set +e

_log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [MUTATE-C] $*"; }

REPORT_DIR="${1:-.}/reports"
PROJECT_ROOT="${2:-.}"
mkdir -p "$REPORT_DIR/c-mutants"

_log "Running C mutation testing..."
LOG="$REPORT_DIR/c-mutation.log"; : > "$LOG"
KILLED=0; SURVIVED=0; TOTAL=0

SRC_FILES=$(find "$PROJECT_ROOT/project-sources/c-src" -type f -name '*.c' ! -name 'test_*.c' 2>/dev/null | sort)

if [ -z "$SRC_FILES" ]; then
  _log "No C source files to mutate."
else
  for SRC in $SRC_FILES; do
    STEM=$(basename "$SRC" .c); DIR=$(dirname "$SRC")
    TEST_FILE="$(dirname "$DIR")/test/test_${STEM}.c"
    [ -f "$TEST_FILE" ] || TEST_FILE="$DIR/test_${STEM}.c"
    if [ ! -f "$TEST_FILE" ]; then
      _log "SKIP (no test found): $SRC"
      echo "SKIP: $SRC" | tee -a "$LOG"; continue
    fi

    MUTANT_DIR="$REPORT_DIR/c-mutants/${STEM}"
    mkdir -p "$MUTANT_DIR"
    INCLUDES="-I. -I${DIR} -I$(dirname "$DIR") -I$(dirname "$DIR")/include"

    echo "========================================" | tee -a "$LOG"
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Mutating: $SRC | Test: $TEST_FILE" | tee -a "$LOG"

    mutate "$SRC" --mutantDir "$MUTANT_DIR" >> "$LOG" 2>&1 || true
    MCOUNT=$(find "$MUTANT_DIR" -name '*.c' | wc -l)
    _log "Generated $MCOUNT mutants for $SRC"

    gcc -std=c11 -Wall $INCLUDES -o /tmp/orig_c_test "$SRC" "$TEST_FILE" >> "$LOG" 2>&1
    if [ $? -ne 0 ]; then
      _log "BASELINE COMPILE FAIL — skipping $SRC"
      echo "BASELINE COMPILE FAIL" | tee -a "$LOG"; continue
    fi

    /tmp/orig_c_test >> "$LOG" 2>&1; BASELINE=$?
    echo "Baseline exit: $BASELINE" | tee -a "$LOG"

    for MUTANT in "$MUTANT_DIR"/*.c; do
      [ -f "$MUTANT" ] || continue
      TOTAL=$((TOTAL + 1))
      MID=$(basename "$MUTANT" .c)
      gcc -std=c11 -Wall $INCLUDES -o /tmp/mut_c_test "$MUTANT" "$TEST_FILE" >> "$LOG" 2>&1
      if [ $? -ne 0 ]; then
        KILLED=$((KILLED + 1)); echo "[KILLED-COMPILE] $MID" | tee -a "$LOG"; continue
      fi
      /tmp/mut_c_test >> "$LOG" 2>&1; RUN_EXIT=$?
      if [ "$RUN_EXIT" -ne "$BASELINE" ]; then
        KILLED=$((KILLED + 1)); echo "[KILLED] $MID" | tee -a "$LOG"
      else
        SURVIVED=$((SURVIVED + 1)); echo "[SURVIVED] $MID" | tee -a "$LOG"
        diff "$SRC" "$MUTANT" > "$MUTANT_DIR/${MID}.diff" 2>/dev/null || true
      fi
    done
  done
fi

SCORE=$(python3 -c "print(round($KILLED/$TOTAL*100,2) if $TOTAL>0 else 0.0)" 2>/dev/null || echo 0)
_log "Summary: killed=$KILLED survived=$SURVIVED total=$TOTAL score=$SCORE%"
[ -n "$GITHUB_OUTPUT" ] && { echo "killed=$KILLED"; echo "survived=$SURVIVED"; echo "total=$TOTAL"; echo "score=$SCORE"; } >> "$GITHUB_OUTPUT"

set -e
