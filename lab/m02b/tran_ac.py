"""M02b: analisis transien (Euler mundur + model pendamping) dan analisis AC.

Netlist sama dengan M02a, ditambah:
  ('C', nama, n1, n2, farad)
  ('L', nama, n1, n2, henry)   arus positif mengalir dari n1 ke n2 lewat induktor
Pada transien, nilai sumber 'V' dan 'I' boleh berupa fungsi waktu f(t).
Pada AC, nilai sumber adalah amplitudo fasor (boleh kompleks).
"""
import cmath
import math


def solve(A, b):
    """Eliminasi Gauss dengan pivot parsial; bekerja untuk bilangan real maupun kompleks."""
    n = len(b)
    A = [row[:] + [b[i]] for i, row in enumerate(A)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(A[r][c]))
        if abs(A[p][c]) < 1e-30:
            raise ValueError("matriks singular")
        A[c], A[p] = A[p], A[c]
        for r in range(c + 1, n):
            f = A[r][c] / A[c][c]
            for k in range(c, n + 1):
                A[r][k] -= f * A[c][k]
    x = [0.0] * n
    for r in range(n - 1, -1, -1):
        x[r] = (A[r][n] - sum(A[r][k] * x[k] for k in range(r + 1, n))) / A[r][r]
    return x


def _system(net, admit, src):
    """Susun dan selesaikan MNA. admit(e) -> admitansi elemen dua terminal (atau None);
    src(e) -> nilai sumber; arus tambahan dari model pendamping ditangani lewat elemen 'I'."""
    nodes = max(max(e[2], e[3]) for e in net)
    vs = [e for e in net if e[0] == 'V']
    m = nodes + len(vs)
    G = [[0j] * m for _ in range(m)]
    b = [0j] * m

    def add(r, c, val):
        if r > 0 and c > 0:
            G[r - 1][c - 1] += val

    for e in net:
        kind, _, a, c, _ = e
        y = admit(e)
        if y is not None:                           # stempel admitansi, sama seperti resistor
            add(a, a, y); add(c, c, y); add(a, c, -y); add(c, a, -y)
        elif kind == 'I':
            val = src(e)
            if a > 0: b[a - 1] -= val
            if c > 0: b[c - 1] += val
    for j, e in enumerate(vs):
        _, _, a, c, _ = e
        k = nodes + j
        if a > 0: G[a - 1][k] += 1; G[k][a - 1] += 1
        if c > 0: G[c - 1][k] -= 1; G[k][c - 1] -= 1
        b[k] = src(e)
    x = solve(G, b)
    return [0j] + x[:nodes]


def ac(net, f):
    """Tegangan fasor setiap simpul pada frekuensi f (Hz)."""
    w = 2 * math.pi * f

    def admit(e):
        if e[0] == 'R': return 1 / e[4]
        if e[0] == 'C': return 1j * w * e[4]
        if e[0] == 'L': return 1 / (1j * w * e[4])
        return None
    return _system(net, admit, lambda e: e[4])


def tran(net, h, steps):
    """Transien dari keadaan awal nol. Kembalikan daftar (t, tegangan simpul, arus induktor)."""
    nodes = max(max(e[2], e[3]) for e in net)
    v = [0.0] * (nodes + 1)
    il = {e[1]: 0.0 for e in net if e[0] == 'L'}
    out = [(0.0, v[:], dict(il))]
    for n in range(1, steps + 1):
        t = n * h
        comp = []                                   # sumber arus model pendamping
        for e in net:
            kind, name, a, c, val = e
            if kind == 'C':                         # i = (C/h)(v - v_lama): konduktansi C/h
                comp.append(('I', name + '#', a, c, -val / h * (v[a] - v[c])))
            elif kind == 'L':                       # i = i_lama + (h/L) v: konduktansi h/L
                comp.append(('I', name + '#', a, c, il[name]))

        def admit(e):
            if e[0] == 'R': return 1 / e[4]
            if e[0] == 'C': return e[4] / h
            if e[0] == 'L': return h / e[4]
            return None

        def src(e):
            return e[4](t) if callable(e[4]) else e[4]

        x = _system(net + comp, admit, src)
        v = [z.real for z in x]
        for e in net:
            if e[0] == 'L':
                il[e[1]] += h / e[4] * (v[e[2]] - v[e[3]])
        out.append((t, v[:], dict(il)))
    return out


def ladder(n, R, C):
    """Kawat RC terdistribusi: n segmen, total R dan C, digerakkan step 1 V di simpul 1."""
    net = [('V', 'VIN', 1, 0, 1.0)]
    for k in range(1, n + 1):
        net.append(('R', f'R{k}', k, k + 1, R / n))
        net.append(('C', f'C{k}', k + 1, 0, C / n))
    return net


