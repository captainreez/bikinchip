"""M03b: model referensi kode Gray, paritas, Hamming/SECDED, dan CRC.
Jalankan: python3 codes.py   (menjalankan _tests lalu demo)"""
import zlib


# ---------- Gray ----------
def bin2gray(b):
    return b ^ (b >> 1)


def gray2bin(g):
    b = 0
    while g:            # XOR prefiks: b_i = g_i xor b_(i+1)
        b ^= g
        g >>= 1
    return b


def popcount(x):
    return bin(x).count("1")


def hamming_distance(a, b):
    return popcount(a ^ b)


def parity(x):
    """1 bila jumlah bit satu ganjil."""
    return popcount(x) & 1


# ---------- Hamming(7,4) dan SECDED(8,4) ----------
# Posisi 1..7 (posisi 1 = bit 0 kata kode). Paritas di posisi 1, 2, 4; data di 3, 5, 6, 7.
DATA_POS = (3, 5, 6, 7)


def h74_encode(d):
    """d: 4 bit data (d0..d3 -> posisi 3,5,6,7). Mengembalikan kata kode 7 bit (bit 0 = posisi 1)."""
    cw = 0
    for i, pos in enumerate(DATA_POS):
        cw |= ((d >> i) & 1) << (pos - 1)
    for p in (1, 2, 4):
        s = 0
        for pos in range(1, 8):
            if pos & p and pos != p:
                s ^= (cw >> (pos - 1)) & 1
        cw |= s << (p - 1)
    return cw


def h74_syndrome(cw):
    s = 0
    for pos in range(1, 8):
        if (cw >> (pos - 1)) & 1:
            s ^= pos
    return s            # 0 = tak ada galat; selain itu = posisi bit yang salah


def h74_decode(cw):
    """Mengembalikan (data 4 bit, syndrome). Mengoreksi satu galat bit."""
    s = h74_syndrome(cw)
    if s:
        cw ^= 1 << (s - 1)
    d = 0
    for i, pos in enumerate(DATA_POS):
        d |= ((cw >> (pos - 1)) & 1) << i
    return d, s


def secded_encode(d):
    cw = h74_encode(d)
    return cw | (parity(cw) << 7)        # bit 7 = paritas keseluruhan (genap)


def secded_decode(cw8):
    """Mengembalikan (status, data). status: 'ok', 'koreksi', 'ganda' (terdeteksi, tidak dikoreksi)."""
    cw7, p = cw8 & 0x7F, (cw8 >> 7) & 1
    s = h74_syndrome(cw7)
    overall = parity(cw7) ^ p            # 0 bila jumlah bit satu di 8 bit genap
    if s == 0 and overall == 0:
        return "ok", h74_decode(cw7)[0]
    if overall == 1:                     # galat ganjil -> dianggap satu galat, dikoreksi
        if s:
            cw7 ^= 1 << (s - 1)
        return "koreksi", h74_decode(cw7)[0]
    return "ganda", None                 # s != 0 dan paritas genap -> dua galat


# ---------- CRC generik (model Rocksoft) ----------
def reflect(x, n):
    r = 0
    for i in range(n):
        if (x >> i) & 1:
            r |= 1 << (n - 1 - i)
    return r


def crc(data, width, poly, init=0, refin=False, refout=False, xorout=0):
    top, mask = 1 << (width - 1), (1 << width) - 1
    reg = init & mask
    for byte in data:
        if refin:
            byte = reflect(byte, 8)
        for i in range(7, -1, -1):
            inbit = (byte >> i) & 1
            fb = ((reg & top) != 0) ^ inbit
            reg = (reg << 1) & mask
            if fb:
                reg ^= poly
    if refout:
        reg = reflect(reg, width)
    return reg ^ xorout


def crc_bits(bits, width, poly, init=0):
    """CRC untuk deretan bit (daftar 0/1) tanpa refleksi, dipakai oleh visualisasi."""
    top, mask = 1 << (width - 1), (1 << width) - 1
    reg = init
    for b in bits:
        fb = ((reg & top) != 0) ^ b
        reg = (reg << 1) & mask
        if fb:
            reg ^= poly
    return reg


CRC8 = dict(width=8, poly=0x07)
CRC16_CCITT = dict(width=16, poly=0x1021, init=0xFFFF)
CRC32 = dict(width=32, poly=0x04C11DB7, init=0xFFFFFFFF, refin=True, refout=True, xorout=0xFFFFFFFF)


