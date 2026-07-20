# Project Sources — Developer Area for AI Mutation Testing

This directory is the **primary developer workspace** containing example projects for the AI-driven mutation testing framework.

## Structure

```
project-sources/
├── .devcontainer/           # VS Code Dev Container (shared for all projects)
│   ├── Dockerfile           # Custom image: Python 3.11, Node 20, CMake, g++
│   ├── docker-compose.yml   # Services: devcontainer + core-service
│   ├── devcontainer.json    # VS Code configuration
│   ├── install-extension.sh # Installs AI Mutation Testing extension
│   └── ai-mutation-testing.vsix  # Pre-built extension
│
├── c-src/                   # C/C++ example project
│   ├── CMakeLists.txt       # CMake configuration
│   ├── include/             # C++ headers (gtest_mock.h)
│   ├── src/                 # Source files (sample.c, hello.cpp)
│   └── test/                # Test files (CTest)
│       ├── test_sample.c    # Test sample.c
│       └── test_hello.cpp   # Test hello.cpp
│
└── py-src/                  # Python example project
    ├── src/                 # Source modules
    │   ├── hello.py         # Greeting utilities (15 branching paths)
    │   └── sample_mutation.py  # Mutation operator examples
    ├── tests/               # Test suite
    │   ├── test_hello.py    # 67 comprehensive tests
    │   ├── test_sample_mutation.py  # 58 mutation-killing tests
    │   └── test_utils.py    # Test utilities & fixtures
    ├── pyproject.toml       # Python project metadata
    ├── pytest.ini           # Pytest configuration
    ├── setup.cfg            # Mutation testing configuration
    └── README.md            # Project documentation
```

## Getting Started

### Option 1: VS Code Dev Container (Recommended)

The easiest way to work on mutation testing projects:

1. **Open project-sources folder in VS Code:**
   ```bash
   code project-sources
   ```

2. **Reopen in Container:**
   - VS Code will detect `.devcontainer/devcontainer.json`
   - Click "Reopen in Container" when prompted
   - Or use the command palette: `Dev Containers: Reopen in Container`

3. **Done!** The container will:
   - Mount `project-sources/` as `/workspace`
   - Include both C/C++ and Python projects
   - Start FastAPI mutation service (core-service) on port 8001
   - Forward Grafana (3000) and Prometheus (9090) ports

### Option 2: Local Development

Without Docker (requires local tools):

```bash
cd project-sources/py-src
python3 -m pytest tests/          # Run Python tests
```

```bash
cd project-sources/c-src
mkdir build && cd build
cmake .. && make && ctest         # Build and test C/C++ project
```

## Available Projects

### C/C++ Project (`c-src/` and `cpp-src/`)

Now split into separate directories:

**C Code (`c-src/`)**
- **Test Framework:** assert.h (default), with support for Check framework
- **Tests:** test_sample.c
- **Compiler:** GCC with C11 standard
- **Build:** `gcc -std=c11 test_sample.c sample.c`

**C++ Code (`cpp-src/`)**
- **Test Framework:** gtest_mock.h (default), with support for Google Test, Catch2
- **Tests:** test_hello.cpp
- **Compiler:** G++ with C++17 standard
- **Build:** `g++ -std=c++17 test_hello.cpp hello.cpp`

**Combined Build (CMake)**
- **CMake:** Separate CMakeLists.txt for each language
- **CTest:** Automatic test discovery via `add_test()`
- **Build:** `cd c-src && cmake .. && make && ctest` or `cd cpp-src && cmake .. && make && ctest`

### Python Project (`py-src/`)
- **Test Frameworks:** 
  - pytest (primary, with parametrized tests, fixtures)
  - unittest (auto-discovered and run by pytest)
  - Hypothesis (optional, for property-based testing)
- **Tests:** 125+ tests across multiple test modules
- **Detection:** Automatic via pytest.ini and test file naming
- **Build:** `python3 -m pytest tests/`

**For detailed test framework configuration, see:** [TEST_FRAMEWORKS.md](../TEST_FRAMEWORKS.md)

## Development Workflow

### Inside the Dev Container

```bash
# Navigate to projects
cd /workspace/py-src      # Python project
cd /workspace/c-src       # C/C++ project

# Run tests
pytest tests/
cmake .. && make && ctest

# Check mutation testing
mutmut run --tests-dir tests
ctest -V
```

### API Endpoints (inside container)

The mutation service runs automatically:
- **FastAPI endpoint:** `http://core-service:8000/api/v1/`
- **Health check:** `http://core-service:8000/health`
- **Grafana dashboard:** `http://localhost:3000`
- **Prometheus metrics:** `http://localhost:9090`

From host machine (port forwarded):
- **FastAPI endpoint:** `http://localhost:8001/api/v1/`

### Common Commands

```bash
# Python project operations
cd py-src
python3 -m pytest tests/ -v            # Run all tests
python3 -m pytest tests/test_hello.py  # Run specific test file
mutmut run                              # Run mutation testing

# C/C++ project operations
cd c-src
mkdir -p build && cd build
cmake .. && make                        # Build project
ctest -V                               # Run tests verbosely
ctest --output-on-failure              # Show test output on failure
```

## Integration with Mutation Engine

Both projects are automatically detected by `BuildSystemFactory`:

```python
from build_system import BuildSystemFactory

# Python project
py_adapter = BuildSystemFactory.create("project-sources/py-src", build_system="auto")
# Returns: PythonBuildAdapter

# C/C++ project
c_adapter = BuildSystemFactory.create("project-sources/c-src", build_system="auto")
# Returns: CMakeBuildAdapter
```

### Baseline Testing
```python
compile_result = adapter.compile()
test_result = adapter.run_tests()
print(f"Tests passed: {test_result.all_passed}")
```

### Mutation Generation
```python
source_files = adapter.get_source_files()
test_files = adapter.get_test_files()
# ... generate mutations using AI engine ...
```

## File Organization Rationale

- **`.devcontainer/` at project root** — Shared across all projects
- **`c-src/` and `py-src/` subdirectories** — Each project is self-contained
- **Build configs in project roots** — CMakeLists.txt, pytest.ini, setup.cfg, pyproject.toml
- **Tests in `tests/` or `test/`** — Standard test directory organization

This structure makes it easy to:
- Add new example projects (create `xyz-src/`)
- Scale to multiple mutations and test frameworks
- Keep projects isolated while sharing infrastructure

## Troubleshooting

### Dev Container Won't Start
- Ensure Docker is running: `docker ps`
- Check mutation-net exists: `docker network ls | grep mutation-net`
- Rebuild container: `Dev Containers: Rebuild Container`

### Tests Not Discovered
- Python: Ensure `pytest.ini` exists in project root
- C/C++: Ensure `CMakeLists.txt` exists and CTest is enabled

### Can't Access Core Service
- From inside container: `curl http://core-service:8000/health`
- From host: `curl http://localhost:8001/health`

## Next Steps

1. **Open the devcontainer** — Start VS Code inside the container
2. **Explore projects** — Walk through py-src/ and c-src/ implementations
3. **Run tests** — Execute test suites to see them pass
4. **Generate mutations** — Use the AI mutation testing extension
5. **Analyze results** — View mutation scores and metrics in Grafana

See individual project READMEs for detailed documentation:
- [Python Project (py-src/README.md)](py-src/README.md)
- [C/C++ Project (c-src/)](c-src/) — Documentation and CMakeLists.txt
