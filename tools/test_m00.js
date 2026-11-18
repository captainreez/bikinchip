const { chromium } = require(process.env.PLAYWRIGHT || 'playwright'); const fs = require('fs');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs', 'm00-orientasi.html')).href); await p.waitForTimeout(300);
  const s = await p.evaluate(() => ({ secs: document.querySelectorAll('section.icd-sec').length, viz: document.querySelectorAll('.icd-viz').length, guides: document.querySelectorAll('.icd-guide').length,
    terms: document.querySelectorAll('.icd-term').length, rawTerms: document.querySelectorAll('span[data-term]').length, code: document.querySelectorAll('.icd-code').length, layers: document.querySelectorAll('.icd-layers').length,
    math: document.querySelectorAll('math').length, sols: document.querySelectorAll('details.icd-sol').length, nav: [...document.querySelectorAll('.icd-nav a')].map(a => a.getAttribute('href')),
    links: [...document.querySelectorAll('main a[href$=".html"], main a[href*=".html#"]')].map(a => a.getAttribute('href').split('#')[0]).filter(h => !/^(index|kurikulum|belajar|glosarium|tools|referensi|pengaturan|tentang|privasi|masuk|styleguide)\.html$/.test(h) && !ICD.reg.file(h.replace('.html', ''))),
    codes: [...document.querySelectorAll('#s08 pre')].map(pre => [...pre.querySelectorAll('code')].map(c => { const k = c.cloneNode(true); k.querySelectorAll('.ln').forEach(x => x.remove()); return k.textContent; }).join('')) }));
  console.log(JSON.stringify({ ...s, codes: undefined }));
  assert(s.secs === 16, '16 bagian'); assert(s.viz >= 3 && s.guides === 4, s.viz + ' visualisasi, 4 eksperimen terpandu'); assert(s.rawTerms === 0, 'semua istilah punya entri glosarium'); assert(s.links.length === 0, 'tautan antar modul sah ' + s.links);
  assert(s.codes[0].trim() === fs.readFileSync('lab/m00/and2.sv', 'utf8').trim(), 'kode and2.sv di halaman identik dengan yang dijalankan');
  assert(s.codes[1].trim() === fs.readFileSync('lab/m00/tb_and2.sv', 'utf8').trim(), 'kode tb_and2.sv di halaman identik dengan yang dijalankan');
  // flow
  await p.click('#flow-list button >> nth=10'); assert((await p.textContent('#flow-detail')).includes('OpenSTA'), 'alur: pilih tahap 11'); 
  await p.click('#vflow button:has-text("Maju")'); assert((await p.textContent('#flow-detail')).includes('Verifikasi fisik'), 'alur: maju');
  await p.click('#vflow button:has-text("Mundur")'); await p.click('#vflow button:has-text("Mundur")'); assert((await p.textContent('#flow-detail')).includes('10. Routing'), 'alur: mundur');
  await p.click('#flow-list button >> nth=17'); console.log('     ', await p.textContent('#flow-out'));
  await p.fill('#flow-k', '5'); await p.dispatchEvent('#flow-k', 'input'); assert((await p.textContent('#flow-out')).includes('5^3 = 125×'), 'alur: pengali mengubah biaya');
  await (await p.$('#vflow')).screenshot({ path: 'shots/m00-flow.png' });
  // timeline
  await p.click('#tl-svg .dot >> nth=6'); assert((await p.textContent('#tl-detail')).includes('4004'), 'garis waktu: pilih 4004'); console.log('     ', await p.textContent('#tl-out'));
  await p.uncheck('#tl-filters input >> nth=0'); assert(!(await p.textContent('#tl-detail')).includes('Transistor pertama'), 'garis waktu: saring kategori');
  await p.click('#vtl button:has-text("Maju")'); await p.check('#tl-filters input >> nth=0'); await p.click('#tl-svg .dot >> nth=20');
  await (await p.$('#vtl')).screenshot({ path: 'shots/m00-tl.png' });
  // scale
  console.log('     ', await p.textContent('#sc-out')); assert((await p.textContent('#sc-out')).includes('1460'), 'skala: rambut / gate pitch = 1460');
  await (await p.$('#vsc')).screenshot({ path: 'shots/m00-sc.png' });
  await p.selectOption('#sc-b', { index: 1 }); await p.selectOption('#sc-a', { index: 3 }); console.log('     ', await p.textContent('#sc-out'));
  // moore
  let best = [9, 0]; for (let T = 1; T <= 3.5; T += 0.05) { await p.fill('#mo-t', String(+T.toFixed(2))); await p.dispatchEvent('#mo-t', 'input'); const m = /RMS = ([\d.]+)/.exec(await p.textContent('#mo-out')); if (+m[1] < best[0]) best = [+m[1], T]; }
  console.log('      T terbaik', best[1].toFixed(2), 'galat', best[0]); assert(best[1] > 1.8 && best[1] < 2.3, 'Moore: T terbaik dekat 2 tahun');
  await p.fill('#mo-t', '1'); await p.dispatchEvent('#mo-t', 'input'); console.log('     ', await p.textContent('#mo-out'));
  await p.fill('#mo-t', String(+best[1].toFixed(2))); await p.dispatchEvent('#mo-t', 'input'); await p.click('#mo-plot canvas', { position: { x: 400, y: 100 } }); console.log('     ', await p.textContent('#mo-plot .readout'));
  await (await p.$('#vmo')).screenshot({ path: 'shots/m00-mo.png' });
  // quiz structure
  const qz = await p.evaluate(() => { let n = 0, bad = []; return new Promise(res => { function go() { const q = document.querySelector('#kuis .q'); if (!q) return res({ n, bad, text: document.querySelector('#kuis').textContent.slice(0, 40) });
      const bs = [...document.querySelectorAll('#kuis .icd-opt')]; bs[0].click(); const whys = document.querySelectorAll('#kuis .why'); const right = document.querySelectorAll('#kuis .icd-opt.right').length; if (whys.length !== bs.length || right !== 1 || [...whys].some(w => w.textContent.length < 25)) bad.push(n); n++; document.querySelector('#kuis .icd-btn.primary').click(); setTimeout(go, 5); } go(); }); });
  assert(qz.n === 12 && qz.bad.length === 0, 'kuis: 12 soal, satu jawaban benar, semua pilihan berpenjelasan ' + JSON.stringify(qz.bad)); console.log('     ', qz.text);
  assert(await p.evaluate(() => ICD.cards.count('m00-orientasi')) === 14, '14 flashcard terdaftar');
  assert(errs.length === 0, 'tanpa error konsol ' + errs.join('|'));
  const m = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true })).newPage();
  await m.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs', 'm00-orientasi.html')).href); await (await m.$('#vflow')).screenshot({ path: 'shots/m00-m-flow.png' }); await (await m.$('#s04')).screenshot({ path: 'shots/m00-m-s04.png' });
  await p.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs', 'kurikulum.html')).href + '?modul=M00'); await p.waitForTimeout(300); assert(await p.isVisible('#detail a[href="m00-orientasi.html"]'), 'kurikulum menautkan M00'); assert(/Mulai|Lanjutkan/.test(await p.textContent('#detail')), 'tombol Mulai/Lanjutkan di detail M00');
  await b.close();
})().catch(e => { console.error('CRASH', e.message); process.exit(1); });
