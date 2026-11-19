const { chromium } = require(process.env.PLAYWRIGHT || 'playwright'); const fs = require('fs'); const cp = require('child_process');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const F = 'm05a-pita-energi-pembawa', LAB = 'lab/m05a/';
const sh = c => cp.execSync(c, { cwd: LAB, encoding: 'utf8', shell: '/bin/bash' });
const num = s => parseFloat(String(s).replace('−', '-').replace(',', '.').replace(/[^\d.\-e+]/g, ''));
const kv = t => Object.fromEntries(t.split(' · ').map(x => { const i = x.indexOf('='); return i < 0 ? [x, ''] : [x.slice(0, i), x.slice(i + 1)]; }));
const near = (a, b, rel = 1e-3, abs = 0) => Math.abs(a - b) <= Math.max(abs, rel * Math.abs(b));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); await p.waitForTimeout(300);
  const setr = async (id, v) => { await p.evaluate(([i, x]) => { const e = document.querySelector(i); e.value = x; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [id, String(v)]); };
  const out = async id => p.textContent(id);
  const s = await p.evaluate(() => { const txt = pre => [...pre.querySelectorAll('code')].map(c => { const k = c.cloneNode(true); k.querySelectorAll('.ln').forEach(x => x.remove()); return k.textContent; }).join('');
    return { secs: document.querySelectorAll('section.icd-sec').length, viz: document.querySelectorAll('.icd-viz').length, guides: document.querySelectorAll('.icd-guide').length,
    rawTerms: [...document.querySelectorAll('span[data-term]')].map(x => x.dataset.term).filter(t => !ICD.gloss.has || !ICD.gloss.has(t)), layers: document.querySelectorAll('.icd-layers').length,
    eq: document.querySelectorAll('.icd-eq math').length, eqAlt: document.querySelectorAll('.icd-eq .alt').length,
    links: [...document.querySelectorAll('main a[href*=".html"]')].map(a => a.getAttribute('href').split('#')[0]).filter(h => !/^(index|kurikulum|belajar|glosarium|tools|referensi|pengaturan|tentang|privasi|masuk|styleguide)\.html$/.test(h) && !ICD.reg.file(h.replace('.html', ''))),
    code: [...document.querySelectorAll('#s08 pre')].map(txt), lab: [...document.querySelectorAll('#s14 pre')].map(txt), sols: [...document.querySelectorAll('#s11 details.icd-sol')].filter(d => /^Solusi/.test(d.querySelector('summary').textContent)).length }; });
  console.log(JSON.stringify({ secs: s.secs, viz: s.viz, guides: s.guides, layers: s.layers, eq: s.eq, codes: s.code.length, sols: s.sols, raw: s.rawTerms, links: s.links }));
  assert(s.secs === 16 && s.viz === 4 && s.guides === 4 && s.layers === 3, '16 bagian, 4 visualisasi, 4 eksperimen, 3 konsep berlapis');
  assert(s.eq >= 10 && s.eq === s.eqAlt, 'rumus MathML dengan teks alternatif: ' + s.eq);
  assert(s.rawTerms.length === 0 && s.links.length === 0, 'istilah dan tautan sah');
  assert(s.sols === 9, '9 latihan dengan solusi tersembunyi');
  const rd = f => fs.readFileSync(LAB + f, 'utf8').trim();
  const files = ['semi.py', 'ni_temp.py', 'carriers.py', 'mobility.py', 'fermi.py', 'fick.py', 'minority.py', 'hall.py', 'test_semi.py'];
  assert(s.code.length === files.length && files.every((f, i) => s.code[i].trim() === rd(f)), 'sembilan file kode identik dengan lab/m05a');
  const labText = s.lab.join('\n');
  assert(['ni_temp', 'carriers', 'mobility', 'fermi', 'fick', 'minority', 'hall'].every(f => labText.includes(sh('python3 ' + f + '.py').trim())), 'semua keluaran lab sama dengan eksekusi sungguhan');
  assert(sh('python3 test_semi.py 2>&1').includes('OK'), 'test_semi lulus');
  // ---- referensi Python ----
  const py = JSON.parse(sh(`python3 - <<'EOF'
import json, io, contextlib
from semi import *
with contextlib.redirect_stdout(io.StringIO()):
    import fick
from math import *
def bis(nd):
    lo, hi = 300.0, 900.0
    for _ in range(80):
        m = (lo + hi) / 2
        if ni(m) < nd: lo = m
        else: hi = m
    return (lo + hi) / 2
R = {'v1': [], 'v2': [], 'v3': [], 'v4': []}
for typ, e, T in [('n',16,300),('p',17,300),('n',12,300),('n',19,300),('n',20,300),('p',16,450),('n',14,500),('n',15,250),('p',13,400)]:
    N = 10.0**e; n, p = carriers(N, 0, T) if typ == 'n' else carriers(0, N, T); k = kt(T)
    R['v1'].append([typ, e, T, n, p, ni(T), k*log(n/ni(T)), k*log(nc(T)/n), k*log(nv(T)/p), k*log(nc(T)/n) < 3*k])
for nd, T in [(1e14,300),(1e15,570),(1e15,300),(1e16,450),(1e17,800),(1e14,250),(1e16,800)]:
    n, p = carriers(nd, 0, T); R['v2'].append([nd, T, n, p, ni(T), bis(nd)])
for typ, e, t in [('n',16,0.2),('p',16,0.2),('n',20,0.1),('p',14,2.0),('n',17,0.5),('p',19,1.0),('n',14,0.1)]:
    N = 10.0**e; rho = resistivity(N, 0) if typ == 'n' else resistivity(0, N)
    R['v3'].append([typ, e, t, mobility(N,'n'), mobility(N,'p'), rho, rho/(t*1e-4)])
for sp, T, h, Q in [('B',1000,1,1e14),('B',1000,2,1e14),('P',1100,0.5,1e15),('As',1050,0.5,1e15),('B',900,0.25,1e13),('As',900,1,1e13),('B',1150,4,1e15),('P',950,3,1e14)]:
    D = fick.dcoef(sp, T+273.15); Dt = D*h*3600; c0 = Q/sqrt(pi*Dt)
    R['v4'].append([sp, T, h, Q, D, 2e4*sqrt(Dt), c0, fick.xj(Q, Dt, 1e15)*1e4 if c0 > 1e15 else None])
print(json.dumps(R))
EOF`));
  // ---- v1 ----
  await p.locator('#v1').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  for (const [typ, e, T, n, pp, ni, efei, ecef, efev, nb] of py.v1) {
    await p.selectOption('#v1-type', typ); await setr('#v1-n', e); await setr('#v1-t', T); const f = kv(await out('#v1-out'));
    const ok = f.jenis === typ && near(num(f.N), Math.pow(10, e)) && near(num(f.n), n) && near(num(f.p), pp) && near(num(f.ni), ni) && near(num(f['EF−Ei']), efei, 1e-3, 1.1e-4) && near(num(f['Ec−EF']), ecef, 1e-3, 1.1e-4) && near(num(f['EF−Ev']), efev, 1e-3, 1.1e-4) && (!!f.catatan === nb);
    assert(ok, 'v1: ' + typ + ' 1e' + e + ' ' + T + ' K sama dengan Python' + (ok ? '' : ' :: ' + JSON.stringify(f) + ' vs ' + JSON.stringify([n, pp, ni, efei, ecef, efev, nb])));
  }
  await p.selectOption('#v1-type', 'n'); await setr('#v1-n', 16); await setr('#v1-t', 300);
  const f1 = kv(await out('#v1-out')); assert(f1['EF−Ei'] === '+0,3699 eV' && f1.rezim === 'ekstrinsik' && !f1.catatan, 'v1: n 1e16 pada 300 K: +0,3699 eV, ekstrinsik');
  assert(near(num(f1['Ec−EF']) + num(f1['EF−Ev']), 1.1245, 1e-3), 'v1: Ec−EF + EF−Ev = Eg(300 K) = 1,1245 eV');
  assert(await p.locator('#v1-band svg line.ef').count() === 1 && await p.locator('#v1-band svg circle.e').count() > 0, 'v1: diagram pita tergambar (garis EF dan elektron)');
  await setr('#v1-n', 19); assert((await out('#v1-out')).includes('catatan=Boltzmann tidak berlaku'), 'v1: 1e19 memunculkan catatan degenerasi');
  await setr('#v1-n', 12); await setr('#v1-t', 500); assert((await out('#v1-out')).includes('rezim=intrinsik'), 'v1: 1e12 pada 500 K intrinsik');
  await setr('#v1-n', 16); await setr('#v1-t', 300); await (await p.$('#v1')).screenshot({ path: 'shots/m05a-v1.png' });
  // ---- v2 ----
  await p.locator('#v2').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  for (const [nd, T, n, pp, ni, cr] of py.v2) {
    await p.selectOption('#v2-nd', '1e' + Math.round(Math.log10(nd))); await setr('#v2-t', T); const f = kv(await out('#v2-out'));
    const ok = near(num(f.n), n) && near(num(f.p), pp) && near(num(f.ni), ni) && Math.abs(num(f.T_silang) - cr) <= 0.51;
    assert(ok, 'v2: Nd=' + nd + ' T=' + T + ' sama dengan Python' + (ok ? '' : ' :: ' + JSON.stringify(f)));
  }
  await p.selectOption('#v2-nd', '1e15'); await setr('#v2-t', 570); const f2 = kv(await out('#v2-out')); assert(f2['n/p'] === '2,41' && f2.T_silang === '566 K', 'v2: 1e15 pada 570 K: n/p = 2,41; silang 566 K');
  assert(await p.evaluate(() => { const c = document.querySelector('#v2-plot canvas'); return c && c.width > 0 && /n.*p.*ni/.test(document.querySelector('#v2-plot .legend').textContent); }), 'v2: plot tergambar dengan legenda n, p, ni');
  await (await p.$('#v2')).screenshot({ path: 'shots/m05a-v2.png' });
  // ---- v3 ----
  await p.locator('#v3').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  for (const [typ, e, t, mn, mp, rho, rs] of py.v3) {
    await p.selectOption('#v3-type', typ); await setr('#v3-n', e); await setr('#v3-t', t); const f = kv(await out('#v3-out'));
    const ok = near(num(f['μn']), mn, 1e-4, 0.06) && near(num(f['μp']), mp, 1e-4, 0.06) && near(num(f['ρ'].split(' ')[0]), rho) && near(num(f.Rs.split(' ')[0]), rs);
    assert(ok, 'v3: ' + typ + ' 1e' + e + ' t=' + t + ' sama dengan Python' + (ok ? '' : ' :: ' + JSON.stringify(f)));
  }
  await p.selectOption('#v3-type', 'n'); await setr('#v3-n', 16); await setr('#v3-t', 0.2); const r16 = num(kv(await out('#v3-out'))['ρ'].split(' ')[0]);
  await setr('#v3-n', 17); const r17 = num(kv(await out('#v3-out'))['ρ'].split(' ')[0]); assert(Math.abs(r16 / r17 - 6.093) < 0.02, 'v3: ρ turun 6,1 kali dari 1e16 ke 1e17 (' + (r16 / r17).toFixed(3) + ')');
  await (await p.$('#v3')).screenshot({ path: 'shots/m05a-v3.png' });
  // ---- v4 ----
  await p.locator('#v4').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  for (const [sp, T, h, Q, D, sd, c0, xj] of py.v4) {
    await p.selectOption('#v4-sp', sp); await setr('#v4-t', T); await setr('#v4-h', h); await p.selectOption('#v4-q', '1e' + Math.round(Math.log10(Q))); const f = kv(await out('#v4-out'));
    const xs = f.xj.startsWith('tidak') ? null : num(f.xj);
    const ok = near(num(f.D.split(' ')[0]), D, 1e-2) && near(num(f['√(4Dt)']), sd, 2e-3, 6e-4) && near(num(f.C0.split(' ')[0]), c0, 1e-2) && (xj === null ? xs === null : (xs !== null && near(xs, xj, 2e-3, 6e-4)));
    assert(ok, 'v4: ' + sp + ' ' + T + ' C ' + h + ' jam Q=' + Q + ' sama dengan Python' + (ok ? '' : ' :: ' + JSON.stringify(f) + ' vs ' + JSON.stringify([D, sd, c0, xj])));
  }
  await p.selectOption('#v4-sp', 'B'); await setr('#v4-t', 1000); await setr('#v4-h', 1); await p.selectOption('#v4-q', '1e14'); const f4 = kv(await out('#v4-out'));
  assert(f4.xj === '0,444 µm' && f4['√(4Dt)'] === '0,148 µm', 'v4: boron 1000 C 1 jam: xj 0,444 µm');
  await setr('#v4-h', 2); assert(kv(await out('#v4-out')).xj === '0,615 µm', 'v4: 2 jam: 0,615 µm');
  assert(await p.evaluate(() => { const c = document.querySelector('#v4-plot canvas'); return c && c.width > 0; }), 'v4: plot tergambar');
  await (await p.$('#v4')).screenshot({ path: 'shots/m05a-v4.png' });
  // kuis dan kartu
  const qz = await p.evaluate(() => { let n = 0, bad = []; return new Promise(res => { function go() { const q = document.querySelector('#kuis .q'); if (!q) return res({ n, bad });
      const bs = [...document.querySelectorAll('#kuis .icd-opt')]; bs[0].click(); const whys = document.querySelectorAll('#kuis .why'); const right = document.querySelectorAll('#kuis .icd-opt.right').length;
      if (whys.length !== bs.length || bs.length !== 4 || right !== 1 || [...whys].some(w => w.textContent.trim().length < 25)) bad.push(n + 1); n++; const nb = document.querySelector('#kuis .icd-btn.primary'); nb.click(); setTimeout(go, 10); } go(); }); });
  assert(qz.n === 14 && qz.bad.length === 0, 'kuis: 14 soal sah ' + JSON.stringify(qz.bad));
  const kc = await p.evaluate(() => ICD.cards.count('m05a-pita-energi-pembawa')); assert(kc === 18, 'flashcard 18: ' + kc);
  assert(errs.length === 0, 'tanpa error konsol ' + errs.join('|'));
  const mo = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true })).newPage();
  await mo.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); await mo.waitForTimeout(500);
  for (const v of ['v1', 'v2', 'v3', 'v4']) await (await mo.$('#' + v)).screenshot({ path: 'shots/m05a-m-' + v + '.png' });
  const ov = await mo.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert(ov <= 1, 'tanpa scroll horizontal pada 360 px (' + ov + ')');
  await b.close();
})().catch(e => { console.error('CRASH', e.message.split('\n')[0]); process.exit(1); });
