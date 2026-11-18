const { chromium } = require(process.env.PLAYWRIGHT || 'playwright'); const fs = require('fs');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const F = 'm01b-kompleks-kalkulus';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); await p.waitForTimeout(300);
  const set = async (id, v) => { await p.fill(id, String(v)); await p.dispatchEvent(id, 'input'); };
  const s = await p.evaluate(() => { const txt = pre => [...pre.querySelectorAll('code')].map(c => { const k = c.cloneNode(true); k.querySelectorAll('.ln').forEach(x => x.remove()); return k.textContent; }).join('');
    const lab = [...document.querySelectorAll('#s14 pre')].map(txt);
    return { secs: document.querySelectorAll('section.icd-sec').length, viz: document.querySelectorAll('.icd-viz').length, guides: document.querySelectorAll('.icd-guide').length, rawTerms: document.querySelectorAll('span[data-term]').length,
    layers: document.querySelectorAll('.icd-layers').length, math: document.querySelectorAll('math').length, nav: [...document.querySelectorAll('.icd-nav a')].map(a => a.getAttribute('href')),
    links: [...document.querySelectorAll('main a[href*=".html"]')].map(a => a.getAttribute('href').split('#')[0]).filter(h => h !== 'index.html' && !ICD.reg.file(h.replace('.html', ''))),
    code: txt(document.querySelector('#s08 pre')), lab }; });
  console.log(JSON.stringify({ ...s, code: undefined, lab: s.lab.map(x => x.slice(0, 18)) }));
  assert(s.secs === 16 && s.viz === 4 && s.guides === 4 && s.layers === 4, '16 bagian, 4 visualisasi, 4 eksperimen, 4 konsep berlapis'); assert(s.rawTerms === 0 && s.links.length === 0, 'istilah dan tautan sah ' + s.links);
  assert(s.code.trim() === fs.readFileSync('lab/m01b/ode.py', 'utf8').trim(), 'kode ode.py di halaman identik dengan yang dijalankan');
  fs.writeFileSync('/tmp/b_out.txt', s.lab[1].trim() + '\n'); fs.writeFileSync('/tmp/b_int.txt', s.lab[4].trim() + '\n'); fs.writeFileSync('/tmp/b_ext.py', s.lab[5]);
  // v1
  let t = await p.textContent('#v1-out'); console.log('     ', t); assert(t.includes('hasil = ') && t.includes('2∠75°'), 'v1: 1.6∠30 × 1.25∠45 = 2∠75');
  await p.selectOption('#v1-op', 'j'); await set('#v1-t1', 30); t = await p.textContent('#v1-out'); assert(t.includes('1.6∠120°'), 'v1: kali j memutar 90° | ' + t.slice(-60));
  await p.selectOption('#v1-op', 'div'); await set('#v1-t1', -150); await set('#v1-t2', 90); t = await p.textContent('#v1-out'); assert(t.includes('1.28∠120°') && t.includes('setara'), 'v1: bagi dengan pembungkusan sudut | ' + t.slice(-90));
  await p.selectOption('#v1-op', 'add'); await set('#v1-t1', 30); await set('#v1-t2', 120); await (await p.$('#v1')).screenshot({ path: 'shots/m01b-v1.png' });
  // v2
  await p.selectOption('#v2-f', 'sin'); await set('#v2-x', 0.5); await set('#v2-n', 60); await set('#v2-h', -3); t = await p.textContent('#v2-out'); console.log('     ', t);
  assert(/Riemann \(N = 60\) = 2\.000/.test(t) && t.includes('integral eksak dari 0 sampai x₀ = 2'), 'v2: luas sin 0..π = 2'); assert(/kemiringan sekan = −1\b|kemiringan sekan = −0\.999/.test(t), 'v2: kemiringan di π ≈ −1');
  await p.selectOption('#v2-f', 'sq'); await set('#v2-x', 0.5); await set('#v2-h', 0); await set('#v2-n', 4); t = await p.textContent('#v2-out'); console.log('     ', t); assert(t.includes('kemiringan sekan = 4') && t.includes('= 3 '), 'v2: x² di 1.5, h = 1: sekan 4, turunan 3');
  await p.selectOption('#v2-f', 'sin'); await set('#v2-x', 0.3); await set('#v2-h', -0.3); await set('#v2-n', 6); await (await p.$('#v2')).screenshot({ path: 'shots/m01b-v2.png' });
  // v3
  for (let i = 0; i < 2; i++) await p.click('#v3 button:has-text("Maju")'); t = await p.textContent('#v3-out'); console.log('     ', t); assert(t.includes('v_k = 0.6 V') && t.includes('eksak = 0.5057'), 'v3: dua langkah Euler h = 0.5 → 0.6 V (Contoh 6)');
  await set('#v3-h', 1); await p.click('#v3 button:has-text("Maju")'); assert((await p.textContent('#v3-out')).includes('v_k = 0.8 V'), 'v3: h = τ tepat di 0.8 V');
  await set('#v3-h', 2.5); for (let i = 0; i < 4; i++) await p.click('#v3 button:has-text("Maju")'); t = await p.textContent('#v3-out'); assert(t.includes('TIDAK STABIL') && t.includes('faktor penguat per langkah = −1.5'), 'v3: h = 2.5τ tidak stabil | ' + t.slice(0, 80));
  await (await p.$('#v3')).screenshot({ path: 'shots/m01b-v3.png' });
  await p.selectOption('#v3-m', 'rk4'); t = await p.textContent('#v3-out'); assert(t.includes('0.6484') && t.includes('(stabil)'), 'v3: RK4 pada h = 2.5τ stabil, faktor 0.6484');
  await p.click('#v3 button:has-text("Putar")'); await p.waitForTimeout(1500); assert((await p.textContent('#v3-out')).includes('langkah k = 4'), 'v3: putar berhenti di ujung (4 langkah × 2.5τ)');
  // v4
  t = await p.textContent('#v4-out'); console.log('     ', t); assert(t.includes('kurang teredam') && t.includes('overshoot = 44.4%') && t.includes('puncak di 323 ps') || t.includes('puncak di 324 ps'), 'v4: ζ 0.25, f0 1.6 GHz → 44.4%');
  await set('#v4-z', 1); t = await p.textContent('#v4-out'); assert(t.includes('teredam kritis') && t.includes('tanpa overshoot'), 'v4: ζ = 1 kritis');
  await set('#v4-z', 2); t = await p.textContent('#v4-out'); assert(t.includes('lewat teredam') && t.includes('−0.268 dan −3.73'), 'v4: ζ = 2 akar real | ' + t.slice(0, 70));
  await set('#v4-z', 0.25); await p.click('#v4-anim'); await p.waitForTimeout(700); await p.click('#v4 button:has-text("Jeda")'); t = await p.textContent('#v4-out'); const fr = +/bingkai (\d+)/.exec(await p.textContent('#v4 .icd-simctl .step'))[1]; assert(fr > 5 && fr < 60, 'v4: animasi dari awal berjalan lalu jeda di bingkai ' + fr);
  await (await p.$('#v4')).screenshot({ path: 'shots/m01b-v4.png' });
  const qz = await p.evaluate(() => { let n = 0, bad = []; return new Promise(res => { function go() { const q = document.querySelector('#kuis .q'); if (!q) return res({ n, bad });
      const bs = [...document.querySelectorAll('#kuis .icd-opt')]; bs[0].click(); const whys = document.querySelectorAll('#kuis .why'); const right = document.querySelectorAll('#kuis .icd-opt.right').length; if (whys.length !== bs.length || bs.length !== 4 || right !== 1 || [...whys].some(w => w.textContent.length < 25)) bad.push(q.textContent.slice(0, 30)); n++; document.querySelector('#kuis .icd-btn.primary').click(); setTimeout(go, 5); } go(); }); });
  assert(qz.n === 14 && qz.bad.length === 0, 'kuis: 14 soal sah ' + JSON.stringify(qz.bad));
  assert(await p.evaluate(() => ICD.cards.count('m01b-kompleks-kalkulus')) === 18, '18 flashcard'); assert(errs.length === 0, 'tanpa error konsol ' + errs.join('|'));
  const m = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true })).newPage();
  await m.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); await (await m.$('#v4')).screenshot({ path: 'shots/m01b-m-v4.png' });
  await b.close();
})().catch(e => { console.error('CRASH', e.message.split('\n')[0]); process.exit(1); });
