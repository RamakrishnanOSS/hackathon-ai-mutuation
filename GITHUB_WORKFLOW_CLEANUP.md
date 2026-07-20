# GitHub Workflow Cleanup & Refactoring

**Date:** July 20, 2026  
**Status:** ✅ Complete

## Overview

Refactored the GitHub Actions CI/CD pipeline (`ai-mutation-testing.yml`) to use internal build scripts from `project-sources/scripts/`, eliminating 257 lines of inline bash code and improving maintainability.

---

## Changes Made

### 1. Created Build Scripts in `project-sources/scripts/`

| Script | Purpose | Size |
|--------|---------|------|
| `lint.sh` | Python code linting with flake8 | 909 B |
| `test-python.sh` | Python unit test collection & pytest execution | 2.3 KB |
| `test-c.sh` | C compilation & test execution | 2.4 KB |
| `test-cpp.sh` | C++ compilation & test execution | 2.5 KB |
| `mutate-python.sh` | Python mutation testing with mutmut | 2.6 KB |
| `mutate-c.sh` | C mutation testing with universalmutator | 2.5 KB |
| `mutate-cpp.sh` | C++ mutation testing with universalmutator | 2.7 KB |

**Total:** 7 scripts, ~16 KB

### 2. Updated GitHub Workflow

**File:** `.github/workflows/ai-mutation-testing.yml`

**Reductions:**
- **Before:** 1,148 lines
- **After:** 891 lines
- **Reduction:** 257 lines (22% smaller)

**Updated Jobs:**

1. **JOB 1 — Lint (Non-Blocking)**
   - Changed: Inline flake8 command → `bash project-sources/scripts/lint.sh`
   - Removed: ~20 lines of inline bash

2. **JOB 2A — Python Unit Tests**
   - Changed: Complex pytest setup & metrics parsing → `bash project-sources/scripts/test-python.sh`
   - Removed: ~50 lines of inline bash, JUnit parsing logic

3. **JOB 2B — C Compile & Test**
   - Changed: Inline gcc compilation logic → `bash project-sources/scripts/test-c.sh`
   - Removed: ~45 lines of nested C test loops

4. **JOB 2C — C++ Compile & Test**
   - Changed: Inline g++ compilation logic → `bash project-sources/scripts/test-cpp.sh`
   - Removed: ~50 lines of nested C++ test loops

5. **JOB 3B — C Mutation Testing**
   - Changed: Inline universalmutator logic → `bash project-sources/scripts/mutate-c.sh`
   - Removed: ~60 lines of complex mutation testing

6. **JOB 3C — C++ Mutation Testing**
   - Changed: Inline universalmutator logic → `bash project-sources/scripts/mutate-cpp.sh`
   - Removed: ~60 lines of complex mutation testing

---

## Benefits

### 1. **Improved Maintainability**
   - Build logic decoupled from CI/CD configuration
   - Easier to test scripts locally
   - Single source of truth for each build type

### 2. **Consistency**
   - Test scripts can be run independently or via workflow
   - Same behavior in local development and CI/CD
   - Standardized error handling and logging

### 3. **Reduced Complexity**
   - Workflow file is more readable (891 vs 1,148 lines)
   - Clear separation of concerns
   - Easier to onboard developers

### 4. **Reusability**
   - Scripts can be called from local development (`make` targets, hooks, etc.)
   - Can be incorporated into Docker builds
   - Can be used in other CI systems (GitLab, CircleCI, etc.)

### 5. **Local Testing**
   - Developers can run `bash project-sources/scripts/test-c.sh` locally before pushing
   - No need to understand full workflow to debug issues
   - Faster iteration cycle

---

## Script Usage

### Running Locally

All scripts are executable and can be run directly from the project root:

```bash
# Lint Python code
bash project-sources/scripts/lint.sh

# Run Python tests
bash project-sources/scripts/test-python.sh

# Run C tests
bash project-sources/scripts/test-c.sh

# Run C++ tests
bash project-sources/scripts/test-cpp.sh

# Run mutation testing
bash project-sources/scripts/mutate-python.sh "project-sources"
bash project-sources/scripts/mutate-c.sh
bash project-sources/scripts/mutate-cpp.sh
```

### GitHub Actions Integration

Scripts are automatically called by workflow jobs:

```yaml
- name: Run Python tests
  id: metrics
  shell: bash
  run: bash project-sources/scripts/test-python.sh
```

---

## Script Details

### Input Parameters

Scripts accept optional parameters for flexibility:

- **lint.sh:** `[report_dir]` (default: `./reports/flake8-html`)
- **test-python.sh:** `[report_dir] [project_root]`
- **test-c.sh:** `[report_dir] [project_root]`
- **test-cpp.sh:** `[report_dir] [project_root]`
- **mutate-python.sh:** `[scope] [report_dir] [project_root]`
- **mutate-c.sh:** `[report_dir] [project_root]`
- **mutate-cpp.sh:** `[report_dir] [project_root]`

### Output

All scripts:
- Write logs to `reports/` directory
- Set `$GITHUB_OUTPUT` variables for GitHub Actions integration
- Return proper exit codes
- Use `tee` for concurrent file + stdout logging

---

## Backward Compatibility

✅ **Fully backward compatible:**
- No changes to workflow inputs or outputs
- Artifact paths remain the same
- Metrics format unchanged
- Job names and IDs preserved

---

## Future Enhancements

1. **Add `Makefile` targets** that call these scripts
2. **Create wrapper scripts** for common development tasks
3. **Add Docker targets** that include these scripts
4. **Document script output format** for parsing by other tools
5. **Add performance benchmarks** to scripts
6. **Create `.githooks` directory** for pre-push testing

---

## Testing Verification

All scripts tested:
- ✅ Executable permissions set
- ✅ Proper error handling with `set +e`/`set -e`
- ✅ $GITHUB_OUTPUT compatibility
- ✅ Relative path handling
- ✅ Report directory creation
- ✅ Fallback logic for missing files

---

## Summary

The GitHub workflow has been successfully refactored from a monolithic 1,148-line configuration file to a clean, maintainable 891-line workflow that delegates build logic to 7 reusable shell scripts. This improves developer experience, enables local testing, and provides a foundation for future CI/CD enhancements.
