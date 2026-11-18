"""sig.py : deret Fourier, DFT, sampling, konvolusi, dan filter digital."""
import cmath
import math


def dft(x):
    """Transformasi Fourier diskret langsung dari definisi (lambat, O(N^2))."""
    N = len(x)
    return [sum(x[n] * cmath.exp(-2j * math.pi * k * n / N) for n in range(N))
            for k in range(N)]


def fft(x):
    """FFT radix-2 rekursif (cepat, O(N log N)); panjang harus pangkat dua."""
    N = len(x)
    if N == 1:
        return list(x)
    even, odd = fft(x[0::2]), fft(x[1::2])
    out = [0j] * N
    for k in range(N // 2):
        t = cmath.exp(-2j * math.pi * k / N) * odd[k]
        out[k] = even[k] + t
        out[k + N // 2] = even[k] - t
    return out


def square_partial(t, n_harm, f0=1.0):
    """Jumlah parsial deret Fourier gelombang kotak +-1: harmonik ganjil sampai n_harm."""
    return 4 / math.pi * sum(math.sin(2 * math.pi * k * f0 * t) / k
                             for k in range(1, n_harm + 1, 2))


def alias(f, fs):
    """Frekuensi yang terlihat setelah sinyal f disampel pada laju fs."""
    f = f % fs
    return min(f, fs - f)


def convolve(x, h):
    """Konvolusi diskret: y[n] = jumlah h[k] * x[n - k]."""
    y = [0.0] * (len(x) + len(h) - 1)
    for n, xn in enumerate(x):
        for k, hk in enumerate(h):
            y[n + k] += xn * hk
    return y


def iir(b, a, x):
    """Filter umum: y[n] = jumlah b[k] x[n-k] + jumlah a[k] y[n-k], k mulai 1 untuk a."""
    y = []
    for n in range(len(x)):
        acc = sum(bk * x[n - k] for k, bk in enumerate(b) if n - k >= 0)
        acc += sum(ak * y[n - k] for k, ak in enumerate(a, start=1) if n - k >= 0)
        y.append(acc)
    return y


def freq_response(b, a, omega):
    """H pada z = e^(j omega), omega dalam radian per sampel."""
    z1 = cmath.exp(-1j * omega)                      # z pangkat -1
    num = sum(bk * z1 ** k for k, bk in enumerate(b))
    den = 1 - sum(ak * z1 ** k for k, ak in enumerate(a, start=1))
    return num / den


def quad_roots(a, b, c):
    """Akar a s^2 + b s + c = 0, boleh kompleks."""
    d = cmath.sqrt(b * b - 4 * a * c)
    return (-b + d) / (2 * a), (-b - d) / (2 * a)


def close(a, b, tol=1e-9):
    return abs(a - b) <= tol * max(1.0, abs(a), abs(b))


if __name__ == "__main__":
    # 1. DFT dan FFT: sinus tepat 3 siklus dalam 32 sampel
    N = 32
    x = [math.sin(2 * math.pi * 3 * n / N) for n in range(N)]
    X = dft(x)
    assert close(abs(X[3]), N / 2) and close(abs(X[N - 3]), N / 2)
    assert all(abs(X[k]) < 1e-9 for k in range(N) if k not in (3, N - 3))
    assert all(close(abs(p - q), 0) for p, q in zip(X, fft(x)))

    # 2. Deret Fourier gelombang kotak: koefisien 4/(pi k) dan lonjakan Gibbs
    N = 1024
    sq = [1.0 if n < N // 2 else -1.0 for n in range(N)]
    S = fft(sq)
    for k in (1, 3, 5):
        assert close(2 * abs(S[k]) / N, 4 / (math.pi * k), 1e-3)
    assert abs(S[2]) < 1e-9                               # harmonik genap nol
    peak = max(square_partial(i / 20000, 99) for i in range(1, 400))
    assert close(peak, 1.179, 1e-3)

    # 3. Aliasing
    assert alias(70e6, 100e6) == 30e6 and alias(130e6, 100e6) == 30e6
    assert alias(30e6, 100e6) == 30e6 and alias(100e6, 100e6) == 0

    # 4. Konvolusi dan filter FIR rata-rata bergerak
    assert convolve([1, 2, 3], [1, 1]) == [1, 3, 5, 3]
    ma4 = [0.25] * 4
    assert close(abs(freq_response(ma4, [], 2 * math.pi * 100 / 1000)), 0.7694208842938134)
    assert abs(freq_response(ma4, [], 2 * math.pi * 250 / 1000)) < 1e-12   # nol di fs/M

    # 5. Filter IIR satu kutub: y[n] = alpha y[n-1] + (1 - alpha) x[n]
    alpha = math.exp(-0.1)
    y = iir([1 - alpha], [alpha], [1.0] * 30)
    assert all(close(y[n], 1 - alpha ** (n + 1)) for n in range(30))
    assert close(y[9], 1 - math.exp(-1))                  # 10 sampel = satu tau

    # 6. Kutub: bidang-s dan bidang-z
    p1, p2 = quad_roots(1, 2, 5)
    assert close(p1.real, -1) and close(abs(p1.imag), 2) and p1.real < 0
    assert close(abs(cmath.exp(p1 * 0.1)), math.exp(-0.1))  # z = e^(sT), di dalam lingkaran
    print("Semua uji lulus.")

    print("kotak, harmonik 1 3 5 7 :", [round(2 * abs(S[k]) / N, 4) for k in (1, 3, 5, 7)])
    print("teori 4/(pi k)          :", [round(4 / (math.pi * k), 4) for k in (1, 3, 5, 7)])
    print(f"puncak Gibbs (99 harm.) : {peak:.4f}")
    frac = 0.0
    for k in (1, 3, 5, 7, 9):
        frac += 0.5 * (4 / (math.pi * k)) ** 2
        print(f" sampai harmonik {k}: {frac:.4%} daya")
    print("alias 70, 130, 170 MHz pada 100 MS/s :",
          [alias(f, 100e6) / 1e6 for f in (70e6, 130e6, 170e6)], "MHz")
    for f in (50, 100, 250, 400):
        h = abs(freq_response(ma4, [], 2 * math.pi * f / 1000))
        print(f" rata-rata 4 titik, {f:>3} Hz: |H| = {h:.4f}" +
              (f" = {20 * math.log10(h):.2f} dB" if h > 1e-9 else " (nol)"))
    print("IIR alpha = e^-0.1, respons step n = 0, 9, 29 :",
          [round(y[n], 4) for n in (0, 9, 29)])
    print("akar s^2 + 2s + 5 :", p1, p2)
