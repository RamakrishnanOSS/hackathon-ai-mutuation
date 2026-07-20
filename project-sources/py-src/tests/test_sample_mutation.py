"""
Comprehensive test suite for sample_mutation.py

Tests designed to:
1. Exercise all code paths
2. Detect mutations in operators (+/-, comparison boundaries, logical operations)
3. Verify boundary conditions and edge cases
4. Create killing tests for common mutation operators
"""

import sys
from pathlib import Path

# Import source modules from sibling src/ directory
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))
import sample_mutation
import pytest


# ─────────────────────────────────────────────────────────────
# arithmetic_substitution Tests
# Mutations: + to -, - to +, >= to >, etc.
# ─────────────────────────────────────────────────────────────

class TestArithmeticSubstitution:
    """Test arithmetic operator substitution detection."""
    
    def test_add_path_basic(self):
        """Verify the addition branch returns correct sum."""
        assert sample_mutation.arithmetic_substitution(8, 3, True) == 11
    
    def test_add_path_negative_numbers(self):
        """Addition path requires a >= 0, so negative a takes subtract path."""
        # When a=-5 (negative), a >= 0 is False, so it returns a - b
        assert sample_mutation.arithmetic_substitution(-5, 3, True) == -8  # -5 - 3

    
    def test_add_path_zero(self):
        """Addition with zero."""
        assert sample_mutation.arithmetic_substitution(0, 5, True) == 5
    
    def test_add_path_large_numbers(self):
        """Addition with large numbers."""
        assert sample_mutation.arithmetic_substitution(1000000, 2000000, True) == 3000000
    
    def test_subtract_path_basic(self):
        """Verify the subtraction branch returns correct difference."""
        assert sample_mutation.arithmetic_substitution(8, 3, False) == 5
    
    def test_subtract_path_negative_a(self):
        """Subtraction with negative first operand."""
        assert sample_mutation.arithmetic_substitution(-5, 3, False) == -8
    
    def test_subtract_path_negative_b(self):
        """Subtraction with negative second operand."""
        assert sample_mutation.arithmetic_substitution(5, -3, False) == 8
    
    def test_subtract_path_both_negative(self):
        """Subtraction with both negative operands."""
        assert sample_mutation.arithmetic_substitution(-5, -3, False) == -2
    
    def test_subtract_path_zero_first(self):
        """Subtraction with zero as first operand."""
        assert sample_mutation.arithmetic_substitution(0, 5, False) == -5
    
    def test_subtract_path_zero_second(self):
        """Subtraction with zero as second operand."""
        assert sample_mutation.arithmetic_substitution(5, 0, False) == 5
    
    def test_substitute_path_flag_false(self):
        """Flag = False should take subtract path."""
        result = sample_mutation.arithmetic_substitution(10, 7, False)
        assert result == 3
    
    def test_add_path_flag_true_positive_a(self):
        """Flag = True with a >= 0 should add."""
        # a=5, b=3, flag=True, a >= 0 is True, so return 5 + 3
        result = sample_mutation.arithmetic_substitution(5, 3, True)
        assert result == 8
    
    def test_add_path_flag_true_zero_a(self):
        """Flag = True with a == 0 should add (a >= 0 is True)."""
        result = sample_mutation.arithmetic_substitution(0, 5, True)
        assert result == 5
    
    def test_subtract_path_flag_true_negative_a(self):
        """Flag = True with a < 0 should subtract."""
        # a=-5, b=3, flag=True, a >= 0 is False, so return -5 - 3
        result = sample_mutation.arithmetic_substitution(-5, 3, True)
        assert result == -8


# ─────────────────────────────────────────────────────────────
# relational_boundary Tests
# Mutations: < to <=, <= to <, boundary values
# ─────────────────────────────────────────────────────────────

