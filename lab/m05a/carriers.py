from semi import carriers, ef_minus_ei, ni, kt

CASES = [
    ("intrinsik", 0.0, 0.0, 300.0),
    ("n 1e16", 1e16, 0.0, 300.0),
    ("p 1e17", 0.0, 1e17, 300.0),
    ("n 1e17 kompensasi p 9e16", 1e17, 9e16, 300.0),
    ("n 1e14 pada 300 K", 1e14, 0.0, 300.0),
    ("n 1e14 pada 500 K", 1e14, 0.0, 500.0),
    ("n 1e18", 1e18, 0.0, 300.0),
]
print("%-26s %10s %10s %10s  %s" % ("kasus", "n", "p", "EF-Ei(eV)", "jenis"))
for name, nd, na, T in CASES:
    n, p = carriers(nd, na, T)
    ef = ef_minus_ei(n, T)
    kind = "n-type" if n > p * 10 else ("p-type" if p > n * 10 else "intrinsik")
    print("%-26s %10.3e %10.3e %+10.4f  %s" % (name, n, p, ef, kind))
n, p = carriers(1e16, 0.0, 300.0)
print("np / ni^2 = %.6f" % (n * p / ni(300.0) ** 2))
