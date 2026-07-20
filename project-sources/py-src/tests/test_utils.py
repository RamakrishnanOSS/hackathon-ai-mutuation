"""
Utilities for testing and test data generation.

Provides fixtures, helpers, and test data for mutation testing scenarios.
"""

import pytest
from typing import List, Tuple, Any


class TestDataGenerator:
    """Generate test data for various scenarios."""
    
    @staticmethod
    def boundary_values(min_val: int, max_val: int) -> List[int]:
        """Generate boundary test values."""
        return [
            min_val,
            min_val + 1,
            (min_val + max_val) // 2,
            max_val - 1,
            max_val,
        ]
    
    @staticmethod
    def edge_cases() -> List[Any]:
        """Generate edge case values."""
        return [
            0,
            -1,
            1,
            "",
            [],
            {},
            None,
        ]
    
    @staticmethod
    def boolean_combinations() -> List[Tuple[bool, bool]]:
        """Generate all combinations of two booleans."""
        return [
            (True, True),
            (True, False),
            (False, True),
            (False, False),
        ]


@pytest.fixture
def test_data():
    """Provide test data generator as a fixture."""
    return TestDataGenerator()


class AssertionHelper:
    """Helper assertions for mutation testing."""
    
    @staticmethod
    def assert_operator_correct(value: int, expected: str, low: int, mid: int, high: int):
        """
        Assert that boundary operators correctly classify value.
        
        Args:
            value: Test value
            expected: Expected classification ("LOW", "MID", "HIGH")
            low: Upper bound of LOW range (exclusive)
            mid: Upper bound of MID range (inclusive)
            high: Lower bound of HIGH range (exclusive)
        """
        if value < low:
            assert expected == "LOW", f"Value {value} < {low} should be LOW"
        elif value <= mid:
            assert expected == "MID", f"Value {value} <= {mid} should be MID"
        else:
            assert expected == "HIGH", f"Value {value} > {mid} should be HIGH"
    
    @staticmethod
    def assert_arithmetic_operation(a: int, b: int, operation: str, expected: int):
        """Assert arithmetic operation result."""
        if operation == "add":
            assert a + b == expected
        elif operation == "sub":
            assert a - b == expected
        elif operation == "mul":
            assert a * b == expected
        elif operation == "div":
            assert a // b == expected if b != 0 else None


@pytest.fixture
def assertions():
    """Provide assertion helper as a fixture."""
    return AssertionHelper()


class MutationKiller:
    """Test patterns that kill specific mutation operators."""
    
    @staticmethod
    def kill_arithmetic_substitution(func, a: int, b: int, use_add: bool):
        """
        Test pattern to kill arithmetic substitution mutations.
        
        Verifies:
        - Addition produces sum, not difference
        - Subtraction produces difference, not sum
        """
        result = func(a, b, use_add)
        
        if use_add and a >= 0:
            # Must be addition
            assert result == a + b, "Mutation detected: + to - substitution"
        elif not use_add or a < 0:
            # Must be subtraction
            assert result == a - b, "Mutation detected: - to + substitution"
    
    @staticmethod
    def kill_relational_boundary(func, value: int):
        """
        Test pattern to kill relational operator mutations.
        
        Verifies:
        - < 10 boundary is respected
        - <= 20 boundary is respected
        """
        result = func(value)
        
        if value < 10:
            assert result == "LOW", "Mutation detected: < boundary changed"
        elif value <= 20:
            assert result == "MID", "Mutation detected: <= boundary changed"
        else:
            assert result == "HIGH", "Mutation detected: comparison boundary changed"
    
    @staticmethod
    def kill_boolean_operations(func, flag_a: bool, flag_b: bool):
        """
        Test pattern to kill boolean operator mutations.
        
        Verifies:
        - 'and' is preserved (not changed to 'or')
        - 'not' is preserved (not removed)
        - Logic flow is correct
        """
        result = func(flag_a, flag_b)
        
        # Truth table verification
        expected = (flag_a and not flag_b) or False
        assert result == expected, "Mutation detected: boolean operator changed"


@pytest.fixture
def killer():
    """Provide mutation killer patterns as a fixture."""
    return MutationKiller()


class CoverageValidator:
    """Validate that tests achieve good mutation testing coverage."""
    
    @staticmethod
    def check_branch_coverage(test_results: List[bool]) -> float:
        """
        Calculate what percentage of branches were tested.
        
        Args:
            test_results: List of boolean test results
            
        Returns:
            Percentage of tests passed (0.0 to 1.0)
        """
        if not test_results:
            return 0.0
        return sum(test_results) / len(test_results)
    
    @staticmethod
    def check_operator_coverage(tested_operators: set) -> bool:
        """
        Verify that critical operators were tested.
        
        Args:
            tested_operators: Set of operators that were covered
            
        Returns:
            True if all critical operators were tested
        """
        critical = {"+", "-", "<", "<=", ">", "and", "or", "not"}
        return critical.issubset(tested_operators)


@pytest.fixture
def coverage():
    """Provide coverage validator as a fixture."""
    return CoverageValidator()
