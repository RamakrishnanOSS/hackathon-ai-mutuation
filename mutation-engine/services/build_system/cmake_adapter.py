"""
CMake Build System Adapter

Handles projects using CMake for C/C++ compilation and CTest for test execution.
"""

import subprocess
import re
from pathlib import Path
from typing import List, Optional
from .base_adapter import BuildAdapter, CompileResult, TestResult


class CMakeBuildAdapter(BuildAdapter):
    """Adapter for CMake-based projects (C/C++)."""
    
    @classmethod
    def detect(cls, project_path: str) -> bool:
        """Check if CMakeLists.txt exists in project root."""
        cmake_file = Path(project_path) / "CMakeLists.txt"
        return cmake_file.exists()
    
    @classmethod
    def name(cls) -> str:
        return "CMake"
    
    def compile(self) -> CompileResult:
        """Configure and build using CMake and make."""
        build_dir = self.get_build_directory()
        
        try:
            # Step 1: Configure with CMake
            config_result = subprocess.run(
                ["cmake", ".."],
                cwd=str(build_dir),
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if config_result.returncode != 0:
                return CompileResult(
                    success=False,
                    returncode=config_result.returncode,
                    stdout=config_result.stdout,
                    stderr=config_result.stderr
                )
            
            # Step 2: Build with make
            build_result = subprocess.run(
                ["make"],
                cwd=str(build_dir),
                capture_output=True,
                text=True,
                timeout=120
            )
            
            return CompileResult(
                success=build_result.returncode == 0,
                returncode=build_result.returncode,
                stdout=config_result.stdout + "\n" + build_result.stdout,
                stderr=config_result.stderr + "\n" + build_result.stderr
            )
        
        except subprocess.TimeoutExpired as e:
            return CompileResult(
                success=False,
                returncode=-1,
                stdout="",
                stderr=f"Build timeout: {str(e)}"
            )
        except Exception as e:
            return CompileResult(
                success=False,
                returncode=-1,
                stdout="",
                stderr=f"Build error: {str(e)}"
            )
    
    def run_tests(self) -> TestResult:
        """Run tests using CTest."""
        build_dir = self.get_build_directory()
        
        try:
            result = subprocess.run(
                ["ctest", "--output-on-failure"],
                cwd=str(build_dir),
                capture_output=True,
                text=True,
                timeout=120
            )
            
            # Parse CTest output to extract test counts
            passed, failed, total = self._parse_ctest_output(result.stdout)
            
            return TestResult(
                success=result.returncode == 0,
                returncode=result.returncode,
                stdout=result.stdout,
                stderr=result.stderr,
                tests_passed=passed,
                tests_failed=failed,
                total_tests=total
            )
        
        except subprocess.TimeoutExpired as e:
            return TestResult(
                success=False,
                returncode=-1,
                stdout="",
                stderr=f"Test timeout: {str(e)}"
            )
        except Exception as e:
            return TestResult(
                success=False,
                returncode=-1,
                stdout="",
                stderr=f"Test error: {str(e)}"
            )
    
    def get_source_files(self, pattern: Optional[str] = None) -> List[str]:
        """Discover source files in src/ directory."""
        src_dir = self.project_path / "src"
        if not src_dir.exists():
            return []
        
        if pattern:
            # Use glob pattern if provided
            return [str(f.relative_to(self.project_path)) for f in src_dir.glob(pattern)]
        
        # Default: find all .c and .cpp files
        files = []
        for ext in ["*.c", "*.cpp", "*.cc", "*.cxx", "*.h", "*.hpp"]:
            files.extend(str(f.relative_to(self.project_path)) for f in src_dir.glob(ext))
        return sorted(files)
    
    def get_test_files(self, pattern: Optional[str] = None) -> List[str]:
        """Discover test files in test/ directory."""
        test_dir = self.project_path / "test"
        if not test_dir.exists():
            return []
        
        if pattern:
            return [str(f.relative_to(self.project_path)) for f in test_dir.glob(pattern)]
        
        # Default: find all test_*.c and test_*.cpp files
        files = []
        for ext in ["test_*.c", "test_*.cpp", "test_*.cc", "*_test.c", "*_test.cpp"]:
            files.extend(str(f.relative_to(self.project_path)) for f in test_dir.glob(ext))
        return sorted(files)
    
    @staticmethod
    def _parse_ctest_output(output: str) -> tuple[int, int, int]:
        """
        Parse CTest output to extract test counts.
        
        Returns:
            Tuple of (tests_passed, tests_failed, total_tests)
        """
        passed = 0
        failed = 0
        total = 0
        
        # Look for "100% tests passed" or "X% tests passed"
        match = re.search(r'(\d+)% tests passed,\s+(\d+)\s+tests failed out of (\d+)', output)
        if match:
            passed = int(match.group(3)) - int(match.group(2))
            failed = int(match.group(2))
            total = int(match.group(3))
        else:
            # Fallback: count individual test results
            passed = len(re.findall(r'PASSED', output))
            failed = len(re.findall(r'FAILED', output))
            total = passed + failed
        
        return passed, failed, total
