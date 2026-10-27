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
    return [
        [sum(a[i][k] * b[k][j] for k in range(len(b)))
         for j in range(len(b[0]))]
        for i in range(len(a))
    ]


def max_abs_difference(a, b):
    return max(abs(a[i][j] - b[i][j])
               for i in range(len(a))
               for j in range(len(a[0])))


def determinant_4x4(a):
    """Small Gaussian-elimination determinant helper for test matrices."""
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
    """Return max_ij |(S^T J S - J)_ij|."""
    return max_abs_difference(matmul(matmul(transpose(s), J), s), J)


class SymplecticInvariantTests(unittest.TestCase):
    tolerance = 1e-12

    def test_identity_is_symplectic(self):
        self.assertLessEqual(symplectic_residual(IDENTITY), self.tolerance)

    def test_constructed_canonical_transform_is_symplectic(self):
        # S = block_diag(A, (A^-1)^T), a standard symplectic construction.
        s = [
            [2.0, 1.0, 0.0, 0.0],
            [1.0, 1.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, -1.0],
            [0.0, 0.0, -1.0, 2.0],
        ]
        self.assertLessEqual(symplectic_residual(s), self.tolerance)

    def test_determinant_one_alone_is_not_enough_in_four_dimensions(self):
        # This matrix has determinant one but does not preserve J.
        determinant_one_non_symplectic = [
            [2.0, 0.0, 0.0, 0.0],
            [0.0, 0.5, 0.0, 0.0],
            [0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 1.0],
        ]
        self.assertAlmostEqual(determinant_4x4(determinant_one_non_symplectic), 1.0)
        self.assertGreater(symplectic_residual(determinant_one_non_symplectic), 1e-6)

    def test_wrong_dimension_is_not_silently_accepted(self):
        with self.assertRaises((IndexError, ValueError)):
            symplectic_residual([[1.0, 0.0], [0.0, 1.0]])


if __name__ == "__main__":
    unittest.main(verbosity=2)