def t_cross(res, node, level):
    """Waktu pertama tegangan simpul melewati level (interpolasi linear)."""
    for (t0, v0, _), (t1, v1, _) in zip(res, res[1:]):
        if v0[node] < level <= v1[node]:
            return t0 + (level - v0[node]) / (v1[node] - v0[node]) * (t1 - t0)
    return None


def close(a, b, rel):
    return abs(a - b) <= rel * abs(b)


if __name__ == "__main__":
    # 1. RC: 1 kOhm, 1 nF, tau = 1 us. Step 1 V.
    rc = [('V', 'V1', 1, 0, 1.0), ('R', 'R1', 1, 2, 1e3), ('C', 'C1', 2, 0, 1e-9)]
    res = tran(rc, 1e-9, 5000)
    assert close(res[1000][1][2], 1 - math.exp(-1), 1e-3)            # v(tau) = 63.2 %
    assert close(t_cross(res, 2, 0.5), math.log(2) * 1e-6, 1e-3)      # t50 = 0.693 tau

    # 2. Energi: separuh energi dari sumber hilang di R, berapa pun R
    for r in (100.0, 1e3, 1e4):
        net = [('V', 'V1', 1, 0, 1.0), ('R', 'R1', 1, 2, r), ('C', 'C1', 2, 0, 1e-9)]
        h = r * 1e-9 / 200
        res = tran(net, h, 200 * 12)
        e_r = sum((1.0 - s[1][2]) ** 2 / r * h for s in res[1:])
        assert close(e_r, 0.5e-9, 2e-2)

    # 3. RLC seri: overshoot sesuai rumus M01b
    L, C, R = 1e-9, 100e-9, 0.04
    zeta = R / 2 * math.sqrt(C / L)
    rlc = [('V', 'V1', 1, 0, 1.0), ('R', 'R1', 1, 2, R), ('L', 'L1', 2, 3, L), ('C', 'C1', 3, 0, C)]
    res = tran(rlc, 1e-10, 20000)
    peak = max(s[1][3] for s in res)
    assert close(peak - 1, math.exp(-math.pi * zeta / math.sqrt(1 - zeta ** 2)), 3e-2)

    # 4. AC: RC low-pass pada fc
    fc = 1 / (2 * math.pi * 1e3 * 1e-9)
    v = ac(rc, fc)
    assert close(abs(v[2]), 1 / math.sqrt(2), 1e-9) and close(math.degrees(cmath.phase(v[2])), -45.0, 1e-9)

    # 5. AC: RLC seri beresonansi, impedansi = R
    f0 = 1 / (2 * math.pi * math.sqrt(L * C))
    i0 = (1.0 - ac(rlc, f0)[2]) / R
    assert close(abs(i0), 1 / R, 1e-6)

    # 6. Kawat RC terdistribusi: Elmore = RC(n+1)/(2n), t50 mendekati 0.38 RC
    res = tran(ladder(50, 1e3, 1e-12), 2e-12, 400)
    t50 = t_cross(res, 51, 0.5)
    assert 0.36e-9 < t50 < 0.40e-9

    print("Semua uji lulus.")
    res = tran(rc, 1e-9, 5000)
    print("RC 1 kOhm, 1 nF, step 1 V:")
    for k in (1000, 2000, 3000, 5000):
        print(f"  t = {k / 1000:.0f} tau: v = {res[k][1][2]:.4f} V, teori {1 - math.exp(-k / 1000):.4f} V")
    print(f"  t50 = {t_cross(res, 2, 0.5) * 1e9:.1f} ns, teori {math.log(2) * 1e3:.1f} ns")
    print(f"RLC seri 1 nH, 100 nF, 40 mOhm: zeta = {zeta:.3f}, f0 = {f0 / 1e6:.2f} MHz, puncak = {peak:.4f} V")
    for f in (fc / 10, fc, fc * 10):
        z = ac(rc, f)[2]
        print(f"  RC low-pass f = {f / 1e3:8.2f} kHz: |H| = {abs(z):.4f} ({20 * math.log10(abs(z)):6.2f} dB), fase = {math.degrees(cmath.phase(z)):6.2f} derajat")
    for n in (1, 2, 5, 50):
        res = tran(ladder(n, 1e3, 1e-12), 2e-12, 400)
        print(f"  kawat {n:2d} segmen: Elmore = {(n + 1) / (2 * n):.3f} RC, t50 = {t_cross(res, n + 1, 0.5) * 1e9:.3f} RC")
