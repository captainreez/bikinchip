from math import sqrt
from pn import depletion, cj, vbi, EPS
from semi import Q

NA, ND, AREA = 1e18, 1e16, 1e-4
print("C-V (Na=%.0e, Nd=%.0e, A=%.0e cm2)" % (NA, ND, AREA))
vs = [-8.0, -6.0, -4.0, -2.0, 0.0]
cs = [cj(NA, ND, v, AREA) for v in vs]
for v, c in zip(vs, cs):
    print("  V=%5.1f  C=%.3f pF  1/C^2=%.4e F^-2" % (v, c * 1e12, 1.0 / c ** 2))
# ekstraksi dari kemiringan dan potongan 1/C^2 terhadap V
y = [1.0 / c ** 2 for c in cs]
n = len(vs)
mx, my = sum(vs) / n, sum(y) / n
slope = sum((a - mx) * (b - my) for a, b in zip(vs, y)) / sum((a - mx) ** 2 for a in vs)
icpt = my - slope * mx
neff = -2.0 / (Q * EPS * AREA ** 2 * slope)
print("kemiringan = %.4e F^-2/V  ->  N_eff = %.4e cm^-3" % (slope, neff))
print("Nd = %.0e, NaNd/(Na+Nd) = %.4e" % (ND, NA * ND / (NA + ND)))
print("potongan sumbu V (1/C^2 = 0): V = %.4f V,  Vbi = %.4f V" % (-icpt / slope, vbi(NA, ND)))
