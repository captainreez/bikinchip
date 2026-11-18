"""M03a lab tantangan: akumulator single berhenti naik di 2^24."""
import struct


def f32(x):
    return struct.unpack(">f", struct.pack(">f", x))[0]


s = 16777214.0                      # mulai dekat 2^24 supaya cepat
for n in range(1, 6):
    s = f32(s + 1.0)                # tiap penambahan dibulatkan ke single
    print(f"setelah {n} penambahan: {s:.1f}")
print("2**24 =", 2 ** 24, "| berhenti naik:", f32(2 ** 24 + 1.0) == 2 ** 24)
