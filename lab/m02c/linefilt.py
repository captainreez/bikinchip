"""M02c: diagram Bode, filter LC (matriks ABCD), dan transmission line lossless.

Semua bilangan kompleks memakai tipe bawaan Python. Frekuensi f dalam hertz.
"""
import cmath
import math


# ---------- 1. Bode dari kutub dan nol ----------
def tf(zeros, poles, k, f):
    """H(jw) = k * prod(1 + jw/wz) / prod(1 + jw/wp); zeros dan poles dalam Hz."""
    s = 1j * f
    h = complex(k)
    for z in zeros:
        h *= 1 + s / z
    for p in poles:
        h /= 1 + s / p
    return h


def db(h):
    return 20 * math.log10(abs(h))


def deg(h):
    return math.degrees(cmath.phase(h))


def asymptote_db(zeros, poles, k, f):
    """Pendekatan garis lurus: tiap kutub menambah -20 dB/dekade di atas frekuensinya."""
    d = 20 * math.log10(abs(k))
    for z in zeros:
        if f > z:
            d += 20 * math.log10(f / z)
    for p in poles:
        if f > p:
            d -= 20 * math.log10(f / p)
    return d


# ---------- 2. Filter Butterworth ----------
def butter_mag(n, f, fc):
    return 1 / math.sqrt(1 + (f / fc) ** (2 * n))


def butter_poles(n):
    """Kutub Butterworth ternormalisasi (fc = 1 rad/s) di setengah bidang kiri."""
    return [cmath.exp(1j * math.pi * (2 * k + n + 1) / (2 * n)) for k in range(n)]


def butter_g(n):
    """Koefisien prototipe tangga: g_k = 2 sin((2k-1)pi/(2n))."""
    return [2 * math.sin((2 * k - 1) * math.pi / (2 * n)) for k in range(1, n + 1)]


# ---------- 3. Rangkaian dua-port dengan matriks ABCD ----------
def mul(a, b):
    return [[a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
            [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]]]


def series(z):
    return [[1, z], [0, 1]]


def shunt(y):
    return [[1, 0], [y, 1]]


def line(z0, theta):
    """Saluran lossless dengan panjang listrik theta (radian)."""
    return [[math.cos(theta), 1j * z0 * math.sin(theta)], [1j * math.sin(theta) / z0, math.cos(theta)]]


def vout_over_vs(parts, rs, rl, f):
    """Vout/Vs untuk sumber Vs dengan hambatan rs, rantai komponen, beban rl.
    parts: daftar ('L', H, 'series'|'shunt') atau ('C', F, ...)."""
    w = 2 * math.pi * f
    m = [[1, 0], [0, 1]]
    for kind, val, pos in parts:
        z = 1j * w * val if kind == 'L' else 1 / (1j * w * val)
        m = mul(m, series(z) if pos == 'series' else shunt(1 / z))
    a, b, c, d = m[0][0], m[0][1], m[1][0], m[1][1]
    return rl / (a * rl + b + rs * (c * rl + d))


def ladder_butter(n, fc, r):
    """Tangga LC Butterworth lolos-bawah, terminasi sama r, dimulai dengan C paralel."""
    wc = 2 * math.pi * fc
    parts = []
    for k, g in enumerate(butter_g(n)):
        if k % 2 == 0:
            parts.append(('C', g / (wc * r), 'shunt'))
        else:
            parts.append(('L', g * r / wc, 'series'))
    return parts


# ---------- 4. Transmission line ----------
def gamma(zl, z0):
    return (zl - z0) / (zl + z0)


def zin(zl, z0, theta):
    t = cmath.tan(theta)
    return z0 * (zl + 1j * z0 * t) / (z0 + 1j * zl * t)


def vswr(g):
    return (1 + abs(g)) / (1 - abs(g))


def bounce(vs, rs, z0, rl, n):
    """Tegangan di ujung beban setelah tiap waktu-tempuh td (diagram kisi/bounce).
    Gelombang awal V1 = vs*z0/(rs+z0); tiap pantulan dikali gamma beban lalu gamma sumber."""
    gs, gl = gamma(rs, z0), gamma(rl, z0)
    wave = vs * z0 / (rs + z0)
    v, out = 0.0, []
    for _ in range(n):
        v += wave * (1 + gl)         # gelombang datang + pantulannya muncul di beban
        out.append(v)
        wave *= gl * gs              # satu putaran pulang-pergi
    return out


