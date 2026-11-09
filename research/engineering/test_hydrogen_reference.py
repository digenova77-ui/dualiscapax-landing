"""Unit tests for hydrogen_reference.py; no third-party dependencies."""
import math
import unittest

from hydrogen_reference import (
    angular_probability_density,
    probability_density,
    radial_probability_density,
    radial_wavefunction,
    nonrelativistic_energy_level_ev,
)


def trapezoid(values, step):
    return step * (0.5 * values[0] + sum(values[1:-1]) + 0.5 * values[-1])


class HydrogenReferenceTests(unittest.TestCase):
    def test_known_radial_forms_in_atomic_units(self):
        r = 1.25
        self.assertAlmostEqual(radial_wavefunction(1, 0, r), 2 * math.exp(-r), places=12)
        self.assertAlmostEqual(
            radial_wavefunction(2, 1, r),
            r * math.exp(-r / 2) / (2 * math.sqrt(6)),
            places=12,
        )
        self.assertAlmostEqual(
            radial_wavefunction(3, 2, r),
            4 * r**2 * math.exp(-r / 3) / (81 * math.sqrt(30)),
            places=12,
        )

    def test_radial_normalization(self):
        step = 0.02
        points = [i * step for i in range(int(120 / step) + 1)]
        for n in range(1, 5):
            for ell in range(n):
                values = [radial_probability_density(n, ell, r) for r in points]
                integral = trapezoid(values, step)
                self.assertAlmostEqual(
                    integral, 1.0, delta=3e-4, msg=f"n={n}, ell={ell}"
                )

    def test_angular_normalization(self):
        count = 4000
        step = math.pi / count
        theta = [i * step for i in range(count + 1)]
        for ell in range(5):
            for m in range(-ell, ell + 1):
                values = [
                    2 * math.pi * angular_probability_density(ell, m, t) * math.sin(t)
                    for t in theta
                ]
                self.assertAlmostEqual(trapezoid(values, step), 1.0, delta=2e-6)

    def test_probability_density_is_nonnegative_and_m_symmetric(self):
        for n, ell in ((1, 0), (2, 1), (3, 2)):
            for m in range(-ell, ell + 1):
                for theta in (0.0, math.pi / 3, math.pi / 2, math.pi):
                    rho = probability_density(n, ell, m, 1.3, theta)
                    self.assertGreaterEqual(rho, 0.0)
                    self.assertAlmostEqual(
                        rho,
                        probability_density(n, ell, -m, 1.3, theta),
                        places=14,
                    )

    def test_reduced_mass_energy_reference_and_model_residual(self):
        # CODATA 2022 m_e/m_p and NIST ASD 5.12 H I ionization energy.
        electron_proton_mass_ratio = 5.446170214889e-4
        nist_ionization_energy_ev = 13.598434599702
        ground = abs(nonrelativistic_energy_level_ev(1, electron_proton_mass_ratio))
        second = abs(nonrelativistic_energy_level_ev(2, electron_proton_mass_ratio))

        self.assertAlmostEqual(ground, 13.59828726428329, places=12)
        self.assertAlmostEqual(second, ground / 4.0, places=14)

        # The reduced-mass Schrödinger model is close, but not precision spectroscopy.
        relative_residual = abs(ground - nist_ionization_energy_ev) / nist_ionization_energy_ev
        self.assertGreater(relative_residual, 1e-6)
        self.assertLess(relative_residual, 2e-5)

    def test_energy_reference_rejects_invalid_inputs(self):
        with self.assertRaises(ValueError):
            nonrelativistic_energy_level_ev(0)
        with self.assertRaises(ValueError):
            nonrelativistic_energy_level_ev(1, -1.0)
        with self.assertRaises(ValueError):
            nonrelativistic_energy_level_ev(1, float("nan"))
    def test_rejects_invalid_inputs(self):
        with self.assertRaises(ValueError):
            radial_wavefunction(0, 0, 1.0)
        with self.assertRaises(ValueError):
            radial_wavefunction(1, 1, 1.0)
        with self.assertRaises(ValueError):
            radial_wavefunction(1, 0, -1.0)
        with self.assertRaises(ValueError):
            angular_probability_density(1, 2, 0.5)
        with self.assertRaises(ValueError):
            probability_density(2, 1, 0, 1.0, 4.0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
