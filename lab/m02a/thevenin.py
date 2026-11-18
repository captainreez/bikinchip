from mna import mna


def thevenin(net, a, b=0, it=1e-3):
    """Setara Thevenin dilihat dari simpul a dan b: (Vth, Rth)."""
    v, _ = mna(net)
    voc = v[a] - v[b]                                    # tegangan rangkaian terbuka
    v, _ = mna(net + [('I', 'ITES', b, a, it)])          # suntik arus uji ke a, keluar dari b
    return voc, ((v[a] - v[b]) - voc) / it               # Rth = perubahan tegangan / arus uji


if __name__ == "__main__":
    tanpa_r5 = [('V', 'VS', 1, 0, 5.0), ('R', 'R1', 1, 2, 1e3), ('R', 'R2', 2, 0, 2e3),
                ('R', 'R3', 1, 3, 1.5e3), ('R', 'R4', 3, 0, 1e3)]
    vth, rth = thevenin(tanpa_r5, 2, 3)
    print(f"dilihat R5: Vth = {vth:.4f} V, Rth = {rth:.2f} ohm")
    print(f"arus R5 = Vth / (Rth + 500) = {vth / (rth + 500) * 1e3:.4f} mA")
