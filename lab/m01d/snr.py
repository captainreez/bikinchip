import math
from sig import fft                                     # sig.py di folder yang sama

def snr_db(bits, n=1024, cycles=127):
    """SNR sinus skala penuh setelah dikuantisasi ke 'bits' bit, diukur lewat FFT."""
    step = 2 / 2 ** bits                                  # rentang -1 sampai +1
    x = [math.sin(2 * math.pi * cycles * i / n) for i in range(n)]
    xq = [round(v / step) * step for v in x]              # kuantisasi
    X = fft(xq)
    sig = abs(X[cycles]) ** 2 + abs(X[n - cycles]) ** 2
    noise = sum(abs(v) ** 2 for k, v in enumerate(X) if k not in (0, cycles, n - cycles))
    return 10 * math.log10(sig / noise)

if __name__ == "__main__":
    for bits in (6, 8, 10, 12):
        print(f"{bits:>2} bit: SNR terukur {snr_db(bits):.2f} dB, teori {6.02 * bits + 1.76:.2f} dB")
