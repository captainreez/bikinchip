const { chromium } = require(process.env.PLAYWRIGHT || 'playwright'); const fs = require('fs'); const cp = require('child_process');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const F = 'm05b-pn-junction-dioda', LAB = 'lab/m05b/';
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
  const files = ['pn.py', 'vbi_w.py', 'iv_curve.py', 'cv.py', 'rectifier.py', 'schottky.py', 'bgr.py', 'test_pn.py'];
  assert(s.code.length === files.length && files.every((f, i) => s.code[i].trim() === rd(f)), 'delapan berkas kode identik dengan lab/m05b');
  const labText = s.lab.join('\n');
  assert(['vbi_w', 'iv_curve', 'cv', 'rectifier', 'schottky', 'bgr'].every(f => labText.includes(sh('python3 ' + f + '.py').trim())), 'semua keluaran lab sama dengan eksekusi sungguhan');
  assert(sh('python3 test_pn.py 2>&1').includes('OK') && sh('python3 test_pn.py 2>&1').includes('Ran 14'), 'test_pn lulus (14 uji)');
  const py = JSON.parse(sh(`python3 - <<'EOF'
import json, io, contextlib
from math import *
with contextlib.redirect_stdout(io.StringIO()):
    import pn, rectifier
from pn import *
def iofv(v, is_, n, rs, T):
    lo, hi = 0.0, 1e4
    for _ in range(200):
        mid = (lo + hi) / 2
        if voltage(mid, is_, n, rs, T) > v: hi = mid
        else: lo = mid
    return (lo + hi) / 2
R = {'v1': [], 'v2': [], 'v3': [], 'v4': []}
for ea, ed, V in [(17,16,0.0),(17,16,-5.0),(15,15,0.5),(19,19,-10.0),(18,15,-3.0),(16.5,15.5,0.2),(15,19,-1.0),(19,15,0.0)]:
    na, nd = 10.0**ea, 10.0**ed; w, xn, xp, em = depletion(na, nd, V)
    R['v1'].append([ea, ed, V, vbi(na, nd), w, xp, xn, em, cj(na, nd, V)])
for T, n, rs, V in [(300,1.0,0,0.65),(350,1.0,0,0.65),(300,1.5,0,0.7),(300,1.0,10,0.85),(250,2.0,50,0.9),(400,1.2,5,0.5),(300,1.0,0,0.3),(300,2.0,0,0.9)]:
    is_ = is_sat(1e18, 1e16, 1e-4, 1e-6, T); I = iofv(V, is_, n, float(rs), T)
    R['v2'].append([T, n, rs, V, is_, I, n*vt(T)/I + rs, voltage(1e-3, is_, n, float(rs), T), n*vt(T)*log(10)*1e3])
for ea, ed, A, V in [(18,16,1e-4,-2.0),(17,16,1e-4,-5.0),(15,15,1e-6,0.3),(19,17,1e-3,-10.0),(16.5,15.5,1e-5,-1.0),(18,16,1e-4,-8.0),(17,15,1e-4,-3.0)]:
    na, nd = 10.0**ea, 10.0**ed; c1, c2 = cj(na, nd, -6.0, A), cj(na, nd, -2.0, A); y1, y2 = 1/c1**2, 1/c2**2; sl = (y2 - y1)/4
    R['v3'].append([ea, ed, A, V, vbi(na, nd), depletion(na, nd, V)[0], cj(na, nd, V, A), cj(na, nd, 0.0, A), na*nd/(na+nd), -2/(Q*EPS*A*A*sl), -2 - y2/sl])
for vpk, f, c, rl in [(5.0,50,1e-4,1000),(5.0,50,1e-3,1000),(5.0,50,1e-4,100),(12.0,60,4.7e-4,220),(3.0,400,1e-4,10000),(12.0,50,3.3e-3,100),(2.0,60,4.7e-4,220),(8.5,400,1e-3,10000)]:
    vmax, vmin, ipk, ang = rectifier.simulate(vpk, float(f), c, float(rl)); R['v4'].append([vpk, f, c, rl, vmax, vmin, vmax - vmin, vmax/(f*rl*c), ipk, ang])
print(json.dumps(R))
EOF`));
  // ---- v1 ----
  await p.locator('#v1').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  for (const [ea, ed, V, vb, w, xp, xn, em, cja] of py.v1) {
    await setr('#v1-na', ea); await setr('#v1-nd', ed); await setr('#v1-v', V); const f = kv(await out('#v1-out'));
    const ok = near(num(f.Na), Math.pow(10, ea), 1e-2) && near(num(f.Nd), Math.pow(10, ed), 1e-2) && near(num(f.V), V, 1e-9, 1e-9) && near(num(f.Vbi), vb, 1e-3, 1e-4) && near(num(f.W), w * 1e4, 1e-3, 1e-4) && near(num(f.xp), xp * 1e4, 2e-3, 1e-4) && near(num(f.xn), xn * 1e4, 1e-3, 1e-4) && near(num(f.Emax.split(' ')[0]), em, 1e-3) && near(num(f['Cj/A'].split(' ')[0]), cja * 1e9, 1e-3, 0.006);
    assert(ok, 'v1: Na=1e' + ea + ' Nd=1e' + ed + ' V=' + V + ' sama dengan Python' + (ok ? '' : ' :: ' + JSON.stringify(f) + ' vs ' + JSON.stringify([vb, w, xp, xn, em, cja])));
  }
  await setr('#v1-na', 17); await setr('#v1-nd', 16); await setr('#v1-v', 0);
  const f1 = kv(await out('#v1-out')); assert(f1.Vbi === '0,7993 V' && f1.W === '0,3372 µm' && f1.xp === '0,0307 µm' && f1.xn === '0,3065 µm', 'v1: 1e17/1e16 pada 0 V: Vbi 0,7993; W 0,3372 µm');
  assert(await p.locator('#v1-fig svg line.ef').count() === 1 && await p.locator('#v1-fig svg line.efp').count() === 0, 'v1: kesetimbangan: satu garis EF');
  await setr('#v1-v', -5); const f1b = kv(await out('#v1-out')); assert(f1b.W === '0,9083 µm' && f1b.xn === '0,8257 µm' && f1b.xp === '0,0826 µm' && f1b['Cj/A'] === '11,41 nF/cm²', 'v1: −5 V: W 0,9083; xn 0,8257; xp 0,0826; 11,41 nF/cm²');
  assert(await p.locator('#v1-fig svg line.efp').count() === 1 && await p.locator('#v1-fig svg line.efn').count() === 1, 'v1: bias: quasi-Fermi level elektron dan hole terpisah');
  await (await p.$('#v1')).screenshot({ path: 'shots/m05b-v1.png' });
  // ---- v2 ----
  await p.locator('#v2').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  for (const [T, n, rs, V, is_, I, rd, v1m, slope] of py.v2) {
    await setr('#v2-t', T); await setr('#v2-n', n); await setr('#v2-rs', rs); await setr('#v2-v', V); const f = kv(await out('#v2-out'));
    const ok = near(num(f.T), T, 1e-9) && near(num(f.Is.split(' ')[0]), is_, 1e-3) && near(num(f.I.split(' ')[0]), I, 2e-3) && near(num(f.rd.split(' ')[0]), rd, 2e-3, 0.006) && near(num(f.V1mA.split(' ')[0]), v1m, 1e-3, 1e-4) && near(num(f.lereng.split(' ')[0]), slope, 1e-3, 0.06);
    assert(ok, 'v2: T=' + T + ' n=' + n + ' Rs=' + rs + ' V=' + V + ' sama dengan Python' + (ok ? '' : ' :: ' + JSON.stringify(f) + ' vs ' + JSON.stringify([is_, I, rd, v1m, slope])));
  }
  await setr('#v2-t', 300); await setr('#v2-n', 1); await setr('#v2-rs', 0); await setr('#v2-v', 0.65); const f2 = kv(await out('#v2-out'));
  assert(f2.Is === '1,2056e-16 A' && f2.V1mA === '0,7690 V' && f2.lereng === '59,5 mV/dek', 'v2: 300 K: Is 1,2056e-16 A; V(1 mA) 0,7690 V; 59,5 mV/dek');
  await setr('#v2-t', 350); assert(kv(await out('#v2-out')).V1mA === '0,6802 V', 'v2: 350 K: V(1 mA) = 0,6802 V');
  await setr('#v2-t', 300); await setr('#v2-rs', 10); await setr('#v2-v', 0.9); assert(num(kv(await out('#v2-out')).V1mA) > 0.77 && num(kv(await out('#v2-out')).V1mA) < 0.7691 + 0.0101, 'v2: Rs 10 Ω menambah 10 mV pada 1 mA');
  await p.selectOption('#v2-s', 'lin'); await p.waitForTimeout(100);
  assert(await p.evaluate(() => { const c = document.querySelector('#v2-plot canvas'); return c && c.width > 0 && /I\(V\)/.test(document.querySelector('#v2-plot .legend').textContent); }), 'v2: plot tergambar (log dan linear)');
  await p.selectOption('#v2-s', 'log'); await setr('#v2-rs', 0); await setr('#v2-v', 0.65); await (await p.$('#v2')).screenshot({ path: 'shots/m05b-v2.png' });
  // ---- v3 ----
  await p.locator('#v3').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  for (const [ea, ed, A, V, vb, w, cv, c0, neff, nex, vex] of py.v3) {
    await setr('#v3-na', ea); await setr('#v3-nd', ed); await p.selectOption('#v3-a', String(A).replace('0.0001', '1e-4').replace('0.001', '1e-3').replace('0.00001', '1e-5').replace('0.000001', '1e-6')); await setr('#v3-v', V); const f = kv(await out('#v3-out'));
    const ok = near(num(f.Vbi), vb, 1e-3, 1e-4) && near(num(f.W), w * 1e4, 1e-3, 1e-4) && near(num(f.C.split(' ')[0]), cv * 1e12, 1e-3, 0.0006) && near(num(f.C0.split(' ')[0]), c0 * 1e12, 1e-3, 0.0006) && near(num(f.Neff.split(' ')[0]), neff, 1e-3) && near(num(f['N_ekstraksi'].split(' ')[0]), nex, 1e-3) && near(num(f['Vbi_ekstraksi']), vex, 1e-3, 1e-4);
    assert(ok, 'v3: Na=1e' + ea + ' Nd=1e' + ed + ' A=' + A + ' V=' + V + ' sama dengan Python' + (ok ? '' : ' :: ' + JSON.stringify(f) + ' vs ' + JSON.stringify([vb, w, cv, c0, neff, nex, vex])));
  }
  await setr('#v3-na', 18); await setr('#v3-nd', 16); await p.selectOption('#v3-a', '1e-4'); await setr('#v3-v', -8); const f3 = kv(await out('#v3-out'));
  assert(f3.C === '0,963 pF' && f3.C0 === '3,093 pF' && f3['N_ekstraksi'] === '9,9010e+15 cm⁻³' && f3['Vbi_ekstraksi'] === '0,8588 V', 'v3: 1e18/1e16, 1e-4 cm²: C(−8 V) 0,963 pF; C0 3,093 pF; Neff 9,901e15; Vbi 0,8588');
  await p.selectOption('#v3-m', 'ic'); await p.waitForTimeout(100);
  assert(await p.evaluate(() => { const c = document.querySelector('#v3-plot canvas'); return c && c.width > 0 && /1\/Cj/.test(document.querySelector('#v3-plot .legend').textContent); }), 'v3: plot 1/C² tergambar');
  await p.selectOption('#v3-m', 'c'); await setr('#v3-v', -2); await (await p.$('#v3')).screenshot({ path: 'shots/m05b-v3.png' });
  // ---- v4 ----
  await p.locator('#v4').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  for (const [vpk, fr, c, rl, vmax, vmin, rip, rf, ipk, ang] of py.v4) {
    await setr('#v4-vpk', vpk); await p.selectOption('#v4-f', String(fr)); await p.selectOption('#v4-c', String(c).replace('0.0001', '1e-4').replace('0.00047', '4.7e-4').replace('0.001', '1e-3').replace('0.0033', '3.3e-3')); await p.selectOption('#v4-rl', String(rl)); const f = kv(await out('#v4-out'));
    const ok = near(num(f.Vmax.split(' ')[0]), vmax, 1e-3, 6e-4) && near(num(f.Vmin.split(' ')[0]), vmin, 1e-3, 6e-4) && near(num(f.riak.split(' ')[0]), rip, 1e-3, 1.1e-3) && near(num(f.riak_rumus.split(' ')[0]), rf, 2e-3, 1.1e-3) && near(num(f.Ipk.split(' ')[0]), ipk, 2e-3, 6e-4) && Math.abs(num(f.sudut) - ang) <= 0.51;
    assert(ok, 'v4: Vpk=' + vpk + ' f=' + fr + ' C=' + c + ' RL=' + rl + ' sama dengan Python' + (ok ? '' : ' :: ' + JSON.stringify(f) + ' vs ' + JSON.stringify([vmax, vmin, rip, rf, ipk, ang])));
  }
  await setr('#v4-vpk', 5); await p.selectOption('#v4-f', '50'); await p.selectOption('#v4-c', '1e-4'); await p.selectOption('#v4-rl', '1000'); const f4 = kv(await out('#v4-out'));
  assert(f4.riak === '0,700 V' && f4.Ipk === '0,073 A' && f4.sudut === '48°' && f4.riak_rumus === '0,859 V', 'v4: 5 V, 50 Hz, 100 µF, 1 kΩ: riak 0,700 V (rumus 0,859), Ipk 0,073 A, 48°');
  await p.selectOption('#v4-c', '1e-3'); const f4b = kv(await out('#v4-out')); assert(f4b.riak === '0,078 V' && f4b.Ipk === '0,137 A' && f4b.sudut === '32°', 'v4: 1000 µF: riak 0,078 V, Ipk 0,137 A, 32°');
  assert(await p.evaluate(() => { const c = document.querySelector('#v4-plot canvas'); return c && c.width > 0 && /Vin/.test(document.querySelector('#v4-plot .legend').textContent); }), 'v4: plot tergambar');
  await p.selectOption('#v4-c', '1e-4'); await (await p.$('#v4')).screenshot({ path: 'shots/m05b-v4.png' });
  // kuis dan kartu
  const qz = await p.evaluate(() => { let n = 0, bad = []; return new Promise(res => { function go() { const q = document.querySelector('#kuis .q'); if (!q) return res({ n, bad });
      const bs = [...document.querySelectorAll('#kuis .icd-opt')]; bs[0].click(); const whys = document.querySelectorAll('#kuis .why'); const right = document.querySelectorAll('#kuis .icd-opt.right').length;
      if (whys.length !== bs.length || bs.length !== 4 || right !== 1 || [...whys].some(w => w.textContent.trim().length < 25)) bad.push(n + 1); n++; const nb = document.querySelector('#kuis .icd-btn.primary'); nb.click(); setTimeout(go, 10); } go(); }); });
  assert(qz.n === 14 && qz.bad.length === 0, 'kuis: 14 soal sah ' + JSON.stringify(qz.bad));
  const kc = await p.evaluate(() => ICD.cards.count('m05b-pn-junction-dioda')); assert(kc === 17, 'flashcard 17: ' + kc);
  assert(errs.length === 0, 'tanpa error konsol ' + errs.join('|'));
  const mo = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true })).newPage();
  await mo.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); await mo.waitForTimeout(500);
  for (const v of ['v1', 'v2', 'v3', 'v4']) await (await mo.$('#' + v)).screenshot({ path: 'shots/m05b-m-' + v + '.png' });
  const ov = await mo.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert(ov <= 1, 'tanpa scroll horizontal pada 360 px (' + ov + ')');
  await b.close();
})().catch(e => { console.error('CRASH', e.message.split('\n')[0]); process.exit(1); });
