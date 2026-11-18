"""Membuat crc8_vec.hex: CRC-8 (poly 0x07) untuk pesan satu byte 0x00..0xFF, dari model Python (pembanding independen untuk testbench)."""
from codes import crc, CRC8

with open("crc8_vec.hex", "w") as f:
    for b in range(256):
        f.write(f"{crc(bytes([b]), **CRC8):02x}\n")
print("crc8_vec.hex: 256 baris")
