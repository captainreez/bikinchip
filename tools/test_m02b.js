const { chromium } = require(process.env.PLAYWRIGHT || 'playwright'); const fs = require('fs');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const F = 'm02b-transien-ac';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); await p.waitForTimeout(300);
  const set = async (id, v) => { await p.fill(id, String(v)); await p.dispatchEvent(id, 'input'); };
  const s = await p.evaluate(() => { const txt = pre => [...pre.querySelectorAll('code')].map(c => { const k = c.cloneNode(true); k.querySelectorAll('.ln').forEach(x => x.remove()); return k.textContent; }).join('');
    return { secs: document.querySelectorAll('section.icd-sec').length, viz: document.querySelectorAll('.icd-viz').length, guides: document.querySelectorAll('.icd-guide').length, rawTerms: [...document.querySelectorAll('span[data-term]')].map(x => x.dataset.term),
    layers: document.querySelectorAll('.icd-layers').length, nav: [...document.querySelectorAll('.icd-nav a')].map(a => a.getAttribute('href')),
    links: [...document.querySelectorAll('main a[href*=".html"]')].map(a => a.getAttribute('href').split('#')[0]).filter(h => !/^(index|kurikulum|belajar|glosarium|tools|referensi|pengaturan|tentang|privasi|masuk|styleguide)\.html$/.test(h) && !ICD.reg.file(h.replace('.html', ''))),
    code: [...document.querySelectorAll('#s08 pre')].map(txt), lab: [...document.querySelectorAll('#s14 pre')].map(txt) }; });
  console.log(JSON.stringify({ secs: s.secs, viz: s.viz, guides: s.guides, layers: s.layers, nav: s.nav, labn: s.lab.length }));
  assert(s.secs === 16 && s.viz === 4 && s.guides === 4 && s.layers === 4, '16 bagian, 4 visualisasi, 4 eksperimen, 4 konsep berlapis'); assert(s.rawTerms.length === 0 && s.links.length === 0, 'istilah dan tautan sah ' + s.rawTerms + s.links);
  assert(s.code[0].trim() === fs.readFileSync('lab/m02b/tran_ac.py', 'utf8').trim() && s.code[1].trim() === fs.readFileSync('lab/m02b/rc_rlc.cir', 'utf8').trim(), 'tran_ac.py dan rc_rlc.cir identik');
  assert(s.lab.some(x => x.trim() === fs.readFileSync('lab/m02b/daya.py', 'utf8').trim()), 'daya.py identik');
  // v1
  await p.locator('#v1').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  for (let i = 0; i < 50; i++) await p.click('#v1 button:has-text("Maju")');
  let t = await p.textContent('#v1-out'); console.log('     ', t); const m1 = t.match(/pengisian pertama = .*?, ([\d.]+)%\)/); assert(m1 && +m1[1] > 99.9 && +m1[1] <= 100, 'v1: panas pengisian pertama ≈ ½CV² (' + (m1 && m1[1]) + '%)');
  await (await p.$('#v1')).screenshot({ path: 'shots/m02b-v1.png' });
  await set('#v1-r', 0); await set('#v1-t', 100); for (let i = 0; i < 50; i++) await p.click('#v1 button:has-text("Maju")'); t = await p.textContent('#v1-out'); const m2 = t.match(/pengisian pertama = .*?, ([\d.]+)%\)/); assert(m2 && +m2[1] > 99.9, 'v1: R = 100 Ω juga ½CV² ' + (m2 && m2[1]));
  await set('#v1-r', 100); await set('#v1-c', 0); await set('#v1-t', 100); for (let i = 0; i < 50; i++) await p.click('#v1 button:has-text("Maju")'); t = await p.textContent('#v1-out'); const m3 = t.match(/pengisian pertama = .*?, ([\d.]+)%\)/); console.log('     ', t.slice(0, 120)); assert(m3 && +m3[1] > 99.9, 'v1: R = 10 kΩ juga ½CV² ' + (m3 && m3[1]));
  for (let i = 0; i < 360; i++) await p.click('#v1 button:has-text("Maju")'); t = await p.textContent('#v1-out'); console.log('     ', t.slice(-120)); assert(t.includes('selisih 0.000%'), 'v1: neraca energi tutup');
  // v2
  t = await p.textContent('#v2-out'); console.log('     ', t); assert(t.startsWith('KURANG TEREDAM') && t.includes('f₀ = 15.9 MHz'), 'v2: default berayun, f0 15.9 MHz');
  const mo2 = t.match(/rumus = ([\d.]+)%, terukur = ([\d.]+)%/); assert(mo2 && Math.abs(+mo2[1] - +mo2[2]) < 0.5, 'v2: overshoot terukur = rumus');
  await (await p.$('#v2')).screenshot({ path: 'shots/m02b-v2.png' });
  await set('#v2-r', 77); t = await p.textContent('#v2-out'); console.log('     ', t.slice(0, 80)); assert(t.startsWith('TEREDAM KRITIS') && t.includes('R kritis = 200 mΩ'), 'v2: 0.2 Ω kritis');
  await set('#v2-r', 67); assert((await p.textContent('#v2-out')).includes('ζ = 0.5'), 'v2: 0.1 Ω → ζ 0.5');
  await set('#v2-r', 100); assert((await p.textContent('#v2-out')).startsWith('LEWAT TEREDAM'), 'v2: 1 Ω lewat teredam');
  // v3
  await set('#v3-f', 44.04); t = await p.textContent('#v3-out'); console.log('     ', t); assert(/\|H\| = 0\.707\d/.test(t) && t.includes('fase = −44.9') , 'v3: di fc 0.707, −45°');
  await (await p.$('#v3')).screenshot({ path: 'shots/m02b-v3.png' });
  await set('#v3-f', 64.04); t = await p.textContent('#v3-out'); console.log('     ', t.slice(0, 60)); assert(t.includes('−20.0'), 'v3: dekade di atas fc → −20 dB');
  await p.selectOption('#v3-k', 'hp'); await set('#v3-f', 44.04); t = await p.textContent('#v3-out'); assert(t.includes('fase = 45.0'), 'v3: high-pass +45°');
  await p.selectOption('#v3-k', 'bp'); await set('#v3-r', 17); await set('#v3-f', 74.04); t = await p.textContent('#v3-out'); console.log('     ', t); assert(/\|H\| = 0\.99\d|\|H\| = 1/.test(t), 'v3: RLC pada f0 → |H| ≈ 1');
  // v4
  await p.locator('#v4').scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await p.selectOption('#v4 .icd-simctl select', '4'); await p.click('#v4 button:has-text("Putar")');
  await p.waitForFunction(() => document.querySelector('#v4-out').textContent.includes('t50 terukur = ') && !document.querySelector('#v4-out').textContent.includes('belum') , null, { timeout: 30000 }); await p.waitForTimeout(500);
  t = await p.textContent('#v4-out'); console.log('     ', t); const a2 = +t.match(/t50 terukur = ([\d.]+) ps/)[1];
  await (await p.$('#v4')).screenshot({ path: 'shots/m02b-v4.png' });
  await set('#v4-l', 4); await p.click('#v4 button:has-text("Putar")'); await p.waitForFunction(() => !document.querySelector('#v4-out').textContent.includes('belum'), null, { timeout: 30000 });
  t = await p.textContent('#v4-out'); const a4 = +t.match(/t50 terukur = ([\d.]+) ps/)[1]; console.log('      2 mm', a2, '4 mm', a4); assert(Math.abs(a4 / a2 - 4) < 0.01, 'v4: 4 mm = 4 × 2 mm');
  await set('#v4-n', 1); await set('#v4-l', 2); await p.click('#v4 button:has-text("Putar")'); await p.waitForFunction(() => !document.querySelector('#v4-out').textContent.includes('belum'), null, { timeout: 30000 });
  t = await p.textContent('#v4-out'); console.log('     ', t.slice(0, 200)); assert(/= 0\.69\d RC/.test(t), 'v4: n = 1 → 0.69 RC');
  const qz = await p.evaluate(() => { let n = 0, bad = []; return new Promise(res => { function go() { const q = document.querySelector('#kuis .q'); if (!q) return res({ n, bad });
      const bs = [...document.querySelectorAll('#kuis .icd-opt')]; bs[0].click(); const whys = document.querySelectorAll('#kuis .why'); const right = document.querySelectorAll('#kuis .icd-opt.right').length; if (whys.length !== bs.length || bs.length !== 4 || right !== 1 || [...whys].some(w => w.textContent.length < 25)) bad.push(q.textContent.slice(0, 30)); n++; document.querySelector('#kuis .icd-btn.primary').click(); setTimeout(go, 5); } go(); }); });
  assert(qz.n === 14 && qz.bad.length === 0, 'kuis: 14 soal sah ' + JSON.stringify(qz.bad));
  assert(await p.evaluate(() => ICD.cards.count('m02b-transien-ac')) === 18, '18 flashcard'); assert(errs.length === 0, 'tanpa error konsol ' + errs.join('|'));
  const mo = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true })).newPage();
  await mo.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); for (const v of ['v1', 'v3', 'v4']) await (await mo.$('#' + v)).screenshot({ path: 'shots/m02b-m-' + v + '.png' });
  await b.close();
})().catch(e => { console.error('CRASH', e.message.split('\n')[0]); process.exit(1); });
