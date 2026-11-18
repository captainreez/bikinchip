from linefilt import bounce


def settle(vs, rs, z0, rl, tol=0.05, n=200):
    """Jumlah waktu-tempuh td sampai tegangan beban menetap dalam +-tol dari nilai akhir.
    Mengembalikan None bila tidak menetap dalam n langkah."""
    v = bounce(vs, rs, z0, rl, n)
    vf = vs * rl / (rs + rl)
    for k in range(n - 1, -1, -1):
        if abs(v[k] - vf) > tol * abs(vf):
            return k + 2 if k + 1 < n else None      # tegangan benar mulai setelah k+1 kedatangan
    return 1


if __name__ == "__main__":
    print("Beban terbuka (1 Mohm), Z0 = 50 ohm, menetap dalam 5%:")
    for rs in (0, 10, 25, 50, 100, 200):
        k = settle(1.0, rs, 50, 1e6)
        print(f"  Rs = {rs:>3} ohm: " + (f"{k} kedatangan (= {2 * k - 1} td)" if k else "tidak menetap"))
