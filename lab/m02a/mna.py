"""M02a: analisis nodal termodifikasi (MNA) untuk rangkaian DC resistif.

Netlist berupa daftar tuple, mengikuti konvensi SPICE:
  ('R', nama, n1, n2, ohm)
  ('I', nama, n1, n2, amp)   arus mengalir dari n1, lewat sumber, keluar ke n2
  ('V', nama, n1, n2, volt)  V(n1) - V(n2) = volt
Simpul 0 adalah ground. Simpul lain diberi nomor 1, 2, 3, ...
"""


def solve(A, b):
    """Eliminasi Gauss dengan pivot parsial (M01c). Mengubah salinan A dan b."""
    n = len(b)
    A = [row[:] + [b[i]] for i, row in enumerate(A)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(A[r][c]))
        if abs(A[p][c]) < 1e-15:
            raise ValueError("matriks singular: ada simpul mengambang atau loop sumber tegangan")
        A[c], A[p] = A[p], A[c]
        for r in range(c + 1, n):
            f = A[r][c] / A[c][c]
            for k in range(c, n + 1):
                A[r][k] -= f * A[c][k]
    x = [0.0] * n
    for r in range(n - 1, -1, -1):
        x[r] = (A[r][n] - sum(A[r][k] * x[k] for k in range(r + 1, n))) / A[r][r]
    return x


def mna(net):
    """Kembalikan (v, iv): v[k] tegangan simpul k (v[0] = 0), iv[nama] arus sumber tegangan."""
    nodes = max(max(e[2], e[3]) for e in net)
    vs = [e for e in net if e[0] == 'V']
    m = nodes + len(vs)
    G = [[0.0] * m for _ in range(m)]
    b = [0.0] * m

    def add(r, c, val):                      # baris/kolom 0 adalah ground: dibuang
        if r > 0 and c > 0:
            G[r - 1][c - 1] += val

    for e in net:
        kind, _, a, c, val = e
        if kind == 'R':                      # stempel konduktansi
            g = 1.0 / val
            add(a, a, g); add(c, c, g); add(a, c, -g); add(c, a, -g)
        elif kind == 'I':                    # arus keluar dari a, masuk ke c
            if a > 0: b[a - 1] -= val
            if c > 0: b[c - 1] += val
    for j, e in enumerate(vs):               # satu baris dan kolom tambahan per sumber tegangan
        _, _, a, c, val = e
        k = nodes + j
        if a > 0: G[a - 1][k] += 1; G[k][a - 1] += 1
        if c > 0: G[c - 1][k] -= 1; G[k][c - 1] -= 1
        b[k] = val
    x = solve(G, b)
    v = [0.0] + x[:nodes]
    iv = {e[1]: x[nodes + j] for j, e in enumerate(vs)}
    return v, iv


def r_current(net, v, name):
    """Arus resistor dari n1 ke n2."""
    e = next(e for e in net if e[1] == name)
    return (v[e[2]] - v[e[3]]) / e[4]


def powers(net, v, iv):
    """Daya yang DISERAP tiap elemen (negatif = elemen memberi daya)."""
    p = {}
    for kind, name, a, c, val in net:
        vab = v[a] - v[c]
        if kind == 'R':
            p[name] = vab * vab / val
        elif kind == 'I':
            p[name] = -vab * val             # arus masuk di a lewat sumber: masuk dari terminal -
        else:
            p[name] = vab * iv[name]         # SPICE: arus positif masuk terminal + ke dalam sumber
    return p


def rail(n, r, i, both=False):
    """Rel daya: n tap berjarak r ohm, tiap tap menarik i ampere.
    Catu di ujung kiri; bila both=True juga di ujung kanan (lewat satu segmen r lagi)."""
    net = [('V', 'VL', 1, 0, 1.0)]
    for k in range(1, n + 1):
        net.append(('R', f'R{k}', k, k + 1, r))
        net.append(('I', f'I{k}', k + 1, 0, i))
    if both:
        net += [('R', 'RE', n + 1, n + 2, r), ('V', 'VR', n + 2, 0, 1.0)]
    v, _ = mna(net)
    return 1.0 - min(v[2:n + 2])             # IR drop terburuk di antara tap


