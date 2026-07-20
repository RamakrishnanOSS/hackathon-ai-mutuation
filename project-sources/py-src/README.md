# Python Mutation Testing Example Project

A comprehensive Python project demonstrating AI-driven mutation testing with multiple test frameworks and edge case coverage.

## Project Structure

```
py-src/
├── src/                          # Source code
│   ├── hello.py                  # Greeting utilities (15+ branching paths)
│   └── sample_mutation.py        # Mutation operator samples (5 functions)
├── tests/                        # Test suite
│   ├── test_hello.py            # 67 tests covering all functions
│   ├── test_sample_mutation.py  # 58 tests for mutation detection
│   ├── test_utils.py            # Test utilities and fixtures
│   └── conftest.py              # Pytest configuration
├── pyproject.toml               # Project metadata and tool configuration
├── pytest.ini                   # Pytest configuration
├── setup.cfg                    # Mutation testing configuration
└── README.md                    # This file
```

## Features

### Source Files

**hello.py** — Greeting utilities with extensive branching:
- `say_hello()` - Special-case "World"
- `say_hello_times()` - Repetition logic
- `greet_all()` - List iteration
- `formal_greeting()` - Conditional title handling
- `shout_hello()` - String transformation
- `count_hellos()` - Filtering and counting
- `is_special_name()` - Classification logic

**sample_mutation.py** — Mutation operator demonstrations:
- `arithmetic_substitution()` - +/- mutations, boundary conditions
- `relational_boundary()` - <, <=, >, >= mutations
- `boolean_inversion()` - and/or and not mutations
- `return_value_stripping()` - Constant value mutations

### Test Suite

- **67 tests** in `test_hello.py` covering all functions with edge cases
- **58 tests** in `test_sample_mutation.py` designed to kill specific mutations
- **24 test utilities** in `test_utils.py` for generating test data and mutation detection patterns
- **All 149 tests passing** with comprehensive branch coverage

## Running Tests

### Run all tests
```bash
cd project-sources/py-src
pytest
```

### Run specific test file
```bash
pytest tests/test_hello.py -v
pytest tests/test_sample_mutation.py -v
```

### Run with coverage
```bash
pytest --cov=src --cov-report=html
```

### Mutation testing with mutmut
```bash
mutmut run
mutmut results
```

## Test Framework Support

This project is configured for:
- **pytest** (primary, auto-detected via pytest.ini)
- **unittest** (auto-discovered via test_*.py naming)
- Built-in assertion introspection

## Integration with AI Mutation Testing Engine

The backend mutation-engine detects this as a Python project via:
- `pytest.ini` presence
- `pyproject.toml` with [project] metadata
- `src/` directory containing source modules
- `tests/` directory with test_*.py files

### Build and Run
```bash
# From mutation-engine backend
python services/core_mutation_service.py

# Via Python adapter
from build_system import BuildSystemFactory
adapter = BuildSystemFactory.create("project-sources/py-src", build_system="auto")
compile_result = adapter.compile()
test_result = adapter.run_tests()
```

The Python adapter automatically:
1. Detects pytest as the test framework
2. Discovers source files in `src/`
3. Runs tests from `tests/` directory
4. Parses pytest output for test counts
5. Reports success/failure metrics

## Development

### Install for development
```bash
pip install -e ".[dev]"
```

### Add new tests
- Create `tests/test_*.py` files
- Tests are auto-discovered by pytest
- Use fixtures from `test_utils.py`

### Run mutation testing
```bash
mutmut run --tests-dir tests
```

## Testing Mutation Operators

The test suite is specifically designed to detect:
- **Arithmetic mutations**: + ↔ -, >= ↔ >, etc.
- **Relational mutations**: < ↔ <=, boundary shifts
- **Boolean mutations**: and ↔ or, not removal/addition
- **Return mutations**: Constant value changes
- **Conditional mutations**: if condition elimination

See `test_sample_mutation.py` for specific mutation-killing patterns.
