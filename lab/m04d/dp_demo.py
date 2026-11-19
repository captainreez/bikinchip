#!/usr/bin/env python3
"""dp_demo.py: rekursi eksponensial menjadi linear lewat memoization; LCS (dasar alat diff) dengan tabel DP."""
from functools import lru_cache

calls = 0
def fib_naif(n):
    global calls
    calls += 1
    return n if n < 2 else fib_naif(n - 1) + fib_naif(n - 2)

memo_calls = 0
@lru_cache(maxsize=None)
def fib_memo(n):
    global memo_calls
    memo_calls += 1
    return n if n < 2 else fib_memo(n - 1) + fib_memo(n - 2)

def lcs(a, b):
    """panjang subsequence persekutuan terpanjang; tabel (len(a)+1) x (len(b)+1), waktu O(len(a) * len(b))."""
    t = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i, x in enumerate(a, 1):
        for j, y in enumerate(b, 1):
            t[i][j] = t[i - 1][j - 1] + 1 if x == y else max(t[i - 1][j], t[i][j - 1])
    return t[-1][-1]

if __name__ == "__main__":
    for n in (10, 20, 25):
        calls = 0
        print(f"fib({n}) = {fib_naif(n)} dengan {calls} panggilan")
    fib_memo.cache_clear(); memo_calls = 0
    print(f"fib(25) memo = {fib_memo(25)} dengan {memo_calls} panggilan")
    print("lcs('ABCBDAB', 'BDCABA') =", lcs("ABCBDAB", "BDCABA"))
