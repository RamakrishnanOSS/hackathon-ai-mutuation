# Test Framework Examples — Practical Usage

This document provides step-by-step examples of using different test frameworks with the GitHub workflows.

---

## Python: pytest vs unittest

### Example 1: Using pytest (Current Default)

**File: `project-sources/py-src/tests/test_example_pytest.py`**
```python
import pytest
from src.hello import say_hello

@pytest.mark.parametrize("name,expected", [
    ("Alice", "Hello, Alice!"),
    ("Bob", "Hello, Bob!"),
    ("", "Hello, !"),
])
def test_say_hello_parametrized(name, expected):
    assert say_hello(name) == expected

@pytest.fixture
def greeting_setup():
    """Fixture for test setup"""
    names = ["Alice", "Bob", "Charlie"]
    yield names

def test_greet_all(greeting_setup):
    from src.hello import greet_all
    result = greet_all(greeting_setup)
    assert len(result) == 3
    assert all("Hello" in r for r in result)
```

**Run with pytest:**
```bash
cd project-sources/py-src
python3 -m pytest tests/test_example_pytest.py -v
```

**GitHub Workflow handles this:** ✅ Automatically detected and executed by pytest

---

### Example 2: Using unittest (Standard Library)

**File: `project-sources/py-src/tests/test_example_unittest.py`**
```python
import unittest
from src.hello import say_hello, greet_all

class TestGreeting(unittest.TestCase):
    """Test suite using standard library unittest"""
    
    def test_basic_greeting(self):
        """Test basic greeting functionality"""
        self.assertEqual(say_hello("Alice"), "Hello, Alice!")
    
    def test_empty_name(self):
        """Test with empty string"""
        self.assertEqual(say_hello(""), "Hello, !")
    
    def test_special_greeting(self):
        """Test special case"""
        self.assertEqual(say_hello("World"), "Hello, World!")

class TestMultipleGreetings(unittest.TestCase):
    """Test suite for multiple greetings"""
    
    def setUp(self):
        """Run before each test"""
        self.names = ["Alice", "Bob", "Charlie"]
    
    def tearDown(self):
        """Run after each test"""
        self.names = []
    
    def test_greet_all(self):
        """Test greeting all names"""
        result = greet_all(self.names)
        self.assertEqual(len(result), 3)

if __name__ == '__main__':
    unittest.main()
```

**Run with unittest:**
```bash
cd project-sources/py-src
python3 -m unittest tests.test_example_unittest -v
```

**Run with pytest (both frameworks):**
```bash
cd project-sources/py-src
python3 -m pytest tests/ -v
# pytest automatically discovers and runs BOTH pytest and unittest tests
```

**GitHub Workflow handles this:** ✅ pytest auto-discovers unittest.TestCase classes

---

### Example 3: Both Frameworks Coexisting

**File: `project-sources/py-src/tests/test_mixed_frameworks.py`**
```python
# Mix both pytest and unittest in same file
import pytest
import unittest
from src.hello import say_hello

# pytest-style test
@pytest.mark.skip(reason="Demonstrating multiple frameworks")
def test_pytest_style():
    """pytest test style"""
    assert say_hello("Alice") == "Hello, Alice!"

# unittest-style test in same file
class TestUnittypeStyle(unittest.TestCase):
    """unittest test in mixed file"""
    def test_unittest_style(self):
        """unittest test style"""
        self.assertEqual(say_hello("Bob"), "Hello, Bob!")
```

**GitHub Workflow handles this:** ✅ pytest runs both test types seamlessly

---

## C: assert.h vs Check Framework

### Example 1: Using assert.h (Current Default)

**File: `project-sources/c-src/test/test_sample.c`** (Current)
```c
#include <assert.h>
#include <stdbool.h>

int add_or_subtract(int a, int b, bool use_add);
bool is_eligible(int age, int score, bool has_override);

static void test_add_or_subtract(void) {
    assert(add_or_subtract(10, 3, true) == 13);
    assert(add_or_subtract(10, 3, false) == 7);
}

static void test_is_eligible(void) {
    assert(is_eligible(21, 75, false) == true);
    assert(is_eligible(17, 75, false) == false);
}

int main(void) {
    test_add_or_subtract();
    test_is_eligible();
    printf("All tests passed!\n");
    return 0;  // Exit code 0 = success
}
```

**Compile and run:**
```bash
gcc -std=c11 -o test_sample test_sample.c sample.c -I..
./test_sample
echo "Exit code: $?"  # 0 = pass, non-zero = fail
```

**GitHub Workflow handles this:** ✅ Currently used, exit code 0 indicates success

---

### Example 2: Using Check Framework (Optional)

