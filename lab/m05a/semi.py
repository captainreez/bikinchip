"""Model semikonduktor silikon yang dipakai semua skrip lab M05a (satuan: cm, s, eV, K)."""
from math import exp, log, sqrt

K_EV = 8.617333262e-5      # konstanta Boltzmann, eV/K
Q = 1.602176634e-19        # muatan elementer, C
EPS0 = 8.8541878128e-14    # permitivitas vakum, F/cm
EPS_SI = 11.7              # permitivitas relatif silikon

def kt(T):
    """Energi termal kT dalam eV."""
    return K_EV * T

def eg(T):
    """Celah pita silikon (eV), model Varshni."""
    return 1.17 - 4.73e-4 * T * T / (T + 636.0)

def nc(T):
    """Rapat keadaan efektif pita konduksi (cm^-3)."""
    return 2.8e19 * (T / 300.0) ** 1.5

def nv(T):
    """Rapat keadaan efektif pita valensi (cm^-3)."""
    return 1.04e19 * (T / 300.0) ** 1.5

def ni(T):
    """Konsentrasi pembawa intrinsik (cm^-3)."""
    return sqrt(nc(T) * nv(T)) * exp(-eg(T) / (2.0 * kt(T)))

def carriers(nd, na, T=300.0):
    """Kesetimbangan dengan ionisasi penuh: netralitas muatan + hukum aksi massa.
    Mengembalikan (n, p) dalam cm^-3."""
    net = nd - na
    n0 = ni(T)
    if net >= 0:
        n = (net + sqrt(net * net + 4.0 * n0 * n0)) / 2.0
        return n, n0 * n0 / n
    p = (-net + sqrt(net * net + 4.0 * n0 * n0)) / 2.0
    return n0 * n0 / p, p

def ef_minus_ei(n, T=300.0):
    """Posisi level Fermi terhadap level intrinsik (eV): kT ln(n / ni)."""
    return kt(T) * log(n / ni(T))

# parameter Caughey-Thomas pada 300 K: (mu_min, mu_max, N_ref, alpha), mobilitas cm^2/(V s)
CT = {'n': (68.5, 1414.0, 9.2e16, 0.711), 'p': (44.9, 470.5, 2.23e17, 0.719)}

def mobility(ntot, kind):
    """Mobilitas pada doping total ntot (cm^-3), kind 'n' atau 'p'."""
    mn, mx, nref, a = CT[kind]
    return mn + (mx - mn) / (1.0 + (ntot / nref) ** a)

def resistivity(nd, na, T=300.0):
    """Resistivitas (ohm cm) = 1 / (q (n mu_n + p mu_p))."""
    n, p = carriers(nd, na, T)
    ntot = nd + na
    return 1.0 / (Q * (n * mobility(ntot, 'n') + p * mobility(ntot, 'p')))

def einstein_d(mu, T=300.0):
    """Koefisien difusi D = mu kT / q (cm^2/s); kT/q dalam volt sama dengan kt(T) dalam eV."""
    return mu * kt(T)
