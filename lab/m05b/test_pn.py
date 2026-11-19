import unittest
from math import log, sqrt, log10
from pn import vbi, depletion, cj, is_sat, current, voltage, vbr, vt, EPS, cdiff, storage_time, igen
from semi import Q, ni
import schottky, bgr, rectifier


class T(unittest.TestCase):
    def test_vbi_values_and_trend(self):
        self.assertAlmostEqual(vbi(1e17, 1e16), 0.7993, places=3)
        self.assertTrue(vbi(1e15, 1e15) < vbi(1e16, 1e16) < vbi(1e18, 1e18))
        self.assertTrue(vbi(1e17, 1e16, 350.0) < vbi(1e17, 1e16, 300.0))

    def test_charge_neutrality_and_field(self):
        for na, nd in ((1e17, 1e16), (1e15, 1e15), (1e19, 1e17)):
            w, xn, xp, em = depletion(na, nd)
            self.assertAlmostEqual(xn * nd / (xp * na), 1.0, places=9)
            self.assertAlmostEqual(xn + xp, w, places=15)
            self.assertAlmostEqual(Q * nd * xn / EPS / em, 1.0, places=9)
            self.assertAlmostEqual(Q * na * xp / EPS / em, 1.0, places=9)

    def test_bias_scaling(self):
        w0 = depletion(1e17, 1e16)[0]
        for v in (-10.0, -1.0, 0.3):
            w = depletion(1e17, 1e16, v)[0]
            self.assertAlmostEqual(w / w0, sqrt((vbi(1e17, 1e16) - v) / vbi(1e17, 1e16)), places=9)
        with self.assertRaises(ValueError):
            depletion(1e17, 1e16, 0.9)

    def test_one_sided(self):
        w, xn, xp, em = depletion(1e19, 1e16)
        self.assertTrue(xp / xn < 1.01e-3)

    def test_capacitance_matches_plate(self):
        c = cj(1e17, 1e16, -2.0, 1e-4)
        w = depletion(1e17, 1e16, -2.0)[0]
        self.assertAlmostEqual(c * w / (EPS * 1e-4), 1.0, places=12)

    def test_cv_extraction(self):
        na, nd, a = 1e18, 1e16, 1e-4
        v1, v2 = -6.0, -2.0
        slope = (1 / cj(na, nd, v2, a) ** 2 - 1 / cj(na, nd, v1, a) ** 2) / (v2 - v1)
        neff = -2 / (Q * EPS * a * a * slope)
        self.assertAlmostEqual(neff / (na * nd / (na + nd)), 1.0, places=9)

    def test_diode_equation(self):
        i = is_sat(1e18, 1e16, 1e-4, 1e-6)
        self.assertAlmostEqual(current(-1.0, i) / i, -1.0, places=9)
        self.assertAlmostEqual(current(voltage(1e-3, i), i) / 1e-3, 1.0, places=9)
        dec = voltage(1e-3, i) - voltage(1e-4, i)
        self.assertAlmostEqual(dec, vt() * log(10), places=4)
        self.assertAlmostEqual(voltage(1e-2, i, 1.0, 10.0) - voltage(1e-2, i), 0.1, places=12)

    def test_is_grows_fast_with_T(self):
        i3, i35 = is_sat(1e18, 1e16, 1e-4, 1e-6, 300.0), is_sat(1e18, 1e16, 1e-4, 1e-6, 350.0)
        self.assertTrue(500 < i35 / i3 < 3000)
        self.assertAlmostEqual(is_sat(1e18, 1e16, 2e-4) / is_sat(1e18, 1e16, 1e-4), 2.0, places=9)

    def test_charge_control(self):
        self.assertAlmostEqual(cdiff(1e-3, 1e-6), 1e-9 / vt(), places=12)
        self.assertAlmostEqual(storage_time(10e-3, 5e-3, 1e-6), 1e-6 * log(3.0), places=15)
        self.assertTrue(storage_time(10e-3, 1e-3, 1e-6) > storage_time(10e-3, 10e-3, 1e-6))

    def test_generation_current(self):
        a, b = igen(1e18, 1e16, -1.0), igen(1e18, 1e16, -9.0)
        w1, w9 = depletion(1e18, 1e16, -1.0)[0], depletion(1e18, 1e16, -9.0)[0]
        self.assertAlmostEqual(b / a, w9 / w1, places=9)
        self.assertTrue(igen(1e18, 1e16, -5.0) > 1000 * is_sat(1e18, 1e16, 1e-4, 1e-6))

    def test_breakdown_trend(self):
        self.assertTrue(vbr(1e15) > vbr(1e16) > vbr(1e17))
        w, xn, xp, em = depletion(1e19, 1e16, -vbr(1e16))
        self.assertTrue(2e5 < em < 8e5)

    def test_schottky_vs_pn(self):
        i = is_sat(1e18, 1e16, 1e-4, 1e-6)
        self.assertTrue(voltage(1e-3, schottky.is_schottky(0.7)) < voltage(1e-3, i) - 0.3)
        self.assertTrue(schottky.is_schottky(0.55) > schottky.is_schottky(0.85) * 1e4)

    def test_bgr_flat(self):
        ik = 10e-6
        sl = (bgr.vbe(ik, 301.0) - bgr.vbe(ik, 299.0)) / 2
        self.assertTrue(-2.6e-3 < sl < -2.0e-3)
        self.assertTrue(bgr.dvbe(8, 350.0) > bgr.dvbe(8, 250.0))
        self.assertAlmostEqual(bgr.dvbe(8, 300.0), vt() * log(8), places=12)

    def test_rectifier(self):
        a = rectifier.simulate(5.0, 50.0, 100e-6, 1000.0)
        b = rectifier.simulate(5.0, 50.0, 1000e-6, 1000.0)
        self.assertTrue(b[0] - b[1] < a[0] - a[1])
        self.assertTrue(4.0 < a[0] < 4.6)
        self.assertTrue(b[2] > a[2])
        est = b[0] / (50.0 * 1000.0 * 1000e-6)
        self.assertTrue(abs((b[0] - b[1]) / est - 1.0) < 0.15)


if __name__ == "__main__":
    unittest.main()
