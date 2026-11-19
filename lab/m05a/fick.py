from math import exp, log, pi, sqrt
from semi import K_EV

D0EA = {"B": (0.76, 3.46), "P": (3.85, 3.66), "As": (0.066, 3.44)}   # cm^2/s, eV (nilai kisaran literatur)

def dcoef(sp, T):
    d0, ea = D0EA[sp]
    return d0 * exp(-ea / (K_EV * T))

def gauss(x, Q, Dt):
    """Profil drive-in dosis tetap, setengah ruang: C = Q / sqrt(pi D t) exp(-x^2 / 4Dt)."""
    return Q / sqrt(pi * Dt) * exp(-x * x / (4.0 * Dt))

def xj(Q, Dt, nb):
    """Kedalaman junction: C(xj) = nb."""
    c0 = Q / sqrt(pi * Dt)
    return 2.0 * sqrt(Dt * log(c0 / nb))

print("D (cm^2/s) pada beberapa suhu:")
for sp in ("B", "P", "As"):
    print("  %-2s " % sp + "  ".join("%dC: %.2e" % (c, dcoef(sp, c + 273.15)) for c in (900, 1000, 1100)))

Q, nb = 1e14, 1e15
T = 1000 + 273.15
for hours in (0.5, 1, 2, 4):
    Dt = dcoef("B", T) * hours * 3600
    print("B 1000C %.1f jam: sqrt(4Dt)=%.3f um  C0=%.2e  xj=%.3f um" % (hours, 2e4 * sqrt(Dt), Q / sqrt(pi * Dt), xj(Q, Dt, nb) * 1e4))

# beda hingga eksplisit (FTCS) dari t1 ke t2 dengan Dt_total sama seperti analitik
D = 1e-14                      # cm^2/s
t1, t2 = 1800.0, 3600.0
dx = 2.0e-6                    # cm (0,02 um)
nx = 400
dt = 0.4 * dx * dx / D         # dt <= dx^2/(2D) untuk stabil
c = [gauss(i * dx, Q, D * t1) for i in range(nx)]
t = t1
while t < t2 - 1e-9:
    h = min(dt, t2 - t)
    r = D * h / (dx * dx)
    new = c[:]
    new[0] = c[0] + 2 * r * (c[1] - c[0])      # batas pantul di x=0 (dosis kekal)
    for i in range(1, nx - 1):
        new[i] = c[i] + r * (c[i + 1] - 2 * c[i] + c[i - 1])
    c = new
    t += h
ref = [gauss(i * dx, Q, D * t2) for i in range(nx)]
err = max(abs(a - b) for a, b in zip(c, ref)) / max(ref)
dose = (sum(c) - 0.5 * c[0]) * dx
print("FTCS: langkah dt=%.0f s, kesalahan maksimum relatif terhadap puncak = %.2e, dosis = %.4e (awal %.1e)" % (dt, err, dose, Q))