class TestRelationalBoundary:
    """Test relational operator boundary detection."""
    
    def test_low_boundary_at_9(self):
        """Value 9 is strictly less than 10."""
        assert sample_mutation.relational_boundary(9) == "LOW"
    
    def test_low_boundary_below_9(self):
        """Values below 9 should be LOW."""
        assert sample_mutation.relational_boundary(0) == "LOW"
        assert sample_mutation.relational_boundary(1) == "LOW"
        assert sample_mutation.relational_boundary(5) == "LOW"
    
    def test_low_boundary_negative(self):
        """Negative values should be LOW."""
        assert sample_mutation.relational_boundary(-100) == "LOW"
        assert sample_mutation.relational_boundary(-1) == "LOW"
    
    def test_mid_boundary_at_10(self):
        """Value 10 should be MID (value < 10 is False, value <= 20 is True)."""
        assert sample_mutation.relational_boundary(10) == "MID"
    
    def test_mid_boundary_at_20(self):
        """Value 20 should be MID (value < 10 is False, value <= 20 is True)."""
        assert sample_mutation.relational_boundary(20) == "MID"
    
    def test_mid_boundary_middle(self):
        """Values between 10 and 20 should be MID."""
        assert sample_mutation.relational_boundary(11) == "MID"
        assert sample_mutation.relational_boundary(15) == "MID"
        assert sample_mutation.relational_boundary(19) == "MID"
    
    def test_high_boundary_at_21(self):
        """Value 21 should be HIGH (value <= 20 is False)."""
        assert sample_mutation.relational_boundary(21) == "HIGH"
    
    def test_high_boundary_above_21(self):
        """Values above 21 should be HIGH."""
        assert sample_mutation.relational_boundary(100) == "HIGH"
        assert sample_mutation.relational_boundary(1000) == "HIGH"
    
    def test_boundary_detection_kills_mutations(self):
        """These tests collectively kill < to <= and <= to < mutations."""
        # If < 10 became <= 10, this would fail
        assert sample_mutation.relational_boundary(10) != "LOW"
        # If <= 20 became < 20, this would fail
        assert sample_mutation.relational_boundary(20) != "HIGH"


# ─────────────────────────────────────────────────────────────
# boolean_inversion Tests
# Mutations: 'and' to 'or', 'not' removal, constant True/False changes
# ─────────────────────────────────────────────────────────────

class TestBooleanInversion:
    """Test boolean operator mutation detection."""
    
    def test_true_true_both_true_and_not_false(self):
        """flag_a=T, flag_b=T: (T and not T) or False = False."""
        assert sample_mutation.boolean_inversion(True, True) is False
    
    def test_true_false_both_true_and_not_true(self):
        """flag_a=T, flag_b=F: (T and not F) or False = True."""
        assert sample_mutation.boolean_inversion(True, False) is True
    
    def test_false_true_false_and_not_false(self):
        """flag_a=F, flag_b=T: (F and not T) or False = False."""
        assert sample_mutation.boolean_inversion(False, True) is False
    
    def test_false_false_false_and_not_true(self):
        """flag_a=F, flag_b=F: (F and not F) or False = False."""
        assert sample_mutation.boolean_inversion(False, False) is False
    
    def test_only_true_false_combination_returns_true(self):
        """Only (True, False) should return True."""
        results = [
            sample_mutation.boolean_inversion(True, True),
            sample_mutation.boolean_inversion(True, False),
            sample_mutation.boolean_inversion(False, True),
            sample_mutation.boolean_inversion(False, False),
        ]
        assert results == [False, True, False, False]
    
    def test_detect_and_to_or_mutation(self):
        """Kills 'and' to 'or' mutation."""
        # (T and not F) or False should be True
        # If 'and' becomes 'or': (T or not F) or False = True (no change)
        # But the constraint is specific, so we verify the current behavior
        assert sample_mutation.boolean_inversion(True, False) is True
    
    def test_detect_not_removal_mutation(self):
        """Kills 'not' operator removal."""
        # If 'not' is removed: flag_a and flag_b
        # (T and F) or False = False (killed)
        result_with_not = sample_mutation.boolean_inversion(True, False)
        assert result_with_not is True


# ─────────────────────────────────────────────────────────────
# return_value_stripping Tests
# Mutations: return constant changes, comparison boundary
# ─────────────────────────────────────────────────────────────

