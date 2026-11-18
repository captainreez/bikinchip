const { chromium } = require(process.env.PLAYWRIGHT || 'playwright'); const fs = require('fs');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const F = 'm02a-rangkaian-dc';
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
    code: [...document.querySelectorAll('#s08 pre')].map(txt), lab: [...document.querySelectorAll('#s14 pre')].map(txt) }; });
  console.log(JSON.stringify({ secs: s.secs, viz: s.viz, guides: s.guides, layers: s.layers, nav: s.nav, labn: s.lab.length }));
  assert(s.secs === 16 && s.viz === 4 && s.guides === 4 && s.layers === 4, '16 bagian, 4 visualisasi, 4 eksperimen, 4 konsep berlapis'); assert(s.rawTerms === 0 && s.links.length === 0, 'istilah dan tautan sah ' + s.links);
  assert(s.code[0].trim() === fs.readFileSync('lab/m02a/mna.py', 'utf8').trim() && s.code[1].trim() === fs.readFileSync('lab/m02a/bridge.cir', 'utf8').trim(), 'mna.py dan bridge.cir identik');
  assert(s.lab.some(x => x.trim() === fs.readFileSync('lab/m02a/thevenin.py', 'utf8').trim()), 'thevenin.py identik');
  let t = await p.textContent('#v1-out'); const tab = await p.textContent('#v1-tab'); console.log('     ', t); console.log('     ', tab.replace(/\s+/g, ' ').slice(0, 300));
  assert((await p.textContent('#v1-sch')).includes('V2 = 2.83 V') && (await p.textContent('#v1-sch')).includes('V3 = 2.453 V'), 'v1: jembatan default = 150/53, 130/53');
  assert(tab.includes('754.7 µA') && tab.includes('−3.868 mA') && tab.includes('Jumlah0 W'), 'v1: I(R5), I(VS), neraca daya');
  await set('#v1-r3', 35); t = await p.textContent('#v1-out'); assert(t.includes('SEIMBANG'), 'v1: seimbang di R3 = 500'); const sch = await p.textContent('#v1-sch'); assert(sch.includes('0 A'), 'v1: arus R5 nol');
  await set('#v1-r5', 90); assert((await p.textContent('#v1-out')).includes('SEIMBANG'), 'v1: tetap seimbang saat R5 diubah');
  await set('#v1-r3', 59); await set('#v1-r5', 35); await (await p.$('#v1')).screenshot({ path: 'shots/m02a-v1.png' });
  t = await p.textContent('#v2-out'); console.log('     ', t); assert(t.includes('V_th = 4 V') && t.includes('R_th = R1∥R2 = 2.4 kΩ'), 'v2: 6k/4k → 4 V, 2.4 kΩ');
  await set('#v2-rl', 60); t = await p.textContent('#v2-out'); console.log('     ', t); assert(/efisiensi rangkaian setara = 5\d/.test(t), 'v2: dekat R_th efisiensi ≈ 50%');
  await (await p.$('#v2')).screenshot({ path: 'shots/m02a-v2.png' });
  t = await p.textContent('#v3-out'); console.log('     ', t); assert(t.includes('2.75 mV di sadap 10') && t.includes('= 2.75 mV'), 'v3: 10 sadap → 2.75 mV');
  await set('#v3-n', 40); assert((await p.textContent('#v3-out')).includes('drop terburuk = 41 mV'), 'v3: 40 sadap → 41 mV');
  await p.check('#v3-both'); await p.dispatchEvent('#v3-both', 'input'); t = await p.textContent('#v3-out'); console.log('     ', t); assert(t.includes('drop terburuk = 10.5 mV'), 'v3: dua ujung → 10.5 mV');
  await (await p.$('#v3')).screenshot({ path: 'shots/m02a-v3.png' });
  await p.locator('#v4').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  t = await p.textContent('#v4-out'); console.log('     ', t);
  for (let i = 0; i < 5; i++) await p.click('#v4 button:has-text("Maju")'); t = await p.textContent('#v4-out'); console.log('     ', t); assert(t.startsWith('putaran = 5'), 'v4: 5 putaran');
  await p.click('#v4 button:has-text("Mundur")'); assert((await p.textContent('#v4-out')).startsWith('putaran = 4'), 'v4: mundur');
  await p.selectOption('#v4 .icd-simctl select', '4'); await p.click('#v4 button:has-text("Putar")');
  await p.waitForFunction(() => document.querySelector('#v4-out').textContent.includes('KONVERGEN'), null, { timeout: 60000 }); await p.click('#v4 button:has-text("Jeda")').catch(() => {});
  t = await p.textContent('#v4-out'); console.log('     ', t); const gsIt = +t.match(/putaran = (\d+)/)[1]; assert(t.includes('(5, 5)') || t.includes('(6, 6)') || t.includes('(5, 6)') || t.includes('(6, 5)'), 'v4: terburuk di pusat untuk pad sudut');
  await (await p.$('#v4')).screenshot({ path: 'shots/m02a-v4.png' });
  await p.selectOption('#v4-m', 'sor'); await p.click('#v4 button:has-text("Putar")');
  await p.waitForFunction(() => document.querySelector('#v4-out').textContent.includes('KONVERGEN'), null, { timeout: 60000 }); t = await p.textContent('#v4-out'); const sorIt = +t.match(/putaran = (\d+)/)[1]; console.log('      GS', gsIt, 'SOR', sorIt); assert(sorIt < gsIt / 2, 'v4: SOR jauh lebih cepat');
  const qz = await p.evaluate(() => { let n = 0, bad = []; return new Promise(res => { function go() { const q = document.querySelector('#kuis .q'); if (!q) return res({ n, bad });
      const bs = [...document.querySelectorAll('#kuis .icd-opt')]; bs[0].click(); const whys = document.querySelectorAll('#kuis .why'); const right = document.querySelectorAll('#kuis .icd-opt.right').length; if (whys.length !== bs.length || bs.length !== 4 || right !== 1 || [...whys].some(w => w.textContent.length < 25)) bad.push(q.textContent.slice(0, 30)); n++; document.querySelector('#kuis .icd-btn.primary').click(); setTimeout(go, 5); } go(); }); });
  assert(qz.n === 14 && qz.bad.length === 0, 'kuis: 14 soal sah ' + JSON.stringify(qz.bad));
  assert(await p.evaluate(() => ICD.cards.count('m02a-rangkaian-dc')) === 18, '18 flashcard'); assert(errs.length === 0, 'tanpa error konsol ' + errs.join('|'));
  const mo = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true })).newPage();
  await mo.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); for (const v of ['v1', 'v2', 'v4']) await (await mo.$('#' + v)).screenshot({ path: 'shots/m02a-m-' + v + '.png' });
  await b.close();
})().catch(e => { console.error('CRASH', e.message.split('\n')[0]); process.exit(1); });
