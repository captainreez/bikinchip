from semi import mobility, resistivity, carriers, Q

print("    N(cm^-3)   mu_n    mu_p   rho_n(ohm cm)  rho_p(ohm cm)")
for e in range(14, 21):
    N = 10.0 ** e
    print("   1e%d   %7.1f %7.1f   %12.5g   %12.5g" % (e, mobility(N, 'n'), mobility(N, 'p'), resistivity(N, 0), resistivity(0, N)))
print("intrinsik 300 K: rho = %.4g ohm cm" % resistivity(0, 0))
# resistansi lembar lapisan seragam
for t_um, N in ((0.2, 1e19), (0.1, 1e20), (1.0, 1e18)):
    t = t_um * 1e-4
    print("lapisan n+ tebal %.1f um, N=%.0e: Rs = %.1f ohm/persegi" % (t_um, N, resistivity(N, 0) / t))
# wafer p 10 ohm cm: doping?
lo, hi = 1e13, 1e18
for _ in range(100):
    mid = (lo * hi) ** 0.5
    if resistivity(0, mid) > 10.0:
        lo = mid
    else:
        hi = mid
print("wafer p 10 ohm cm: Na = %.3e cm^-3" % ((lo * hi) ** 0.5))
