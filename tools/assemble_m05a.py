#!/usr/bin/env python3
"""Merakit src/m05a-pita-energi-pembawa.src.html dari /tmp/m05a/p*.html.
{{FILE:x}} = isi lab/m05a/x, {{RUN:cmd}} = keluaran sebenarnya, [[EQ:alt|ekspresi]] = rumus MathML (tools/mathdsl.py)."""
import html, re, subprocess, sys
sys.path.insert(0, 'tools')
import mathdsl
LAB = 'lab/m05a'
t = ''.join(open('/tmp/m05a/p%d.html' % i, encoding='utf8').read() for i in range(1, 6))
t = re.sub(r'\{\{FILE:([^}]+)\}\}', lambda m: html.escape(open(LAB + '/' + m.group(1), encoding='utf8').read().rstrip('\n'), quote=False), t)
def run(m):
    out = subprocess.run(m.group(1), shell=True, cwd=LAB, capture_output=True, text=True, executable='/bin/bash').stdout.rstrip('\n')
    return html.escape(out, quote=False)
t = re.sub(r'\{\{RUN:([^}]+)\}\}', run, t)
t = re.sub(r'\[\[EQ:(.*?)\|(.*?)\]\]', lambda m: mathdsl.eq(m.group(1), m.group(2)), t, flags=re.S)
t = re.sub(r'\[\[M:(.*?)\]\]', lambda m: mathdsl.inline(m.group(1)), t, flags=re.S)
assert '{{' not in t and '[[EQ:' not in t and '[[M:' not in t
open('src/m05a-pita-energi-pembawa.src.html', 'w', encoding='utf8').write(t)
print(len(t), 'byte')
