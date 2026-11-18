"""link.py: model penaut (linker) untuk start.o + util.o, dibandingkan dengan ld sungguhan (butuh as dan ld dari binutils).
Aturan: tiap objek ditaruh berurutan dari alamat dasar; awal setiap bagian .text dibulatkan ke perataannya;
relokasi R_X86_64_PLT32 pada field rel32 di alamat P: nilai = S + A - P dengan A = -4, S = alamat simbol."""
import subprocess, os, re, tempfile, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
START_SIZE, UTIL_SIZE = 24, 7          # ukuran .text (byte) dari `size start.o util.o`
CALL_OFF = 0xA                         # offset instruksi call di _start (opcode e8 di 0xa, field rel32 di 0xb)

def align_up(x, a): return (x + a - 1) // a * a

def model(order, util_align, base):
    objs = {'start': (START_SIZE, 1), 'util': (UTIL_SIZE, util_align)}
    addr, cur = {}, base
    for name in order:
        size, al = objs[name]
        cur = align_up(cur, al); addr[name] = cur; cur += size
    start, add_mul = addr['start'], addr['util']
    P = start + CALL_OFF + 1
    rel32 = (add_mul - 4 - P) & 0xFFFFFFFF
    return {'start': start, 'add_mul': add_mul, 'rel32': rel32, 'end': cur}

def real(order, util_align, base, tmp):
    src = open(os.path.join(HERE, 'util.s')).read()
    if util_align == 1: src = src.replace('.p2align 4', '')
    open(os.path.join(tmp, 'util.s'), 'w').write(src)
    shutil.copy(os.path.join(HERE, 'start.s'), tmp)
    for n in ('start', 'util'): subprocess.run(['as', '-o', n + '.o', n + '.s'], cwd=tmp, check=True)
    objs = [n + '.o' for n in order]
    subprocess.run(['ld', '-Ttext=0x%x' % base, '-o', 'prog'] + objs, cwd=tmp, check=True)
    nm = subprocess.run(['nm', 'prog'], cwd=tmp, capture_output=True, text=True).stdout
    sym = {m.group(2): int(m.group(1), 16) for m in re.finditer(r'^([0-9a-f]+) \w (\w+)$', nm, re.M)}
    dis = subprocess.run(['objdump', '-d', '-M', 'intel', 'prog'], cwd=tmp, capture_output=True, text=True).stdout
    m = re.search(r'e8 ([0-9a-f]{2}) ([0-9a-f]{2}) ([0-9a-f]{2}) ([0-9a-f]{2})\s+call', dis)
    rel = int(m.group(4) + m.group(3) + m.group(2) + m.group(1), 16)
    code = subprocess.run(['./prog'], cwd=tmp).returncode
    return {'start': sym['_start'], 'add_mul': sym['add_mul'], 'rel32': rel, 'code': code}

if __name__ == '__main__':
    tmp = tempfile.mkdtemp()
    print('urutan        perataan  dasar      _start     add_mul    rel32       exit')
    for order in (('start', 'util'), ('util', 'start')):
        for al in (16, 1):
            for base in (0x401000, 0x400000):
                m = model(order, al, base); r = real(order, al, base, tmp)
                assert (m['start'], m['add_mul'], m['rel32']) == (r['start'], r['add_mul'], r['rel32']), (order, al, base, m, r)
                assert r['code'] == 36
                print(f"{'+'.join(order):13s} {al:8d}  0x{base:06x}  0x{m['start']:06x}  0x{m['add_mul']:06x}  0x{m['rel32']:08x}  {r['code']}")
    shutil.rmtree(tmp)
    print('model penaut == ld sungguhan untuk 8 kombinasi; program keluar dengan kode 36')
