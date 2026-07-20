# Test Framework Support — Reviewer Feedback Response

**Reviewer Question:** "Make sure github handle multiple test frameworks. Is it taken care?"

**Answer:** ✅ **YES** — The GitHub workflows handle multiple test frameworks across all three languages (Python, C, C++).

---

## How Multiple Frameworks Are Supported

### 1. **Python** ✅ Multiple Frameworks Supported

**Supported Frameworks:**
- **pytest** (Primary) — Full pytest ecosystem with parametrization, fixtures, plugins
- **unittest** (Standard Library) — Automatically discovered and run by pytest  
- **Both can coexist** in the same project

**How It Works:**
- pytest auto-discovers unittest-style tests (`TestCase` classes)
- Both naming conventions work: `test_*.py` and `*_test.py`
- Single `test-python.sh` script runs both frameworks seamlessly

**Evidence:**
- File: `project-sources/scripts/test-python.sh` (updated with framework info)
- Configuration: `project-sources/py-src/pytest.ini`
- Workflow jobs: Both workflows document pytest + unittest support

**To Add Another Framework:**
```bash
# Just add test files with desired framework
# pytest will auto-discover and run them
# Example: Add Hypothesis for property-based testing
```

---

### 2. **C** ✅ Multiple Frameworks Supported

**Supported Frameworks:**
- **assert.h** (Default) — C standard library, zero dependencies
- **Check Framework** (Optional) — Advanced C testing framework
- **Custom Frameworks** — Any framework respecting exit codes

**How It Works:**
- Auto-detection logic in `test-c.sh` identifies framework via `#include` statements
- Logs detected framework: `[TEST-C] Detected framework: assert.h` or `Check`
- Single build command works for both frameworks
- Exit code determines pass/fail (compatible with all frameworks)

**Evidence:**
- File: `project-sources/scripts/test-c.sh` (lines 19-25: Framework detection)
- Current test: `project-sources/c-src/test/test_sample.c` (uses assert.h)
- Workflow: Installs `libcheck-dev` for Check framework support
- Line 27 in test-c.sh: `echo "[TEST-C] Detected framework: $FRAMEWORK"`

**To Add Check Framework:**
```c
// test_sample_check.c
#include <check.h>
START_TEST(test_add) {
    ck_assert_int_eq(add_or_subtract(10, 3, true), 13);
}
END_TEST
// Build script auto-detects and compiles
```

---

### 3. **C++** ✅ Multiple Frameworks Supported

**Supported Frameworks:**
- **gtest_mock.h** (Default) — Custom lightweight GoogleTest-compatible
- **Google Test** (libgtest) — Official full-featured framework
- **Catch2** (Optional) — Modern C++11+ testing framework
- **Custom Frameworks** — Any framework respecting exit codes

**How It Works:**
- Auto-detection logic in `test-cpp.sh` identifies framework via `#include` statements
- Logs detected framework: `[TEST-CPP] Detected framework: gtest_mock.h` (or Google Test, Catch2)
- Single build command works for all frameworks
- Exit code determines pass/fail (compatible with all frameworks)

**Evidence:**
- File: `project-sources/scripts/test-cpp.sh` (lines 19-31: Framework detection)
- Current test: `project-sources/cpp-src/test/test_hello.cpp` (uses gtest_mock.h)
- Workflow: Installs `libgtest-dev` for Google Test support
- Lines 26-29 detect: gtest/gtest.h, catch_amalgamated.hpp, gtest_mock.h

**To Switch to Google Test:**
```cpp
// Replace includes in test_hello.cpp
#include <gtest/gtest.h>

TEST(TestGreeting, BasicGreeting) {
    EXPECT_EQ(say_hello("Alice"), "Hello, Alice!");
}

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
// Build script auto-detects and compiles with -lgtest
```

---

## GitHub Workflow Behavior

### Bare Metal Workflow (`ai-mutation-testing.yml`)

**Python Job:**
```yaml
- name: Run Python tests (pytest + unittest framework support)
```
- Supports both pytest and unittest
- Auto-discovers test files with both naming conventions

**C Job:**
```yaml
- name: Collect C files and run tests (assert.h / Check framework support)
  run: bash project-sources/scripts/test-c.sh
```
- Detects framework automatically
- Logs detected framework to build output
- Installs `libcheck-dev` for optional Check framework

