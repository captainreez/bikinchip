const { chromium } = require(process.env.PLAYWRIGHT || 'playwright'); const fs = require('fs');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const F = 'm01a-matematika-dasar';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); await p.waitForTimeout(300);
  const set = async (id, v) => { await p.fill(id, String(v)); await p.dispatchEvent(id, 'input'); };
  const s = await p.evaluate(() => { const txt = pre => [...pre.querySelectorAll('code')].map(c => { const k = c.cloneNode(true); k.querySelectorAll('.ln').forEach(x => x.remove()); return k.textContent; }).join('');
    return { secs: document.querySelectorAll('section.icd-sec').length, viz: document.querySelectorAll('.icd-viz').length, guides: document.querySelectorAll('.icd-guide').length, rawTerms: document.querySelectorAll('span[data-term]').length,
    layers: document.querySelectorAll('.icd-layers').length, math: document.querySelectorAll('math').length, nav: [...document.querySelectorAll('.icd-nav a')].map(a => a.getAttribute('href')),
    links: [...document.querySelectorAll('main a[href*=".html"]')].map(a => a.getAttribute('href').split('#')[0]).filter(h => h !== 'index.html' && !ICD.reg.file(h.replace('.html', ''))),
    code: txt(document.querySelector('#s08 pre')), ext: txt([...document.querySelectorAll('#s14 details pre')].pop()), out: txt(document.querySelectorAll('#s14 pre')[2]) }; });
  console.log(JSON.stringify({ ...s, code: undefined, ext: undefined, out: undefined }));
  assert(s.secs === 16 && s.viz === 4 && s.guides === 4 && s.layers === 4, '16 bagian, 4 visualisasi, 4 eksperimen, 4 konsep berlapis'); assert(s.rawTerms === 0 && s.links.length === 0, 'istilah dan tautan sah ' + s.links);
  assert(s.code.trim() === fs.readFileSync('lab/m01a/eng.py', 'utf8').trim(), 'kode eng.py di halaman identik dengan yang dijalankan');
  fs.writeFileSync('/tmp/ext.py', fs.readFileSync('lab/m01a/eng.py', 'utf8').split('if __name__')[0] + s.ext + '\nprint("ekstensi lulus")\n'); fs.writeFileSync('/tmp/out_page.txt', s.out.trim() + '\n');
  // v1
  await p.fill('#v1-in', '0.000000047'); await p.dispatchEvent('#v1-in', 'input'); let t = await p.textContent('#v1-tab'); assert(t.includes('47 nF') && t.includes('4.7 × 10⁻⁸') && t.includes('0.000 000 047'), 'v1: 4.7e-8 F = 47 nF | ' + t);
  await p.fill('#v1-in', '3.2e9'); await p.dispatchEvent('#v1-in', 'input'); await p.selectOption('#v1-u', 'Hz'); t = await p.textContent('#v1-tab'); assert(t.includes('3.2 GHz') && t.includes('3 200 000 000'), 'v1: 3.2 GHz | ' + t);
  await p.fill('#v1-in', '999.96'); await p.dispatchEvent('#v1-in', 'input'); t = await p.textContent('#v1-tab'); assert(t.includes('1 kHz'), 'v1: pembulatan 999.96 → 1 kHz | ' + t);
  await p.fill('#v1-in', '4.7'); await p.dispatchEvent('#v1-in', 'input'); t = await p.textContent('#v1-tab'); assert(t.includes('Desimal biasa4.7 Hz'), 'v1: 4.7 tetap 4.7');
  await set('#v1-e', -12); console.log('     ', await p.textContent('#v1-out')); await p.fill('#v1-in', '4.7e-8'); await p.dispatchEvent('#v1-in', 'input'); await p.selectOption('#v1-u', 'F');
  await (await p.$('#v1')).screenshot({ path: 'shots/m01a-v1.png' });
  // v2
  await set('#v2-a', 0.3); await set('#v2-b', 0.6); t = await p.textContent('#v2-out'); console.log('     ', t); assert(/a·b = 7\.9|a·b = 8/.test(t), 'v2: 2 × 4 ≈ 8');
  await p.selectOption('#v2-base', '2'); t = await p.textContent('#v2-out'); assert(t.includes('log_2(a) = 0.99') || t.includes('log_2(a) = 1.0'), 'v2: basis 2 | ' + t); await (await p.$('#v2')).screenshot({ path: 'shots/m01a-v2.png' });
  // v3
  t = await p.textContent('#v3-out'); console.log('     ', t); assert(t.includes('= 20 dB') && t.includes('keluaran = 10 mV'), 'v3: 20 − 6 + 6 = 20 dB, keluaran 10 mV');
  await set('#v3-g1', 40); await set('#v3-g2', 20); await set('#v3-g3', 6); t = await p.textContent('#v3-out'); assert(t.includes('terpotong'), 'v3: peringatan di atas 1 V'); await (await p.$('#v3')).screenshot({ path: 'shots/m01a-v3.png' });
  // v4
  t = await p.textContent('#v4-out'); assert(t.includes('θ = 0°') && t.includes('v = 0.000'), 'v4: awal θ = 0');
  await set('#v4-p', 90); t = await p.textContent('#v4-out'); assert(t.includes('v = 0.800') && t.includes('geseran waktu = -0.500'), 'v4: fase +90° mulai dari puncak, 0.5 s lebih awal | ' + t);
  for (let i = 0; i < 15; i++) await p.click('#v4 button:has-text("Maju")'); t = await p.textContent('#v4-out'); assert(t.includes('t = 0.50') && t.includes('θ = 180°'), 'v4: maju 15 bingkai = 0.5 s = 90° tambahan | ' + t);
  await p.click('#v4 button:has-text("Mundur")'); assert((await p.textContent('#v4-out')).includes('t = 0.47'), 'v4: mundur');
  await p.click('#v4 button:has-text("Putar")'); await p.waitForTimeout(1200); await p.click('#v4 button:has-text("Jeda")'); const tt = parseFloat(/t = ([\d.]+)/.exec(await p.textContent('#v4-out'))[1]); assert(tt > 1.2 && tt < 2.1, 'v4: putar ~1.2 s nyata → t = ' + tt);
  await (await p.$('#v4')).screenshot({ path: 'shots/m01a-v4.png' });
  const qz = await p.evaluate(() => { let n = 0, bad = []; return new Promise(res => { function go() { const q = document.querySelector('#kuis .q'); if (!q) return res({ n, bad });
      const bs = [...document.querySelectorAll('#kuis .icd-opt')]; bs[0].click(); const whys = document.querySelectorAll('#kuis .why'); const right = document.querySelectorAll('#kuis .icd-opt.right').length; if (whys.length !== bs.length || bs.length !== 4 || right !== 1 || [...whys].some(w => w.textContent.length < 25)) bad.push(q.textContent.slice(0, 30)); n++; document.querySelector('#kuis .icd-btn.primary').click(); setTimeout(go, 5); } go(); }); });
  assert(qz.n === 14 && qz.bad.length === 0, 'kuis: 14 soal sah ' + JSON.stringify(qz.bad));
  assert(await p.evaluate(() => ICD.cards.count('m01a-matematika-dasar')) === 18, '18 flashcard'); assert(errs.length === 0, 'tanpa error konsol ' + errs.join('|'));
  const m = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true })).newPage();
  await m.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); await (await m.$('#v3')).screenshot({ path: 'shots/m01a-m-v3.png' });
  await b.close();
})().catch(e => { console.error('CRASH', e.message.split('\n')[0]); process.exit(1); });
