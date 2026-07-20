cmake_minimum_required(VERSION 3.10)
project(ai-mutation-testing-c VERSION 1.0.0 LANGUAGES C)

# ─────────────────────────────────────────────────────────────
# C Project Settings
# ─────────────────────────────────────────────────────────────
set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Output directories
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

# Include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)

# ─────────────────────────────────────────────────────────────
# C Source Files
# ─────────────────────────────────────────────────────────────
set(C_SOURCES
    src/sample.c
)

# Add source library (for linking into tests)
add_library(sample_lib OBJECT ${C_SOURCES})
target_include_directories(sample_lib PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include)

# ─────────────────────────────────────────────────────────────
# Enable Testing with CTest
# ─────────────────────────────────────────────────────────────
enable_testing()
add_subdirectory(test)

# ─────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────
message(STATUS "=============================================================")
message(STATUS "AI Mutation Testing — C Project")
message(STATUS "=============================================================")
message(STATUS "CMAKE_BUILD_TYPE:    ${CMAKE_BUILD_TYPE}")
message(STATUS "C_STANDARD:          ${CMAKE_C_STANDARD}")
message(STATUS "Build Directory:     ${CMAKE_BINARY_DIR}")
message(STATUS "Source Directory:    ${CMAKE_CURRENT_SOURCE_DIR}")
message(STATUS "=============================================================")