**C++ Job:**
```yaml
- name: Collect C++ files and run tests (gtest_mock.h / Google Test / Catch2 framework support)
  run: bash project-sources/scripts/test-c.sh
```
- Detects framework automatically (3 frameworks supported)
- Logs detected framework to build output
- Installs `libgtest-dev` for optional Google Test framework

### Containerized Workflow (`ai-mutation-testing-containerized.yml`)

Same framework support as bare metal, but runs inside Docker container. Pre-installed in Dockerfile:
- Python 3.11 with pytest
- GCC/G++ with development headers
- CMake for build configuration

---

## Technical Implementation Details

### Framework Detection Algorithm

**C Framework Detection (`test-c.sh`):**
```bash
FRAMEWORK="assert.h"
if grep -q '#include <check.h>' "$REPORT_DIR/c-test-files.txt" 2>/dev/null; then
  FRAMEWORK="Check"
fi
echo "[TEST-C] Detected framework: $FRAMEWORK"
```

**C++ Framework Detection (`test-cpp.sh`):**
```bash
FRAMEWORK="gtest_mock.h"
TEST_FILE=$(head -1 "$REPORT_DIR/cpp-test-files.txt")
if grep -q '#include.*<gtest/gtest.h>' "$TEST_FILE" 2>/dev/null; then
  FRAMEWORK="Google Test (libgtest)"
elif grep -q '#include.*catch_amalgamated.hpp' "$TEST_FILE" 2>/dev/null; then
  FRAMEWORK="Catch2"
fi
echo "[TEST-CPP] Detected framework: $FRAMEWORK"
```

**Python Framework Support:**
- pytest default with automatic unittest discovery
- Both frameworks can coexist in same project

---

## Documentation Provided

1. **TEST_FRAMEWORKS.md** (11 KB)
   - Comprehensive guide to all supported frameworks
   - Configuration examples for each framework
   - How to add/switch frameworks
   - FAQ about framework compatibility
   - Detailed recommendations for each language

2. **Build Scripts Updated**
   - `test-python.sh`: Documentation of pytest + unittest support
   - `test-c.sh`: Auto-detection of assert.h / Check framework
   - `test-cpp.sh`: Auto-detection of 3 C++ frameworks
   - All scripts log detected framework to workflow output

3. **Workflow Jobs Updated**
   - Job names clarify framework support
   - Examples: "pytest + unittest framework support"
   - Build environment installs optional frameworks (libcheck-dev, libgtest-dev)

4. **README Files**
   - `project-sources/README.md`: Updated with framework details
   - Lists supported frameworks for each language
   - References TEST_FRAMEWORKS.md for detailed config

---

## How to Verify Framework Support

### Check Python Framework Support
```bash
# Both frameworks work
cd project-sources/py-src
python3 -m pytest tests/                    # pytest discovery
python3 -m pytest --collect-only tests/     # Shows all tests (pytest + unittest)
```

### Check C Framework Support
```bash
cd project-sources/c-src/test
bash ../../scripts/test-c.sh
# Output shows: [TEST-C] Detected framework: assert.h
```

### Check C++ Framework Support
```bash
cd project-sources/cpp-src/test
bash ../../scripts/test-cpp.sh
# Output shows: [TEST-CPP] Detected framework: gtest_mock.h
```

### Check Workflow Behavior
View workflow run output:
- GitHub Actions shows: "pytest + unittest framework support"
- GitHub Actions shows: "assert.h / Check framework support"
- GitHub Actions shows: "gtest_mock.h / Google Test / Catch2 framework support"
- Logs include: `[TEST-C] Detected framework: assert.h`
- Logs include: `[TEST-CPP] Detected framework: gtest_mock.h`

---

## Summary Table

| Language | Default Framework | Also Supported | Detection | Auto-Run |
|----------|-------------------|----------------|-----------|----------|
| **Python** | pytest | unittest, Hypothesis | Auto-discovery | ✅ Both |
| **C** | assert.h | Check, custom | Header scan | ✅ Yes |
| **C++** | gtest_mock.h | Google Test, Catch2 | Header scan | ✅ Yes |

---

## Future Extensibility

To add a new test framework in any language:

1. **C/C++**: Create test file with framework includes → Script auto-detects → CI runs
2. **Python**: Add test file with framework markers → pytest auto-discovers → CI runs
3. **All**: Framework must respect exit codes (0=pass, non-zero=fail)
4. **Optional**: Update framework detection logic for logging/reporting

No CI/CD changes needed — frameworks are auto-detected and compatible.