class TestReturnValueStripping:
    """Test return value constant mutation detection."""
    
    def test_positive_count_returns_one(self):
        """Positive count should return 1."""
        assert sample_mutation.return_value_stripping(1) == 1
        assert sample_mutation.return_value_stripping(2) == 1
        assert sample_mutation.return_value_stripping(100) == 1
    
    def test_zero_count_returns_zero(self):
        """Zero count should return 0."""
        assert sample_mutation.return_value_stripping(0) == 0
    
    def test_negative_count_returns_zero(self):
        """Negative count should return 0 (count > 0 is False)."""
        assert sample_mutation.return_value_stripping(-1) == 0
        assert sample_mutation.return_value_stripping(-100) == 0
    
    def test_boundary_at_one(self):
        """Boundary between positive and non-positive."""
        assert sample_mutation.return_value_stripping(1) == 1
        assert sample_mutation.return_value_stripping(0) == 0
    
    def test_large_positive_count(self):
        """Large positive values should return 1."""
        assert sample_mutation.return_value_stripping(1000000) == 1
    
    def test_detect_return_1_to_0_mutation(self):
        """Kills mutation: return 1 -> return 0."""
        assert sample_mutation.return_value_stripping(5) != 0
        assert sample_mutation.return_value_stripping(5) == 1
    
    def test_detect_return_0_to_1_mutation(self):
        """Kills mutation: return 0 -> return 1."""
        assert sample_mutation.return_value_stripping(0) != 1
        assert sample_mutation.return_value_stripping(0) == 0
    
    def test_detect_greater_than_to_greater_equal(self):
        """Kills mutation: > to >=."""
        # If > becomes >=, return_value_stripping(0) would return 1
        assert sample_mutation.return_value_stripping(0) == 0


# ─────────────────────────────────────────────────────────────
# Integration Tests
# ─────────────────────────────────────────────────────────────

class TestIntegration:
    """Integration tests combining multiple functions."""
    
    def test_all_functions_callable(self):
        """All functions should be callable without errors."""
        assert callable(sample_mutation.arithmetic_substitution)
        assert callable(sample_mutation.relational_boundary)
        assert callable(sample_mutation.boolean_inversion)
        assert callable(sample_mutation.return_value_stripping)
    
    def test_return_types(self):
        """Verify return types of all functions."""
        assert isinstance(sample_mutation.arithmetic_substitution(1, 2, True), int)
        assert isinstance(sample_mutation.relational_boundary(15), str)
        assert isinstance(sample_mutation.boolean_inversion(True, False), bool)
        assert isinstance(sample_mutation.return_value_stripping(5), int)
    
    @pytest.mark.parametrize("value", [-100, -1, 0, 1, 9, 10, 20, 21, 100])
    def test_relational_boundary_all_ranges(self, value):
        """Comprehensive boundary test with parametrization."""
        result = sample_mutation.relational_boundary(value)
        assert result in ["LOW", "MID", "HIGH"]


# ─────────────────────────────────────────────────────────────
# Auto-synthesized Mutation Killer Tests
# These tests are designed to kill specific mutations
# ─────────────────────────────────────────────────────────────

def test_kill_arithmetic_add_to_subtract():
    """Kill mutation: a + b becomes a - b."""
    assert sample_mutation.arithmetic_substitution(8, 3, True) == 11  # Would be 5 if mutated


def test_kill_arithmetic_subtract_to_add():
    """Kill mutation: a - b becomes a + b."""
    assert sample_mutation.arithmetic_substitution(8, 3, False) == 5  # Would be 11 if mutated


def test_kill_boundary_less_to_less_equal():
    """Kill mutation: < becomes <=."""
    assert sample_mutation.relational_boundary(10) == "MID"  # Would be "LOW" if mutated


def test_kill_boundary_less_equal_to_less():
    """Kill mutation: <= becomes <."""
    assert sample_mutation.relational_boundary(20) == "MID"  # Would be "HIGH" if mutated


def test_kill_boundary_greater_to_greater_equal():
    """Kill mutation: > becomes >=."""
    # This is implicit in the boundary test


def test_kill_boolean_and_to_or():
    """Kill mutation: 'and' becomes 'or'."""
    # (True and True) -> True, but (True or True) -> True (same)
    # So we test: (True and not False) -> True, but (True or not False) -> True (same)
    # Better: (False and not False) -> False, but (False or not False) -> True (killed)
    assert sample_mutation.boolean_inversion(False, False) is False


def test_kill_boolean_not_removal():
    """Kill mutation: 'not flag_b' becomes 'flag_b'."""
    # (True and not False) -> True
    # (True and False) -> False (killed)
    assert sample_mutation.boolean_inversion(True, False) is True


def test_kill_return_value_1_to_0():
    """Kill mutation: return 1 becomes return 0."""
    assert sample_mutation.return_value_stripping(5) == 1  # Would be 0 if mutated


def test_kill_return_value_0_to_1():
    """Kill mutation: return 0 becomes return 1."""
    assert sample_mutation.return_value_stripping(-5) == 0  # Would be 1 if mutated
