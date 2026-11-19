#!/usr/bin/env python3
"""sort_counts.py: hitung perbandingan elemen insertion, merge, dan quick sort pada n kunci."""
def lcg(n, seed=12345):
    x, out = seed, []
    for _ in range(n):
        x = x * 48271 % 2147483647      # Park-Miller; muat di float64 sehingga identik dengan JavaScript
        out.append(x % 1000)
    return out

def insertion(a):
    a, cmp = a[:], 0
    for i in range(1, len(a)):
        key, j = a[i], i - 1
        while j >= 0:
            cmp += 1
            if a[j] > key:
                a[j + 1] = a[j]; j -= 1
            else:
                break
        a[j + 1] = key
    return a, cmp

def merge_sort(a):
    cmp = 0
    def ms(x):
        nonlocal cmp
        if len(x) <= 1:
            return x
        m = len(x) // 2
        l, r = ms(x[:m]), ms(x[m:])
        out, i, j = [], 0, 0
        while i < len(l) and j < len(r):
            cmp += 1
            if l[i] <= r[j]:
                out.append(l[i]); i += 1
            else:
                out.append(r[j]); j += 1
        return out + l[i:] + r[j:]
    return ms(a[:]), cmp

def quick(a):
    a, cmp, st = a[:], 0, [(0, len(a) - 1)]
    while st:
        lo, hi = st.pop()
        if lo >= hi:
            continue
        piv, i = a[hi], lo
        for j in range(lo, hi):
            cmp += 1
            if a[j] < piv:
                a[i], a[j] = a[j], a[i]; i += 1
        a[i], a[hi] = a[hi], a[i]
        st.append((lo, i - 1)); st.append((i + 1, hi))
    return a, cmp

def data(kind, n):
    d = lcg(n)
    return sorted(d) if kind == "sorted" else (sorted(d, reverse=True) if kind == "reverse" else d)

if __name__ == "__main__":
    for kind in ("random", "sorted", "reverse"):
        print(kind)
        for n in (4, 8, 16, 32, 64, 128, 256, 512, 1024):
            d = data(kind, n)
            r = [f(d) for f in (insertion, merge_sort, quick)]
            assert all(x[0] == sorted(d) for x in r)
            print(f"  n={n:5d} insertion={r[0][1]:8d} merge={r[1][1]:6d} quick={r[2][1]:8d}")
