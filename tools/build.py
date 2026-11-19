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
idxp = ROOT/'src'/'search-index.json'
idx = json.loads(idxp.read_text(encoding='utf-8')) if idxp.exists() else []
import subprocess, shutil as _sh
ESB = os.environ.get('ESBUILD') or '/opt/npm-tools/node_modules/.bin/esbuild'
def minify(src, loader):
    if os.environ.get('NO_MIN') or not os.path.exists(ESB): return src
    r = subprocess.run([ESB, '--minify', '--loader=' + loader, '--target=es2017', '--legal-comments=none'], input=src, capture_output=True, text=True)
    return r.stdout if r.returncode == 0 and r.stdout else src
ver = re.search(r"version: '([\d.]+)'", js).group(1)
assert '</script' not in js.lower() and '</style' not in css.lower()
js_min = minify(js, 'js'); css_min = minify(css, 'css')
BLOCK = ('<!-- ICD-CORE %s BEGIN (identik di semua file; jangan disunting per file) -->\n'
         '<style id="icd-core-css">\n%s</style>\n<script id="icd-core-js">\n%s</script>\n<!-- ICD-CORE END -->') % (ver, css_min, js_min)
def data_block(m):
    names = [n for n in m.group(1).split(',') if n]
    obj = {n: json.loads((ROOT/'src'/(n+'.json')).read_text(encoding='utf-8')) for n in names}
    s = json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    return '<script>window.ICD_DATA=Object.assign(window.ICD_DATA||{},%s);</script>' % s
pcss = (ROOT/'src'/'pages.css').read_text(encoding='utf-8')
pjs = (ROOT/'src'/'pages.js').read_text(encoding='utf-8') if (ROOT/'src'/'pages.js').exists() else ''
PAGES = '<style id="icd-pages-css">\n%s</style>\n<script id="icd-pages-js">\n%s</script>' % (minify(pcss, 'css'), minify(pjs, 'js'))
DATA = re.compile(r'<!--DATA:([a-z0-9,-]+)-->')
PAT = re.compile(r'<!-- ICD-CORE [\d.]+ BEGIN.*?<!-- ICD-CORE END -->', re.S)

import html as _h, shutil
SITE = cfg.get('siteUrl', 'https://captainreez.github.io/bikinchip/').rstrip('/') + '/'
NOINDEX = {'masuk.html', 'styleguide.html'}
def plain(s):
    s = re.sub(r'\s+', ' ', _h.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()
    return re.sub(r'\(\s+', '(', re.sub(r'\s+([,.;:?!)])', r'\1', s))
def lesson_desc(t):
    d = ''
    for m in re.finditer(r'<p[^>]*>(.*?)</p>', t[t.find('id="s01"'):], re.S):
        d = plain(m.group(1))
        if len(d) > 60 and not d.startswith('Prasyarat'): break
    if len(d) > 155: d = d[:155].rsplit(' ', 1)[0].rstrip(',;:') + '…'
    return d
def seo(t, name):
    """Judul statis, deskripsi, canonical, OG/Twitter, ikon, manifest."""
    m = re.search(r'<title>(.*?)</title>', t, re.S); title = plain(m.group(1))
    if re.match(r'm\d\d', name):
        title = re.sub(r'\s+[—-]\s+IC Design dari Nol sampai Silikon.*$', '', title) + ' · bikinchip'
        t = t.replace(m.group(0), '<title>%s</title>' % _h.escape(title, quote=False), 1)
    d = re.search(r'<meta name="description" content="(.*?)"', t, re.S)
    desc = _h.unescape(d.group(1)) if d else lesson_desc(t)
    url = SITE + ('' if name == 'index.html' else name); q = lambda s: _h.escape(s, quote=True)
    tags = ['<meta name="theme-color" content="#0B5C7A">',
      '<link rel="canonical" href="%s">' % url,
      '<link rel="icon" href="favicon.svg" type="image/svg+xml">', '<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">',
      '<link rel="apple-touch-icon" href="apple-touch-icon.png">', '<link rel="manifest" href="manifest.webmanifest">',
      '<meta property="og:type" content="website">', '<meta property="og:site_name" content="bikinchip">', '<meta property="og:locale" content="id_ID">',
      '<meta property="og:title" content="%s">' % q(title), '<meta property="og:url" content="%s">' % url, '<meta property="og:image" content="%sog.png">' % SITE,
      '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
      '<meta name="twitter:card" content="summary_large_image">', '<meta name="twitter:title" content="%s">' % q(title), '<meta name="twitter:image" content="%sog.png">' % SITE]
    if desc:
        tags += ['<meta property="og:description" content="%s">' % q(desc), '<meta name="twitter:description" content="%s">' % q(desc)]
        if not d: tags.insert(0, '<meta name="description" content="%s">' % q(desc))
    if name in NOINDEX: tags.append('<meta name="robots" content="noindex">')
    return t.replace('</head>', '\n'.join(tags) + '\n</head>', 1)
def extras(out, names):
    st = ROOT/'src'/'static'
    if st.exists():
        for f in st.iterdir(): shutil.copy(f, out/f.name)
    (out/'manifest.webmanifest').write_text(json.dumps({'name': 'bikinchip', 'short_name': 'bikinchip', 'description': 'Ayo jadi chip designer Indonesia.', 'lang': 'id', 'start_url': './', 'scope': './', 'display': 'standalone', 'background_color': '#FFFFFF', 'theme_color': '#0B5C7A',
      'icons': [{'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png'}, {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png'}, {'src': 'icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]}, ensure_ascii=False, indent=1), encoding='utf-8')
    urls = [SITE + ('' if n == 'index.html' else n) for n in names if n not in NOINDEX]
    (out/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join('  <url><loc>%s</loc></url>\n' % u for u in urls) + '</urlset>\n', encoding='utf-8')
    (out/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: %ssitemap.xml\n' % SITE, encoding='utf-8')
def main():
    if len(sys.argv) > 2 and sys.argv[1] == '--update':
        for p in sorted(pathlib.Path(sys.argv[2]).glob('*.html')):
            t = p.read_text(encoding='utf-8'); n = PAT.sub(lambda m: BLOCK, t)
            if n != t: p.write_text(n, encoding='utf-8'); print('diperbarui', p.name)
        return
    out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ROOT/'dist'); out.mkdir(parents=True, exist_ok=True)
    srcs = sorted((ROOT/'src').glob('*.src.html'))
    if os.environ.get('WITH_TEST_PAGES'): srcs += sorted((ROOT/'tools'/'pages').glob('*.src.html'))  # halaman uji internal, tidak pernah masuk docs/
    if idx: (out/'search-index.js').write_text('window.ICD_INDEX=' + json.dumps(idx, ensure_ascii=False, separators=(',', ':')) + ';', encoding='utf-8')
    done = []
    for src in srcs:
        t = src.read_text(encoding='utf-8'); assert '<!--CORE-->' in t, src
        name = src.name.replace('.src.html', '.html')
        page = DATA.sub(data_block, t.replace('<!--CORE-->', BLOCK).replace('<!--PAGES-->', PAGES))
        if src.parent.name == 'src': page = seo(page, name); done.append(name)
        (out/name).write_text(page, encoding='utf-8')
        print(name, round((out/name).stat().st_size/1024), 'KB')
    extras(out, sorted(done))
main()
