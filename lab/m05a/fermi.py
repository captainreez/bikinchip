from math import exp, log
from semi import carriers, kt, nc, nv, ni, ef_minus_ei

print("(E-EF)/kT   FD        Boltzmann  galat relatif (hanya berlaku bila E-EF > 0)")
for x in (1, 2, 3, 4, 6, 10):
    fd = 1.0 / (1.0 + exp(x))
    bz = exp(-x)
    print("%+5d     %.5f   %.5f    %6.2f%%" % (x, fd, bz, (bz - fd) / fd * 100))
T = 300.0
for nd in (1e16, 1e18, 1e19, 1e20):
    n, p = carriers(nd, 0, T)
    x = log(nc(T) / n)          # (Ec - EF)/kT bila Boltzmann
    print("Nd=%.0e: Ec-EF = %.3f kT = %.4f eV  %s" % (nd, x, x * kt(T), "Boltzmann layak (galat < 5%)" if x > 3 else "Boltzmann gagal (terdegenerasi)"))
