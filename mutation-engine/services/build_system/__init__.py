"""
Build System Factory

Auto-detection and factory for build system adapters.
"""

from pathlib import Path
from typing import Optional
from .base_adapter import BuildAdapter
from .cmake_adapter import CMakeBuildAdapter
from .python_adapter import PythonBuildAdapter


class BuildSystemFactory:
    """Factory for detecting and instantiating build system adapters."""
    
    # Adapters in order of preference (Python first as primary mutation target)
    ADAPTERS = [
        PythonBuildAdapter,
        CMakeBuildAdapter,
    ]
    
    # Aliases for build system names (maps user input to adapter)
    BUILD_SYSTEM_ALIASES = {
        "cmake": CMakeBuildAdapter,
        "c++": CMakeBuildAdapter,
        "cpp": CMakeBuildAdapter,
        "cmake-build": CMakeBuildAdapter,
        "python": PythonBuildAdapter,
        "pytest": PythonBuildAdapter,
        "unittest": PythonBuildAdapter,
    }
    
    @classmethod
    def detect(cls, project_path: str) -> Optional[str]:
        """
        Detect the build system used by a project, including subdirectories.

        Args:
            project_path: Root path of the project

        Returns:
            Name of detected build system, or None if no match
        """
        project = Path(project_path)
        # Check root
        for adapter_class in cls.ADAPTERS:
            if adapter_class.detect(project_path):
                return adapter_class.name()
        # Check subdirectories
        _SKIP = {"__pycache__", "node_modules", ".git", ".venv", "venv", "build", "dist"}
        subdirs = sorted(d for d in project.iterdir()
                         if d.is_dir() and not d.name.startswith(".") and d.name not in _SKIP)
        for adapter_class in cls.ADAPTERS:
            for subdir in subdirs:
                if adapter_class.detect(str(subdir)):
                    return adapter_class.name()
        return None
    
    @classmethod
    def create(cls, project_path: str, build_system: Optional[str] = None) -> BuildAdapter:
        """
        Create a build system adapter for the project.
        
        Args:
            project_path: Root path of the project
            build_system: Optional build system name/alias to use. If None, auto-detect.
                         Supported aliases: 'cmake', 'c++', 'cpp', 'cmake-build', 'python', 'pytest', 'unittest', or 'auto'
            
        Returns:
            BuildAdapter instance
            
        Raises:
            ValueError: If build system cannot be determined or is invalid
        """
        project = Path(project_path).resolve()
        if not project.exists():
            raise ValueError(f"Project path does not exist: {project_path}")
        
        # If build_system is specified, use it
        if build_system and build_system.lower() != "auto":
            # Check if it's an alias
            build_system_lower = build_system.lower()
            if build_system_lower in cls.BUILD_SYSTEM_ALIASES:
                adapter_class = cls.BUILD_SYSTEM_ALIASES[build_system_lower]
                return adapter_class(str(project))
            
            # Try to match by adapter name (for backward compatibility)
            for adapter_class in cls.ADAPTERS:
                if adapter_class.name().lower() == build_system_lower:
                    return adapter_class(str(project))
            
            raise ValueError(
                f"Unknown build system: {build_system}. "
                f"Supported: {', '.join(sorted(set(cls.BUILD_SYSTEM_ALIASES.keys())))}"
            )
        
        # Auto-detect at root first
        for adapter_class in cls.ADAPTERS:
            if adapter_class.detect(str(project)):
                return adapter_class(str(project))

        # Root had no markers — scan one level of subdirectories.
        # Skip hidden dirs (.devcontainer, .git, etc.) and non-project dirs.
        _SKIP = {"__pycache__", "node_modules", ".git", ".venv", "venv", "build", "dist"}
        subdirs = sorted(
            d for d in project.iterdir()
            if d.is_dir() and not d.name.startswith(".") and d.name not in _SKIP
        )
        for adapter_class in cls.ADAPTERS:
            for subdir in subdirs:
                if adapter_class.detect(str(subdir)):
                    return adapter_class(str(subdir))

        raise ValueError(
            f"No supported build system detected in {project_path} or its subdirectories. "
            f"Supported: CMake (CMakeLists.txt), Python (pytest.ini/conftest.py/test_*.py)"
        )
    
    @classmethod
    def list_adapters(cls) -> list[str]:
        """List all available build system adapters."""
        return [adapter.name() for adapter in cls.ADAPTERS]
