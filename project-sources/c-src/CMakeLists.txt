cmake_minimum_required(VERSION 3.10)
project(ai-mutation-testing-c VERSION 1.0.0 LANGUAGES C CXX)

# ─────────────────────────────────────────────────────────────
# Global Settings
# ─────────────────────────────────────────────────────────────
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_C_STANDARD 99)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Output directories
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

# Include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)

# ─────────────────────────────────────────────────────────────
# Source Files and Libraries
# ─────────────────────────────────────────────────────────────

# C source files
set(C_SOURCES
    src/sample.c
)

# C++ source files
set(CXX_SOURCES
    src/hello.cpp
)

# Add source library (for linking into tests)
add_library(sample_lib OBJECT ${C_SOURCES} ${CXX_SOURCES})
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
message(STATUS "AI Mutation Testing — C/C++ Project")
message(STATUS "=============================================================")
message(STATUS "CMAKE_BUILD_TYPE:    ${CMAKE_BUILD_TYPE}")
message(STATUS "C_STANDARD:          ${CMAKE_C_STANDARD}")
message(STATUS "CXX_STANDARD:        ${CMAKE_CXX_STANDARD}")
message(STATUS "Build Directory:     ${CMAKE_BINARY_DIR}")
message(STATUS "Source Directory:    ${CMAKE_CURRENT_SOURCE_DIR}")
message(STATUS "=============================================================")
