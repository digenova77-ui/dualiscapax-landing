"""Numerical regression tests for the symplectic-form invariant.

Uses only the Python standard library. Convention: coordinates are ordered
(q1, q2, p1, p2), with J = [[0, I], [-I, 0]].
"""
import unittest

J = [
    [0.0, 0.0, 1.0, 0.0],
    [0.0, 0.0, 0.0, 1.0],
    [-1.0, 0.0, 0.0, 0.0],
    [0.0, -1.0, 0.0, 0.0],
]
IDENTITY = [
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0],
    [0.0, 0.0, 0.0, 1.0],
]


def transpose(a):
    return [list(row) for row in zip(*a)]


def matmul(a, b):
    if not a or not b or any(len(row) != len(a[0]) for row in a):
        raise ValueError("Matrices must be non-empty and rectangular")
    if len(a[0]) != len(b):
        raise ValueError("Incompatible matrix dimensions")
    return [
        [sum(a[i][k] * b[k][j] for k in range(len(b)))
         for j in range(len(b[0]))]
        for i in range(len(a))
    ]


def max_abs_difference(a, b):
    if len(a) != len(b) or not a or len(a[0]) != len(b[0]):
        raise ValueError("Matrices must have the same non-empty shape")
    return max(abs(a[i][j] - b[i][j])
               for i in range(len(a))
               for j in range(len(a[0])))


def determinant_4x4(a):
    """Gaussian-elimination determinant helper for square test matrices."""
    if len(a) != 4 or any(len(row) != 4 for row in a):
        raise ValueError("Expected a 4x4 matrix")
    m = [row[:] for row in a]
    det = 1.0
    n = len(m)
    for col in range(n):
        pivot = max(range(col, n), key=lambda row: abs(m[row][col]))
        if abs(m[pivot][col]) < 1e-14:
            return 0.0
        if pivot != col:
            m[col], m[pivot] = m[pivot], m[col]
            det *= -1.0
        value = m[col][col]
        det *= value
        for row in range(col + 1, n):
            factor = m[row][col] / value
            for j in range(col + 1, n):
                m[row][j] -= factor * m[col][j]
            m[row][col] = 0.0
    return det


def symplectic_residual(s):
    """Return max_ij |(S^T J S - J)_ij| for a 4x4 candidate S."""
    if len(s) != 4 or any(len(row) != 4 for row in s):
        raise ValueError("Symplectic matrix must be 4x4 for this test")
    return max_abs_difference(matmul(matmul(transpose(s), J), s), J)


class SymplecticInvariantTests(unittest.TestCase):
    tolerance = 1e-12

    def test_identity_is_symplectic(self):
        self.assertLessEqual(symplectic_residual(IDENTITY), self.tolerance)

    def test_constructed_canonical_transform_is_symplectic(self):
        # S = block_diag(A, (A^-1)^T), where det(A)=1.
        s = [
            [2.0, 1.0, 0.0, 0.0],
            [1.0, 1.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, -1.0],
            [0.0, 0.0, -1.0, 2.0],
        ]
        self.assertLessEqual(symplectic_residual(s), self.tolerance)

    def test_determinant_one_alone_is_not_enough_in_four_dimensions(self):
        # This matrix has determinant one but does not preserve J.
        candidate = [
            [2.0, 0.0, 0.0, 0.0],
            [0.0, 0.5, 0.0, 0.0],
            [0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 1.0],
        ]
        self.assertAlmostEqual(determinant_4x4(candidate), 1.0)
        self.assertGreater(symplectic_residual(candidate), 1e-6)

    def test_wrong_dimension_is_rejected(self):
        with self.assertRaises(ValueError):
            symplectic_residual([[1.0, 0.0], [0.0, 1.0]])


if __name__ == "__main__":
    unittest.main(verbosity=2)