**File: `project-sources/c-src/test/test_sample_check.c`** (Alternative)
```c
#include <check.h>
#include <stdlib.h>
#include <stdbool.h>

// Function declarations
int add_or_subtract(int a, int b, bool use_add);
bool is_eligible(int age, int score, bool has_override);

// Test cases
START_TEST(test_add_with_true) {
    ck_assert_int_eq(add_or_subtract(10, 3, true), 13);
}
END_TEST

START_TEST(test_add_with_false) {
    ck_assert_int_eq(add_or_subtract(10, 3, false), 7);
}
END_TEST

START_TEST(test_is_eligible_adult) {
    ck_assert_int_eq(is_eligible(21, 75, false), true);
}
END_TEST

// Suite creation
Suite *sample_suite(void) {
    Suite *s = suite_create("Sample");
    TCase *tc_core = tcase_create("Core");
    
    tcase_add_test(tc_core, test_add_with_true);
    tcase_add_test(tc_core, test_add_with_false);
    tcase_add_test(tc_core, test_is_eligible_adult);
    
    suite_add_tcase(s, tc_core);
    return s;
}

// Main test runner
int main(void) {
    Suite *s = sample_suite();
    SRunner *sr = srunner_create(s);
    srunner_run_all(sr, CK_NORMAL);
    
    int number_failed = srunner_ntests_failed(sr);
    srunner_free(sr);
    
    return (number_failed == 0) ? 0 : 1;  // Exit code indicates pass/fail
}
```

**Compile and run (requires Check framework):**
```bash
# Install Check framework first
sudo apt-get install libcheck-dev

# Compile
gcc -std=c11 -o test_sample_check test_sample_check.c sample.c \
    $(pkg-config --cflags --libs check)

# Run
./test_sample_check
echo "Exit code: $?"
```

**GitHub Workflow handles this:** ✅ Auto-detects `#include <check.h>` and installs libcheck-dev

---

### Example 3: Both Frameworks Coexisting

**Directory structure:**
```
project-sources/c-src/test/
├── test_sample.c              # Uses assert.h
├── test_sample_check.c        # Uses Check framework
└── CMakeLists.txt             # Defines both as separate test executables
```

**Build with CMake:**
```bash
cd project-sources/c-src
mkdir build && cd build
cmake ..  # Detects both test files
make      # Builds both test_sample and test_sample_check
ctest     # Runs both, reports on both
```

**GitHub Workflow handles this:** ✅ Scripts auto-detect both, CMake builds both, both run in CI

---

## C++: gtest_mock.h vs Google Test vs Catch2

### Example 1: Using gtest_mock.h (Current Default)

**File: `project-sources/cpp-src/test/test_hello.cpp`** (Current)
```cpp
#include "gtest_mock.h"
#include <string>

std::string say_hello(const std::string& name);

TEST(TestGreeting, BasicGreeting) {
    EXPECT_EQ(say_hello("Alice"), "Hello, Alice!");
}

TEST(TestGreeting, WorldCase) {
    EXPECT_TRUE(say_hello("World") == "Hello, World!");
}

TEST(TestGreeting, EmptyString) {
    EXPECT_EQ(say_hello(""), "Hello, !");
}
```

**Compile and run:**
```bash
g++ -std=c++17 -I../../include -o test_hello \
    test_hello.cpp ../../src/hello.cpp
./test_hello
echo "Exit code: $?"
```

**GitHub Workflow handles this:** ✅ Currently used, default framework

---

### Example 2: Using Google Test Framework (Production)

**File: `project-sources/cpp-src/test/test_hello_gtest.cpp`** (Alternative)
```cpp
#include <gtest/gtest.h>
#include <string>

std::string say_hello(const std::string& name);

class GreetingTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Setup before each test
    }
    
    void TearDown() override {
        // Cleanup after each test
    }
};

TEST_F(GreetingTest, BasicGreeting) {
    EXPECT_EQ(say_hello("Alice"), "Hello, Alice!");
}

TEST_F(GreetingTest, ParametrizedTest) {
    struct TestCase {
        std::string input;
        std::string expected;
    };
    
    TestCase cases[] = {
        {"Alice", "Hello, Alice!"},
        {"Bob", "Hello, Bob!"},
        {"", "Hello, !"},
    };
    
    for (const auto& tc : cases) {
        EXPECT_EQ(say_hello(tc.input), tc.expected);
    }
}

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
```

**Compile and run:**
```bash
# Install Google Test
sudo apt-get install libgtest-dev

# Compile
g++ -std=c++17 -o test_hello_gtest \
    test_hello_gtest.cpp ../../src/hello.cpp -lgtest -lpthread

# Run
./test_hello_gtest
echo "Exit code: $?"
```

**GitHub Workflow handles this:** ✅ Auto-detects `#include <gtest/gtest.h>` and installs libgtest-dev

---

### Example 3: Using Catch2 Framework (Modern)

**File: `project-sources/cpp-src/test/test_hello_catch2.cpp`** (Alternative)
```cpp
#include "catch_amalgamated.hpp"
#include <string>

std::string say_hello(const std::string& name);

TEST_CASE("Basic Greeting") {
    REQUIRE(say_hello("Alice") == "Hello, Alice!");
    REQUIRE(say_hello("Bob") == "Hello, Bob!");
}

TEST_CASE("Special Cases", "[special]") {
    SECTION("World is special") {
        REQUIRE(say_hello("World") == "Hello, World!");
    }
    
    SECTION("Empty string") {
        REQUIRE(say_hello("") == "Hello, !");
    }
}

TEST_CASE("Greeting format", "[format]") {
    std::string result = say_hello("Charlie");
    REQUIRE(result.find("Hello,") != std::string::npos);
    REQUIRE(result.find("Charlie") != std::string::npos);
}
```

