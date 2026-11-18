"""M03a: representasi bilangan: two's complement, fixed-point Qi.f, dan IEEE 754 dari nol.

Semua fungsi memakai bilangan bulat Python; nilai float dibuat eksak dengan Fraction.
"""
import math
import random
import struct
from fractions import Fraction


# ---------- 1. Bilangan bulat ----------
def mask(n):
    return (1 << n) - 1


def to_twos(x, n):
    """Pola bit n-bit (sebagai bilangan tak bertanda) untuk x bertanda; x harus muat."""
    assert -(1 << (n - 1)) <= x < (1 << (n - 1)), "tidak muat"
    return x & mask(n)


def from_twos(u, n):
    """Nilai bertanda dari pola n-bit u."""
    return u - (1 << n) if u >> (n - 1) else u


def add_flags(a, b, n, sub=False):
    """Penjumlah/pengurang n-bit pada pola bit a, b. Mengembalikan (hasil, carry, overflow).
    Pengurangan = a + ~b + 1; carry pada pengurangan berarti 'tidak ada pinjaman'."""
    cin = 1 if sub else 0
    bb = (~b & mask(n)) if sub else b
    total = a + bb + cin
    res = total & mask(n)
    carry = total >> n
    sa, sb, sr = a >> (n - 1), bb >> (n - 1), res >> (n - 1)
    overflow = int(sa == sb and sr != sa)
    return res, carry, overflow


def sign_extend(u, n_from, n_to):
    return to_twos(from_twos(u, n_from), n_to)


def saturate(x, n):
    lo, hi = -(1 << (n - 1)), (1 << (n - 1)) - 1
    return max(lo, min(hi, x))


# ---------- 2. Fixed-point bertanda Qi.f (i termasuk bit tanda; lebar total i+f) ----------
def q_quant(x, i, f, mode="round", sat=True):
    """Kuantisasi x ke Qi.f. Mengembalikan bilangan bulat bertanda (nilai = hasil / 2^f)."""
    n = i + f
    v = Fraction(x) * (1 << f)
    r = math.floor(v) if mode == "trunc" else round(v)      # round = setengah-ke-genap
    lo, hi = -(1 << (n - 1)), (1 << (n - 1)) - 1
    if sat:
        return max(lo, min(hi, r))
    return from_twos(r & mask(n), n)                        # bungkus (wrap-around)


def q_value(r, f):
    return r / (1 << f)


def q_mul(a, b, i, f):
    """a, b bilangan bulat Qi.f. Hasil kali penuh berskala 2^(2f); geser balik f bit dengan pembulatan
    dan saturasi."""
    p = a * b
    r = (p + (1 << (f - 1))) >> f if f > 0 else p            # tambah setengah LSB lalu geser (pembulatan ke atas)
    return saturate(r, i + f)


# ---------- 3. IEEE 754 generik: ebits eksponen, mbits pecahan ----------
FORMATS = {"half": (5, 10), "single": (8, 23), "double": (11, 52)}


def decode(bits, eb, mb):
    """Mengembalikan (jenis, nilai) dengan nilai Fraction eksak (atau None untuk inf/nan)."""
    s = bits >> (eb + mb) & 1
    e = bits >> mb & mask(eb)
    fr = bits & mask(mb)
    bias = (1 << (eb - 1)) - 1
    sg = -1 if s else 1
    if e == mask(eb):
        return ("nan", None) if fr else ("inf", sg)
    if e == 0:
        return ("zero" if fr == 0 else "subnormal", sg * Fraction(fr) * Fraction(2) ** (1 - bias - mb))
    return "normal", sg * (1 + Fraction(fr, 1 << mb)) * Fraction(2) ** (e - bias)


def encode(x, eb, mb):
    """Pola bit IEEE 754 untuk x (float/int/Fraction), pembulatan ke terdekat-genap."""
    bias = (1 << (eb - 1)) - 1
    if isinstance(x, float) and math.isnan(x):
        return (mask(eb) << mb) | (1 << (mb - 1))
    neg = (isinstance(x, float) and math.copysign(1.0, x) < 0) or (not isinstance(x, float) and x < 0)
    s = 1 << (eb + mb) if neg else 0
    if isinstance(x, float) and math.isinf(x):
        return s | (mask(eb) << mb)
    ax = abs(Fraction(x))
    if ax == 0:
        return s
    e = ax.numerator.bit_length() - ax.denominator.bit_length()
    if Fraction(2) ** e > ax:
        e -= 1
    e = max(e, 1 - bias)                                    # di bawah ini: subnormal
    n = round(ax / Fraction(2) ** (e - mb))                 # bilangan bulat signifikan, setengah-ke-genap
    if n >= 1 << (mb + 1):                                  # pembulatan naik melewati 2^(e+1)
        n >>= 1
        e += 1
    if e > bias:
        return s | (mask(eb) << mb)                         # luapan menjadi tak hingga
    if n < 1 << mb:
        return s | n                                        # subnormal atau nol
    return s | ((e + bias) << mb) | (n - (1 << mb))


def ulp(x, eb, mb):
    """Jarak dari |x| ke bilangan tertampung berikutnya (jarak antar-float di sekitar x)."""
    b = encode(abs(x), eb, mb)
    return decode(b + 1, eb, mb)[1] - decode(b, eb, mb)[1]


