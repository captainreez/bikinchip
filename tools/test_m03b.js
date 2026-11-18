const { chromium } = require(process.env.PLAYWRIGHT || 'playwright'); const fs = require('fs');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const F = 'm03b-kode-deteksi-koreksi';
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
    links: [...document.querySelectorAll('main a[href*=".html"]')].map(a => a.getAttribute('href').split('#')[0]).filter(h => h !== 'index.html' && !ICD.reg.file(h.replace('.html', ''))),
    code: [...document.querySelectorAll('#s08 pre')].map(txt), lab: [...document.querySelectorAll('#s14 pre')].map(txt) }; });
  console.log(JSON.stringify({ secs: s.secs, viz: s.viz, guides: s.guides, layers: s.layers, nav: s.nav, labn: s.lab.length, raw: s.rawTerms, links: s.links }));
  assert(s.secs === 16 && s.viz === 4 && s.guides === 4 && s.layers === 3, '16 bagian, 4 visualisasi, 4 eksperimen, 3 konsep berlapis');
  assert(s.rawTerms.length === 0 && s.links.length === 0, 'istilah dan tautan sah');
  const ck = async (id, ...subs) => { const t = await out(id); const bad = subs.filter(x => x instanceof RegExp ? !x.test(t) : !t.includes(x)); return { t, bad }; };
  const A = async (name, id, ...subs) => { const r = await ck(id, ...subs); if (r.bad.length) console.log('      ', r.t); assert(r.bad.length === 0, name + (r.bad.length ? ' GAGAL: ' + r.bad.join(' | ') : '')); };
  const click = async s => p.click(s);
  const rd = f => fs.readFileSync('lab/m03b/' + f, 'utf8').trim();
  assert(['codes.py', 'codes.v', 'tb_codes.v', 'genvec.py', 'crcdetect.py', 'crcpar.py'].every((f, i) => s.code[i] && s.code[i].trim() === rd(f)), 'enam file kode identik dengan lab/m03b');
  // v1
  await p.locator('#v1').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await fwd('v1', 8); await A('v1: 7 → 8 (4 bit)', '#v1-out', 'n = 4 bit', 'hitungan 7 → 8', '0111 → 1000: 4 bit berubah (16 pola', '0100 → 1100: 1 bit berubah (2 pola', 'transisi kumulatif: biner 15, Gray 8');
  await fwd('v1', 8); await A('v1: siklus penuh', '#v1-out', 'hitungan 15 → 16 (kembali ke 0)', 'transisi kumulatif: biner 30, Gray 16', '2^5 − 2 = 30', '2^4 = 16');
  assert(await p.locator('#v1-bin .cell').count() === 4 && await p.locator('#v1-gray .cell.tg').count() === 1, 'v1: 4 sel biner, satu sel Gray berubah');
  await (await p.$('#v1')).screenshot({ path: 'shots/m03b-v1.png' });
  await sel('#v1-n', '3'); await A('v1: n = 3 reset', '#v1-out', 'n = 3 bit', 'hitungan 0');
  await fwd('v1', 8); await A('v1: 3 bit penuh', '#v1-out', 'transisi kumulatif: biner 14, Gray 8');
  await sel('#v1-n', '6'); await fwd('v1', 64); await A('v1: 6 bit penuh', '#v1-out', 'biner 126, Gray 64');
  await sel('#v1-n', '4');
  // v2
  await p.locator('#v2').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await fwd('v2', 3); await A('v2: data 1011 tanpa galat', '#v2-out', 'Data 1011', 'kata kode (posisi 8…1) = 01010101', 'tahap 3 dari 3', 'tidak ada galat terdeteksi', 'data = 1011 (BENAR)');
  await sel('#v2-e1', '3'); await sel('#v2-e2', '5'); await A('v2: SECDED galat di 3 dan 5', '#v2-out', 'syndrome = 6 (110)', 'P′ = 0', 'galat GANDA terdeteksi');
  await sel('#v2-mode', 'ham'); await A('v2: Hamming salah-koreksi', '#v2-out', 'galat tunggal dikoreksi di posisi 6', 'SALAH tanpa peringatan', 'kata kode (posisi 7…1) = 1010101');
  await (await p.$('#v2')).screenshot({ path: 'shots/m03b-v2.png' });
  await sel('#v2-mode', 'secded'); await set('#v2-d', 6); await sel('#v2-e1', '1'); await sel('#v2-e2', '2'); await sel('#v2-e3', '4');
  await A('v2: tiga galat 1, 2, 4', '#v2-out', 'Data 0110', 'kata kode (posisi 8…1) = 00110011', 'syndrome = 7', "P′ = 1", 'galat tunggal dikoreksi di posisi 7', 'data = 1110 (SALAH tanpa peringatan)');
  await sel('#v2-e1', '2'); await sel('#v2-e2', '5'); await sel('#v2-e3', '0'); await A('v2: ganda 2 dan 5', '#v2-out', 'syndrome = 7 (111)', 'galat GANDA terdeteksi');
  await sel('#v2-e1', '6'); await sel('#v2-e2', '0'); await A('v2: tunggal posisi 6', '#v2-out', 'syndrome = 6 (110)', 'P′ = 1', 'dikoreksi di posisi 6', 'data = 0110 (BENAR)');
  await sel('#v2-e1', '8'); await A('v2: galat pada P', '#v2-out', 'syndrome = 0 (000)', 'bit P salah, dikoreksi', 'data = 0110 (BENAR)');
  await sel('#v2-e1', '2'); await sel('#v2-e2', '2'); await A('v2: galat sama dua kali saling batal', '#v2-out', 'galat disuntik di posisi: tidak ada', 'tidak ada galat terdeteksi');
  await sel('#v2-e1', '0'); await sel('#v2-e2', '0'); await sel('#v2-d', '11').catch(() => {}); await set('#v2-d', 11);
  // v3
  await p.locator('#v3').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await fwd('v3', 8); await A('v3: CRC-3 0xB5', '#v3-out', 'CRC-3 (G = x³ + x + 1)', 'pesan 10110101', 'CRC = 100', 'kata kode 10110101100', 'sisa penerima = 000', 'lolos (memang tanpa galat)');
  const regs = await p.$$eval('#v3-tab tbody tr td:last-child', t => t.map(x => x.textContent.trim())); assert(regs.join(',') === '011,110,100,000,000,011,110,100', 'v3: jejak register CRC-3 ' + regs.join(','));
  await sel('#v3-e1', '1'); await sel('#v3-e2', '8'); await A('v3: galat 1 dan 8 lolos', '#v3-out', 'galat di posisi: 1, 8', 'sisa penerima = 000', 'galat TIDAK terdeteksi');
  await (await p.$('#v3')).screenshot({ path: 'shots/m03b-v3.png' });
  await sel('#v3-e2', '6'); await A('v3: galat 1 dan 6 terdeteksi', '#v3-out', 'galat terdeteksi');
  await sel('#v3-e1', '4'); await sel('#v3-e2', '11'); await A('v3: galat 4 dan 11 lolos', '#v3-out', 'galat TIDAK terdeteksi');
  await sel('#v3-e1', '0'); await sel('#v3-e2', '0');
  await sel('#v3-crc', '4'); await A('v3: CRC-4', '#v3-out', 'CRC-4 (G = x⁴ + x + 1)', 'CRC = 1110', 'peluang galat acak lolos 2^−4 = 6.25%');
  await sel('#v3-crc', '8'); await A('v3: CRC-8', '#v3-out', 'CRC = 00000010', '0.39%');
  assert(await p.locator('#v3-cw .cell').count() === 16, 'v3: 16 sel kata kode CRC-8');
  await sel('#v3-crc', '3'); await set('#v3-d', 13); await A('v3: pesan 0x0D', '#v3-out', 'CRC = 001', 'kata kode 00001101001');
  await set('#v3-d', 181);
  // v4
  await p.locator('#v4').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await A('v4: k = 64, p = 1e−6', '#v4-out', 'k = 64 bit data', 'r = 7 + 1 paritas = 8 bit cek, n = 72 bit, overhead 12.5%', 'p = 1.0e−6', 'tanpa kode P = 6.400e−5', 'SECDED tak terkoreksi (≥ 2 galat) P = 2.556e−9', '(≥ 3 galat) P = 5.964e−14', /paritas \(n = 65\) lolos tak terdeteksi P = 2\.08\de−9/);
  await (await p.$('#v4')).screenshot({ path: 'shots/m03b-v4.png' });
  await sel('#v4-k', '128'); await A('v4: k = 128', '#v4-out', 'r = 8 + 1 paritas = 9 bit cek, n = 137 bit, overhead 7.0%');
  await sel('#v4-k', '8'); await A('v4: k = 8', '#v4-out', 'r = 4 + 1 paritas = 5 bit cek, n = 13 bit, overhead 62.5%');
  await sel('#v4-k', '64'); await set('#v4-p', -3); await A('v4: p = 1e−3', '#v4-out', 'p = 1.0e−3', /tanpa kode P = 6\.2\d\de−2/);
  await set('#v4-p', -6);
  await fwd('v4', 21); await A('v4: sapuan ke log p = −7', '#v4-out', 'p = 1.0e−7');
  assert((await p.inputValue('#v4-p')) === '-7', 'v4: slider ikut sapuan: ' + await p.inputValue('#v4-p'));
  // kuis dan kartu
  const qz = await p.evaluate(() => { let n = 0, bad = []; return new Promise(res => { function go() { const q = document.querySelector('#kuis .q'); if (!q) return res({ n, bad });
      const bs = [...document.querySelectorAll('#kuis .icd-opt')]; bs[0].click(); const whys = document.querySelectorAll('#kuis .why'); const right = document.querySelectorAll('#kuis .icd-opt.right').length;
      if (whys.length !== bs.length || bs.length !== 4 || right !== 1 || [...whys].some(w => w.textContent.trim().length < 25)) bad.push(n + 1); n++; const nb = document.querySelector('#kuis .icd-btn.primary'); nb.click(); setTimeout(go, 10); } go(); }); });
  assert(qz.n === 14 && qz.bad.length === 0, 'kuis: 14 soal sah ' + JSON.stringify(qz.bad));
  const kc = await p.evaluate(() => ICD.cards.count('m03b-kode-deteksi-koreksi')); assert(kc === 18, 'flashcard 18: ' + kc);
  assert(errs.length === 0, 'tanpa error konsol ' + errs.join('|'));
  const mo = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true })).newPage();
  await mo.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); for (const v of ['v1', 'v2', 'v3', 'v4']) await (await mo.$('#' + v)).screenshot({ path: 'shots/m03b-m-' + v + '.png' });
  await b.close();
})().catch(e => { console.error('CRASH', e.message.split('\n')[0]); process.exit(1); });
