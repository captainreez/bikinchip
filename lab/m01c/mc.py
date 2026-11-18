"""mc.py : aljabar linear, statistik, Monte Carlo, dan graf untuk engineer chip."""
import math


def solve(A, b):
    """Selesaikan A x = b dengan eliminasi Gauss dan pivot parsial."""
    n = len(A)
    M = [row[:] + [bi] for row, bi in zip(A, b)]          # matriks diperluas
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))  # baris pivot terbesar
        if abs(M[p][c]) < 1e-12:
            raise ValueError("matriks singular")
        M[c], M[p] = M[p], M[c]
        for r in range(c + 1, n):
            f = M[r][c] / M[c][c]
            M[r] = [x - f * y for x, y in zip(M[r], M[c])]
    x = [0.0] * n
    for r in range(n - 1, -1, -1):                        # substitusi mundur
        x[r] = (M[r][n] - sum(M[r][k] * x[k] for k in range(r + 1, n))) / M[r][r]
    return x


def mean(xs):
    return sum(xs) / len(xs)


def std(xs):
    """Simpangan baku sampel (pembagi n - 1)."""
    m = mean(xs)
    return math.sqrt(sum((x - m) ** 2 for x in xs) / (len(xs) - 1))


def tail(k):
    """Peluang variabel normal melebihi k sigma di satu sisi."""
    return 0.5 * math.erfc(k / math.sqrt(2))


class Rng:
    """Pembangkit bilangan acak xorshift 32 bit: hasil sama di semua komputer."""

    def __init__(self, seed=1):
        self.s = (seed & 0xFFFFFFFF) or 1

    def u32(self):
        x = self.s
        x ^= (x << 13) & 0xFFFFFFFF
        x ^= x >> 17
        x ^= (x << 5) & 0xFFFFFFFF
        self.s = x
        return x

    def uniform(self):
        """Bilangan seragam di antara 0 dan 1."""
        return (self.u32() + 0.5) / 2 ** 32

    def gauss(self, mu, sigma):
        """Bilangan berdistribusi normal lewat transformasi Box-Muller."""
        u1, u2 = self.uniform(), self.uniform()
        return mu + sigma * math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)


def path_mc(n_gates, mu, sigma, trials, seed=1):
    """Monte Carlo delay path: jumlah n_gates delay gerbang yang saling bebas."""
    rng = Rng(seed)
    return [sum(rng.gauss(mu, sigma) for _ in range(n_gates)) for _ in range(trials)]


def topo_order(succ):
    """Urutan topologis graf berarah tanpa siklus (algoritma Kahn)."""
    indeg = {v: 0 for v in succ}
    for v in succ:
        for w in succ[v]:
            indeg[w] += 1
    ready = sorted(v for v in succ if indeg[v] == 0)
    order = []
    while ready:
        v = ready.pop(0)
        order.append(v)
        for w in succ[v]:
            indeg[w] -= 1
            if indeg[w] == 0:
                ready.append(w)
    if len(order) != len(succ):
        raise ValueError("graf memuat siklus")
    return order


def arrival(succ, delay):
    """Waktu tiba terlama di setiap simpul (path terpanjang)."""
    at = {v: delay[v] for v in succ}
    for v in topo_order(succ):
        for w in succ[v]:
            at[w] = max(at[w], at[v] + delay[w])
    return at


def close(a, b, tol=1e-9):
    return abs(a - b) <= tol * max(1.0, abs(a), abs(b))


if __name__ == "__main__":
    # 1. Aljabar linear
    x = solve([[3, -1, -1], [-1, 3, -1], [-1, -1, 3]], [2, 0, 0])
    assert all(close(a, b) for a, b in zip(x, [1, 0.5, 0.5]))
    assert all(close(a, b) for a, b in zip(solve([[4, 2], [1, 3]], [10, 5]), [2, 1]))
    assert all(close(a, b) for a, b in zip(solve([[0, 1], [1, 0]], [7, 9]), [9, 7]))  # butuh pivot
    try:
        solve([[1, 2], [2, 4]], [3, 6])
        raise AssertionError("seharusnya singular")
    except ValueError:
        pass

    # 2. Distribusi normal
    assert close(1 - 2 * tail(1), 0.6826894921)
    assert close(1 - 2 * tail(2), 0.9544997361)
    assert close(1 - 2 * tail(3), 0.9973002039)
    assert close(tail(3), 1.349898e-3, 1e-6)

    # 3. Monte Carlo: path 16 gerbang, tiap gerbang 20 ps dengan sigma 2 ps
    d = path_mc(16, 20.0, 2.0, 20000, seed=1)
    assert abs(mean(d) - 320) < 0.2 and abs(std(d) - 8) < 0.2
    frac = sum(v > 340 for v in d) / len(d)
    assert abs(frac - tail(2.5)) < 0.002

    # 4. Graf: urutan topologis dan path terpanjang
    succ = {"a": ["g1", "g2"], "b": ["g1"], "c": ["g2"], "g1": ["g3"], "g2": ["g3"], "g3": []}
    delay = {"a": 0, "b": 0, "c": 0, "g1": 30, "g2": 45, "g3": 20}
    order = topo_order(succ)
    assert order.index("g1") < order.index("g3") and order.index("a") < order.index("g2")
    assert arrival(succ, delay)["g3"] == 65
    try:
        topo_order({"p": ["q"], "q": ["p"]})
        raise AssertionError("seharusnya ada siklus")
    except ValueError:
        pass

    # 5. Hitung dan aritmetika modular
    assert math.comb(8, 3) == 56 and math.factorial(5) == 120
    assert (250 + 10) % 256 == 4 and (3 - 250) % 256 == 9
    assert 0b1011 ^ 0b0110 == 0b1101
    print("Semua uji lulus.")

    print("tegangan simpul      =", [round(v, 6) for v in x])
    print(f"dalam 1, 2, 3 sigma  = {1 - 2 * tail(1):.4%}, {1 - 2 * tail(2):.4%}, {1 - 2 * tail(3):.4%}")
    print(f"path 16 gerbang      : rata-rata {mean(d):.2f} ps, sigma {std(d):.2f} ps (teori 320 dan 8)")
    print(f"P(delay > 340 ps)    : Monte Carlo {frac:.4%}, teori {tail(2.5):.4%}")
    print(" sampel   rata-rata    galat")
    for n in (100, 1000, 10000, 100000):
        m = mean(path_mc(16, 20.0, 2.0, n, seed=7))
        print(f" {n:>6}   {m:9.4f}   {abs(m - 320):.4f}")
    print("urutan topologis     =", order)
    print("waktu tiba           =", arrival(succ, delay))
    for k in (3, 4, 5, 6):
        p = tail(k)
        print(f" {k} sigma: p = {p:.3e}, yield 1 Mbit = {math.exp(-1e6 * p):.4%}")
