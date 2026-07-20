# ─────────────────────────────────────────────────────────────
# C++ Test Suite Configuration (CMake)
# Uses CTest for test discovery and execution
# ─────────────────────────────────────────────────────────────

# C++ test executable (using gtest_mock.h)
add_executable(test_hello test_hello.cpp ../src/hello.cpp)
target_include_directories(test_hello PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/../include)
target_include_directories(test_hello PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/..)
set_target_properties(test_hello PROPERTIES LANGUAGE CXX)

# Register tests with CTest
add_test(NAME test_hello COMMAND test_hello)

# ─────────────────────────────────────────────────────────────
# Test Output
# ─────────────────────────────────────────────────────────────
message(STATUS "C++ Tests registered:")
message(STATUS "  • test_hello (C++ with gtest_mock)")
