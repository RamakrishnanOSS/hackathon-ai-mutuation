# Test Frameworks Configuration Guide

This document describes the test frameworks supported by the AI Mutation Testing build system and how to configure or switch between them.

## Python Test Frameworks

### Supported Frameworks

#### 1. **pytest** (Default, Recommended)
- **Status**: ✅ Primary framework, fully integrated
- **Features**:
  - Parametrized testing via `@pytest.mark.parametrize`
  - Fixtures for test setup/teardown
  - Multiple reporters (HTML, JUnit, JSON)
  - Built-in assertion introspection
  - Plugin ecosystem
- **Discovery Pattern**: `test_*.py` or `*_test.py` in `tests/` directory
- **Configuration**: `pytest.ini` or `pyproject.toml`
- **CI/CD**: All Python test jobs default to pytest

#### 2. **unittest** (Also Supported)
- **Status**: ✅ Fully compatible (pytest discovers unittest tests)
- **Features**:
  - Standard library (no external dependency)
  - Test discovery via `TestCase` classes
  - Setup/teardown via `setUp()` / `tearDown()`
- **Discovery Pattern**: Classes inheriting from `unittest.TestCase`
- **Migration**: pytest automatically discovers and runs unittest tests
- **Example**: Use `unittest.TestCase` in test files alongside pytest tests

#### 3. **Property-Based Testing** (Optional Enhancement)
- **Framework**: Hypothesis
- **Use Case**: Automatic test case generation for mutation testing
- **Configuration**: `pip install hypothesis`
- **Example**:
  ```python
  from hypothesis import given, strategies as st
  
  @given(st.integers(), st.integers())
  def test_property_add_commutative(a, b):
      assert add(a, b) == add(b, a)
  ```

### Python Test Configuration

**File: `project-sources/py-src/pytest.ini`**
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = --tb=short -v
```

**To run specific framework:**
```bash
# Run with pytest (default)
pytest project-sources/py-src/tests/

# Run with unittest discovery (pytest still executes)
pytest --collect-only project-sources/py-src/tests/

# Run a specific unittest-style test file
python -m unittest project.sources.py_src.tests.test_module
```

---

## C Test Frameworks

### Supported Frameworks

#### 1. **assert.h** (Default, Lightweight)
- **Status**: ✅ Primary framework, C standard library
- **Features**:
  - Zero external dependencies
  - Simple inline assertions
  - Exit code indicates pass/fail (0 = pass, non-zero = fail)
  - Minimal overhead
- **Best For**: Simple unit tests, mutation testing baseline
- **Example**:
  ```c
  #include <assert.h>
  
  void test_add(void) {
      assert(add(2, 3) == 5);
      assert(add(-1, 1) == 0);
  }
  
  int main(void) {
      test_add();
      return 0;  // All passed
  }
  ```

#### 2. **Check Framework** (Optional Enhanced Support)
- **Status**: ⚠️ Supported by build system (needs framework detection)
- **Features**:
  - Test suite organization
  - Better failure messages
  - Fixture support
  - Verbose test reporting
- **Installation**: `sudo apt-get install check libcheck-dev`
- **Example**:
  ```c
  #include <check.h>
  
  START_TEST(test_add) {
      ck_assert_int_eq(add(2, 3), 5);
  }
  END_TEST
  ```

#### 3. **CMake CTest** (Build Integration)
- **Status**: ✅ Integrated for test discovery and execution
- **Features**:
  - Automatic test discovery from CMakeLists.txt
  - Parallel test execution
  - Test output aggregation
- **Configuration**: Via `add_test()` in `project-sources/c-src/test/CMakeLists.txt`

### C Test Configuration

**Current Build Script: `project-sources/scripts/test-c.sh`**

The script automatically:
1. **Discovers test files**: `test_*.c` in `project-sources/c-src/test/`
2. **Links source files**: Matches `test_sample.c` with `sample.c`
3. **Compiles with assert.h**: Uses GCC with `-std=c11`
4. **Executes and verifies**: Exit code determines pass/fail

**To add support for other frameworks:**

1. Create wrapper test file using desired framework
2. Build script will automatically detect and compile
3. Exit code handling works the same way

**Example: Adding Check Framework Support**

```bash
# test_sample_check.c
#include <check.h>
#include "sample.h"

