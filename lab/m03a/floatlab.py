"""M03a lab: percobaan numerik dengan float. Jalankan: python3 floatlab.py"""
import math
import struct
from numrep import encode, decode, FORMATS


def f32(x):
    """Bulatkan x ke single, kembalikan sebagai float Python."""
    return struct.unpack(">f", struct.pack(">f", x))[0]


def kahan(xs):
    """Penjumlahan terkompensasi Kahan (dengan double)."""
    s = c = 0.0
    for x in xs:
        y = x - c
        t = s + y
        c = (t - s) - y
        s = t
    return s


# 1. 0.1 tidak tertampung persis
print("0.1 + 0.2 =", 0.1 + 0.2, "| sama dengan 0.3?", 0.1 + 0.2 == 0.3, "| dekat 0.3?", math.isclose(0.1 + 0.2, 0.3))

# 2. penjumlahan tak asosiatif
a, b, c = 1e16, -1e16, 1.0
print("(a+b)+c =", (a + b) + c, "| a+(b+c) =", a + (b + c))

# 3. single: bilangan bulat berhenti tepat di 2^24
print("single(16777216) =", f32(16777216.0), "| single(16777217) =", f32(16777217.0))

# 4. akumulasi 0.1 sebanyak sejuta kali
xs = [0.1] * 1_000_000
naive = 0.0
for x in xs:
    naive += x
print("jumlah naif    =", repr(naive), "| galat =", f"{naive - 100000:+.3e}")
print("jumlah Kahan   =", repr(kahan(xs)), "| galat =", f"{kahan(xs) - 100000:+.3e}")
print("math.fsum      =", repr(math.fsum(xs)))

# 5. jarak antar-float (ulp) di berbagai besar nilai pada single
eb, mb = FORMATS["single"]
for x in (1.0, 1e3, 1e8, 1e30):
    b0 = encode(x, eb, mb)
    gap = decode(b0 + 1, eb, mb)[1] - decode(b0, eb, mb)[1]
    print(f"ulp single di {x:>7g} = {float(gap):.3e}  (relatif {float(gap) / x:.2e})")
