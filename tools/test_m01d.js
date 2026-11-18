const { chromium } = require(process.env.PLAYWRIGHT || 'playwright'); const fs = require('fs');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const F = 'm01d-transformasi-sinyal';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); await p.waitForTimeout(300);
  const set = async (id, v) => { await p.fill(id, String(v)); await p.dispatchEvent(id, 'input'); };
  const s = await p.evaluate(() => { const txt = pre => [...pre.querySelectorAll('code')].map(c => { const k = c.cloneNode(true); k.querySelectorAll('.ln').forEach(x => x.remove()); return k.textContent; }).join('');
    return { secs: document.querySelectorAll('section.icd-sec').length, viz: document.querySelectorAll('.icd-viz').length, guides: document.querySelectorAll('.icd-guide').length, rawTerms: document.querySelectorAll('span[data-term]').length,
    layers: document.querySelectorAll('.icd-layers').length, nav: [...document.querySelectorAll('.icd-nav a')].map(a => a.getAttribute('href')),
    links: [...document.querySelectorAll('main a[href*=".html"]')].map(a => a.getAttribute('href').split('#')[0]).filter(h => h !== 'index.html' && !ICD.reg.file(h.replace('.html', ''))),
    code: txt(document.querySelector('#s08 pre')), lab: [...document.querySelectorAll('#s14 pre')].map(txt) }; });
  console.log(JSON.stringify({ secs: s.secs, viz: s.viz, guides: s.guides, layers: s.layers, nav: s.nav, labn: s.lab.length }));
  assert(s.secs === 16 && s.viz === 4 && s.guides === 4 && s.layers === 4, '16 bagian, 4 visualisasi, 4 eksperimen, 4 konsep berlapis'); assert(s.rawTerms === 0 && s.links.length === 0, 'istilah dan tautan sah ' + s.links);
  assert(s.code.trim() === fs.readFileSync('lab/m01d/sig.py', 'utf8').trim(), 'kode sig.py identik dengan yang dijalankan');
  fs.writeFileSync('/tmp/d_out.txt', s.lab[1].trim() + '\n'); fs.writeFileSync('/tmp/d_ext.py', s.lab[5]); fs.writeFileSync('/tmp/d_extout.txt', s.lab[6].trim() + '\n');
  // v1
  let t = await p.textContent('#v1-out'); console.log('     ', t); assert(t.includes('daya tertangkap = 93.31%'), 'v1: kotak N=5 → 93.31% daya');
  await set('#v1-n', 49); t = await p.textContent('#v1-out'); console.log('     ', t); assert(/puncak = 1\.1[78]/.test(t), 'v1: Gibbs ≈ 1.18');
  await set('#v1-n', 1); assert((await p.textContent('#v1-out')).includes('81.06%'), 'v1: N=1 → 81.06%');
  await p.selectOption('#v1-w', 'tri'); await set('#v1-n', 5); t = await p.textContent('#v1-out'); console.log('     ', t);
  await p.selectOption('#v1-w', 'sq'); await set('#v1-n', 7); await (await p.$('#v1')).screenshot({ path: 'shots/m01d-v1.png' });
  // v2
  t = await p.textContent('#v2-out'); console.log('     ', t); assert(t.includes('= 30 MHz'), 'v2: 70 MHz @100 → 30');
  await set('#v2-f', 130); assert((await p.textContent('#v2-out')).includes('= 30 MHz'), 'v2: 130 → 30');
  await set('#v2-f', 170); assert((await p.textContent('#v2-out')).includes('= 30 MHz'), 'v2: 170 → 30');
  await set('#v2-f', 40); assert((await p.textContent('#v2-out')).includes('tidak ada aliasing'), 'v2: 40 MHz tanpa alias');
  await set('#v2-f', 50); console.log('     ', (await p.textContent('#v2-out')).slice(0, 140));
  await set('#v2-f', 70); await (await p.$('#v2')).screenshot({ path: 'shots/m01d-v2.png' });
  // v3
  t = await p.textContent('#v3-out'); console.log('     ', t); assert(t.startsWith('STABIL'), 'v3: awal stabil');
  await set('#v3-r', -1); await set('#v3-i', 2); t = await p.textContent('#v3-out'); console.log('     ', t); assert(t.includes('ω₀ = 2.24') && t.includes('ζ = 0.447') && t.includes('puncak respons = 1.208'), 'v3: −1±2j → ω0 2.24, ζ 0.447, puncak 1.208 (overshoot 20.8%)');
  await set('#v3-r', 0); assert((await p.textContent('#v3-out')).startsWith('BATAS'), 'v3: σ=0 osilator');
  await set('#v3-r', 0.2); assert((await p.textContent('#v3-out')).startsWith('TIDAK STABIL'), 'v3: σ>0 tidak stabil');
  await set('#v3-r', -1); await p.check('#v3-zon'); await p.dispatchEvent('#v3-zon', 'input'); await set('#v3-z', 2); t = await p.textContent('#v3-out'); console.log('     ', t); assert(t.includes('mula-mula turun'), 'v3: nol setengah kanan → undershoot');
  await (await p.$('#v3')).screenshot({ path: 'shots/m01d-v3.png' });
  // v4
  await p.locator('#v4').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  for (let i = 0; i < 10; i++) await p.click('#v4 button:has-text("Maju")'); t = await p.textContent('#v4-out'); console.log('     ', t); assert(t.startsWith('y[9] = ('), 'v4: maju 10 kali → y[9]');
  await p.click('#v4 button:has-text("Mundur")'); assert((await p.textContent('#v4-out')).startsWith('y[8]'), 'v4: mundur');
  for (let i = 0; i < 45; i++) await p.click('#v4 button:has-text("Maju")'); t = await p.textContent('#v4-out'); console.log('     ', t); assert(t.includes('σ noise terukur') && t.includes('mengecil 2 kali'), 'v4: noise diukur, teori 2 kali');
  const m = t.match(/masukan ([\d.]+), keluaran ([\d.]+)/); assert(m && +m[1] / +m[2] > 1.4 && +m[1] / +m[2] < 3, 'v4: rasio terukur wajar ' + (m && (+m[1] / +m[2]).toFixed(2)));
  assert(t.includes('|H| di f_s/32 = 0.976, di f_s/4 = 0 '), 'v4: |H| MA4 di fs/32 0.976, fs/4 = 0');
  await (await p.$('#v4')).screenshot({ path: 'shots/m01d-v4.png' });
  await p.selectOption('#v4-t', 'iir'); await set('#v4-p', 12); t = await p.textContent('#v4-out'); console.log('     ', t.slice(0, 200)); assert(t.includes('kutub di z = 0.923'), 'v4: IIR α=0.923');
  await p.selectOption('#v4-x', 'imp'); await p.click('#v4 button:has-text("Reset")').catch(() => {}); 
  const qz = await p.evaluate(() => { let n = 0, bad = []; return new Promise(res => { function go() { const q = document.querySelector('#kuis .q'); if (!q) return res({ n, bad });
      const bs = [...document.querySelectorAll('#kuis .icd-opt')]; bs[0].click(); const whys = document.querySelectorAll('#kuis .why'); const right = document.querySelectorAll('#kuis .icd-opt.right').length; if (whys.length !== bs.length || bs.length !== 4 || right !== 1 || [...whys].some(w => w.textContent.length < 25)) bad.push(q.textContent.slice(0, 30)); n++; document.querySelector('#kuis .icd-btn.primary').click(); setTimeout(go, 5); } go(); }); });
  assert(qz.n === 14 && qz.bad.length === 0, 'kuis: 14 soal sah ' + JSON.stringify(qz.bad));
  assert(await p.evaluate(() => ICD.cards.count('m01d-transformasi-sinyal')) === 19, '19 flashcard'); assert(errs.length === 0, 'tanpa error konsol ' + errs.join('|'));
  const mo = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true })).newPage();
  await mo.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); for (const v of ['v1', 'v3', 'v4']) await (await mo.$('#' + v)).screenshot({ path: 'shots/m01d-m-' + v + '.png' });
  await b.close();
})().catch(e => { console.error('CRASH', e.message.split('\n')[0]); process.exit(1); });
