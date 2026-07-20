# Build Scripts Guide

Quick reference for using the internal build scripts in `project-sources/scripts/`.

## Quick Start

All scripts can be run from the project root:

```bash
# Make scripts executable (already done)
chmod +x project-sources/scripts/*.sh

# Run any script
bash project-sources/scripts/lint.sh
bash project-sources/scripts/test-python.sh
bash project-sources/scripts/test-c.sh
bash project-sources/scripts/test-cpp.sh
bash project-sources/scripts/mutate-python.sh
bash project-sources/scripts/mutate-c.sh
bash project-sources/scripts/mutate-cpp.sh
```

## Script Reference

### 1. lint.sh — Python Linting

Runs flake8 on all Python files in `project-sources/` and `mutation-engine/`.

```bash
bash project-sources/scripts/lint.sh
```

**Output:**
- `reports/flake8-html/index.html` — HTML report

**Environment:**
- Requires: `flake8`, `flake8-bugbear`, `flake8-html`

---

### 2. test-python.sh — Python Unit Tests

Collects and runs pytest on all test files.

```bash
bash project-sources/scripts/test-python.sh
```

**Parameters (optional):**
- `$1` — Report directory (default: `./reports`)
- `$2` — Project root (default: `.`)

**Output:**
- `reports/pytest-report.html` — HTML report
- `reports/pytest-files.txt` — List of test files
- `reports/python-sources/` — Copied test files
- Sets `$GITHUB_OUTPUT`: `total`, `passed`, `failed`, `errors`, `skipped`

**Environment:**
- Requires: `pytest`, `junit2html`
- Sets: `GITHUB_OUTPUT` for GitHub Actions

---

### 3. test-c.sh — C Compilation & Tests

Compiles C test files with gcc and runs them.

```bash
bash project-sources/scripts/test-c.sh
```

**Parameters (optional):**
- `$1` — Report directory (default: `./reports`)
- `$2` — Project root (default: `.`)

**Output:**
- `reports/c-build.log` — Build log
- `reports/c-test-files.txt` — List of test files
- `reports/c-sources/` — Copied C files
- Sets `$GITHUB_OUTPUT`: `files`, `compile_pass`, `compile_fail`, `run_pass`, `run_fail`

---

### 4. test-cpp.sh — C++ Compilation & Tests

Compiles C++ test files with g++ and runs them.

```bash
bash project-sources/scripts/test-cpp.sh
```

**Parameters (optional):**
- `$1` — Report directory (default: `./reports`)
- `$2` — Project root (default: `.`)

**Output:**
- `reports/cpp-build.log` — Build log
- `reports/cpp-test-files.txt` — List of test files
- `reports/cpp-sources/` — Copied C++ files
- Sets `$GITHUB_OUTPUT`: `files`, `compile_pass`, `compile_fail`, `run_pass`, `run_fail`

---

### 5. mutate-python.sh — Python Mutation Testing

Runs mutmut to generate and test mutants of Python code.

```bash
bash project-sources/scripts/mutate-python.sh [scope]
```

**Parameters (optional):**
- `$1` — Mutation scope (default: `project-sources`)
- `$2` — Report directory (default: `./reports`)
- `$3` — Project root (default: `.`)

**Output:**
- `reports/mutmut-run.log` — Mutation test log
- `reports/mutmut-results.log` — Results
- `reports/mutmut-counts.txt` — Mutation counts
- `reports/mutants/` — Survived mutant diffs
- Sets `$GITHUB_OUTPUT`: `killed`, `survived`, `timeout`, `total_mutants`, `mutation_score`

---

### 6. mutate-c.sh — C Mutation Testing

Generates and tests mutants of C code using universalmutator.

```bash
bash project-sources/scripts/mutate-c.sh
```

**Parameters (optional):**
- `$1` — Report directory (default: `./reports`)
- `$2` — Project root (default: `.`)

**Output:**
- `reports/c-mutation.log` — Mutation test log
- `reports/c-mutants/` — Mutants and diffs
- Sets `$GITHUB_OUTPUT`: `killed`, `survived`, `total`, `score`

---

### 7. mutate-cpp.sh — C++ Mutation Testing

Generates and tests mutants of C++ code using universalmutator.

```bash
bash project-sources/scripts/mutate-cpp.sh
```

**Parameters (optional):**
- `$1` — Report directory (default: `./reports`)
- `$2` — Project root (default: `.`)

