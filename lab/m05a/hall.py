from semi import Q, carriers, mobility, resistivity

# batang silikon n 1e16, I = 1 mA, B = 0,1 T. Satuan SI di dalam fungsi.
def hall_forward(n_cm3, ptype, I, B, t_m):
    n_m3 = n_cm3 * 1e6
    sign = 1 if ptype else -1
    return sign * I * B / (Q * n_m3 * t_m)

def hall_inverse(VH, I, B, t_m, rho_ohm_cm):
    RH = VH * t_m / (I * B)                    # m^3/C
    typ = "p" if RH > 0 else "n"
    conc = 1.0 / (Q * abs(RH)) * 1e-6          # cm^-3
    mu_h = abs(RH) / (rho_ohm_cm * 1e-2) * 1e4   # cm^2/Vs, mu_H = |R_H| / rho (faktor Hall r = 1)
    return typ, conc, mu_h

t = 0.5e-3
for name, nd, na in (("n 1e16", 1e16, 0), ("p 1e17", 0, 1e17)):
    n, p = carriers(nd, na)
    majority_p = p > n
    conc = p if majority_p else n
    VH = hall_forward(conc, majority_p, 1e-3, 0.1, t)
    rho = resistivity(nd, na)
    typ, c2, mu = hall_inverse(VH, 1e-3, 0.1, t, rho)
    mu_true = mobility(nd + na, 'p' if majority_p else 'n')
    print("%-7s VH = %+.4e V  rho = %.4f ohm cm -> tipe %s, N = %.3e cm^-3, mu_H = %.1f (model %.1f)" % (name, VH, rho, typ, c2, mu, mu_true))
