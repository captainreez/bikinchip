#!/usr/bin/env python3
"""Terapkan docs/terminologi.md ke sumber: ganti istilah Indonesia kaku dengan istilah teknis
Inggris, dan 'Anda' -> 'kamu'. Hanya teks biasa; <pre>, <code>, <script>, <style> dilewati
pada HTML. Untuk .js hanya baris yang bukan `idn:` (padanan Indonesia di glosarium).
Pakai: python3 tools/terminologi.py [--dry] berkas..."""
import re, sys
TERMS = [
 (r'Devais', 'Device'), (r'devais', 'device'),
 (r'bangku uji', 'testbench'), (r'jabat tangan', 'handshake'), (r'rendemen', 'yield'),
 (r'denah chip', 'floorplan'), (r'mesin keadaan hingga', 'FSM'), (r'sudut PVT', 'PVT corner'),
 (r'rantai scan', 'scan chain'), (r'sintesis pohon clock', 'clock tree synthesis'),
 (r'jatuh tegangan IR', 'IR drop'), (r'transistor sirip', 'FinFET'),
 (r'waktu setup', 'setup time'), (r'waktu hold', 'hold time'), (r'tepi clock', 'clock edge'),
 (r'desimal tak bertanda', 'desimal unsigned'), (r'tak bertanda', 'unsigned'),
 (r'masukannya', 'input-nya'), (r'keluarannya', 'output-nya'),
 (r'masukan', 'input'), (r'keluaran', 'output'), (r'Masukan', 'Input'), (r'Keluaran', 'Output'),
 (r'penyangga(?! data)', 'buffer'), (r'penyangga data', 'buffer data'),
 (r'Lebar(?! pita)', 'Bit width'),
 (r'Saring istilah', 'Cari istilah'), (r'Dasbor', 'Dashboard'),
 (r'sinkron antarperangkat', 'sinkronisasi antar-device'),
]
def fix(s):
    for a, b in TERMS: s = re.sub(r'(?<![\w-])' + a + r'(?![\w])', b, s)
    s = re.sub(r'(^|[.!?:]\s+|>\s*|\n\s*)Anda\b', r'\1Kamu', s)
    s = re.sub(r'\bAnda\b', 'kamu', s)
    return s
def html(s):
    out, i, skip = [], 0, 0
    for m in re.finditer(r'<(/?)(pre|code|script|style)\b[^>]*>|<[^>]+>', s):
        seg = s[i:m.start()]; out.append(seg if skip else fix(seg)); tag = m.group(0)
        if m.group(2):
            skip += -1 if m.group(1) else 1; skip = max(skip, 0)
        out.append(tag); i = m.end()
    out.append(s[i:] if skip else fix(s[i:])); return ''.join(out)
def js(s):
    return '\n'.join(l if 'idn:' in l else fix(l) for l in s.split('\n'))
dry = '--dry' in sys.argv
for p in [a for a in sys.argv[1:] if a != '--dry']:
    t = open(p, encoding='utf-8').read()
    n = html(t) if p.endswith('.html') else js(t) if p.endswith('.js') else fix(t)
    if n != t:
        print(p, 'diubah')
        if not dry: open(p, 'w', encoding='utf-8').write(n)
