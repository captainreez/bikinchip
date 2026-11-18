from tran_ac import tran


def p_dyn(R, C, V, f, cycles=20, n=400):
    """Daya rata-rata yang dikeluarkan sumber kotak 0..V berfrekuensi f ke R seri C."""
    T = 1 / f
    h = T / n
    sq = lambda t: V if (t % T) < T / 2 else 0.0
    net = [('V', 'V1', 1, 0, sq), ('R', 'R1', 1, 2, R), ('C', 'C1', 2, 0, C)]
    res = tran(net, h, cycles * n)
    e = sum(sq(t) * (sq(t) - v[2]) / R * h for t, v, _ in res[1:])   # energi dari sumber
    return e / (cycles * T)


if __name__ == "__main__":
    C, V = 10e-15, 0.8                                                  # 10 fF, 0.8 V
    for R, f in ((5e3, 1e9), (20e3, 1e9), (5e3, 2e9)):
        print(f"R = {R / 1e3:4.0f} kOhm, f = {f / 1e9:.0f} GHz: P = {p_dyn(R, C, V, f) * 1e6:.3f} uW, "
              f"C V^2 f = {C * V * V * f * 1e6:.3f} uW")
