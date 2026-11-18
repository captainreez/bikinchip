"""regex_bt.py: mesin regex backtracking kecil (literal, ., |, (), *, +, ?) yang menghitung LANGKAH.
Hasil kecocokan penuh diperiksa terhadap modul re bawaan Python; langkah menunjukkan ledakan eksponensial pada pola seperti (a+)+b."""
import itertools, re

def parse(p):
    pos = 0
    def peek(): return p[pos] if pos < len(p) else None
    def alt():
        nonlocal pos
        n = cat()
        while peek() == '|':
            pos += 1; n = ('alt', n, cat())
        return n
    def cat():
        nonlocal pos
        n = ('empty',)
        while peek() is not None and peek() not in '|)':
            a = post()
            n = a if n == ('empty',) else ('cat', n, a)
        return n
    def post():
        nonlocal pos
        a = atom()
        while peek() in ('*', '+', '?'):
            a = ({'*': 'star', '+': 'plus', '?': 'opt'})[peek()], a; pos += 1
        return a
    def atom():
        nonlocal pos
        c = peek(); pos += 1
        if c == '(':
            n = alt(); assert peek() == ')', 'kurung tak seimbang'; pos += 1; return n
        return ('chr', c)
    n = alt(); assert pos == len(p), 'sisa pola'
    return n

def fullmatch(p, s):
    """kembalikan (cocok, langkah); satu langkah = satu pemanggilan m()"""
    ast, n, steps = parse(p), len(s), [0]
    def m(node, i, k):
        steps[0] += 1
        t = node[0]
        if t == 'empty': return k(i)
        if t == 'chr': return i < n and (node[1] == '.' or s[i] == node[1]) and k(i + 1)
        if t == 'cat': return m(node[1], i, lambda j: m(node[2], j, k))
        if t == 'alt': return m(node[1], i, k) or m(node[2], i, k)
        if t == 'opt': return m(node[1], i, k) or k(i)
        if t == 'star':
            def loop(j): return m(node[1], j, lambda j2: j2 > j and loop(j2)) or k(j)
            return loop(i)
        if t == 'plus': return m(('cat', node[1], ('star', node[1])), i, k)
        raise ValueError(t)
    return bool(m(ast, 0, lambda j: j == n)), steps[0]

if __name__ == '__main__':
    pats = ['a+b', '(a+)+b', 'a*a*b', '(a|b)*abb', '(ab)*', 'a?b?c', '.*x', '(a|aa)+b', 'a(b|c)*d?', '(a*)*b']
    for p in pats:
        for L in range(0, 7):
            for tup in itertools.product('abcdx', repeat=L) if L <= 5 else []:
                s = ''.join(tup)
                assert fullmatch(p, s)[0] == bool(re.fullmatch(p, s)), (p, s)
    print('mesin backtracking == re.fullmatch untuk 10 pola x semua string abcdx sepanjang <= 5')
    print('n   a+b(a^n)   (a+)+b(a^n)  a*a*b(a^n)   (a+)+b(a^n b)')
    rows = {}
    for n in range(1, 15):
        s = 'a' * n
        rows[n] = [fullmatch('a+b', s)[1], fullmatch('(a+)+b', s)[1], fullmatch('a*a*b', s)[1], fullmatch('(a+)+b', s + 'b')[1]]
        print(f'{n:2d} {rows[n][0]:9d} {rows[n][1]:12d} {rows[n][2]:11d} {rows[n][3]:14d}')
    assert not fullmatch('(a+)+b', 'a' * 10)[0] and fullmatch('(a+)+b', 'a' * 10 + 'b')[0]
    for n in range(2, 15): assert rows[n][1] > 1.9 * rows[n - 1][1] * 0.95 and rows[n][0] < 5 * n + 5   # eksponensial vs linear
    fib = [fullmatch('(a|aa)+b', 'a' * n)[1] for n in range(1, 15)]
    print('(a|aa)+b pada a^n, n = 1..14:', fib)
    assert fib[-1] / fib[-2] > 1.5 and fib[-1] / fib[-2] < 1.7        # tumbuh seperti deret Fibonacci (~1,618)
    ratio = rows[14][1] / rows[13][1]
    print(f'rasio langkah (a+)+b dari n = 13 ke 14: {ratio:.3f} (mendekati 2 = eksponensial)')
    assert 1.9 < ratio < 2.1
    print('semua pemeriksaan regex_bt.py lulus')
