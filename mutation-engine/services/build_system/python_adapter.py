"""
Python Build System Adapter

Handles Python projects with support for multiple test frameworks:
- pytest (primary, auto-detects via pytest.ini, conftest.py)
- unittest (built-in, detects via test_*.py or *_test.py)
- nose2 (detects via .nose2cfg or setup.cfg with [nose2])
- tox (detects via tox.ini)

Supports both standalone test discovery and projects without explicit compilation.
"""

import subprocess
import re
from pathlib import Path
from typing import List, Optional, Tuple
from .base_adapter import BuildAdapter, CompileResult, TestResult


class PythonBuildAdapter(BuildAdapter):
    """Adapter for Python projects with multi-framework test support."""
    
    @classmethod
    def detect(cls, project_path: str) -> bool:
        """Check if Python project with test framework is present."""
        project = Path(project_path)
        
        # Check for pytest configuration
        if (project / "pytest.ini").exists():
            return True
        if (project / "conftest.py").exists():
            return True
        
        # Check for tox
        if (project / "tox.ini").exists():
            return True
        
        # Check for nose2 configuration
        if (project / ".nose2cfg").exists():
            return True
        if (project / "setup.cfg").exists():
            cfg = project / "setup.cfg"
            if "[nose2]" in cfg.read_text(errors="ignore"):
                return True
        
        # Check for setup.py or pyproject.toml
        if (project / "setup.py").exists():
            return True
        if (project / "pyproject.toml").exists():
            return True
        
        # Look for test files (pytest or unittest)
        test_files = list(project.glob("test_*.py")) + list(project.glob("*_test.py"))
        return len(test_files) > 0
    
    @classmethod
    def name(cls) -> str:
        return "Python (Multi-Framework)"
    
    def _detect_test_framework(self) -> str:
        """
        Auto-detect which test framework to use.
        Priority: pytest > tox > nose2 > unittest
        
        Returns:
            Framework name: 'pytest', 'tox', 'nose2', or 'unittest'
        """
        project = self.project_path
        
        # Check for pytest
        if (project / "pytest.ini").exists() or (project / "conftest.py").exists():
            return "pytest"
        
        # Check for tox
        if (project / "tox.ini").exists():
            return "tox"
        
        # Check for nose2
        if (project / ".nose2cfg").exists():
            return "nose2"
        if (project / "setup.cfg").exists():
            cfg = project / "setup.cfg"
            if "[nose2]" in cfg.read_text(errors="ignore"):
                return "nose2"
        
        # Default to unittest if test files exist
        test_files = list(project.glob("test_*.py")) + list(project.glob("*_test.py"))
        if test_files:
            return "unittest"
        
        # Fallback to pytest
        return "pytest"
    
    def compile(self) -> CompileResult:
        """Python doesn't need compilation, return success."""
        return CompileResult(
            success=True,
            returncode=0,
            stdout="Python project (no compilation needed)",
            stderr=""
        )
    
    def run_tests(self) -> TestResult:
        """Run tests using auto-detected or specified framework."""
        framework = self._detect_test_framework()
        
        if framework == "tox":
            return self._run_tox()
        elif framework == "nose2":
            return self._run_nose2()
        elif framework == "unittest":
            return self._run_unittest()
        else:
            return self._run_pytest()
    
    def _run_pytest(self) -> TestResult:
        """Run tests using pytest."""
        try:
            result = subprocess.run(
                ["python", "-m", "pytest", "-v", "--tb=short", "--no-header"],
                cwd=str(self.project_path),
                capture_output=True,
                text=True,
                timeout=120
            )
            
            # Parse pytest output
            passed, failed, total = self._parse_pytest_output(result.stdout + result.stderr)
            
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
        except FileNotFoundError:
            return TestResult(
                success=False,
                returncode=-1,
                stdout="",
                stderr="pytest not found. Install with: pip install pytest"
            )
        except Exception as e:
            return TestResult(
                success=False,
                returncode=-1,
                stdout="",
                stderr=f"pytest error: {str(e)}"
            )
    
    def _run_unittest(self) -> TestResult:
        """Run tests using unittest (Python built-in)."""
        try:
            result = subprocess.run(
                ["python", "-m", "unittest", "discover", "-s", ".", "-p", "test_*.py", "-v"],
                cwd=str(self.project_path),
                capture_output=True,
                text=True,
                timeout=120
            )
            
            # Parse unittest output
            passed, failed, total = self._parse_unittest_output(result.stderr)  # unittest prints to stderr
            
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
                stderr=f"unittest error: {str(e)}"
            )
    
    def _run_nose2(self) -> TestResult:
        """Run tests using nose2."""
        try:
            result = subprocess.run(
                ["python", "-m", "nose2", "-v"],
                cwd=str(self.project_path),
                capture_output=True,
                text=True,
                timeout=120
            )
            
            # Parse nose2 output
            passed, failed, total = self._parse_nose2_output(result.stderr)
            
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
        except FileNotFoundError:
            return TestResult(
                success=False,
                returncode=-1,
                stdout="",
                stderr="nose2 not found. Install with: pip install nose2"
            )
        except Exception as e:
            return TestResult(
                success=False,
                returncode=-1,
                stdout="",
                stderr=f"nose2 error: {str(e)}"
            )
    
    def _run_tox(self) -> TestResult:
        """Run tests using tox."""
        try:
            result = subprocess.run(
                ["tox", "-v"],
                cwd=str(self.project_path),
                capture_output=True,
                text=True,
                timeout=300  # Tox can take longer
            )
            
            # Parse tox output
            passed, failed, total = self._parse_tox_output(result.stdout + result.stderr)
            
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
        except FileNotFoundError:
            return TestResult(
                success=False,
                returncode=-1,
                stdout="",
                stderr="tox not found. Install with: pip install tox"
            )
        except Exception as e:
            return TestResult(
                success=False,
                returncode=-1,
                stdout="",
                stderr=f"tox error: {str(e)}"
            )
    
    def get_source_files(self, pattern: Optional[str] = None) -> List[str]:
        """Discover Python source files."""
        if pattern:
            files = []
            patterns = pattern.split("|")
            for p in patterns:
                files.extend([str(f.relative_to(self.project_path)) for f in self.project_path.glob(p)])
            return sorted(set(files))
        
        # Find all .py files excluding test files and special directories
        files = []
        for py_file in self.project_path.glob("**/*.py"):
            rel_path = str(py_file.relative_to(self.project_path))
            
            # Skip common exclusions
            skip_dirs = ["test_", "_test.py", "__pycache__", ".pytest_cache", ".venv", "venv", ".tox", "build", "dist", ".egg"]
            if any(skip in rel_path for skip in skip_dirs):
                continue
            
            files.append(rel_path)
        
        return sorted(files)
    
    def get_test_files(self, pattern: Optional[str] = None) -> List[str]:
        """Discover test files."""
        if pattern:
            files = []
            patterns = pattern.split("|")
            for p in patterns:
                files.extend([str(f.relative_to(self.project_path)) for f in self.project_path.glob(p)])
            return sorted(set(files))
        
        # Find test files: test_*.py or *_test.py
        files = []
        for pattern_str in ["test_*.py", "*_test.py"]:
            files.extend(
                str(f.relative_to(self.project_path))
                for f in self.project_path.glob(f"**/{pattern_str}")
                if "__pycache__" not in str(f)
            )
        
        return sorted(set(files))
    
    @staticmethod
    def _parse_pytest_output(output: str) -> Tuple[int, int, int]:
        """
        Parse pytest output to extract test counts.
        
        Returns:
            Tuple of (tests_passed, tests_failed, total_tests)
        """
        # Look for summary line like:
        # "5 passed in 0.12s"
        # "4 failed, 1 passed in 0.15s"
        # "1 failed, 2 passed, 1 skipped in 0.20s"
        
        # First try: look for "X failed, Y passed" pattern
        failed_passed_match = re.search(r'(\d+)\s+failed[,\s]+(\d+)\s+passed', output)
        if failed_passed_match:
            failed = int(failed_passed_match.group(1))
            passed = int(failed_passed_match.group(2))
            return passed, failed, passed + failed
        
        # Second try: look for just "X passed" (no failures)
        passed_match = re.search(r'(\d+)\s+passed(?:\s+in\s+[\d.]+s)?(?:\n|$)', output)
        if passed_match:
            passed = int(passed_match.group(1))
            failed = 0
            return passed, failed, passed
        
        # Fallback: count individual test results
        passed = len(re.findall(r'PASSED', output))
        failed = len(re.findall(r'FAILED', output))
        return passed, failed, passed + failed
    
    @staticmethod
    def _parse_unittest_output(output: str) -> Tuple[int, int, int]:
        """Parse unittest output to extract test counts."""
        # Look for "Ran X test(s)" and status line
        ran_match = re.search(r'Ran\s+(\d+)\s+test', output)
        
        if ran_match:
            total = int(ran_match.group(1))
            # Check for failures
            failed_match = re.search(r'FAILED\s+\(.*?failures=(\d+).*?\)', output)
            failed = int(failed_match.group(1)) if failed_match else 0
            passed = total - failed
            return passed, failed, total
        
        # Fallback
        ok_match = re.search(r'OK', output)
        if ok_match:
            return 1, 0, 1
        
        return 0, 0, 0
    
    @staticmethod
    def _parse_nose2_output(output: str) -> Tuple[int, int, int]:
        """Parse nose2 output to extract test counts."""
        # nose2 outputs similar to pytest
        match = re.search(
            r'(?:(\d+)\s+failed[,\s])?(?:(\d+)\s+passed)?',
            output
        )
        
        if match:
            failed = int(match.group(1)) if match.group(1) else 0
            passed = int(match.group(2)) if match.group(2) else 0
            total = passed + failed
            if total > 0:
                return passed, failed, total
        
        # Fallback
        return 0, 0, 0
    
    @staticmethod
    def _parse_tox_output(output: str) -> Tuple[int, int, int]:
        """Parse tox output to extract test counts (looks for pytest summary within)."""
        # Tox runs pytest internally, look for pytest summary
        match = re.search(
            r'(?:(\d+)\s+failed[,\s])?(?:(\d+)\s+passed)?',
            output
        )
        
        if match:
            failed = int(match.group(1)) if match.group(1) else 0
            passed = int(match.group(2)) if match.group(2) else 0
            total = passed + failed
            if total > 0:
                return passed, failed, total
        
        # Look for SUCCESS keyword
        if "SUCCESS" in output or "passed" in output:
            return 1, 0, 1
        
        return 0, 0, 0
