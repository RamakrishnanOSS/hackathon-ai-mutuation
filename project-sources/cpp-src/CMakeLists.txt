cmake_minimum_required(VERSION 3.10)
project(ai-mutation-testing-cpp VERSION 1.0.0 LANGUAGES CXX)

# ─────────────────────────────────────────────────────────────
# C++ Project Settings
# ─────────────────────────────────────────────────────────────
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Output directories
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

# Include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)

# ─────────────────────────────────────────────────────────────
# C++ Source Files
# ─────────────────────────────────────────────────────────────
set(CXX_SOURCES
    src/hello.cpp
)

# Add source library (for linking into tests)
add_library(hello_lib OBJECT ${CXX_SOURCES})
target_include_directories(hello_lib PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include)

# ─────────────────────────────────────────────────────────────
# Enable Testing with CTest
# ─────────────────────────────────────────────────────────────
enable_testing()
add_subdirectory(test)

# ─────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────
message(STATUS "=============================================================")
message(STATUS "AI Mutation Testing — C++ Project")
message(STATUS "=============================================================")
message(STATUS "CMAKE_BUILD_TYPE:    ${CMAKE_BUILD_TYPE}")
message(STATUS "CXX_STANDARD:        ${CMAKE_CXX_STANDARD}")
message(STATUS "Build Directory:     ${CMAKE_BINARY_DIR}")
message(STATUS "Source Directory:    ${CMAKE_CURRENT_SOURCE_DIR}")
message(STATUS "=============================================================")
