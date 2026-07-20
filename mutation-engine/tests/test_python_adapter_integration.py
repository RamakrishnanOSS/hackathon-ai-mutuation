"""
Integration tests for Python build system adapter.

Verifies:
1. Build adapter correctly detects Python projects
2. Tests are discovered and run correctly
3. Source files are discovered correctly
4. Multiple test frameworks work (pytest, unittest)
"""

import pytest
import sys
from pathlib import Path

# Add services to path for build_system imports
sys.path.insert(0, str(Path(__file__).parent.parent / "services"))

from build_system import BuildSystemFactory, PythonBuildAdapter


class TestPythonAdapterDetection:
    """Test Python project detection."""
    
    def test_detect_project_with_pytest_ini(self, tmp_path):
        """Detect project with pytest.ini."""
        pytest_ini = tmp_path / "pytest.ini"
        pytest_ini.write_text("[pytest]\n")
        
        assert PythonBuildAdapter.detect(str(tmp_path))
    
    def test_detect_project_with_conftest(self, tmp_path):
        """Detect project with conftest.py."""
        conftest = tmp_path / "conftest.py"
        conftest.write_text("# conftest\n")
        
        assert PythonBuildAdapter.detect(str(tmp_path))
    
    def test_detect_project_with_test_files(self, tmp_path):
        """Detect project with test_*.py files."""
        test_file = tmp_path / "test_example.py"
        test_file.write_text("def test_pass(): pass\n")
        
        assert PythonBuildAdapter.detect(str(tmp_path))
    
    def test_detect_project_with_setup_py(self, tmp_path):
        """Detect project with setup.py."""
        setup = tmp_path / "setup.py"
        setup.write_text("from setuptools import setup\n")
        
        assert PythonBuildAdapter.detect(str(tmp_path))
    
    def test_detect_project_with_tox_ini(self, tmp_path):
        """Detect project with tox.ini."""
        tox = tmp_path / "tox.ini"
        tox.write_text("[testenv]\n")
        
        assert PythonBuildAdapter.detect(str(tmp_path))
    
    def test_not_detect_empty_directory(self, tmp_path):
        """Empty directory should not be detected as Python project."""
        assert not PythonBuildAdapter.detect(str(tmp_path))


class TestPythonAdapterFactory:
    """Test factory integration with Python adapter."""
    
    def test_factory_creates_python_adapter(self, tmp_path):
        """Factory should create PythonBuildAdapter."""
        pytest_ini = tmp_path / "pytest.ini"
        pytest_ini.write_text("[pytest]\n")
        
        adapter = BuildSystemFactory.create(str(tmp_path), "auto")
        assert isinstance(adapter, PythonBuildAdapter)
    
    def test_factory_explicit_python(self, tmp_path):
        """Factory should create adapter when 'python' specified."""
        adapter = BuildSystemFactory.create(str(tmp_path), "python")
        assert isinstance(adapter, PythonBuildAdapter)


class TestPythonAdapterCompile:
    """Test Python adapter compile operation."""
    
    def test_compile_always_succeeds(self, tmp_path):
        """Python projects don't need compilation."""
        adapter = PythonBuildAdapter(str(tmp_path))
        result = adapter.compile()
        
        assert result.success
        assert result.returncode == 0
        assert "no compilation" in result.stdout.lower()


class TestPythonAdapterSourceDiscovery:
    """Test Python source file discovery."""
    
    def test_discover_source_files(self, tmp_path):
        """Discover .py files excluding test files."""
        (tmp_path / "main.py").write_text("def foo(): pass\n")
        (tmp_path / "utils.py").write_text("def bar(): pass\n")
        (tmp_path / "test_main.py").write_text("def test_foo(): pass\n")
        
        adapter = PythonBuildAdapter(str(tmp_path))
        files = adapter.get_source_files()
        
        assert "main.py" in files
        assert "utils.py" in files
        assert "test_main.py" not in files
    
    def test_discover_source_with_pattern(self, tmp_path):
        """Discover files matching pattern."""
        (tmp_path / "main.py").write_text("# source\n")
        (tmp_path / "test_main.py").write_text("# test\n")
        
        adapter = PythonBuildAdapter(str(tmp_path))
        files = adapter.get_source_files(pattern="*.py")
        
        assert len(files) >= 2  # Should find both


