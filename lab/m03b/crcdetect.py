"""M03b lab: ukur peluang galat acak lolos dari CRC-3, CRC-4, CRC-8 (harus mendekati 2^-r)."""
import random
from codes import crc_bits

random.seed(2026)
CASES = [(3, 0b011, "CRC-3"), (4, 0b0011, "CRC-4"), (8, 0x07, "CRC-8")]
TRIALS = 200_000
MSG = 24                                    # bit pesan

for r, poly, name in CASES:
    miss = 0
    for _ in range(TRIALS):
        msg = [random.getrandbits(1) for _ in range(MSG)]
        cw = msg + [(crc_bits(msg, r, poly) >> (r - 1 - i)) & 1 for i in range(r)]
        err = [random.getrandbits(1) for _ in range(len(cw))]        # pola galat acak seragam
        if not any(err):
            continue
        rx = [a ^ b for a, b in zip(cw, err)]
        if crc_bits(rx, r, poly) == 0:
            miss += 1
    print(f"{name}: lolos {miss}/{TRIALS} = {miss / TRIALS:.5f}   (teori 2^-{r} = {2 ** -r:.5f})")
