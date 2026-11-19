from math import exp, log
from pn import is_sat, vt, voltage
from semi import K_EV

A_STAR = 112.0                 # konstanta Richardson efektif n-Si, A/(cm^2 K^2)


def is_schottky(phib, area=1e-4, T=300.0):
    """Arus saturasi emisi termionik (A): A A* T^2 exp(-phib/(kT/q))."""
    return area * A_STAR * T * T * exp(-phib / vt(T))


i_pn = is_sat(1e18, 1e16, 1e-4, 1e-6)
print("pn      : Is = %.3e A" % i_pn)
for phib in (0.55, 0.70, 0.85):
    isb = is_schottky(phib)
    print("Schottky: phiB=%.2f V  Is = %.3e A   Vf(1 mA) = %.3f V   Vf(pn, 1 mA) = %.3f V" % (phib, isb, voltage(1e-3, isb), voltage(1e-3, i_pn)))
print("Schottky phiB=0.70: Is naik %.1f kali dari 300 ke 350 K" % (is_schottky(0.70, 1e-4, 350.0) / is_schottky(0.70)))
print("pn      :          Is naik %.1f kali dari 300 ke 350 K" % (is_sat(1e18, 1e16, 1e-4, 1e-6, 350.0) / i_pn))