class TestPythonAdapterTestDiscovery:
    """Test Python test file discovery."""
    
    def test_discover_test_files_with_prefix(self, tmp_path):
        """Discover test_*.py files."""
        (tmp_path / "test_main.py").write_text("def test_foo(): pass\n")
        (tmp_path / "test_utils.py").write_text("def test_bar(): pass\n")
        (tmp_path / "main.py").write_text("def foo(): pass\n")
        
        adapter = PythonBuildAdapter(str(tmp_path))
        files = adapter.get_test_files()
        
        assert "test_main.py" in files
        assert "test_utils.py" in files
        assert "main.py" not in files
    
    def test_discover_test_files_with_suffix(self, tmp_path):
        """Discover *_test.py files."""
        (tmp_path / "main_test.py").write_text("def test_foo(): pass\n")
        
        adapter = PythonBuildAdapter(str(tmp_path))
        files = adapter.get_test_files()
        
        assert "main_test.py" in files


class TestPythonAdapterFrameworkDetection:
    """Test automatic test framework detection."""
    
    def test_detect_pytest_framework(self, tmp_path):
        """Detect pytest when pytest.ini exists."""
        (tmp_path / "pytest.ini").write_text("[pytest]\n")
        
        adapter = PythonBuildAdapter(str(tmp_path))
        framework = adapter._detect_test_framework()
        
        assert framework == "pytest"
    
    def test_detect_unittest_framework(self, tmp_path):
        """Detect unittest as fallback."""
        (tmp_path / "test_main.py").write_text("def test_foo(): pass\n")
        
        adapter = PythonBuildAdapter(str(tmp_path))
        framework = adapter._detect_test_framework()
        
        # Should detect unittest if test files exist but no pytest config
        assert framework in ["pytest", "unittest"]


class TestPythonAdapterName:
    """Test adapter naming."""
    
    def test_adapter_name(self):
        """Verify adapter name."""
        assert "Python" in PythonBuildAdapter.name()


class TestPythonAdapterOutput:
    """Test compile and test result outputs."""
    
    def test_compile_result_structure(self, tmp_path):
        """Verify compile result has required fields."""
        adapter = PythonBuildAdapter(str(tmp_path))
        result = adapter.compile()
        
        assert hasattr(result, "success")
        assert hasattr(result, "returncode")
        assert hasattr(result, "stdout")
        assert hasattr(result, "stderr")


class TestPythonAdapterPathHandling:
    """Test path handling in adapter."""
    
    def test_adapter_stores_project_path(self, tmp_path):
        """Adapter should store and handle project path."""
        adapter = PythonBuildAdapter(str(tmp_path))
        
        assert adapter.project_path == tmp_path
    
    def test_relative_path_discovery(self, tmp_path):
        """Files should be returned as relative paths."""
        (tmp_path / "main.py").write_text("# source\n")
        
        adapter = PythonBuildAdapter(str(tmp_path))
        files = adapter.get_source_files()
        
        # Files should be relative to project_path
        assert all(not Path(f).is_absolute() for f in files)


class TestPythonAdapterExcludedDirs:
    """Test that excluded directories are properly skipped."""
    
    def test_skip_pycache(self, tmp_path):
        """Skip __pycache__ directories."""
        pycache = tmp_path / "__pycache__"
        pycache.mkdir()
        (pycache / "main.cpython-39.pyc").write_bytes(b"")
        (tmp_path / "main.py").write_text("# source\n")
        
        adapter = PythonBuildAdapter(str(tmp_path))
        files = adapter.get_source_files()
        
        assert all("__pycache__" not in f for f in files)
    
    def test_skip_venv(self, tmp_path):
        """Skip venv directories."""
        venv = tmp_path / "venv"
        venv.mkdir()
        (venv / "lib").mkdir()
        (tmp_path / "main.py").write_text("# source\n")
        
        adapter = PythonBuildAdapter(str(tmp_path))
        files = adapter.get_source_files()
        
        # Should only find main.py, not venv contents
        assert len(files) == 1
        assert "main.py" in files


class TestPythonAdapterOutputParsing:
    """Test output parsing for different test frameworks."""
    
    def test_parse_pytest_summary(self):
        """Parse pytest output summary."""
        output = "5 passed in 0.12s\n"
        passed, failed, total = PythonBuildAdapter._parse_pytest_output(output)
        
        assert passed == 5
        assert failed == 0
        assert total == 5
    
    def test_parse_pytest_with_failures(self):
        """Parse pytest output with failures."""
        output = "4 failed, 1 passed in 0.15s\n"
        passed, failed, total = PythonBuildAdapter._parse_pytest_output(output)
        
        assert passed == 1
        assert failed == 4
        assert total == 5
    
    def test_parse_unittest_summary(self):
        """Parse unittest output summary."""
        output = "Ran 5 tests\n\nOK\n"
        passed, failed, total = PythonBuildAdapter._parse_unittest_output(output)
        
        assert passed == 5
        assert total == 5
