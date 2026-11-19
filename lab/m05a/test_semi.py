import unittest
from math import exp, log, sqrt
from semi import carriers, ni, nc, nv, eg, kt, mobility, resistivity, einstein_d, ef_minus_ei

class T(unittest.TestCase):
    def test_mass_action(self):
        for nd, na, t in ((1e16, 0, 300), (0, 1e17, 300), (1e14, 0, 500), (1e15, 9e14, 350)):
            n, p = carriers(nd, na, t)
            self.assertAlmostEqual(n * p / ni(t) ** 2, 1.0, places=9)

    def test_neutrality(self):
        for nd, na, t in ((1e16, 0, 300), (0, 1e17, 300), (1e17, 9e16, 300)):
            n, p = carriers(nd, na, t)
            self.assertAlmostEqual((p + nd - n - na) / max(nd, na), 0.0, places=9)

    def test_limits(self):
        n, p = carriers(0, 0, 300)
        self.assertAlmostEqual(n, ni(300)); self.assertAlmostEqual(p, ni(300))
        n, p = carriers(1e18, 0, 300)
        self.assertAlmostEqual(n / 1e18, 1.0, places=6)
        self.assertAlmostEqual(ef_minus_ei(ni(300)), 0.0)

    def test_ni_grows_with_T(self):
        self.assertTrue(all(ni(a) < ni(b) for a, b in ((250, 300), (300, 350), (350, 400))))
        self.assertTrue(eg(400) < eg(300) < eg(200))

    def test_mobility(self):
        ns = [10 ** e for e in range(14, 21)]
        for k in 'np':
            ms = [mobility(x, k) for x in ns]
            self.assertTrue(all(a > b for a, b in zip(ms, ms[1:])))
        self.assertGreater(mobility(1e14, 'n'), mobility(1e14, 'p'))

    def test_resistivity_falls_with_doping(self):
        self.assertTrue(resistivity(1e15, 0) > resistivity(1e16, 0) > resistivity(1e17, 0))
        self.assertAlmostEqual(resistivity(1e16, 0), 0.5, delta=0.1)

    def test_einstein(self):
        self.assertAlmostEqual(einstein_d(1400.0), 36.2, delta=0.1)

    def test_fermi_boltzmann(self):
        x = 3.0
        self.assertAlmostEqual(exp(-x) / (1 / (1 + exp(x))), 1 + exp(-x), places=9)

if __name__ == "__main__":
    unittest.main()