# ---------- uji dan demonstrasi ----------
def _tests():
    # bilangan bulat
    assert to_twos(-1, 8) == 0xFF and from_twos(0x80, 8) == -128 and from_twos(0x7F, 8) == 127
    assert add_flags(100, 100, 8) == (200, 0, 1)                   # 100+100 luapan bertanda, tanpa carry
    assert add_flags(0xFF, 0x01, 8) == (0, 1, 0)                   # -1 + 1: carry, tanpa luapan
    assert add_flags(0x80, 0x80, 8) == (0, 1, 1)                   # -128 + -128
    assert add_flags(5, 3, 8, sub=True) == (2, 1, 0)               # 5 - 3: carry = tanpa pinjaman
    assert add_flags(0x80, 1, 8, sub=True)[2] == 1                 # -128 - 1 luapan
    assert sign_extend(0xF0, 8, 16) == 0xFFF0 and saturate(300, 8) == 127 and saturate(-300, 8) == -128
    for a in range(256):                                           # a - b == a + (-b) untuk semua pola, kecuali -128
        for b in range(256):
            r1, _, _ = add_flags(a, b, 8, sub=True)
            assert r1 == (a - b) & 0xFF
    # fixed-point
    assert q_quant(0.5, 1, 15) == 16384 and q_quant(1.0, 1, 15) == 32767 and q_quant(-1.0, 1, 15) == -32768
    assert q_quant(1.0, 1, 15, sat=False) == -32768                # bungkus: +1.0 menjadi -1.0
    assert q_mul(q_quant(0.5, 1, 15), q_quant(0.5, 1, 15), 1, 15) == 8192    # 0.5 * 0.5 = 0.25
    assert q_mul(-32768, -32768, 1, 15) == 32767                   # (-1)*(-1) = +1 tersaturasi
    # IEEE 754 terhadap pustaka struct, untuk banyak nilai acak
    rnd = random.Random(7)
    for fmt, code in (("half", ">e"), ("single", ">f"), ("double", ">d")):
        eb, mb = FORMATS[fmt]
        total = 1 + eb + mb
        n = 0
        for _ in range(30000):
            x = rnd.choice([rnd.uniform(-2, 2), rnd.uniform(-1e5, 1e5), 2.0 ** rnd.randint(-30, 17) * rnd.uniform(1, 2), rnd.uniform(-1, 1) * 1e-7])
            try:
                ref = struct.unpack(">" + {"half": "H", "single": "I", "double": "Q"}[fmt], struct.pack(code, x))[0]
            except OverflowError:
                continue
            assert encode(x, eb, mb) == ref, (fmt, x)
            n += 1
        assert n > 20000
    assert decode(encode(0.1, 8, 23), 8, 23)[0] == "normal"
    assert encode(float("inf"), 8, 23) == 0x7F800000 and encode(-0.0, 8, 23) == 0x80000000
    assert encode(2.0 ** 128, 8, 23) == 0x7F800000                 # luapan -> tak hingga
    assert decode(1, 8, 23)[0] == "subnormal" and decode(0x7FC00000, 8, 23)[0] == "nan"
    assert encode(16777217, 8, 23) == encode(16777216.0, 8, 23)   # 2^24 + 1 tidak tertampung di single
    print("Semua uji lulus.")


if __name__ == "__main__":
    _tests()
    print("Bilangan bulat 8 bit:")
    for x in (127, 1, 0, -1, -127, -128):
        print(f"  {x:5d} -> {to_twos(x, 8):08b}  (0x{to_twos(x, 8):02X})")
    for a, b in ((100, 100), (-128, -128), (127, -1)):
        r, c, v = add_flags(to_twos(a, 8), to_twos(b, 8), 8)
        print(f"  {a} + {b} = {from_twos(r, 8)}  (carry={c}, overflow={v})")
    print("Fixed-point Q1.15 (16 bit):")
    for x in (0.1, 0.5, 0.999999, 1.0, -1.0):
        r = q_quant(x, 1, 15)
        print(f"  {x:>9} -> {r:6d} = 0x{r & 0xFFFF:04X}, nilai {q_value(r, 15):.8f}, galat {q_value(r, 15) - x:+.2e}")
    print("  0.5 * 0.5 ->", q_value(q_mul(q_quant(0.5, 1, 15), q_quant(0.5, 1, 15), 1, 15), 15))
    print("  (-1) * (-1) ->", q_value(q_mul(-32768, -32768, 1, 15), 15), "(tersaturasi)")
    print("IEEE 754 single:")
    for x in (1.0, 0.1, -2.5, 3.4028235e38, 1e-45):
        b = encode(x, 8, 23)
        kind, v = decode(b, 8, 23)
        print(f"  {x!r:>12} -> 0x{b:08X} {b >> 31}|{b >> 23 & 255:08b}|{b & 0x7FFFFF:023b}  {kind:9s} {float(v) if v is not None else 0!r}")
    v = decode(encode(0.1, 8, 23), 8, 23)[1]
    print(f"  0.1 tersimpan sebagai {float(v)!r}, galat {float(v - Fraction(1, 10)):+.3e}")
    print("  2**24 + 1 =", float(decode(encode(2 ** 24 + 1, 8, 23), 8, 23)[1]), "(single); ulp di 2**24 =", float(ulp(2.0 ** 24, 8, 23)))
    print("  0.1 + 0.2 == 0.3 (double)?", 0.1 + 0.2 == 0.3, "; selisih", 0.1 + 0.2 - 0.3)
    print("  eps mesin: single", float(ulp(1.0, 8, 23)), "double", float(ulp(1.0, 11, 52)), "half", float(ulp(1.0, 5, 10)))
