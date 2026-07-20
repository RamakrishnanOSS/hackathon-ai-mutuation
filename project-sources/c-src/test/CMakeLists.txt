# ─────────────────────────────────────────────────────────────
# C Test Suite Configuration (CMake)
# Uses CTest for test discovery and execution
# ─────────────────────────────────────────────────────────────

# C test executable (using assert)
add_executable(test_sample test_sample.c ../src/sample.c)
target_include_directories(test_sample PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/../include)
target_include_directories(test_sample PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/..)

# Register tests with CTest
add_test(NAME test_sample COMMAND test_sample)

# ─────────────────────────────────────────────────────────────
# Test Output
# ─────────────────────────────────────────────────────────────
message(STATUS "C Tests registered:")
message(STATUS "  • test_sample (C with assert)")