# ---------- uji dan demonstrasi ----------
def close(a, b, tol=1e-9):
    return abs(a - b) <= tol * max(1.0, abs(a), abs(b))


def _tests():
    # Bode: satu kutub pada 1 kHz
    h = tf([], [1e3], 1, 1e3)
    assert close(db(h), -3.0103, 1e-4) and close(deg(h), -45.0, 1e-9)
    assert abs(db(tf([], [1e3], 1, 100e3)) + 40.0) < 0.01          # -20 dB/dekade
    # nol dan kutub saling menghapus
    assert close(abs(tf([1e3], [1e3], 1, 5e3)), 1.0)
    # Butterworth orde 3 di 2 fc
    assert close(db(butter_mag(3, 2, 1) + 0j), -18.1, 2e-3)
    # kutub Butterworth: semua di lingkaran satuan dan di kiri
    assert all(close(abs(p), 1.0) and p.real < 0 for p in butter_poles(5))
    # tangga LC orde 3, terminasi 50 ohm, fc 1 MHz
    parts = ladder_butter(3, 1e6, 50)
    h0 = vout_over_vs(parts, 50, 50, 1.0) * 2
    hc = vout_over_vs(parts, 50, 50, 1e6) * 2
    h2 = vout_over_vs(parts, 50, 50, 2e6) * 2
    assert close(abs(h0), 1.0, 1e-5) and close(db(hc), -3.0103, 1e-4) and close(db(h2), -18.13, 1e-3)
    # transmission line: pengecilan lambda/4 dan kondisi sama
    assert close(abs(zin(100, 50, math.pi / 2) - 25), 0, 1e-9)       # Zin = Z0^2/ZL
    assert close(abs(zin(50, 50, 1.234) - 50), 0, 1e-9)              # beban sama
    assert close(abs(zin(30, 50, math.pi)) , 30, 1e-9)               # lambda/2 mengulang beban
    assert close(vswr(gamma(200, 50)), 4.0)
    # bounce konvergen ke pembagi DC
    b = bounce(1.0, 10, 50, 200, 80)
    assert close(b[-1], 200 / 210, 1e-9)
    assert close(b[0], 4 / 3, 1e-9) and close(b[1], 0.8, 1e-9)
    print("Semua uji lulus.")


if __name__ == "__main__":
    _tests()
    print("Bode, 1 kutub 1 kHz dan 1 nol 10 kHz:")
    for f in (100, 1e3, 1e4, 1e5):
        h = tf([1e4], [1e3], 1, f)
        print(f"  f = {f:>9.0f} Hz: eksak {db(h):7.2f} dB {deg(h):7.2f} deg, garis lurus {asymptote_db([1e4], [1e3], 1, f):7.2f} dB")
    print("Butterworth n=3, tangga LC 50 ohm, fc = 1 MHz:")
    print("  g =", " ".join(f"{g:.3f}" for g in butter_g(3)))
    for k, (kind, val, _) in enumerate(ladder_butter(3, 1e6, 50)):
        print(f"  elemen {k + 1}: {kind} = {val * (1e9 if kind == 'C' else 1e6):.2f} {'nF' if kind == 'C' else 'uH'}")
    parts = ladder_butter(3, 1e6, 50)
    for f in (0.5e6, 1e6, 2e6, 4e6):
        h = 2 * vout_over_vs(parts, 50, 50, f)
        print(f"  f = {f / 1e6:3.1f} MHz: {db(h):7.2f} dB, rumus {db(butter_mag(3, f, 1e6) + 0j):7.2f} dB")
    print("Saluran 50 ohm, beban 200 ohm: gamma = %.3f, VSWR = %.2f" % (gamma(200, 50), vswr(gamma(200, 50))))
    b = bounce(1.0, 10, 50, 200, 8)
    print("  Rs = 10, RL = 200, tegangan beban tiap td:", " ".join(f"{v:.4f}" for v in b), "-> akhir", f"{200 / 210:.4f}")
    z = zin(100, 50, math.pi / 2)
    print(f"  lambda/4 dengan beban 100 ohm: Zin = {z.real:.2f} ohm")