**Compile and run:**
```bash
# Download Catch2 header (header-only library)
curl -L https://github.com/catchorg/Catch2/releases/download/v3.x.x/catch_amalgamated.hpp \
     -o ../../include/catch_amalgamated.hpp

# Compile
g++ -std=c++17 -I../../include -o test_hello_catch2 \
    test_hello_catch2.cpp ../../src/hello.cpp

# Run
./test_hello_catch2
echo "Exit code: $?"
```

**GitHub Workflow handles this:** ✅ Auto-detects `#include "catch_amalgamated.hpp"`

---

### Example 4: All Three Frameworks Coexisting

**Directory structure:**
```
project-sources/cpp-src/test/
├── test_hello.cpp              # Uses gtest_mock.h (current)
├── test_hello_gtest.cpp        # Uses <gtest/gtest.h> (production)
├── test_hello_catch2.cpp       # Uses Catch2 (modern)
└── CMakeLists.txt              # Defines all three as separate test executables
```

**CMakeLists.txt setup:**
```cmake
# For gtest_mock.h (no external dependency)
add_executable(test_hello test_hello.cpp ../src/hello.cpp)
target_include_directories(test_hello PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/../include)
add_test(NAME test_hello COMMAND test_hello)

# For Google Test (optional)
if(TARGET gtest)
  add_executable(test_hello_gtest test_hello_gtest.cpp ../src/hello.cpp)
  target_link_libraries(test_hello_gtest gtest)
  add_test(NAME test_hello_gtest COMMAND test_hello_gtest)
endif()

# For Catch2 (header-only)
add_executable(test_hello_catch2 test_hello_catch2.cpp ../src/hello.cpp)
target_include_directories(test_hello_catch2 PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/../include)
add_test(NAME test_hello_catch2 COMMAND test_hello_catch2)
```

**Build and test all:**
```bash
cd project-sources/cpp-src
mkdir build && cd build
cmake ..
make
ctest -V  # Runs all three test executables
```

**GitHub Workflow handles this:** ✅ All three frameworks auto-detected and run

---

## GitHub Actions Workflow Output Examples

### Python Tests
```
Run bash project-sources/scripts/test-python.sh
[TEST-PY] Collecting test file list...
[TEST-PY] Running pytest with HTML and JUnit output...
test_hello.py::test_basic_greeting PASSED
test_example_unittest.py::TestGreeting::test_basic_greeting PASSED
[✓] pytest + unittest framework support verified
```

### C Tests
```
Run bash project-sources/scripts/test-c.sh
[TEST-C] Collecting C source files...
[TEST-C] Collecting C test file list...
[TEST-C] Detecting test frameworks...
[TEST-C] Detected framework: assert.h
[TEST-C] Compiling and running C tests...
[BUILD PASS] test_sample.c
[RUN PASS]
[✓] assert.h / Check framework support verified
```

### C++ Tests
```
Run bash project-sources/scripts/test-cpp.sh
[TEST-CPP] Collecting C++ source files...
[TEST-CPP] Collecting C++ test file list...
[TEST-CPP] Detecting test frameworks...
[TEST-CPP] Detected framework: gtest_mock.h
[TEST-CPP] Compiling and running C++ tests...
[BUILD PASS] test_hello.cpp
[RUN PASS]
[✓] gtest_mock.h / Google Test / Catch2 framework support verified
```

---

## How to Test This Locally

### Run Python tests with both frameworks:
```bash
cd project-sources/py-src
python3 -m pytest tests/ -v --tb=short
# Both pytest and unittest tests will run
```

### Run C tests with auto-detected framework:
```bash
bash project-sources/scripts/test-c.sh
# Output shows detected framework
```

### Run C++ tests with auto-detected framework:
```bash
bash project-sources/scripts/test-cpp.sh
# Output shows detected framework
```

### Run via GitHub Actions (on push or manual trigger):
```bash
# Workflows automatically:
# 1. Install framework dependencies
# 2. Run build scripts
# 3. Detect frameworks automatically
# 4. Report framework used in output
```

---

## Summary

✅ **Multiple test frameworks are fully supported** across all languages:
- Python: pytest + unittest (both run together)
- C: assert.h + Check + custom (auto-detected)
- C++: gtest_mock.h + Google Test + Catch2 + custom (auto-detected)

✅ **GitHub workflows handle all frameworks seamlessly:**
- No configuration needed to switch frameworks
- Framework auto-detected at runtime
- Exit codes determine pass/fail (universal)
- Optional frameworks installed in CI environment

✅ **Easy to add new frameworks:**
1. Create test file with framework includes
2. Build script auto-detects via #include statements
3. No CI/CD changes required
4. Framework runs immediately on next push
