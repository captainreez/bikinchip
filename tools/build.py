#!/usr/bin/env python3
"""Bangun file HTML mandiri: sisipkan ICD-Core (CSS+JS) ke setiap src/*.src.html.
Pemakaian: python3 tools/build.py [folder_keluaran]
Juga bisa memperbarui core di file HTML yang sudah jadi: python3 tools/build.py --update folder
"""
import re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
css = (ROOT/'src'/'core.css').read_text(encoding='utf-8')
js = (ROOT/'src'/'core.js').read_text(encoding='utf-8')
import json
import os
cfgp = pathlib.Path(os.environ['CONFIG']) if os.environ.get('CONFIG') else ROOT/'src'/'config.json'
cfg = json.loads(cfgp.read_text(encoding='utf-8')) if cfgp.exists() else {}
js = js.replace('/*@@CONFIG@@*/{}', json.dumps(cfg, ensure_ascii=False))
ver = re.search(r"version: '([\d.]+)'", js).group(1)
assert '</script' not in js.lower() and '</style' not in css.lower()
BLOCK = ('<!-- ICD-CORE %s BEGIN (identik di semua file; jangan disunting per file) -->\n'
         '<style id="icd-core-css">\n%s</style>\n<script id="icd-core-js">\n%s</script>\n<!-- ICD-CORE END -->') % (ver, css, js)
PAT = re.compile(r'<!-- ICD-CORE [\d.]+ BEGIN.*?<!-- ICD-CORE END -->', re.S)
def main():
    if len(sys.argv) > 2 and sys.argv[1] == '--update':
        for p in sorted(pathlib.Path(sys.argv[2]).glob('*.html')):
            t = p.read_text(encoding='utf-8'); n = PAT.sub(lambda m: BLOCK, t)
            if n != t: p.write_text(n, encoding='utf-8'); print('diperbarui', p.name)
        return
    out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ROOT/'dist'); out.mkdir(parents=True, exist_ok=True)
    for src in sorted((ROOT/'src').glob('*.src.html')):
        t = src.read_text(encoding='utf-8'); assert '<!--CORE-->' in t, src
        name = src.name.replace('.src.html', '.html')
        (out/name).write_text(t.replace('<!--CORE-->', BLOCK), encoding='utf-8')
        print(name, round((out/name).stat().st_size/1024), 'KB')
main()
