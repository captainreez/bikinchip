const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const dir = require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/';
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(dir + 'uji-komponen.html');
  // unit checks inside page
  const u = await p.evaluate(() => { const I = ICD, r = {};
    r.si = [I.fmt.si(1e-6,'s'), I.fmt.si(159154.9,'Hz'), I.fmt.si(0,'V'), I.fmt.si(-0.0033,'A'), I.fmt.si(999.96,'Ω')];
    r.parse = [I.fmt.parse('10k'), I.fmt.parse('4.7n'), I.fmt.parse('1Meg'.toLowerCase()), I.fmt.parse('2.5G'), I.fmt.parse('1e-12'), I.fmt.parse('3m')];
    r.basis = I.calc.run('basis', {v:'0xA5', base:'10', w:'8'});
    r.neg = I.calc.run('basis', {v:'-1', base:'10', w:'16'});
    r.slack = I.calc.run('slack', {T:'2',cq:'0.12',lg:'1.5',su:'0.08',cqm:'0.08',lgm:'0.05',h:'0.04',sk:'0.05',u:'0.05'});
    r.rc = I.calc.run('rc', {R:'10k', C:'100p'});
    r.mtbf = I.calc.run('mtbf', {tr:'0.8n',tau:'20p',T0:'50p',fc:'500M',fd:'10M'});
    r.dpw = I.calc.run('dpw', {d:'300',w:'10',h:'10',D0:'0.1'});
    r.enob = I.calc.run('enob', {s:'62',n:'12',fin:'100M',j:'200f'});
    let c = {}; I.cards.sm2(c,4); const a=[c.iv]; I.cards.sm2(c,4); a.push(c.iv); I.cards.sm2(c,4); a.push(c.iv, c.ef); I.cards.sm2(c,1); a.push(c.iv, c.n, c.ef); r.sm2 = a;
    r.files = I.reg.files.length; r.hours = I.reg.modules.reduce((s,m)=>s+m.hours,0);
    r.tracks = Object.fromEntries(Object.entries(I.reg.tracks).map(([k,t]) => [k, Math.round(I.reg.files.filter(f=>t.files[f.id]).reduce((s,f)=>s+f.hours,0))]));
    r.hl = I.hl("assign y = a & 8'hFF; // c", 'sv'); r.math = I.math.supported();
    return r; });
  console.log(JSON.stringify(u, null, 0));
  assert(u.files === 98 && u.hours === 1212, 'registry 98 file, 1212 jam');
  // slider changes plot readout
  const before = await p.textContent('#rc-out'); await p.fill('#rc-r', '5'); await p.dispatchEvent('#rc-r', 'input');
  assert(before !== await p.textContent('#rc-out'), 'slider RC mengubah readout: ' + await p.textContent('#rc-out'));
  await p.click('#rc-t canvas', { position: { x: 300, y: 80 } }); console.log('     plot readout:', await p.textContent('#rc-t .readout'));
  await p.fill('#wv-t', '3.7'); await p.dispatchEvent('#wv-t', 'input'); assert((await p.textContent('#wv-out')).includes('PELANGGARAN setup'), 'pelanggaran setup terdeteksi');
  await p.fill('#wv-t', '4.2'); await p.dispatchEvent('#wv-t', 'input'); assert((await p.textContent('#wv-out')).includes('PELANGGARAN hold'), 'pelanggaran hold terdeteksi');
  await p.fill('#wv-t', '4.3'); await p.dispatchEvent('#wv-t', 'input'); assert((await p.textContent('#wv-out')).startsWith('Aman'), 'tepat di batas hold aman');
  await p.focus('#wv svg'); await p.keyboard.press('ArrowRight'); console.log('     wave readout:', await p.textContent('#wv .readout'));
  // sim
  for (let i = 0; i < 3; i++) await p.click('#simbox button:has-text("Maju")');
  assert((await p.textContent('#sim-out')).includes('q = 3'), 'sim maju 3 langkah');
  await p.click('#simbox button:has-text("Mundur")'); assert((await p.textContent('#sim-out')).includes('q = 2'), 'sim mundur');
  await p.click('#simbox button:has-text("Putar")'); await p.waitForTimeout(1700); await p.click('#simbox button:has-text("Jeda")');
  const s1 = await p.textContent('#sim-out'); await p.waitForTimeout(700); assert(s1 === await p.textContent('#sim-out') && !s1.includes('q = 2 '), 'putar lalu jeda: ' + s1);
  await p.click('#simbox button:has-text("Reset")'); assert((await p.textContent('#sim-out')).includes('siklus 0'), 'sim reset');
  // guide
  await p.click('.icd-guide .icd-opt >> nth=1'); await p.click('.icd-guide button:has-text("Lihat penjelasan")');
  assert(await p.isVisible('.icd-guide .explain'), 'eksperimen terpandu menampilkan penjelasan');
  await p.click('.icd-term'); assert(await p.isVisible('.icd-tip'), 'tooltip glosarium'); await p.keyboard.press('Escape');
  await p.click('.icd-layers [role=tab]:has-text("Pakar")'); assert(await p.isVisible('.icd-layers [role=tabpanel][data-level=pakar]') && !(await p.isVisible('.icd-layers [role=tabpanel][data-level=pemula]')), 'penjelasan berlapis');
  // quiz: answer all correct
  for (let i = 0; i < 3; i++) { const n = await p.evaluate(() => { const q = document.querySelector('#kuis .q').textContent; const want = q.includes('konstanta') ? '1 µs' : q.includes('0xA5') ? '−91' : 'Pelanggaran setup'; const bs = [...document.querySelectorAll('#kuis .icd-opt')]; const k = bs.findIndex(b => b.textContent.includes(want)); bs[k].click(); return document.querySelectorAll('#kuis .why').length; });
    if (i === 0) assert(n === 4, 'semua pilihan punya penjelasan'); await p.click('#kuis .icd-btn.primary'); }
  assert((await p.textContent('#kuis')).includes('3 dari 3'), 'kuis 3/3');
  // flashcard
  await p.click('#kartu button:has-text("Tampilkan jawaban")'); await p.click('#kartu button:has-text("Baik")');
  // mark sections, bookmark, note
  await p.click('#s01 button:has-text("Tandai selesai")'); await p.click('#s03 button:has-text("Bookmark")');
  await p.click('#s02 summary:has-text("Catatan")'); await p.fill('#s02 textarea', 'catatan uji'); await p.waitForTimeout(700);
  await p.click('#probe');
  await p.click('.icd-code .copy >> nth=0');
  await p.screenshot({ path: 'shots/uji-top.png' });
  await (await p.$('#rc')).screenshot({ path: 'shots/rc.png' }); await (await p.$('#wv')).screenshot({ path: 'shots/wv.png' });
  await (await p.$('#s06')).screenshot({ path: 'shots/code.png' });
  // reload persistence
  await p.reload(); await p.waitForTimeout(300);
  assert((await p.textContent('#kuis')).includes('Skor terbaik 3/3'), 'skor kuis bertahan setelah muat ulang');
  assert((await p.inputValue('#s02 textarea')) === 'catatan uji', 'catatan bertahan');
  assert((await p.textContent('#s01 .icd-secfoot')).includes('Selesai dibaca'), 'tanda selesai bertahan');
  // index
  await p.goto(dir + 'index.html'); await p.waitForTimeout(300);
  assert((await p.textContent('#d-status')).includes('terbaca'), 'tanda uji terbaca di index');
  assert((await p.textContent('#bookmarks')).includes('Grafik'), 'bookmark tampil di dasbor');
  await p.click('#graph [data-mod="M22"]'); assert((await p.textContent('#detail')).includes('Static timing analysis'), 'pilih modul di graf');
  assert((await p.textContent('#detail')).includes('M23'), 'rincian memuat modul lanjutan');
  await (await p.$('#peta')).screenshot({ path: 'shots/peta.png' });
  await p.selectOption('#track', 'ams'); assert(await p.evaluate(() => document.querySelector('#graph [data-mod="M18"]').classList.contains('dim') && !document.querySelector('#graph [data-mod="M27"]').classList.contains('dim')), 'filter jalur');
  await p.fill('#icd-search', 'setup hold'); await p.waitForTimeout(100); const res = await p.textContent('#hasil-list'); assert(res.includes('M09') && res.includes('M22'), 'pencarian "setup hold" menemukan M09 dan M22');
  await p.fill('#icd-search', ''); await p.click('#p-make'); const sum = await p.textContent('#p-sum'); assert(/\d+ minggu/.test(sum), 'rencana: ' + sum);
  await p.selectOption('#p-track', 'rtl'); await p.click('#p-make'); console.log('     rencana RTL:', await p.textContent('#p-sum'));
  await p.focus('#graph [data-mod="M10"]'); await p.keyboard.press('Enter'); assert((await p.textContent('#detail')).includes('CMOS VLSI'), 'graf bisa dipakai dengan keyboard');
  const exp = await p.evaluate(() => JSON.parse(ICD.store.exportJSON())); assert(exp.app === 'icd' && exp.data.progress['uji-komponen'].quiz.uji.best === 3, 'ekspor JSON memuat progres');
  await p.evaluate((t) => { ICD.store.reset(); ICD.store.importJSON(t, 'gabung'); }, JSON.stringify(exp)); assert(await p.evaluate(() => ICD.store.get('progress.uji-komponen.quiz.uji.best')) === 3, 'impor JSON memulihkan progres');
  await p.click('#d-reset'); assert(await p.isVisible('dialog.icd-dialog'), 'dialog konfirmasi (bukan alert)'); await p.click('dialog button:has-text("Batal")');
  await p.goto(dir + 'uji-komponen.html'); await p.fill('#icd-search', 'cache'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  assert(p.url().includes('index.html#cari=cache') && (await p.textContent('#hasil-list')).includes('M13'), 'pencarian dari halaman modul menuju index');
  assert(errs.length === 0, 'tanpa error konsol ' + errs.join(' | '));
  // mobile
  const m = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true })).newPage();
  await m.goto(dir + 'uji-komponen.html'); await m.click('.icd-toc-btn'); await m.screenshot({ path: 'shots/m-toc.png' }); await m.keyboard.press('Escape');
  await (await m.$('#s03')).screenshot({ path: 'shots/m-rc.png' });
  await m.goto(dir + 'index.html'); assert(await m.isVisible('#modlist') && !(await m.isVisible('#graphwrap')), 'ponsel memakai tampilan daftar'); await m.screenshot({ path: 'shots/m-index.png' });
  await m.tap('#modlist .modbtn >> nth=3'); await (await m.$('#detail')).screenshot({ path: 'shots/m-detail.png' });
  await b.close();
})().catch(e => { console.error('TEST CRASH', e.message); process.exit(1); });