def close(a, b, tol=1e-9):
    return abs(a - b) <= tol * max(1.0, abs(b))


if __name__ == "__main__":
    # 1. Pembagi tegangan
    div = [('V', 'V1', 1, 0, 10.0), ('R', 'R1', 1, 2, 6e3), ('R', 'R2', 2, 0, 4e3)]
    v, iv = mna(div)
    assert close(v[2], 4.0) and close(iv['V1'], -1e-3)

    # 2. Jembatan Wheatstone
    bridge = [('V', 'VS', 1, 0, 5.0), ('R', 'R1', 1, 2, 1e3), ('R', 'R2', 2, 0, 2e3),
              ('R', 'R3', 1, 3, 1.5e3), ('R', 'R4', 3, 0, 1e3), ('R', 'R5', 2, 3, 500.0)]
    v, iv = mna(bridge)
    for node in (2, 3):                      # KCL di tiap simpul dalam
        s = sum(r_current(bridge, v, e[1]) * (1 if e[2] == node else -1)
                for e in bridge if e[0] == 'R' and node in (e[2], e[3]))
        assert abs(s) < 1e-12
    assert abs(sum(powers(bridge, v, iv).values())) < 1e-12      # daya seimbang
    seimbang = [e if e[1] != 'R3' else ('R', 'R3', 1, 3, 500.0) for e in bridge]
    vb, _ = mna(seimbang)                    # R1/R2 = R3/R4
    assert abs(r_current(seimbang, vb, 'R5')) < 1e-15

    # 3. Thevenin pembagi, lalu dibebani
    vth, rth = 4.0, 6e3 * 4e3 / 10e3
    v, _ = mna(div + [('R', 'RL', 2, 0, rth)])
    assert close(rth, 2400.0) and close(v[2], vth / 2)

    # 4. Superposisi
    two = [('V', 'V1', 1, 0, 6.0), ('R', 'R1', 1, 2, 2e3), ('R', 'R2', 2, 0, 3e3), ('I', 'I1', 0, 2, 2e-3)]
    va, _ = mna(two)
    v1, _ = mna([two[0], two[1], two[2], ('I', 'I1', 0, 2, 0.0)])
    v2, _ = mna([('V', 'V1', 1, 0, 0.0), two[1], two[2], two[3]])
    assert close(va[2], v1[2] + v2[2]) and close(va[2], 6.0)

    # 5. Rel daya: drop = r i n(n+1)/2
    assert close(rail(10, 0.1, 10e-3), 0.1 * 10e-3 * 55)
    assert rail(10, 0.1, 10e-3, both=True) < rail(10, 0.1, 10e-3) / 3

    print("Semua uji lulus.")
    v, iv = mna(bridge)
    print(f"jembatan: V2 = {v[2]:.4f} V, V3 = {v[3]:.4f} V, I(R5) = {r_current(bridge, v, 'R5') * 1e3:.4f} mA")
    print(f"          I(VS) = {iv['VS'] * 1e3:.4f} mA (negatif: sumber memberi daya)")
    for k, p in powers(bridge, v, iv).items():
        print(f"          daya {k:2s} = {p * 1e3:8.4f} mW")
    print(f"Thevenin pembagi: Vth = {vth} V, Rth = {rth:.0f} ohm")
    for rl in (240.0, 2400.0, 24e3):
        v, _ = mna(div + [('R', 'RL', 2, 0, rl)])
        print(f"  RL = {rl:7.0f} ohm: VL = {v[2]:.4f} V, PL = {v[2] ** 2 / rl * 1e3:.4f} mW")
    for n in (10, 20, 40):
        a, b = rail(n, 0.05, 1e-3), rail(n, 0.05, 1e-3, both=True)
        print(f"rel {n:2d} tap, 0.05 ohm, 1 mA/tap: drop satu ujung {a * 1e3:6.2f} mV, dua ujung {b * 1e3:6.2f} mV")
