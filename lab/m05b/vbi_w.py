from math import sqrt
from pn import vbi, depletion, cj, vbr, vt
from semi import ni

print("kT/q = %.5f V, ni = %.4e cm^-3" % (vt(300.0), ni(300.0)))
print("%8s %8s %7s %9s %9s %9s %11s %10s" % ("Na", "Nd", "Vbi", "W(0V)", "xp", "xn", "Emax(V/cm)", "Cj0 nF/cm2"))
for na, nd in [(1e15, 1e15), (1e16, 1e16), (1e17, 1e16), (1e18, 1e16), (1e19, 1e17), (1e18, 1e18)]:
    w, xn, xp, em = depletion(na, nd)
    print("%8.0e %8.0e %7.4f %7.4f um %7.4f um %7.4f um %11.3e %10.2f" % (na, nd, vbi(na, nd), w * 1e4, xp * 1e4, xn * 1e4, em, cj(na, nd) * 1e9))
print()
na, nd = 1e17, 1e16
print("Na=1e17, Nd=1e16 pada beberapa bias:")
for v in (0.4, 0.0, -1.0, -5.0, -20.0):
    w, xn, xp, em = depletion(na, nd, v)
    print("  V=%6.1f  W=%.4f um  Emax=%.3e V/cm  Cj/A=%.2f nF/cm2" % (v, w * 1e4, em, cj(na, nd, v) * 1e9))
print()
print("Breakdown avalanche sepihak (Nb):")
for nb in (1e15, 1e16, 1e17, 1e18):
    print("  Nb=%.0e  Vbr=%.1f V" % (nb, vbr(nb)))
