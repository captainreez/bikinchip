"""ode.py : bilangan kompleks, fasor, dan penyelesaian persamaan diferensial."""
import cmath
import math


def polar(z):
    """Bilangan kompleks ke (besar, sudut dalam derajat)."""
    return abs(z), math.degrees(cmath.phase(z))


def rect(r, deg):
    """(besar, sudut dalam derajat) ke bilangan kompleks."""
    return cmath.rect(r, math.radians(deg))


def rc_lowpass(f, R, C):
    """Fungsi transfer H = 1 / (1 + j*2*pi*f*R*C) filter RC orde satu."""
    return 1 / (1 + 1j * 2 * math.pi * f * R * C)


def euler(f, y0, t_end, h):
    """Metode Euler: y[k+1] = y[k] + h * f(t[k], y[k])."""
    t, y = 0.0, y0
    for _ in range(round(t_end / h)):
        y = y + h * f(t, y)
        t = t + h
    return y


def rk4(f, y0, t_end, h):
    """Runge-Kutta orde empat; y berupa daftar agar bisa memuat sistem."""
    def add(a, b, s):                       # a + s*b, elemen demi elemen
        return [ai + s * bi for ai, bi in zip(a, b)]
    t, y = 0.0, list(y0)
    for _ in range(round(t_end / h)):
        k1 = f(t, y)
        k2 = f(t + h / 2, add(y, k1, h / 2))
        k3 = f(t + h / 2, add(y, k2, h / 2))
        k4 = f(t + h, add(y, k3, h))
        y = [yi + h / 6 * (a + 2 * b + 2 * c + d)
             for yi, a, b, c, d in zip(y, k1, k2, k3, k4)]
        t = t + h
    return y


def step1(t, tau, y0, yf):
    """Solusi eksak orde satu: y = yf + (y0 - yf) * exp(-t/tau)."""
    return yf + (y0 - yf) * math.exp(-t / tau)


def step2(t, zeta, w0):
    """Respons step orde dua kurang teredam (0 < zeta < 1), nilai akhir 1."""
    wd = w0 * math.sqrt(1 - zeta ** 2)
    phi = math.acos(zeta)
    return 1 - math.exp(-zeta * w0 * t) / math.sqrt(1 - zeta ** 2) * math.sin(wd * t + phi)


def overshoot(zeta):
    """Overshoot puncak respons step orde dua, sebagai pecahan."""
    return math.exp(-math.pi * zeta / math.sqrt(1 - zeta ** 2))


def close(a, b, tol=1e-6):
    return abs(a - b) <= tol * max(1.0, abs(a), abs(b))


if __name__ == "__main__":
    # 1. Bilangan kompleks
    r, deg = polar(3 + 4j)
    assert close(r, 5) and close(deg, 53.13010235)
    assert (3 + 4j) * (1 - 2j) == 11 - 2j
    assert 1 / (1 + 1j) == 0.5 - 0.5j
    assert close(abs(rect(2, 90) - 2j), 0)
    assert close(polar(-1 + 0j)[1], 180)              # atan2 tahu kuadran
    assert close(abs(cmath.exp(1j * math.pi) + 1), 0)  # e^(j*pi) = -1

    # 2. Fasor: filter RC 1 kOhm, 1 nF pada frekuensi sudut potongnya
    R, C = 1e3, 1e-9
    fc = 1 / (2 * math.pi * R * C)
    mag, ph = polar(rc_lowpass(fc, R, C))
    assert close(mag, 1 / math.sqrt(2)) and close(ph, -45)

    # 3. RMS sinus = A / sqrt(2), lewat integral numerik kuadrat sinus
    n = 100000
    mean_sq = sum(math.sin(2 * math.pi * (k + 0.5) / n) ** 2 for k in range(n)) / n
    assert close(mean_sq, 0.5)

    # 4. Orde satu: dv/dt = (Vs - v)/tau, v(0) = 0, Vs = 0.8 V, tau = 1
    tau, vs = 1.0, 0.8
    rc = lambda t, v: (vs - v) / tau
    exact = step1(2.0, tau, 0.0, vs)
    assert close(exact, 0.6917318)
    e_euler = abs(euler(rc, 0.0, 2.0, 0.1) - exact)
    e_rk4 = abs(rk4(lambda t, y: [rc(t, y[0])], [0.0], 2.0, 0.1)[0] - exact)
    assert 1e-2 < e_euler < 2e-2 and e_rk4 < 1e-6
    assert abs(euler(rc, 0.0, 20.0, 2.5)) > 10        # h > 2*tau: meledak

    # 5. Orde dua: y'' + 2*zeta*w0*y' + w0^2*y = w0^2, zeta = 0.3, w0 = 1
    zeta, w0 = 0.3, 1.0
    sys2 = lambda t, y: [y[1], w0 ** 2 * (1 - y[0]) - 2 * zeta * w0 * y[1]]
    y_rk4 = rk4(sys2, [0.0, 0.0], 5.0, 0.01)[0]
    assert close(y_rk4, step2(5.0, zeta, w0), 1e-6)
    t_peak = math.pi / (w0 * math.sqrt(1 - zeta ** 2))
    assert close(step2(t_peak, zeta, w0) - 1, overshoot(zeta))
    print("Semua uji lulus.")

    print(f"|3+4j| = {r:g}, sudut = {deg:.2f} derajat")
    print(f"H(fc)  = {mag:.4f} pada {ph:.1f} derajat, fc = {fc / 1e3:.1f} kHz")
    print(f"rata-rata sin^2 = {mean_sq:.6f}, jadi RMS = A / {1 / math.sqrt(mean_sq):.4f}")
    print(f"v(2 tau) eksak = {exact:.6f} V")
    print(" h      galat Euler   galat RK4")
    for h in (0.5, 0.2, 0.1, 0.05, 0.01):
        ge = abs(euler(rc, 0.0, 2.0, h) - exact)
        gr = abs(rk4(lambda t, y: [rc(t, y[0])], [0.0], 2.0, h)[0] - exact)
        print(f" {h:<5}  {ge:.2e}      {gr:.2e}")
    print(f"zeta = {zeta}: overshoot = {overshoot(zeta) * 100:.1f} %, puncak di t = {t_peak:.3f}")
