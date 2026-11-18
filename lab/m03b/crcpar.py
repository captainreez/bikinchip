"""M03b lab tantangan: CRC-8 paralel 8 bit per clock. Menurunkan persamaan XOR dari LFSR serial
dan memeriksanya untuk semua 256 x 256 kombinasi (register, byte)."""
from codes import crc_bits

POLY, W = 0x07, 8


def serial_step(reg, bit):
    fb = ((reg >> (W - 1)) & 1) ^ bit
    reg = (reg << 1) & 0xFF
    return reg ^ POLY if fb else reg


def byte_serial(reg, byte):
    for i in range(7, -1, -1):
        reg = serial_step(reg, (byte >> i) & 1)
    return reg


# Fungsi linear terhadap XOR: next = A(reg) xor B(byte). Matriks dari basis satu-bit.
colA = [byte_serial(1 << i, 0) for i in range(W)]      # pengaruh bit register i
colB = [byte_serial(0, 1 << i) for i in range(8)]      # pengaruh bit data i


def parallel(reg, byte):
    out = 0
    for i in range(W):
        if (reg >> i) & 1:
            out ^= colA[i]
        if (byte >> i) & 1:
            out ^= colB[i]
    return out


for reg in range(256):
    for byte in range(256):
        assert parallel(reg, byte) == byte_serial(reg, byte)
print("65536 kombinasi (register, byte): paralel == serial")
for o in range(W):
    terms = [f"r{i}" for i in range(W) if (colA[i] >> o) & 1] + [f"d{i}" for i in range(8) if (colB[i] >> o) & 1]
    print(f"next[{o}] = " + " ^ ".join(terms))
