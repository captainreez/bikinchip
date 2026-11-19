#!/usr/bin/env python3
"""Merakit src/m04d-python-tcl-algoritma.src.html dari bagian /tmp/m04d/p*.html; {{FILE:x}} = isi lab/m04d/x (escape HTML), {{RUN:cmd}} = keluaran sebenarnya."""
import html, re, subprocess, sys
LAB = 'lab/m04d'
parts = [open('/tmp/m04d/p%d.html' % i, encoding='utf8').read() for i in range(1, 6)]
t = ''.join(parts)
t = re.sub(r'\{\{FILE:([^}]+)\}\}', lambda m: html.escape(open(LAB + '/' + m.group(1), encoding='utf8').read().rstrip('\n'), quote=False), t)
def run(m):
    cmd = m.group(1)
    out = subprocess.run(cmd, shell=True, cwd=LAB, capture_output=True, text=True, executable='/bin/bash').stdout.rstrip('\n')
    return html.escape(out, quote=False)
t = re.sub(r'\{\{RUN:([^}]+)\}\}', run, t)
assert '{{' not in t
open('src/m04d-python-tcl-algoritma.src.html', 'w', encoding='utf8').write(t)
print(len(t), 'byte')
