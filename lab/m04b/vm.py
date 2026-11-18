"""vm.py: terjemahan alamat virtual ke fisik, model mainan: alamat virtual 16 bit, halaman 4 KB (offset 12 bit, VPN 4 bit),
8 frame fisik (PA 15 bit). x86-64 sungguhan memakai 4 tingkat tabel (9 bit per tingkat) pada alamat virtual 48 bit."""

# (hadir, r, w, x, frame)
def tabel(guard=True):
    t = {v: (False, 0, 0, 0, 0) for v in range(16)}
    t[0] = (True, 1, 0, 1, 2)       # kode: r-x
    t[1] = (True, 1, 0, 0, 5)       # konstanta: r--
    t[2] = (True, 1, 1, 0, 1)       # data: rw-
    t[4] = (True, 1, 1, 0, 6)       # heap: rw-
    t[13] = (False, 0, 0, 0, 0) if guard else (True, 1, 1, 0, 7)   # halaman penjaga di bawah stack
    t[14] = (True, 1, 1, 0, 3)      # stack: rw-
    t[15] = (True, 1, 1, 0, 4)      # puncak stack: rw-
    return t

def translate(va, akses, t):
    vpn, off = va >> 12, va & 0xFFF
    hadir, r, w, x, fr = t[vpn]
    if not hadir: return ('page fault', None)
    need = {'r': r, 'w': w, 'x': x}[akses]
    if not need: return ('protection fault', None)
    return ('ok', (fr << 12) | off)

if __name__ == '__main__':
    T = tabel(True)
    kasus = [(0x0123, 'r'), (0x0123, 'w'), (0x0010, 'x'), (0x1004, 'r'), (0x1004, 'w'), (0x2ABC, 'w'), (0x2000, 'x'), (0x3000, 'r'),
             (0xD7FF, 'w'), (0xE000, 'r'), (0xEFFF, 'w'), (0xFFF0, 'w'), (0x4000, 'r')]
    print('VA     akses  hasil                PA')
    for va, a in kasus:
        h, pa = translate(va, a, T)
        print(f'0x{va:04X}  {a}      {h:18s}   ' + (f'0x{pa:04X}' if pa is not None else '-'))
    assert translate(0x0123, 'r', T) == ('ok', 0x2123)
    assert translate(0x0123, 'w', T) == ('protection fault', None)
    assert translate(0x0010, 'x', T) == ('ok', 0x2010)
    assert translate(0x1004, 'r', T) == ('ok', 0x5004) and translate(0x1004, 'w', T)[0] == 'protection fault'
    assert translate(0x2ABC, 'w', T) == ('ok', 0x1ABC) and translate(0x2000, 'x', T)[0] == 'protection fault'
    assert translate(0x3000, 'r', T)[0] == 'page fault'
    assert translate(0xD7FF, 'w', T)[0] == 'page fault'
    assert translate(0xEFFF, 'w', T) == ('ok', 0x3FFF) and translate(0xFFF0, 'w', T) == ('ok', 0x4FF0)
    assert translate(0xD7FF, 'w', tabel(False)) == ('ok', 0x77FF)        # tanpa halaman penjaga: stack overflow diam-diam
    print('semua pemeriksaan vm.py lulus')
