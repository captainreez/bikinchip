#!/usr/bin/env python3
"""alias_demo.py: nama menunjuk ke objek; salinan dangkal berbagi objek di dalamnya."""
import copy

def run(form):
    a = [[1, 2], [3]]
    if form == "alias":
        b = a
    elif form == "shallow":
        b = a[:]                 # sama dengan list(a) dan a.copy()
    elif form == "deep":
        b = copy.deepcopy(a)
    else:
        raise ValueError(form)
    b[0].append(9)               # mengubah isi list di dalam
    b.append([4])                # mengubah list luar
    return a, b, b is a, b[0] is a[0]

FORMS = ["alias", "shallow", "deep"]
if __name__ == "__main__":
    for f in FORMS:
        a, b, same_outer, same_inner = run(f)
        print(f"{f:8s} a={a} b={b} b_is_a={same_outer} b0_is_a0={same_inner}")

    # jebakan klasik: argumen bawaan yang bisa diubah dibuat SEKALI saat def dijalankan
    def tambah(x, acc=[]):
        acc.append(x)
        return acc
    print("bawaan:", tambah(1), tambah(2))
    def tambah_aman(x, acc=None):
        acc = [] if acc is None else acc
        acc.append(x)
        return acc
    print("aman  :", tambah_aman(1), tambah_aman(2))
    # += pada list mengubah objek di tempat, + membuat objek baru
    p = [1]; q = p; p += [2]
    r = [1]; s = r; r = r + [2]
    print("+= :", q, "| + :", s)
