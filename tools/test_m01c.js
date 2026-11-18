const { chromium } = require(process.env.PLAYWRIGHT || 'playwright'); const fs = require('fs');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const F = 'm01c-linear-probabilitas-diskrit';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); await p.waitForTimeout(300);
  const set = async (id, v) => { await p.fill(id, String(v)); await p.dispatchEvent(id, 'input'); };
  const s = await p.evaluate(() => { const txt = pre => [...pre.querySelectorAll('code')].map(c => { const k = c.cloneNode(true); k.querySelectorAll('.ln').forEach(x => x.remove()); return k.textContent; }).join('');
    return { secs: document.querySelectorAll('section.icd-sec').length, viz: document.querySelectorAll('.icd-viz').length, guides: document.querySelectorAll('.icd-guide').length, rawTerms: document.querySelectorAll('span[data-term]').length,
    layers: document.querySelectorAll('.icd-layers').length, math: document.querySelectorAll('math').length, nav: [...document.querySelectorAll('.icd-nav a')].map(a => a.getAttribute('href')),
    links: [...document.querySelectorAll('main a[href*=".html"]')].map(a => a.getAttribute('href').split('#')[0]).filter(h => !/^(index|kurikulum|belajar|glosarium|tools|referensi|pengaturan|tentang|privasi|masuk|styleguide)\.html$/.test(h) && !ICD.reg.file(h.replace('.html', ''))),
    code: txt(document.querySelector('#s08 pre')), lab: [...document.querySelectorAll('#s14 pre')].map(txt),
    tails: [1, 2, 3, 4, 5, 6, 2.5].map(k => M01C.tail(k)) }; });
  console.log(JSON.stringify({ ...s, code: undefined, lab: s.lab.map(x => x.slice(0, 16)) }));
  assert(s.secs === 16 && s.viz === 4 && s.guides === 4 && s.layers === 4, '16 bagian, 4 visualisasi, 4 eksperimen, 4 konsep berlapis'); assert(s.rawTerms === 0 && s.links.length === 0, 'istilah dan tautan sah ' + s.links);
  assert(s.code.trim() === fs.readFileSync('lab/m01c/mc.py', 'utf8').trim(), 'kode mc.py di halaman identik dengan yang dijalankan');
  fs.writeFileSync('/tmp/c_out.txt', s.lab[1].trim() + '\n'); fs.writeFileSync('/tmp/c_int.txt', s.lab[4].trim() + '\n'); fs.writeFileSync('/tmp/c_ext.py', s.lab[5]); fs.writeFileSync('/tmp/c_extout.txt', s.lab[6].trim() + '\n');
  const ref = [0.15865525393145707, 0.02275013194817922, 1.349898031630095e-3, 3.167124183311998e-5, 2.866515718791946e-7, 9.865876450377e-10, 6.209665325776132e-3];
  assert(s.tails.every((v, i) => Math.abs(v / ref[i] - 1) < 1e-6), 'erfc di browser cocok dengan Python sampai 6 sigma (galat relatif < 1e-6)');
  // v1
  for (let i = 0; i < 20; i++) await p.click('#v1 button:has-text("Maju")'); let t = await p.textContent('#v1-out'); console.log('     ', t, '|', await p.textContent('#v1-desc'));
  assert(t.includes('v₁ = 1 V, v₂ = 0.5 V, v₃ = 0.5 V; det = 16'), 'v1: tiga simpul → 1, 0.5, 0.5 V, det 16');
  await (await p.$('#v1')).screenshot({ path: 'shots/m01c-v1.png' });
  await set('#v1-i', 4); t = await p.textContent('#v1-out'); assert(t.includes('v₁ = 2 V'), 'v1: arus dua kali → tegangan dua kali');
  await p.selectOption('#v1-pre', 'swap'); await p.click('#v1 button:has-text("Maju")'); assert((await p.textContent('#v1-desc')).includes('Tukar baris'), 'v1: pertukaran baris'); t = await p.textContent('#v1-out'); assert(t.includes('x = 2, y = 1, z = 3'), 'v1: sistem tukar baris → 2, 1, 3 | ' + t.slice(-60));
  await p.selectOption('#v1-pre', 'sing'); for (let i = 0; i < 6; i++) await p.click('#v1 button:has-text("Maju")'); assert((await p.textContent('#v1-desc')).includes('singular') && (await p.textContent('#v1-out')).includes('singular (det = 0)'), 'v1: sistem singular terdeteksi');
  // v2
  t = await p.textContent('#v2-out'); console.log('     ', t); assert(t.includes('di dalam = 99.730%') && t.includes('rata-rata 2700 sel') , 'v2: ±3σ, 1 juta sel → 2700 di luar');
  await set('#v2-k', 6); t = await p.textContent('#v2-out'); console.log('     ', t.slice(t.indexOf('di luar'))); assert(t.includes('rata-rata 0.00197 sel'), 'v2: 6σ dua sisi → 0.00197 sel dari 1 juta');
  await p.selectOption('#v2-n', '100'); await set('#v2-k', 3); t = await p.textContent('#v2-out'); assert(t.includes('76.31%'), 'v2: 100 sel pada 3σ → yield 76.31%'); await p.selectOption('#v2-n', '1000000'); await (await p.$('#v2')).screenshot({ path: 'shots/m01c-v2.png' });
  // v3
  await p.locator('#v3').scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await p.selectOption('#v3 .icd-simctl select', '4'); await p.click('#v3 button:has-text("Putar")'); await p.waitForFunction(() => document.querySelector('#v3-out').textContent.includes('N = 20000'), null, { timeout: 15000 });
  t = await p.textContent('#v3-out'); console.log('     ', t); assert(t.includes('rata-rata = 320.05 ps') && t.includes('σ = 8.05 ps') && t.includes('melampaui batas: 0.64%'), 'v3: 20 000 sampel identik dengan mc.py (320.05, 8.05, 0.64%)');
  await (await p.$('#v3')).screenshot({ path: 'shots/m01c-v3.png' });
  await p.click('#v3 button:has-text("Mundur")'); assert((await p.textContent('#v3-out')).includes('N = 19800'), 'v3: mundur satu kelompok');
  await set('#v3-n', 64); assert((await p.textContent('#v3-out')).includes('teori 16 = 2·√64'), 'v3: n = 64 → σ teori 16 ps');
  // v4
  for (let i = 0; i < 8; i++) await p.click('#v4 button:has-text("Maju")'); t = await p.textContent('#v4-desc'); console.log('     ', t); assert(t.includes('Critical path: B → G2 → G3 → G5, total 85 ps'), 'v4: critical path awal 85 ps');
  await set('#v4-d1', 40); assert((await p.textContent('#v4-out')).includes('G5 = 85 ps'), 'v4: G1 = 40 ps tidak mengubah 85 ps (slack)');
  await set('#v4-d1', 50); t = await p.textContent('#v4-desc'); assert(t.includes('A → G1 → G3 → G5, total 90 ps'), 'v4: G1 = 50 ps memindahkan critical path | ' + t.slice(-50));
  await set('#v4-d1', 30); await set('#v4-d4', 40); assert((await p.textContent('#v4-desc')).includes('G4 → G5, total 100 ps'), 'v4: G4 = 40 ps → 100 ps lewat G4'); await (await p.$('#v4')).screenshot({ path: 'shots/m01c-v4.png' });
  const qz = await p.evaluate(() => { let n = 0, bad = []; return new Promise(res => { function go() { const q = document.querySelector('#kuis .q'); if (!q) return res({ n, bad });
      const bs = [...document.querySelectorAll('#kuis .icd-opt')]; bs[0].click(); const whys = document.querySelectorAll('#kuis .why'); const right = document.querySelectorAll('#kuis .icd-opt.right').length; if (whys.length !== bs.length || bs.length !== 4 || right !== 1 || [...whys].some(w => w.textContent.length < 25)) bad.push(q.textContent.slice(0, 30)); n++; document.querySelector('#kuis .icd-btn.primary').click(); setTimeout(go, 5); } go(); }); });
  assert(qz.n === 14 && qz.bad.length === 0, 'kuis: 14 soal sah ' + JSON.stringify(qz.bad));
  assert(await p.evaluate(() => ICD.cards.count('m01c-linear-probabilitas-diskrit')) === 19, '19 flashcard'); assert(errs.length === 0, 'tanpa error konsol ' + errs.join('|'));
  const m = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true })).newPage();
  await m.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); await (await m.$('#v1')).screenshot({ path: 'shots/m01c-m-v1.png' });
  await b.close();
})().catch(e => { console.error('CRASH', e.message.split('\n')[0]); process.exit(1); });