def _tests():
    # Gray
    for n in range(1, 11):
        seq = [bin2gray(i) for i in range(1 << n)]
        assert all(gray2bin(bin2gray(i)) == i for i in range(1 << n))
        assert len(set(seq)) == 1 << n
        assert all(hamming_distance(seq[i], seq[(i + 1) % (1 << n)]) == 1 for i in range(1 << n)), n
        tb = sum(hamming_distance(i, (i + 1) % (1 << n)) for i in range(1 << n))
        assert tb == (1 << (n + 1)) - 2, n          # toggle biner per siklus penuh (termasuk lompatan terakhir ke 0)
        assert sum(hamming_distance(bin2gray(i), bin2gray((i + 1) % (1 << n))) for i in range(1 << n)) == 1 << n
    assert sum(hamming_distance(bin2gray(i), bin2gray((i + 1) % 16)) for i in range(16)) == 16
    # paritas
    assert parity(0b1011) == 1 and parity(0b1111) == 0
    # Hamming (7,4): jarak minimum 3
    cws = [h74_encode(d) for d in range(16)]
    assert min(hamming_distance(a, b) for a in cws for b in cws if a != b) == 3
    for d in range(16):
        cw = h74_encode(d)
        assert h74_syndrome(cw) == 0 and h74_decode(cw) == (d, 0)
        for e in range(7):
            dd, s = h74_decode(cw ^ (1 << e))
            assert dd == d and s == e + 1
    assert h74_encode(0b1011) == 0b1010101
    # SECDED: jarak minimum 4; satu galat dikoreksi; dua galat terdeteksi
    cws8 = [secded_encode(d) for d in range(16)]
    assert min(hamming_distance(a, b) for a in cws8 for b in cws8 if a != b) == 4
    for d in range(16):
        cw = secded_encode(d)
        assert secded_decode(cw) == ("ok", d)
        for e in range(8):
            assert secded_decode(cw ^ (1 << e)) == ("koreksi", d)
        for e1 in range(8):
            for e2 in range(e1 + 1, 8):
                assert secded_decode(cw ^ (1 << e1) ^ (1 << e2))[0] == "ganda"
    # Hamming (7,4) dengan dua galat salah koreksi (data salah tanpa peringatan)
    cw = h74_encode(0b0101)
    bad = h74_decode(cw ^ 0b0000011)[0]
    assert bad != 0b0101
    # CRC: nilai cek baku "123456789"
    m = b"123456789"
    assert crc(m, **CRC8) == 0xF4
    assert crc(m, **CRC16_CCITT) == 0x29B1
    assert crc(m, **CRC32) == 0xCBF43926 == zlib.crc32(m)
    import os
    for _ in range(300):
        data = os.urandom(os.urandom(1)[0] % 64)
        assert crc(data, **CRC32) == zlib.crc32(data)
    # sifat: tambah CRC di ekor menghasilkan sisa 0 (CRC-8 tanpa init/xorout)
    for _ in range(100):
        data = os.urandom(10)
        assert crc(data + bytes([crc(data, **CRC8)]), **CRC8) == 0
    # semua galat 1 bit dan semua burst <= 8 bit pada pesan 12 byte terdeteksi oleh CRC-8
    data = bytes(range(1, 13))
    full = int.from_bytes(data + bytes([crc(data, **CRC8)]), "big")
    nb = 13 * 8
    for L in range(1, 9):
        for pos in range(nb - L + 1):
            for pat in range(1 << (L - 1), 1 << L):          # ujung burst bernilai 1 dan panjang tepat L
                if not pat & 1:
                    continue
                e = full ^ (pat << pos)
                assert crc(e.to_bytes(13, "big"), **CRC8) != 0
    return True


if __name__ == "__main__":
    _tests()
    print("Semua uji lulus.")
    print("Gray 3 bit  :", " ".join(format(bin2gray(i), "03b") for i in range(8)))
    for n in (3, 4, 8):
        tb = sum(hamming_distance(i, (i + 1) % (1 << n)) for i in range(1 << n))
        print(f"n = {n}: toggle per siklus biner = {tb}, Gray = {1 << n}")
    d = 0b1011
    cw = h74_encode(d)
    print(f"Hamming(7,4): data {d:04b} -> kata kode {cw:07b} (bit 6..0 = posisi 7..1)")
    for e in (0, 4):
        r, s = h74_decode(cw ^ (1 << e))
        print(f"  bit posisi {e + 1} dibalik -> syndrome {s} -> data {r:04b}")
    c8 = secded_encode(d)
    print("SECDED: dua galat ->", secded_decode(c8 ^ 0b00000011)[0])
    m = b"123456789"
    print(f"CRC-8 = 0x{crc(m, **CRC8):02X}, CRC-16/CCITT-FALSE = 0x{crc(m, **CRC16_CCITT):04X}, CRC-32 = 0x{crc(m, **CRC32):08X}")
