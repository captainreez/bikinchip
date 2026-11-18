"""eng.py : alat bantu satuan, logaritma, dan desibel untuk engineer chip."""
import math

# Awalan SI yang dipakai sehari-hari. 'u' menggantikan huruf Yunani mu,
# seperti kebiasaan di SPICE dan skrip.
PREFIX = {12: "T", 9: "G", 6: "M", 3: "k", 0: "",
          -3: "m", -6: "u", -9: "n", -12: "p", -15: "f", -18: "a"}
VALUE = {sym: 10.0 ** exp for exp, sym in PREFIX.items() if sym}


def eng(x, unit="", sig=3):
    """Format x dalam notasi engineering: 4.7e-8 F menjadi '47 nF'."""
    if x == 0:
        return f"0 {unit}".strip()
    exp3 = math.floor(math.log10(abs(x)) / 3) * 3   # kelipatan 3 terdekat di bawah
    exp3 = max(-18, min(12, exp3))                  # tetap di dalam tabel awalan
    mant = float(f"{x / 10.0 ** exp3:.{sig}g}")     # bulatkan ke sig angka penting
    if abs(mant) >= 1000 and exp3 < 12:             # 999.96 dibulatkan jadi 1000
        mant /= 1000
        exp3 += 3
    return f"{mant:g} {PREFIX[exp3]}{unit}".strip()


def parse_eng(text):
    """Baca '47n', '2.2k', atau '1e-9' menjadi bilangan."""
    text = text.strip()
    if text and text[-1] in VALUE:
        return float(text[:-1]) * VALUE[text[-1]]
    return float(text)


def db20(ratio):
    """Rasio tegangan atau arus ke desibel."""
    return 20 * math.log10(ratio)


def db10(ratio):
    """Rasio daya ke desibel."""
    return 10 * math.log10(ratio)


def from_db20(db):
    """Desibel ke rasio tegangan atau arus."""
    return 10 ** (db / 20)


def from_db10(db):
    """Desibel ke rasio daya."""
    return 10 ** (db / 10)


def bits_needed(n):
    """Jumlah bit untuk membedakan n nilai; sama dengan ceil(log2(n))."""
    return max(1, (n - 1).bit_length())


def close(a, b, tol=1e-9):
    return abs(a - b) <= tol * max(1.0, abs(a), abs(b))


if __name__ == "__main__":
    # Uji diri: setiap baris adalah satu fakta yang harus benar.
    assert eng(4.7e-8, "F") == "47 nF"
    assert eng(2200, "Ohm") == "2.2 kOhm"
    assert eng(1e-12, "s") == "1 ps"
    assert eng(0.9, "V") == "900 mV"
    assert eng(999.96, "Hz") == "1 kHz"
    assert eng(-3.3e-3, "A") == "-3.3 mA"
    assert close(parse_eng("47n"), 47e-9)
    assert close(parse_eng("2.2k"), 2200)
    assert close(parse_eng("1e-9"), 1e-9)
    assert close(db20(10), 20) and close(db10(10), 10)
    assert close(db20(2), 6.020599913279624)
    assert close(db10(2), 3.010299956639812)
    assert close(from_db20(-3), 0.7079457843841379)
    assert close(from_db10(-3), 0.5011872336272722)
    assert [bits_needed(n) for n in (1, 2, 3, 4, 5, 1000, 1024, 1025)] == [1, 1, 2, 2, 3, 10, 10, 11]
    print("Semua uji lulus.")

    tau = parse_eng("2.2k") * parse_eng("15f")
    print("tau = R*C  =", eng(tau, "s"))
    print("gain 50x   =", round(db20(50), 2), "dB")
    print("-40 dB     =", from_db20(-40), "kali")
    print("1000 nilai =", bits_needed(1000), "bit")
    for db in (-20, -6, -3, 0, 3, 6, 20):
        print(f"{db:>4} dB  tegangan x{from_db20(db):.4f}  daya x{from_db10(db):.4f}")