**Output:**
- `reports/cpp-mutation.log` — Mutation test log
- `reports/cpp-mutants/` — Mutants and diffs
- Sets `$GITHUB_OUTPUT`: `killed`, `survived`, `total`, `score`

---

## Development Workflow

### Running Tests Locally Before Push

```bash
# Quick lint check
bash project-sources/scripts/lint.sh

# Run Python tests
bash project-sources/scripts/test-python.sh

# Run C tests
bash project-sources/scripts/test-c.sh

# Run C++ tests
bash project-sources/scripts/test-cpp.sh
```

### Testing Mutations Locally

```bash
# Python mutations
bash project-sources/scripts/mutate-python.sh "project-sources"

# C mutations
bash project-sources/scripts/mutate-c.sh

# C++ mutations
bash project-sources/scripts/mutate-cpp.sh
```

### Integration with Makefile (Future)

```makefile
.PHONY: lint test test-python test-c test-cpp
.PHONY: mutate mutate-python mutate-c mutate-cpp
.PHONY: all-tests all-mutations

lint:
	bash project-sources/scripts/lint.sh

test-python:
	bash project-sources/scripts/test-python.sh

test-c:
	bash project-sources/scripts/test-c.sh

test-cpp:
	bash project-sources/scripts/test-cpp.sh

mutate-python:
	bash project-sources/scripts/mutate-python.sh

mutate-c:
	bash project-sources/scripts/mutate-c.sh

mutate-cpp:
	bash project-sources/scripts/mutate-cpp.sh

all-tests: test-python test-c test-cpp
all-mutations: mutate-python mutate-c mutate-cpp
```

---

## Troubleshooting

### Script Not Found
```bash
# Make sure you're in the project root
pwd  # Should show: /path/to/hackathon-ai-mutuation

# Make scripts executable
chmod +x project-sources/scripts/*.sh
```

### Missing Dependencies

**Python Testing:**
```bash
pip install pytest flake8 flake8-bugbear flake8-html junit2html
```

**C/C++ Testing:**
```bash
sudo apt-get install gcc g++ make cmake
```

**Mutation Testing:**
```bash
pip install mutmut universalmutator
```

### Reports Directory Permissions

If scripts fail to write to `reports/`:
```bash
# Ensure reports directory is writable
mkdir -p reports
chmod 755 reports
```

---

## GitHub Actions Integration

The workflow automatically calls these scripts. To verify:

```bash
# Check workflow file
grep "bash project-sources/scripts" .github/workflows/ai-mutation-testing.yml
```

**Output should show:**
```
run: bash project-sources/scripts/lint.sh
run: bash project-sources/scripts/test-python.sh
run: bash project-sources/scripts/test-c.sh
run: bash project-sources/scripts/test-cpp.sh
run: bash project-sources/scripts/mutate-c.sh
run: bash project-sources/scripts/mutate-cpp.sh
```

---

## Output Location Reference

All scripts write to `reports/` by default:

```
reports/
├── flake8-html/
│   └── index.html                    # Lint report
├── pytest-report.html                # Python test report
├── pytest-junit-report.html          # JUnit format
├── pytest-files.txt                  # List of test files
├── python-sources/                   # Copied Python files
├── c-build.log                       # C build log
├── c-test-files.txt                  # C test file list
├── c-sources/                        # Copied C files
├── c-mutation.log                    # C mutation log
├── c-mutants/                        # C mutants
├── cpp-build.log                     # C++ build log
├── cpp-test-files.txt                # C++ test file list
├── cpp-sources/                      # Copied C++ files
├── cpp-mutation.log                  # C++ mutation log
├── cpp-mutants/                      # C++ mutants
├── mutmut-run.log                    # Python mutation log
├── mutmut-results.log                # Mutation results
├── mutmut-counts.txt                 # Mutation counts
└── mutants/                          # Survived mutant diffs
```

---

## Contributing

When modifying build scripts:

1. Test locally before pushing:
   ```bash
   bash project-sources/scripts/your-script.sh
   ```

2. Ensure proper exit codes:
   - `0` = success
   - `1` = failure
   - `2+` = fatal error

3. Ensure `$GITHUB_OUTPUT` compatibility for GitHub Actions

4. Add logging with timestamps for debugging

5. Use relative paths for portability

---

**Last Updated:** July 20, 2026  
**Maintained By:** GitHub Workflow Cleanup  
**Related:** [GITHUB_WORKFLOW_CLEANUP.md](GITHUB_WORKFLOW_CLEANUP.md)
