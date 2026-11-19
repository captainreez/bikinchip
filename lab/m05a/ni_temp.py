from semi import eg, kt, ni, nc, nv

print("T(K)   Eg(eV)   kT(meV)     ni(cm^-3)")
for T in (250, 300, 350, 400, 450, 500):
    print("%4d   %.4f   %6.2f   %.3e" % (T, eg(T), kt(T) * 1000, ni(T)))
print("ni(310)/ni(300) = %.3f" % (ni(310) / ni(300)))

def crossover(nd, lo=300.0, hi=900.0):
    """Suhu (K) saat ni = nd; di atasnya bahan n-type berperilaku intrinsik."""
    for _ in range(80):
        mid = (lo + hi) / 2
        if ni(mid) < nd:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2

for nd in (1e14, 1e15, 1e16, 1e17):
    T = crossover(nd)
    print("ni = Nd = %.0e pada T = %.0f K (%.0f C)" % (nd, T, T - 273.15))
