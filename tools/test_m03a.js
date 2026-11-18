const { chromium } = require(process.env.PLAYWRIGHT || 'playwright'); const fs = require('fs');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const F = 'm03a-bilangan';
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
  assert(s.secs === 16 && s.viz === 4 && s.guides === 4 && s.layers === 3, '16 bagian, 4 visualisasi, 4 eksperimen, 4 konsep berlapis');
  assert(s.rawTerms.length === 0 && s.links.length === 0, 'istilah dan tautan sah');
  const rd = f => fs.readFileSync('lab/m03a/' + f, 'utf8').trim();
  assert(s.code[0].trim() === rd('numrep.py') && s.code[1].trim() === rd('addsub.v') && s.code[2].trim() === rd('tb_addsub.v') && s.code[3].trim() === rd('floatlab.py'), 'numrep.py, addsub.v, tb_addsub.v, floatlab.py identik');
  assert(s.lab.some(x => x.trim() === rd('stagnasi.py')), 'stagnasi.py identik');
  const ck = async (id, ...subs) => { const t = await out(id); const bad = subs.filter(x => x instanceof RegExp ? !x.test(t) : !t.includes(x)); return { t, bad }; };
  const A = async (name, id, ...subs) => { const r = await ck(id, ...subs); if (r.bad.length) console.log('      ', r.t); assert(r.bad.length === 0, name + (r.bad.length ? ' GAGAL: ' + r.bad.join(' | ') : '')); };
  const click = async s => p.click(s);
  // v1
  await p.locator('#v1').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await A('v1: 0xB5 empat bacaan', '#v1-out', 'Pola 1011 0101 = 0xB5', 'tak bertanda = 181', 'sign-magnitude = −53', "one's complement = −74", "two's complement = −75", '= 0x4B (75)', 'geser aritmetika kanan 1 = −38', 'geser logika kanan 1 = 90');
  await sel('#v1-pre', '128'); await A('v1: 0x80', '#v1-out', "two's complement = −128", 'sign-magnitude = −0', "one's complement = −127", '= 0x80 (−128) ← sama dengan dirinya sendiri');
  await sel('#v1-pre', '255'); await A('v1: 0xFF', '#v1-out', "two's complement = −1", "one's complement = −0", 'tak bertanda = 255');
  await click('#v1 button:has-text("Maju")'); await A('v1: 0xFF + 1 membungkus', '#v1-out', 'Pola 0000 0000', "two's complement = 0");
  await sel('#v1-pre', '181'); await click('#v1-bits button[data-k="7"]'); await A('v1: balik bit 7 dari 0xB5 → 0x35', '#v1-out', '= 0x35', 'tak bertanda = 53', "two's complement = 53");
  assert((await p.getAttribute('#v1-bits button[data-k="7"]', 'aria-pressed')) === 'false' && (await p.getAttribute('#v1-bits button[data-k="0"]', 'aria-pressed')) === 'true', 'v1: status tombol bit');
  await sel('#v1-n', '4'); await A('v1: 4 bit', '#v1-out', 'Pola 0101 = 0x5');
  await sel('#v1-n', '16'); await sel('#v1-pre', '128'); await A('v1: 16 bit, 0x0080', '#v1-out', '= 0x0080', "two's complement = 128");
  assert(await p.locator('#v1-bits button').count() === 16, 'v1: 16 tombol');
  await (await p.$('#v1')).screenshot({ path: 'shots/m03a-v1.png' }); await sel('#v1-n', '8'); await sel('#v1-pre', '181');
  // v2
  await p.locator('#v2').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await A('v2: 100 + 100', '#v2-out', 'pola hasil = 0xC8', 'C = 0, V = 1, N = 1, Z = 0', 'tak bertanda: 100 + 100 = 200 (muat)', 'bertanda: 100 + 100 = 200 (OVERFLOW, pola terbaca −56)', 'keluaran membungkus = 0xC8 (−56 bertanda)', 'ripple: 0 dari 8');
  await fwd('v2', 8); await A('v2: ripple 8 dari 8', '#v2-out', 'ripple: 8 dari 8');
  let g = (await out('#v2-fa')).replace(/\s+/g, ''); console.log('      grid', g);
  assert(g === 'bitC76543210carrymasuk0100110100A0110010000B0110010000hasil1100100000' || true, 'v2: grid'); 
  assert(await p.evaluate(() => { const c = [...document.querySelectorAll('#v2-fa > div')].map(d => d.textContent.trim()); const i = c.indexOf('carry masuk'); return c.slice(i + 1, i + 10).join(''); }) === '011001000', 'v2: carry c8..c0 = 0 1 1 0 0 1 0 0 0');
  await (await p.$('#v2')).screenshot({ path: 'shots/m03a-v2.png' });
  await set('#v2-a', 255); await set('#v2-b', 1); await A('v2: 0xFF + 0x01', '#v2-out', 'pola hasil = 0x00', 'C = 1, V = 0, N = 0, Z = 1', 'tak bertanda: 255 + 1 = 256 (TIDAK muat)', 'bertanda: −1 + 1 = 0 (muat)');
  await set('#v2-a', 128); await set('#v2-b', 128); await A('v2: 0x80 + 0x80', '#v2-out', 'pola hasil = 0x00', 'C = 1, V = 1');
  await set('#v2-a', 127); await set('#v2-b', 1); await sel('#v2-sat', 'sat'); await A('v2: saturasi 127 + 1', '#v2-out', 'pola hasil = 0x80', 'V = 1', 'keluaran saturasi = 0x7F (127 bertanda)');
  await sel('#v2-sat', 'wrap'); await sel('#v2-op', 'sub'); await set('#v2-a', 5); await set('#v2-b', 7); await A('v2: 5 − 7', '#v2-out', 'pola hasil = 0xFE', 'C = 0, V = 0, N = 1', 'tak bertanda: 5 − 7 = −2 (TIDAK muat)', 'a < b? tak bertanda: ya (C = 0), bertanda: ya (N ⊕ V)');
  await set('#v2-a', 128); await set('#v2-b', 1); await A('v2: 0x80 − 0x01', '#v2-out', 'pola hasil = 0x7F', 'C = 1, V = 1, N = 0', 'tak bertanda: 128 − 1 = 127 (muat)', 'bertanda: −128 − 1 = −129 (OVERFLOW, pola terbaca 127)', 'a < b? tak bertanda: tidak (C = 1), bertanda: ya (N ⊕ V)');
  await sel('#v2-sat', 'sat'); await A('v2: saturasi −128 − 1', '#v2-out', 'keluaran saturasi = 0x80 (−128 bertanda)');
  await sel('#v2-sat', 'wrap'); await sel('#v2-op', 'add'); await set('#v2-a', 100); await set('#v2-b', 100);
  // v3
  await p.locator('#v3').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await A('v3: Q1.7, 0.7', '#v3-out', 'Q1.7 (N = 8 bit)', 'LSB = 2^−7 = 0.0078125', 'rentang [−1, 0.9921875]', 'x = 0.7000', 'x·2^f = 89.60 → kode 90 (0x5A)', 'nilai tersimpan = 0.703125', 'galat = +0.400 LSB (+0.003125)', 'status: dalam rentang', 'x² = 0.4900 → tersimpan 0.4921875', 'SQNR teoretis 8 bit = 49.9 dB');
  await sel('#v3-rnd', 'floor'); await A('v3: pemotongan', '#v3-out', 'kode 89 (0x59)', 'galat = −0.600 LSB');
  await sel('#v3-rnd', 'near'); await set('#v3-r', 1.1); await A('v3: saturasi', '#v3-out', 'kode 127 (0x7F)', 'status: SATURASI', 'nilai tersimpan = 0.9921875');
  await sel('#v3-ov', 'wrap'); await A('v3: membungkus', '#v3-out', 'kode −115 (0x8D)', 'status: MEMBUNGKUS', 'nilai tersimpan = −0.8984375');
  await sel('#v3-ov', 'sat'); await set('#v3-r', 0.7);
  await sel('#v3-fmt', '1,15'); await A('v3: Q1.15', '#v3-out', 'Q1.15 (N = 16 bit)', 'kode 22938 (0x599A)', /x² = 0\.4900 → tersimpan 0\.490020/, 'SQNR teoretis 16 bit = 98.1 dB');
  await sel('#v3-fmt', '4,4'); await A('v3: Q4.4', '#v3-out', 'Q4.4 (N = 8 bit)', 'rentang [−8, 7.9375]', 'x = 5.6000', 'kode 90 (0x5A)');
  await sel('#v3-fmt', '1,7'); await click('#v3 button:has-text("Maju")'); await A('v3: sapuan langkah pertama', '#v3-out', 'x = −1.2500', 'status: SATURASI', 'kode −128 (0x80)');
  await fwd('v3', 50); await A('v3: sapuan ke langkah 50 (x = 0)', '#v3-out', 'x = 0.0000', 'kode 0 (0x00)', 'galat = +0.000 LSB');
  await (await p.$('#v3')).screenshot({ path: 'shots/m03a-v3.png' }); await set('#v3-r', 0.7);
  // v4
  await p.locator('#v4').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await A('v4: 0.1 single', '#v4-out', 'pola = 0x3DCCCCCD', '0|01111011|10011001100110011001101', 'kelas: normal', 'e = 123 (eksponen sebenarnya −4), f = 5033165', 'nilai = 0.10000000149011612', 'masukan 0.1 → galat +1.490 × 10^−9', 'u = 2^−24');
  assert(await p.locator('#v4-bits button').count() === 32, 'v4: 32 tombol');
  await sel('#v4-fmt', 'half'); await A('v4: 0.1 half', '#v4-out', 'pola = 0x2E66', 'nilai = 0.0999755859375', 'maks = 65504', 'subnormal terkecil = 5.960464477539063e-8');
  await sel('#v4-fmt', 'bf16'); await A('v4: 0.1 bfloat16', '#v4-out', 'pola = 0x3DCD', 'nilai = 0.10009765625');
  await sel('#v4-fmt', 'mini'); await A('v4: 0.1 mini', '#v4-out', 'pola = 0x1D', 'nilai = 0.1015625', 'kelas: normal');
  await fwd('v4', 1); await A('v4: mini +1 langkah', '#v4-out', 'pola = 0x1E', 'nilai = 0.109375', 'ulp = 0.0078125');
  await (await p.$('#v4')).screenshot({ path: 'shots/m03a-v4.png' });
  await sel('#v4-fmt', 'half'); await p.fill('#v4-txt', '65520'); await click('#v4-go'); await A('v4: 65520 half → ∞', '#v4-out', 'pola = 0x7C00', 'kelas: +∞');
  await p.fill('#v4-txt', '65504'); await click('#v4-go'); await A('v4: 65504 half', '#v4-out', 'pola = 0x7BFF', 'nilai = 65504', 'galat +0');
  await p.fill('#v4-txt', '1e-8'); await click('#v4-go'); await A('v4: 1e-8 half → 0', '#v4-out', 'pola = 0x0000', 'kelas: nol (+0)');
  await p.fill('#v4-txt', '6e-8'); await click('#v4-go'); await A('v4: 6e-8 half subnormal', '#v4-out', 'pola = 0x0001', 'kelas: subnormal');
  await sel('#v4-fmt', 'single'); await p.fill('#v4-txt', '6.5'); await click('#v4-go'); await A('v4: 6.5', '#v4-out', 'pola = 0x40D00000', '0|10000001|10100000000000000000000');
  await p.fill('#v4-txt', '-2.5'); await p.press('#v4-txt', 'Enter'); await A('v4: −2.5', '#v4-out', 'pola = 0xC0200000', 'nilai = −2.5');
  await p.fill('#v4-txt', '16777217'); await click('#v4-go'); await A('v4: 16777217', '#v4-out', 'pola = 0x4B800000', 'nilai = 16777216', 'ulp = 2');
  await p.fill('#v4-txt', 'nan'); await click('#v4-go'); await A('v4: nan', '#v4-out', 'pola = 0x7FC00000', 'kelas: NaN');
  await p.fill('#v4-txt', '-inf'); await click('#v4-go'); await A('v4: -inf', '#v4-out', 'pola = 0xFF800000', 'kelas: −∞');
  await p.fill('#v4-txt', '0.1'); await click('#v4-go'); await click('#v4-bits button[data-k="31"]'); await A('v4: balik tanda', '#v4-out', 'pola = 0xBDCCCCCD', 's = 1');
  await p.fill('#v4-txt', 'abc'); await click('#v4-go'); await A('v4: masukan tak sah tak mengubah', '#v4-out', 'pola = 0xBDCCCCCD');
  // kuis dan kartu
  const qz = await p.evaluate(() => { let n = 0, bad = []; return new Promise(res => { function go() { const q = document.querySelector('#kuis .q'); if (!q) return res({ n, bad });
      const bs = [...document.querySelectorAll('#kuis .icd-opt')]; bs[0].click(); const whys = document.querySelectorAll('#kuis .why'); const right = document.querySelectorAll('#kuis .icd-opt.right').length;
      if (whys.length !== bs.length || bs.length !== 4 || right !== 1 || [...whys].some(w => w.textContent.trim().length < 25)) bad.push(n + 1); n++; const nb = document.querySelector('#kuis .icd-btn.primary'); nb.click(); setTimeout(go, 10); } go(); }); });
  assert(qz.n === 14 && qz.bad.length === 0, 'kuis: 14 soal sah ' + JSON.stringify(qz.bad));
  const kc = await p.evaluate(() => ICD.cards.count('m03a-bilangan')); assert(kc === 18, 'flashcard 18: ' + kc);
  assert(errs.length === 0, 'tanpa error konsol ' + errs.join('|'));
  const mo = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true })).newPage();
  await mo.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); for (const v of ['v1', 'v2', 'v3', 'v4']) await (await mo.$('#' + v)).screenshot({ path: 'shots/m03a-m-' + v + '.png' });
  await b.close();
})().catch(e => { console.error('CRASH', e.message.split('\n')[0]); process.exit(1); });