START_TEST(test_add_or_subtract)
{
    ck_assert_int_eq(add_or_subtract(10, 3, true), 13);
    ck_assert_int_eq(add_or_subtract(10, 3, false), 7);
}
END_TEST

int main(void) {
    Suite *s = suite_create("sample");
    TCase *tc = tcase_create("core");
    tcase_add_test(tc, test_add_or_subtract);
    suite_add_tcase(s, tc);
    
    SRunner *sr = srunner_create(s);
    srunner_run_all(sr, CK_NORMAL);
    int failed = srunner_ntests_failed(sr);
    srunner_free(sr);
    
    return failed ? 1 : 0;
}
```

---

## C++ Test Frameworks

### Supported Frameworks

#### 1. **gtest_mock.h** (Default, Custom Implementation)
- **Status**: ✅ Primary framework, custom lightweight implementation
- **Features**:
  - GoogleTest-style syntax (`TEST`, `EXPECT_*`, `ASSERT_*`)
  - No external dependencies
  - Simple test organization
  - Assertion messages on failure
- **Best For**: Simple to moderate C++ testing, mutation testing
- **Example**:
  ```cpp
  #include "gtest_mock.h"
  
  TEST(TestGreeting, BasicGreeting) {
      EXPECT_EQ(say_hello("Alice"), "Hello, Alice!");
  }
  ```

#### 2. **Google Test (gtest)** (Optional Production Framework)
- **Status**: ⚠️ Can be enabled with `apt-get install libgtest-dev`
- **Features**:
  - Full GoogleTest framework
  - Advanced mocking with googlemock
  - Parameterized tests
  - Death tests
  - Better IDE integration
- **Compatibility**: 100% - Just replace includes and recompile

#### 3. **Catch2** (Optional Modern Framework)
- **Status**: ⚠️ Can be integrated (header-only)
- **Features**:
  - Modern C++ (C++11+)
  - Powerful BDD-style syntax
  - Better error messages
  - No compilation needed
- **Installation**: Copy single header file

### C++ Test Configuration

**Current Build Script: `project-sources/scripts/test-cpp.sh`**

The script automatically:
1. **Discovers test files**: `test_*.cpp` or `test_*.cc` in `project-sources/cpp-src/test/`
2. **Links source files**: Matches `test_hello.cpp` with `hello.cpp`
3. **Compiles with G++**: Uses `-std=c++17`
4. **Executes and verifies**: Exit code determines pass/fail

**To switch to Google Test framework:**

1. Install Google Test:
   ```bash
   sudo apt-get install libgtest-dev cmake
   cd /usr/src/gtest && sudo cmake . && sudo make && sudo make install
   ```

2. Update C++ test file:
   ```cpp
   #include <gtest/gtest.h>
   
   TEST(TestGreeting, BasicGreeting) {
       EXPECT_EQ(say_hello("Alice"), "Hello, Alice!");
   }
   
   int main(int argc, char **argv) {
       ::testing::InitGoogleTest(&argc, argv);
       return RUN_ALL_TESTS();
   }
   ```

3. Build with gtest libraries:
   ```bash
   g++ -std=c++17 -o test_hello test_hello.cpp hello.cpp -lgtest -lpthread
   ```

---

## GitHub Workflows: Framework Support

### Bare Metal Workflow (`ai-mutation-testing.yml`)

**Python Job:**
- Framework: pytest (default)
- Fallback: unittest (auto-discovered)
- Configuration: `pytest.ini` in `project-sources/py-src/`
- To customize: Edit `pytest.ini` or workflow job

**C Job:**
- Framework: assert.h (default)
- Discovery: `test_*.c` files in `project-sources/c-src/test/`
- Compiler: GCC with `-std=c11`
- To add framework: Add test file with desired framework, build script auto-detects

**C++ Job:**
- Framework: gtest_mock.h (default)
- Discovery: `test_*.cpp` files in `project-sources/cpp-src/test/`
- Compiler: G++ with `-std=c++17`
- To switch: Replace `gtest_mock.h` includes with desired framework

### Containerized Workflow (`ai-mutation-testing-containerized.yml`)

All test framework support is the same as bare metal, but runs inside Docker container. The Dockerfile includes:
- Python 3.11 with pytest pre-installed
- GCC/G++ with development headers
- CMake for build configuration

**To add framework support to Docker:**

1. Edit `.devcontainer/Dockerfile`:
   ```dockerfile
   # Add your framework
   RUN apt-get update && apt-get install -y libgtest-dev libcheck-dev
   ```

2. Rebuild container:
   ```bash
   docker build -t ai-mutation-testing:latest .
   ```

---

## Adding New Test Frameworks: Step-by-Step

### Example: Adding Catch2 for C++

1. **Download Catch2 header:**
   ```bash
   curl -L https://github.com/catchorg/Catch2/releases/download/v3.x.x/catch_amalgamated.hpp \
        -o project-sources/cpp-src/include/catch_amalgamated.hpp
   ```

2. **Write test using Catch2:**
   ```cpp
   // test_hello_catch2.cpp
   #include "catch_amalgamated.hpp"
   
   std::string say_hello(const std::string& name);
   
   TEST_CASE("say_hello basic greeting") {
       REQUIRE(say_hello("Alice") == "Hello, Alice!");
   }
   ```

3. **Build and test:**
   ```bash
   g++ -std=c++17 -I project-sources/cpp-src/include \
       -o test_hello_catch2 \
       test_hello_catch2.cpp hello.cpp
   ./test_hello_catch2
   ```

4. **Build script automatically handles it** (discovery works via executable naming)

---

## Test Framework Recommendations

| Language | Framework | When to Use | Complexity |
|----------|-----------|------------|-----------|
| **Python** | pytest | Default, modern, full-featured | Low→High |
| **Python** | unittest | Legacy code, stdlib-only requirement | Medium |
| **C** | assert.h | Default, mutation testing focus, simple cases | Very Low |
| **C** | Check | More complex test suites, better organization | Medium |
| **C++** | gtest_mock.h | Default, lightweight, mutation testing focus | Low |
| **C++** | Google Test | Production code, advanced features needed | Medium |
| **C++** | Catch2 | Modern C++, best error messages, header-only | Medium |

---

## FAQ

**Q: Can I use unittest alongside pytest in Python?**
A: Yes! pytest automatically discovers and runs unittest-style tests. Both can coexist.

**Q: Do I need to modify build scripts to support a new framework?**
A: For C/C++: If test file follows naming convention (`test_*.c`/`test_*.cpp`), it's auto-discovered.
   For Python: Just ensure file is in `project-sources/py-src/tests/` with correct naming.

**Q: How does mutation testing work with different frameworks?**
A: Build scripts verify exit code (0 = pass, non-zero = fail) regardless of framework. Any framework that respects this convention is compatible.

**Q: Can I use multiple frameworks in the same language?**
A: Yes! Each framework (unittest + pytest, assert.h + Check, etc.) can have its own test files.
   Build scripts discover and run all of them.

**Q: What if my framework isn't listed?**
A: As long as it:
   1. Respects exit codes (0 = pass, non-zero = fail)
   2. Can be invoked as a single executable
   3. Follows naming conventions for auto-discovery
   
   It should work with the build system.

---

## References

- [pytest Documentation](https://docs.pytest.org/)
- [unittest Documentation](https://docs.python.org/3/library/unittest.html)
- [Google Test](https://github.com/google/googletest)
- [Catch2](https://github.com/catchorg/Catch2)
- [Check (C Unit Testing Framework)](https://libcheck.github.io/check/)
