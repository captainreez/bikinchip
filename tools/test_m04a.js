const { chromium } = require(process.env.PLAYWRIGHT || 'playwright'); const fs = require('fs');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const F = 'm04a-c-pointer';
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
  assert(s.secs === 16 && s.viz === 4 && s.guides === 4 && s.layers === 3, '16 bagian, 4 visualisasi, 4 eksperimen, 3 konsep berlapis');
  assert(s.rawTerms.length === 0 && s.links.length === 0, 'istilah dan tautan sah');
  const ck = async (id, ...subs) => { const t = await out(id); const bad = subs.filter(x => x instanceof RegExp ? !x.test(t) : !t.includes(x)); return { t, bad }; };
  const A = async (name, id, ...subs) => { const r = await ck(id, ...subs); if (r.bad.length) console.log('      ', r.t); assert(r.bad.length === 0, name + (r.bad.length ? ' GAGAL: ' + r.bad.join(' | ') : '')); };
  const click = async s => p.click(s);
  const rd = f => fs.readFileSync('lab/m04a/' + f, 'utf8').trim();
  assert(['layout.c', 'ptr.c', 'bits.h', 'test_bits.c', 'crcfix.c', 'bugs.c', 'endian.c'].every((f, i) => s.code[i] && s.code[i].trim() === rd(f)), 'tujuh file kode identik dengan lab/m04a');
  // v1
  await p.locator('#v1').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await fwd('v1', 2); await A('v1: int32 p++ x2', '#v1-out', 'int32_t * p = 0x1008 (offset 8, 2 kali p++)', 'byte di memori: 01 00 00 00', 'little-endian: *p = 0x00000001 (1 bertanda, 1 tak bertanda)', 'alamat rata');
  await sel('#v1-e', 'be'); await A('v1: big-endian byte sama', '#v1-out', 'byte di memori: 01 00 00 00', 'big-endian: *p = 0x01000000 (16777216 bertanda');
  await sel('#v1-e', 'le'); await fwd('v1', 2); await A('v1: string "Hell" sebagai bilangan', '#v1-out', 'p = 0x1010', '*p = 0x6C6C6548 (1819043144 bertanda', 'ASCII: "Hell"');
  await fwd('v1', 4); await A('v1: di luar objek', '#v1-out', 'p = 0x1020', 'DI LUAR OBJEK');
  assert(await p.locator('#v1-mem .cell').count() === 32, 'v1: 32 sel byte');
  await sel('#v1-t', '2'); await A('v1: int16 reset', '#v1-out', 'int16_t * p = 0x1000', '*p = 0x3344');
  await fwd('v1', 1); await A('v1: int16 p++', '#v1-out', 'p = 0x1002', '*p = 0x1122', 'alamat rata');
  await set('#v1-off', 1); await A('v1: int16 offset 1 tak rata', '#v1-out', 'p = 0x1001', 'TAK RATA: bukan kelipatan 2');
  await sel('#v1-t', '8'); await set('#v1-off', 0); await A('v1: int64', '#v1-out', 'int64_t * p', '*p = 0xAABBCCDD11223344 (-6144092016769617084 bertanda'.replace('−', '−').replace('-6144', '−6144'), '12302652056939934532 tak bertanda');
  await (await p.$('#v1')).screenshot({ path: 'shots/m04a-v1.png' });
  await sel('#v1-t', '4'); await set('#v1-off', 0);
  // v2
  await p.locator('#v2').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await fwd('v2', 5); await A('v2: n = 5, kedalaman 5', '#v2-out', 'panggil fact(1)', 'kedalaman 5', 'stack 160 B dari 256 B (62.5%)');
  await fwd('v2', 1); await A('v2: kembali dari fact(1)', '#v2-out', 'fact(1) mengembalikan 1! = 1', 'kedalaman setelah kembali = 4');
  await fwd('v2', 4); await A('v2: fact(5) = 120', '#v2-out', 'fact(5) mengembalikan 5! = 120', 'kedalaman setelah kembali = 0', 'stack 0 B');
  await (await p.$('#v2')).screenshot({ path: 'shots/m04a-v2.png' });
  await set('#v2-n', 12); await A('v2: n = 12 reset', '#v2-out', 'fact(12) belum dipanggil');
  await fwd('v2', 9); await A('v2: overflow pada pemanggilan ke-9', '#v2-out', 'STACK OVERFLOW pada pemanggilan ke-9', '9 × 32 = 288 B > 256 B');
  assert(await p.locator('#v2-stk .fr.bad').count() === 1 && await p.locator('#v2-stk .fr').count() === 10, 'v2: 10 frame (main + 9), satu frame bad');
  await sel('#v2-lim', '512'); await fwd('v2', 12); await A('v2: 512 B, kedalaman 12', '#v2-out', 'kedalaman 12', 'stack 384 B dari 512 B (75.0%)');
  await fwd('v2', 12); await A('v2: 12! = 479001600', '#v2-out', 'fact(12) mengembalikan 12! = 479001600');
  await sel('#v2-lim', '256'); await set('#v2-n', 5);
  // v3
  await p.locator('#v3').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await fwd('v3', 5); await A('v3: deklarasi 32 byte', '#v3-out', 'sizeof = 32', 'alignof = 8', 'offset: a@0 b@4 c@8 d@16 e@24', 'jumlah ukuran field = 16 B', 'padding total 16 B (50.0%) (di antara field 10 B, di ekor 6 B)');
  assert(await p.locator('#v3-map .cell').count() === 32 && await p.locator('#v3-map .cell.pr').count() === 16, 'v3: 32 sel, 16 padding');
  await (await p.$('#v3')).screenshot({ path: 'shots/m04a-v3.png' });
  await sel('#v3-ord', 'sort'); await A('v3: sort 16 byte', '#v3-out', 'sizeof = 16', 'offset: d@0 b@8 e@12 a@14 c@15', 'padding total 0 B (0.0%)', 'urutan: d b e a c');
  await sel('#v3-ord', 'pack'); await A('v3: packed', '#v3-out', 'sizeof = 16', 'alignof = 1', 'offset: a@0 b@1 c@5 d@6 e@14', 'akses tak rata: b, d');
  await sel('#v3-ord', 'decl'); await sel('#v3-f4', '2'); await A('v3: d menjadi int', '#v3-out', 'offset: a@0 b@4 c@8 d@12 e@16', 'sizeof = 20', 'alignof = 4');
  await sel('#v3-f4', '4');
  // v4
  await p.locator('#v4').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await fwd('v4', 4); await A('v4: ganti field', '#v4-out', 'r = 0xA5C3F00F', 'M = 0x0000F000', 'hasil = 0xA5C3900F', 'bit berubah: 2 (0x00006000)');
  const rows = await p.$$eval('#v4-tab tbody tr td:last-child', t => t.map(x => x.textContent.trim())); assert(rows.join(',') === '0x0000F000,0xA5C3000F,0x00009000,0xA5C3900F', 'v4: tahap ' + rows.join(','));
  assert(await p.locator('#v4-bits .cell').count() === 32 && await p.locator('#v4-bits .cell.er').count() === 2 && await p.locator('#v4-bits .cell.tg').count() === 4, 'v4: 32 sel, 2 berubah, 4 di field');
  await (await p.$('#v4')).screenshot({ path: 'shots/m04a-v4.png' });
  await sel('#v4-op', 'set'); await set('#v4-l', 4); await fwd('v4', 2); await A('v4: nyalakan', '#v4-out', 'M = 0x000000F0', 'hasil = 0xA5C3F0FF');
  await set('#v4-l', 12); await sel('#v4-op', 'tog'); await fwd('v4', 2); await A('v4: balik', '#v4-out', 'hasil = 0xA5C3000F');
  await sel('#v4-op', 'clr'); await fwd('v4', 3); await A('v4: matikan', '#v4-out', 'hasil = 0xA5C3000F');
  await sel('#v4-op', 'get'); await fwd('v4', 3); await A('v4: ambil', '#v4-out', 'field = 0xF (15)');
  await sel('#v4-op', 'ins'); await set('#v4-v', 31); await fwd('v4', 4); await A('v4: nilai terlalu lebar dipotong', '#v4-out', 'v = 31 (efektif 15)', 'hasil = 0xA5C3F00F', 'bit berubah: 0');
  await set('#v4-v', 9); await set('#v4-l', 24); await A('v4: l = 24 membatasi w', '#v4-out', 'l = 24, w = 4');
  await set('#v4-w', 8); await A('v4: w maksimum 8 pada l = 24', '#v4-out', 'l = 24, w = 8');
  await set('#v4-l', 0); await set('#v4-w', 20);
  await p.fill('#v4-reg', 'FFFFFFFF'); await p.dispatchEvent('#v4-reg', 'input'); await A('v4: r = FFFFFFFF', '#v4-out', 'r = 0xFFFFFFFF');
  await p.fill('#v4-reg', 'A5C3F00F'); await p.dispatchEvent('#v4-reg', 'input'); await set('#v4-l', 12); await set('#v4-w', 4);
  // kuis dan kartu
  const qz = await p.evaluate(() => { let n = 0, bad = []; return new Promise(res => { function go() { const q = document.querySelector('#kuis .q'); if (!q) return res({ n, bad });
      const bs = [...document.querySelectorAll('#kuis .icd-opt')]; bs[0].click(); const whys = document.querySelectorAll('#kuis .why'); const right = document.querySelectorAll('#kuis .icd-opt.right').length;
      if (whys.length !== bs.length || bs.length !== 4 || right !== 1 || [...whys].some(w => w.textContent.trim().length < 25)) bad.push(n + 1); n++; const nb = document.querySelector('#kuis .icd-btn.primary'); nb.click(); setTimeout(go, 10); } go(); }); });
  assert(qz.n === 14 && qz.bad.length === 0, 'kuis: 14 soal sah ' + JSON.stringify(qz.bad));
  const kc = await p.evaluate(() => ICD.cards.count('m04a-c-pointer')); assert(kc === 18, 'flashcard 18: ' + kc);
  assert(errs.length === 0, 'tanpa error konsol ' + errs.join('|'));
  const mo = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true })).newPage();
  await mo.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); for (const v of ['v1', 'v2', 'v3', 'v4']) await (await mo.$('#' + v)).screenshot({ path: 'shots/m04a-m-' + v + '.png' });
  await b.close();
})().catch(e => { console.error('CRASH', e.message.split('\n')[0]); process.exit(1); });
