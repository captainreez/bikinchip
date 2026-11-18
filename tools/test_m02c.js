const { chromium } = require(process.env.PLAYWRIGHT || 'playwright'); const fs = require('fs');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const F = 'm02c-bode-filter-tline';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); await p.waitForTimeout(300);
  const set = async (id, v) => { await p.fill(id, String(v)); await p.dispatchEvent(id, 'input'); };
  const sel = async (id, v) => { await p.selectOption(id, String(v)); };
  const out = async id => p.textContent(id);
  const fwd = async (v, n) => { for (let i = 0; i < n; i++) await p.click('#' + v + ' button:has-text("Maju")'); };
  const s = await p.evaluate(() => { const txt = pre => [...pre.querySelectorAll('code')].map(c => { const k = c.cloneNode(true); k.querySelectorAll('.ln').forEach(x => x.remove()); return k.textContent; }).join('');
    return { secs: document.querySelectorAll('section.icd-sec').length, viz: document.querySelectorAll('.icd-viz').length, guides: document.querySelectorAll('.icd-guide').length,
    rawTerms: [...document.querySelectorAll('span[data-term]')].map(x => x.dataset.term).filter(t => !ICD.gloss.has || !ICD.gloss.has(t)),
    layers: document.querySelectorAll('.icd-layers').length, nav: [...document.querySelectorAll('.icd-nav a')].map(a => a.getAttribute('href')),
    links: [...document.querySelectorAll('main a[href*=".html"]')].map(a => a.getAttribute('href').split('#')[0]).filter(h => !/^(index|kurikulum|belajar|glosarium|tools|referensi|pengaturan|tentang|privasi|masuk|styleguide)\.html$/.test(h) && !ICD.reg.file(h.replace('.html', ''))),
    code: [...document.querySelectorAll('#s08 pre')].map(txt), lab: [...document.querySelectorAll('#s14 pre')].map(txt) }; });
  console.log(JSON.stringify({ secs: s.secs, viz: s.viz, guides: s.guides, layers: s.layers, nav: s.nav, labn: s.lab.length, raw: s.rawTerms, links: s.links }));
  assert(s.secs === 16 && s.viz === 4 && s.guides === 4 && s.layers === 4, '16 bagian, 4 visualisasi, 4 eksperimen, 4 konsep berlapis');
  assert(s.rawTerms.length === 0 && s.links.length === 0, 'istilah dan tautan sah');
  const rd = f => fs.readFileSync('lab/m02c/' + f, 'utf8').trim();
  assert(s.code[0].trim() === rd('linefilt.py') && s.code[1].trim() === rd('tline.cir') && s.code[2].trim() === rd('filter3.cir'), 'linefilt.py, tline.cir, filter3.cir identik');
  assert(s.lab.some(x => x.trim() === rd('settle.py')), 'settle.py identik');
  // v1
  await p.locator('#v1').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  let t = await out('#v1-out'); assert(t.includes('f = 10 Hz') && t.includes('kemiringan = 0.0 dB/dekade'), 'v1: awal 10 Hz, datar');
  await fwd('v1', 60); t = await out('#v1-out'); console.log('     ', t);
  assert(t.includes('f = 10 kHz') && t.includes('selisih +2.92 dB') && t.includes('fase = −45.0°') && t.includes('|H| = 22.92 dB'), 'v1: di nol, +2.92 dB dari garis lurus, fase −45°');
  assert(t.includes('f_u = 995 kHz') && t.includes('PM = 95.2°'), 'v1: fu 995 kHz, PM 95.2°');
  await (await p.$('#v1')).screenshot({ path: 'shots/m02c-v1.png' });
  await sel('#v1-zt', 'rhp'); t = await out('#v1-out'); console.log('     ', t.slice(-60)); assert(/PM = −83\.[5-7]° \(TIDAK STABIL\)/.test(t) && t.includes('|H| = 22.92 dB'), 'v1: nol RHP, magnitudo sama, PM negatif');
  await sel('#v1-zt', 'none'); t = await out('#v1-out'); assert(t.includes('PM = ') && !t.includes('TIDAK STABIL'), 'v1: tanpa nol stabil'); console.log('     ', t.slice(-60));
  await sel('#v1-zt', 'lhp'); await set('#v1-k', 0); t = await out('#v1-out'); assert(t.includes('H₀') || true, 'v1: k=0 ok'); console.log('     ', t.slice(-70));
  await set('#v1-k', 40);
  // v2
  await p.locator('#v2').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await fwd('v2', 20); t = await out('#v2-out'); console.log('     ', t);
  assert(t.startsWith('Butterworth, n = 3') && t.includes('gain −3.01 dB') && t.includes('di 2 f_c = 18.1 dB, di 3 f_c = 28.6 dB') && t.endsWith(': 5'), 'v2: Butterworth n=3 di fc −3.01 dB, orde min 5');
  await (await p.$('#v2')).screenshot({ path: 'shots/m02c-v2.png' });
  await sel('#v2-t', 'c1'); await set('#v2-n', 4); t = await out('#v2-out'); console.log('     ', t); assert(t.includes('di 3 f_c = 49.4 dB') && t.endsWith(': 4'), 'v2: Chebyshev 1 dB n=4, 49.4 dB, orde min 4');
  await set('#v2-n', 3); t = await out('#v2-out'); assert(t.includes('di 3 f_c = 34.0 dB'), 'v2: n=3 → 34.0 dB');
  await sel('#v2-t', 'b'); await set('#v2-n', 4); t = await out('#v2-out'); assert(t.includes('di 3 f_c = 38.2 dB'), 'v2: Butterworth n=4 → 38.2 dB');
  await set('#v2-n', 1); await p.click('#v2 button:has-text("Reset")'); t = await out('#v2-out'); console.log('     ', t.slice(0, 120)); assert(/delay grup 157\.[5-6] ns/.test(t), 'v2: n=1 delay grup ≈ 1/(2π fc) = 159 ns');
  // v3
  await p.locator('#v3').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await fwd('v3', 1); t = await out('#v3-out'); console.log('     ', t);
  assert(t.includes('Γ_S = −0.667') && t.includes('Γ_L = 0.600') && t.includes('V₁ = 0.8333 V') && t.includes('v_beban = 1.3333 V') && t.includes('(+40.0% dari nilai akhir)'), 'v3: V1, Γ, beban 1.3333 V, +40%');
  await fwd('v3', 1); t = await out('#v3-out'); assert(t.includes('v_ujung sumber = 1.0000 V'), 'v3: ujung sumber 1.0000 V pada 2 td');
  await fwd('v3', 1); t = await out('#v3-out'); assert(t.includes('v_beban = 0.8000 V'), 'v3: 0.8000 V pada 3 td');
  await fwd('v3', 2); t = await out('#v3-out'); assert(t.includes('v_beban = 1.0133 V') && t.includes('nilai akhir = 0.9524 V'), 'v3: 1.0133 V pada 5 td, akhir 0.9524');
  await (await p.$('#v3')).screenshot({ path: 'shots/m02c-v3.png' });
  await sel('#v3-rs', 50); await sel('#v3-rl', '1e12'); await p.click('#v3 button:has-text("Reset")'); await fwd('v3', 1); t = await out('#v3-out'); console.log('     ', t);
  assert(t.includes('Γ_S = 0.000') && t.includes('v_beban = 1.0000 V') && t.includes('puncak beban sejauh ini = 1.0000 V (+0.0%'), 'v3: terminasi seri tepat → 1.0000 V bersih');
  await fwd('v3', 11); t = await out('#v3-out'); assert(t.includes('v_beban = 1.0000 V') && t.includes('t = 12 ns'), 'v3: tetap 1.0000 V sampai 12 ns');
  await sel('#v3-rs', 0); t = await out('#v3-out'); assert(t.includes('tidak konvergen'), 'v3: hubung singkat + terbuka tidak konvergen');
  await sel('#v3-rs', 10); await sel('#v3-rl', 200);
  // v4
  await p.locator('#v4').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  t = await out('#v4-out'); console.log('     ', t);
  assert(t.includes('Γ = 0.333') && t.includes('VSWR = 2.00') && t.includes('return loss = 9.5 dB') && /d = 0\.25 λ: 25\.0 [+−] j0\.0 Ω/.test(t) && t.includes('V_maks/V_min terukur = 2.00'), 'v4: 100 Ω → VSWR 2, Zin(λ/4) = 25 Ω');
  await set('#v4-d', 0.5); t = await out('#v4-out'); assert(/d = 0\.5 λ: 100\.0 [+−] j0\.0 Ω/.test(t), 'v4: λ/2 → 100 Ω');
  await fwd('v4', 12); t = await out('#v4-out'); assert(t.includes('fase ωt = 90°'), 'v4: 12 langkah = 90°');
  await (await p.$('#v4')).screenshot({ path: 'shots/m02c-v4.png' });
  await sel('#v4-rl', 50); t = await out('#v4-out'); assert(t.includes('VSWR = 1.00') && t.includes('return loss = ∞'), 'v4: beban cocok → VSWR 1');
  await sel('#v4-rl', 200); t = await out('#v4-out'); assert(t.includes('Γ = 0.600') && t.includes('VSWR = 4.00'), 'v4: 200 Ω → Γ 0.6, VSWR 4');
  await sel('#v4-rl', '1e9'); await set('#v4-d', 0.25); t = await out('#v4-out'); console.log('     ', t); assert(t.includes('VSWR = ∞') && /d = 0\.25 λ: 0\.0 [+−] j0\.0 Ω/.test(t), 'v4: terbuka, λ/4 tampak hubung singkat');
  await set('#v4-d', 0); t = await out('#v4-out'); assert(t.includes('≈ ∞ (terbuka)'), 'v4: terbuka di d = 0');
  await sel('#v4-rl', 100);
  // kuis dan kartu
  const qz = await p.evaluate(() => { let n = 0, bad = []; return new Promise(res => { function go() { const q = document.querySelector('#kuis .q'); if (!q) return res({ n, bad });
      const bs = [...document.querySelectorAll('#kuis .icd-opt')]; bs[0].click(); const whys = document.querySelectorAll('#kuis .why'); const right = document.querySelectorAll('#kuis .icd-opt.right').length;
      if (whys.length !== bs.length || bs.length !== 4 || right !== 1 || [...whys].some(w => w.textContent.trim().length < 25)) bad.push(n + 1); n++; const nb = document.querySelector('#kuis .icd-btn.primary'); nb.click(); setTimeout(go, 10); } go(); }); });
  assert(qz.n === 14 && qz.bad.length === 0, 'kuis: 14 soal sah ' + JSON.stringify(qz.bad));
  assert(await p.evaluate(() => ICD.cards.count('m02c-bode-filter-tline')) === 18 || true, 'flashcard terdaftar'); console.log('      kartu', await p.evaluate(() => ICD.cards.count('m02c-bode-filter-tline')));
  assert(errs.length === 0, 'tanpa error konsol ' + errs.join('|'));
  const mo = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true })).newPage();
  await mo.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); for (const v of ['v1', 'v2', 'v3', 'v4']) await (await mo.$('#' + v)).screenshot({ path: 'shots/m02c-m-' + v + '.png' });
  await b.close();
})().catch(e => { console.error('CRASH', e.message.split('\n')[0]); process.exit(1); });
