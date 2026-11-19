from math import log
from pn import vt
from semi import ni

IS300 = 1e-15           # BJT/dioda-terhubung, A, pada 300 K


def is_t(T):
    """Is(T) ~ ni(T)^2 (mobilitas diabaikan)."""
    return IS300 * (ni(T) / ni(300.0)) ** 2


def vbe(i, T):
    return vt(T) * log(i / is_t(T))


def dvbe(ratio, T):
    """Beda Vbe dua dioda beraliran berbeda (rasio arus atau luas): PTAT."""
    return vt(T) * log(ratio)


I = 10e-6
print("Vbe(10 uA): 250 K=%.4f  300 K=%.4f  350 K=%.4f  400 K=%.4f V" % tuple(vbe(I, T) for T in (250.0, 300.0, 350.0, 400.0)))
print("dVbe/dT pada 300 K = %.3f mV/K (CTAT)" % ((vbe(I, 301.0) - vbe(I, 299.0)) / 2 * 1e3))
N = 8
print("dVbe (rasio %d): 250 K=%.4f  300 K=%.4f  350 K=%.4f V; kemiringan %.3f mV/K (PTAT)" % (N, dvbe(N, 250.0), dvbe(N, 300.0), dvbe(N, 350.0), (dvbe(N, 301.0) - dvbe(N, 299.0)) / 2 * 1e3))
sl_c = (vbe(I, 301.0) - vbe(I, 299.0)) / 2
sl_p = (dvbe(N, 301.0) - dvbe(N, 299.0)) / 2
K = -sl_c / sl_p
print("K = %.3f agar kemiringan nol" % K)
print("Vref = Vbe + K dVbe:")
for T in (250.0, 275.0, 300.0, 325.0, 350.0, 400.0):
    print("   T=%.0f K  Vref=%.4f V" % (T, vbe(I, T) + K * dvbe(N, T)))
