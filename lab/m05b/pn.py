"""Model PN junction dan dioda silikon untuk lab M05b (cm, s, V, A, K).
Memakai semi.py (salinan dari M05a): ni(T), mobility(N), einstein_d."""
from math import exp, log, sqrt
from semi import Q, EPS0, EPS_SI, kt, ni, mobility, einstein_d

EPS = EPS_SI * EPS0          # permitivitas silikon, F/cm
EG_SI = 1.12                 # celah pita (eV) untuk aturan Zener/avalanche


def vt(T=300.0):
    """Tegangan termal kT/q (V)."""
    return kt(T)


def vbi(na, nd, T=300.0):
    """Built-in potential (V) = kT/q ln(Na Nd / ni^2)."""
    return vt(T) * log(na * nd / ni(T) ** 2)


def depletion(na, nd, v=0.0, T=300.0):
    """Junction abrupt. v>0 = bias maju, v<0 = bias mundur.
    Mengembalikan (W, xn, xp, Emax): lebar total, penetrasi ke sisi n dan p (cm), medan puncak (V/cm)."""
    psi = vbi(na, nd, T) - v
    if psi <= 0:
        raise ValueError("v harus lebih kecil dari Vbi")
    w = sqrt(2.0 * EPS * psi / Q * (1.0 / na + 1.0 / nd))
    xn = w * na / (na + nd)
    xp = w * nd / (na + nd)
    return w, xn, xp, Q * nd * xn / EPS


def cj(na, nd, v=0.0, area=1.0, T=300.0):
    """Kapasitansi depletion (F) = eps A / W."""
    return EPS * area / depletion(na, nd, v, T)[0]


def is_sat(na, nd, area=1e-4, tau=1e-6, T=300.0):
    """Arus saturasi (A), dioda panjang: A q ni^2 (Dp/(Lp Nd) + Dn/(Ln Na)).
    Mobilitas pada 300 K dipakai untuk semua T; D = mu kT/q; L = sqrt(D tau)."""
    dp = einstein_d(mobility(nd + na, 'p'), T)
    dn = einstein_d(mobility(nd + na, 'n'), T)
    lp, ln_ = sqrt(dp * tau), sqrt(dn * tau)
    return area * Q * ni(T) ** 2 * (dp / (lp * nd) + dn / (ln_ * na))


def current(v, isat, n=1.0, T=300.0):
    """Persamaan dioda Shockley."""
    return isat * (exp(min(v / (n * vt(T)), 700.0)) - 1.0)


def voltage(i, isat, n=1.0, rs=0.0, T=300.0):
    """Tegangan terminal untuk arus i > 0 dengan resistansi seri rs."""
    return n * vt(T) * log(i / isat + 1.0) + i * rs


def vbr(nb):
    """Tegangan breakdown avalanche (V), junction sepihak abrupt, taksiran empiris Sze."""
    return 60.0 * (EG_SI / 1.1) ** 1.5 * (nb / 1e16) ** -0.75


def cdiff(i, tau, n=1.0, T=300.0):
    """Kapasitansi difusi gaya SPICE (F) = tau * dI/dV = tau * I / (n Vt)."""
    return tau * i / (n * vt(T))


def storage_time(i_f, i_r, tau):
    """Waktu penyimpanan (s) saat dioda dimatikan: ts = tau ln(1 + IF/IR), model kendali muatan."""
    return tau * log(1.0 + i_f / i_r)


def igen(na, nd, v, area=1e-4, tau_g=1e-6, T=300.0):
    """Arus generasi bias mundur (A) di daerah deplesi: q ni W A / (2 tau_g). Nilai positif = besarnya."""
    return Q * ni(T) * depletion(na, nd, v, T)[0] * area / (2.0 * tau_g)
