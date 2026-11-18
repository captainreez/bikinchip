"""emu.py: emulator mini untuk subset x86-64 yang dipakai di visualisasi 1, dibandingkan dengan mesin sungguhan lewat ctypes.
Menghitung jumlah instruksi dan memeriksa rumus 3n+4 (sum_to) dan 4n (fact_it, n >= 1)."""
import ctypes, subprocess, os, sys

PROG = {
    'sum_to': [('xor', 'eax', 'eax'), ('test', 'rdi', 'rdi'), ('jle', 6), ('add', 'rax', 'rdi'), ('dec', 'rdi'), ('jnz', 3), ('ret',)],
    'fact_it': [('mov', 'eax', 1), ('cmp', 'rdi', 1), ('jle', 7), ('imul', 'rax', 'rdi'), ('dec', 'rdi'), ('cmp', 'rdi', 1), ('jg', 3), ('ret',)],
}

def run(name, n):
    prog = PROG[name]
    reg = {'rax': 0, 'rdi': n}
    zf = sf = False
    pc = steps = 0
    def val(x): return reg[x] if isinstance(x, str) and x in reg else (reg['rax'] if x == 'eax' else x)
    while True:
        ins = prog[pc]; op = ins[0]; steps += 1; pc += 1
        if op == 'xor': reg['rax'] = 0; zf, sf = True, False
        elif op == 'mov': reg['rax'] = ins[2]
        elif op == 'test':
            v = reg['rdi']; zf, sf = v == 0, v < 0
        elif op == 'cmp':
            r = reg['rdi'] - ins[2]; zf, sf = r == 0, r < 0
        elif op == 'add': reg['rax'] += reg['rdi']; zf, sf = reg['rax'] == 0, reg['rax'] < 0
        elif op == 'imul': reg['rax'] *= reg['rdi']; zf, sf = reg['rax'] == 0, reg['rax'] < 0
        elif op == 'dec': reg['rdi'] -= 1; zf, sf = reg['rdi'] == 0, reg['rdi'] < 0
        elif op == 'jle':
            if zf or sf: pc = ins[1]
        elif op == 'jg':
            if (not zf) and (not sf): pc = ins[1]
        elif op == 'jnz':
            if not zf: pc = ins[1]
        elif op == 'ret': return reg['rax'], steps
        else: raise ValueError(op)

if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    subprocess.run(['gcc', '-shared', '-fPIC', '-o', os.path.join(here, 'libsumloop.so'), os.path.join(here, 'sumloop.s')], check=True)
    lib = ctypes.CDLL(os.path.join(here, 'libsumloop.so'))
    for f in (lib.sum_to, lib.fact_it): f.argtypes = [ctypes.c_long]; f.restype = ctypes.c_long
    print('  n  sum_to(n)  instr  3n+4 | fact_it(n)  instr  4n')
    for n in range(0, 13):
        s, ns = run('sum_to', n)
        assert s == lib.sum_to(n) and ns == 3 * n + 4, (n, s, ns)
        if n >= 1:
            f, nf = run('fact_it', n)
            assert f == lib.fact_it(n) and nf == 4 * n, (n, f, nf)
            print(f'{n:3d}  {s:9d}  {ns:5d}  {3*n+4:4d} | {f:11d}  {nf:5d}  {4*n:3d}')
        else:
            print(f'{n:3d}  {s:9d}  {ns:5d}  {3*n+4:4d} | (n >= 1)')
    for n in range(13, 21): s, ns = run('sum_to', n); assert s == lib.sum_to(n) and ns == 3 * n + 4
    print('emulator == mesin sungguhan untuk sum_to (n = 0..20) dan fact_it (n = 1..12)')
