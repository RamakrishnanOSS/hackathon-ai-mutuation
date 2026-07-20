"""
Build System Abstraction Layer

Abstract base interface for pluggable build system adapters.
Each adapter handles project-specific compilation, test execution, and source discovery.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from pathlib import Path


@dataclass
class CompileResult:
    """Result of a compilation attempt."""
    success: bool
    returncode: int
    stdout: str
    stderr: str
    
    def __str__(self) -> str:
        status = "✅ SUCCESS" if self.success else "❌ FAILED"
        return f"{status} (exit code {self.returncode})\nStdout:\n{self.stdout}\nStderr:\n{self.stderr}"


@dataclass
class TestResult:
    """Result of test execution."""
    success: bool
    returncode: int
    stdout: str
    stderr: str
    tests_passed: int = 0
    tests_failed: int = 0
    total_tests: int = 0
    
    @property
    def all_passed(self) -> bool:
        return self.success and self.tests_failed == 0
    
    def __str__(self) -> str:
        status = "✅ PASSED" if self.all_passed else "❌ FAILED"
        return (
            f"{status}\n"
            f"Tests: {self.tests_passed} passed, {self.tests_failed} failed, "
            f"{self.total_tests} total\n"
            f"Exit code: {self.returncode}\n"
            f"Output:\n{self.stdout}\n{self.stderr}"
        )


class BuildAdapter(ABC):
    """Abstract base class for build system adapters."""
    
    def __init__(self, project_path: str):
        """Initialize adapter with project path."""
        self.project_path = Path(project_path).resolve()
        if not self.project_path.exists():
            raise ValueError(f"Project path does not exist: {project_path}")
    
    @classmethod
    @abstractmethod
    def detect(cls, project_path: str) -> bool:
        """
        Check if this adapter applies to the given project.
        
        Args:
            project_path: Root path of the project
            
        Returns:
            True if this build system is detected, False otherwise
        """
        pass
    
    @classmethod
    @abstractmethod
    def name(cls) -> str:
        """Return friendly name of the build system."""
        pass
    
    @abstractmethod
    def compile(self) -> CompileResult:
        """
        Compile the project.
        
        Returns:
            CompileResult with success status and output
        """
        pass
    
    @abstractmethod
    def run_tests(self) -> TestResult:
        """
        Execute test suite.
        
        Returns:
            TestResult with test execution details
        """
        pass
    
    @abstractmethod
    def get_source_files(self, pattern: Optional[str] = None) -> List[str]:
        """
        Discover source files in the project.
        
        Args:
            pattern: Optional glob pattern to filter files (e.g., "src/**/*.c")
            
        Returns:
            List of relative paths to source files
        """
        pass
    
    @abstractmethod
    def get_test_files(self, pattern: Optional[str] = None) -> List[str]:
        """
        Discover test files in the project.
        
        Args:
            pattern: Optional glob pattern to filter files
            
        Returns:
            List of relative paths to test files
        """
        pass
    
    def get_build_directory(self) -> Path:
        """Get or create the build directory."""
        build_dir = self.project_path / "build"
        build_dir.mkdir(exist_ok=True)
        return build_dir
