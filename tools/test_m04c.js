const { chromium } = require(process.env.PLAYWRIGHT || 'playwright'); const fs = require('fs');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const F = 'm04c-linux-git-make';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); await p.waitForTimeout(300);
  const set = async (id, v) => { await p.fill(id, String(v)); await p.dispatchEvent(id, 'input'); };
  const setr = async (id, v) => { await p.evaluate(([i, x]) => { const e = document.querySelector(i); e.value = x; e.dispatchEvent(new Event('input', { bubbles: true })); }, [id, String(v)]); };
  const sel = async (id, v) => { await p.selectOption(id, String(v)); };
  const out = async id => p.textContent(id);
  const fwd = async (v, n) => { for (let i = 0; i < n; i++) await p.click('#' + v + ' button:has-text("Maju")'); };
  const s = await p.evaluate(() => { const txt = pre => [...pre.querySelectorAll('code')].map(c => { const k = c.cloneNode(true); k.querySelectorAll('.ln').forEach(x => x.remove()); return k.textContent; }).join('');
    return { secs: document.querySelectorAll('section.icd-sec').length, viz: document.querySelectorAll('.icd-viz').length, guides: document.querySelectorAll('.icd-guide').length,
    rawTerms: [...document.querySelectorAll('span[data-term]')].map(x => x.dataset.term).filter(t => !ICD.gloss.has || !ICD.gloss.has(t)),
    layers: document.querySelectorAll('.icd-layers').length, nav: [...document.querySelectorAll('.icd-nav a')].map(a => a.getAttribute('href')),
    links: [...document.querySelectorAll('main a[href*=".html"]')].map(a => a.getAttribute('href').split('#')[0]).filter(h => !/^(index|kurikulum|belajar|glosarium|tools|referensi|pengaturan|tentang|privasi|masuk|styleguide)\.html$/.test(h) && !ICD.reg.file(h.replace('.html', ''))),
    code: [...document.querySelectorAll('#s08 pre')].map(txt), lab: [...document.querySelectorAll('#s14 pre')].map(txt), sols: [...document.querySelectorAll('#s11 details.icd-sol')].filter(d => /^Solusi/.test(d.querySelector('summary').textContent)).length }; });
  console.log(JSON.stringify({ secs: s.secs, viz: s.viz, guides: s.guides, layers: s.layers, nav: s.nav, codes: s.code.length, labn: s.lab.length, sols: s.sols, raw: s.rawTerms, links: s.links }));
  assert(s.secs === 16 && s.viz === 4 && s.guides === 4 && s.layers === 3, '16 bagian, 4 visualisasi, 4 eksperimen, 3 konsep berlapis');
  assert(s.rawTerms.length === 0 && s.links.length === 0, 'istilah dan tautan sah');
  assert(s.sols === 9, '9 latihan dengan solusi tersembunyi');
  const A = async (name, id, ...subs) => { const t = await out(id); const bad = subs.filter(x => !t.includes(x)); if (bad.length) console.log('      ', t); assert(bad.length === 0, name + (bad.length ? ' GAGAL: ' + bad.join(' | ') : '')); };
  const rd = f => fs.readFileSync('lab/m04c/' + f, 'utf8').trim();
  const files = ['redir.sh', 'quote_demo.sh', 'sample.log', 'logparse.sh', 'regex_bt.py', 'mk/Makefile', 'mk/Makefile.nodep', 'mk/main.c', 'mk/util.c', 'mk/lib.c', 'mk/util.h', 'mk/config.h', 'mk_test.sh', 'gitobj.py', 'git_demo.sh'];
  assert(files.every((f, i) => s.code[i] && s.code[i].trim() === rd(f)) && s.code.length === files.length, 'lima belas file kode identik dengan lab/m04c');
  assert(s.lab.some(x => x.includes('semua pemeriksaan redir.sh lulus')) && s.lab.some(x => x.includes('commit buruk pertama: perubahan 5')) && s.lab.some(x => x.includes('mac(2,5,1) = 31, twice(21) = 42')) && s.lab.some(x => x.includes('90127')), 'keluaran lab tertanam');
  // v1
  await p.locator('#v1').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await A('v1: siap (default both > f 2>&1)', '#v1-out', 'both > f 2>&1 · diproses 0 dari 2 (sementara) · stdout asli: OUT · stderr asli: ERR · isi f: -');
  await fwd('v1', 1); await A('v1: langkah 1', '#v1-out', 'diproses 1 dari 2', 'stdout asli: -', 'stderr asli: ERR', 'isi f: OUT');
  await fwd('v1', 1); await A('v1: >f 2>&1', '#v1-out', 'diproses 2 dari 2 (selesai)', 'stdout asli: -', 'stderr asli: -', 'isi f: OUT,ERR');
  await (await p.$('#v1')).screenshot({ path: 'shots/m04c-v1.png' });
  const cases = [['0', 0, 'both · diproses 0 dari 0 (selesai) · stdout asli: OUT · stderr asli: ERR · isi f: -'], ['1', 1, 'stdout asli: - · stderr asli: ERR · isi f: OUT'], ['2', 1, 'stdout asli: OUT · stderr asli: - · isi f: ERR'],
    ['4', 2, 'both 2>&1 > f · diproses 2 dari 2 (selesai) · stdout asli: ERR · stderr asli: - · isi f: OUT'], ['5', 1, 'stdout asli: - · stderr asli: - · isi f: OUT,ERR'],
    ['6', 2, 'stdout asli: - · stderr asli: - · isi f: OUT,ERR'], ['7', 2, 'stdout asli: - · stderr asli: - · isi f: -']];
  for (const [v, n, t] of cases) { await sel('#v1-form', v); await fwd('v1', n); await A('v1: bentuk ' + v, '#v1-out', t); }
  await sel('#v1-form', '4'); await fwd('v1', 1); await A('v1: 2>&1 dulu (sementara)', '#v1-out', 'diproses 1 dari 2 (sementara)', 'stdout asli: OUT,ERR', 'isi f: -');
  assert(await p.locator('#v1-tab tbody tr').count() === 4 && await p.locator('#v1-res tbody tr').count() === 2, 'v1: tabel fd 3 baris + baris perintah, hasil 2 baris');
  // v2
  await p.locator('#v2').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await A('v2: n = 1', '#v2-out', '(a+)+b · aⁿ · n = 1 · langkah 13 · n pertama · tidak cocok');
  await fwd('v2', 13); await A('v2: n = 14', '#v2-out', 'n = 14 · langkah 90.127 · × 2,00 dari n−1 · tidak cocok');
  assert(await p.locator('#v2-tab tbody tr').count() === 8, 'v2: 8 baris terakhir');
  const t2 = await tx2(p); assert(t2.includes('45.070') && t2.includes('90.127'), 'v2: tabel memuat 45.070 dan 90.127');
  await (await p.$('#v2')).screenshot({ path: 'shots/m04c-v2.png' });
  await fwd('v2', 4); await A('v2: n = 18 maksimum', '#v2-out', 'n = 18 · langkah 1.441.811', 'n maksimum');
  await sel('#v2-pat', 'a+b'); await fwd('v2', 13); await A('v2: a+b linear', '#v2-out', 'a+b · aⁿ · n = 14 · langkah 33 ·');
  await sel('#v2-pat', 'a*a*b'); await fwd('v2', 13); await A('v2: a*a*b kuadratik', '#v2-out', 'langkah 273');
  await sel('#v2-pat', '(a|aa)+b'); await fwd('v2', 13); await A('v2: (a|aa)+b', '#v2-out', 'langkah 8.970', '× 1,6');
  await sel('#v2-pat', '(a+)+b'); await sel('#v2-str', 'ab'); await fwd('v2', 13); await A('v2: aⁿb cocok', '#v2-out', 'aⁿb · n = 14 · langkah 26', 'cocok');
  assert((await out('#v2-out')).indexOf('tidak cocok') < 0, 'v2: aⁿb tidak berstatus gagal');
  await sel('#v2-str', 'a'); await fwd('v2', 1); await A('v2: n = 2', '#v2-out', 'n = 2 · langkah 25');
  // v3
  await p.locator('#v3').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await A('v3: siap', '#v3-out', 'sentuh config.h · dibangun ulang: main.o, util.o, lib.o, prog · -j 2 · t = 0 dari 8 · berjalan: main.o, util.o');
  assert(await p.locator('#v3-dag .nd').count() === 9 && await p.locator('#v3-dag .nd.touch').count() === 1 && await p.locator('#v3-trk .trk').count() === 4, 'v3: 9 simpul, 1 disentuh, 4 jalur');
  await fwd('v3', 8); await A('v3: config.h j2', '#v3-out', 'total 8 · T₁ = 11 · T∞ = 6 · batas bawah max(T₁/N, T∞) = 6');
  assert(await p.locator('#v3-dag .nd.done').count() === 4, 'v3: 4 target selesai');
  await (await p.$('#v3')).screenshot({ path: 'shots/m04c-v3.png' });
  const mk = async (t, j, n, ...subs) => { await sel('#v3-touch', t); await setr('#v3-j', j); await fwd('v3', n); await A('v3: ' + t + ' j' + j, '#v3-out', ...subs); };
  await mk('config.h', 1, 11, 'total 11'); await mk('config.h', 3, 6, 'total 6'); await mk('config.h', 4, 6, 'total 6', 'batas bawah max(T₁/N, T∞) = 6');
  await mk('util.h', 2, 5, 'dibangun ulang: main.o, util.o, prog', 'total 5 · T₁ = 7 · T∞ = 5', '= 5');
  await mk('util.h', 1, 7, 'total 7', '= 7');
  await mk('util.c', 2, 4, 'dibangun ulang: util.o, prog', 'total 4 · T₁ = 4 · T∞ = 4');
  await mk('main.c', 4, 5, 'dibangun ulang: main.o, prog', 'total 5');
  await mk('lib.c', 2, 6, 'dibangun ulang: lib.o, prog', 'total 6');
  await mk('all', 2, 8, 'total 8'); assert(await p.locator('#v3-dag .nd.touch').count() === 5, 'v3: semua = 5 berkas sumber disentuh');
  await mk('all', 1, 11, 'total 11 · T₁ = 11');
  await sel('#v3-touch', 'none'); await A('v3: none', '#v3-out', 'dibangun ulang: tidak ada', 'total 0'); await A('v3: none jalur', '#v3-trk', "'prog' is up to date");
  await sel('#v3-touch', 'config.h'); await setr('#v3-j', 2);
  // v4
  await p.locator('#v4').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await A('v4: siap', '#v4-out', 'siap · tujuh objek akan dihitung');
  await fwd('v4', 1); await A('v4: blob a1', '#v4-out', 'langkah 1 dari 7', 'blob a.txt v1 = ce013625030ba8dba906f756967f9e9ca394464a');
  await fwd('v4', 6); await A('v4: selesai', '#v4-out', 'commit 2 = 56dbbd480950b764bc030411d15c4eebdec3de6d', 'beda di 37 dari 40 digit', 'objek baru pada commit 2: 3');
  const tab = await out('#v4-tab');
  for (const id of ['ce013625030ba8dba906f756967f9e9ca394464a', 'cc628ccd10742baea8241c5924df992b5c019f71', '18eb80fbbbf9160491c007668d5298f1e86cd40a', '2e47f06f48e8ef4518e26f608e702625635843d7', '94bab17c85ac96c4dd0cfcb7a16f22f6862733eb', '9d57d37999ef33a5ff5794eed721e8766e01051b', '56dbbd480950b764bc030411d15c4eebdec3de6d']) assert(tab.includes(id), 'v4: ID ' + id.slice(0, 8) + ' sama dengan git sungguhan');
  await (await p.$('#v4')).screenshot({ path: 'shots/m04c-v4.png' });
  await set('#v4-a2', 'hello'); await fwd('v4', 7); await A('v4: isi sama', '#v4-out', 'beda di 0 dari 40 digit', 'objek baru pada commit 2: 1');
  await set('#v4-a1', ''); await fwd('v4', 1); await A('v4: blob "\\n"', '#v4-out', '8b137891791fe96927ad78e64b0aad7bded08bdc');
  await set('#v4-a1', 'hello'); await set('#v4-a2', 'hello, git');
  await set('#v4-a1', 'Hello'); await fwd('v4', 7); const dm = await out('#v4-out'); assert(/beda di (3[0-9]|40) dari 40/.test(dm), 'v4: huruf besar mengubah hampir semua digit: ' + dm.match(/beda di \d+ dari 40/));
  await set('#v4-a1', 'hello');
  // kuis dan kartu
  const qz = await p.evaluate(() => { let n = 0, bad = []; return new Promise(res => { function go() { const q = document.querySelector('#kuis .q'); if (!q) return res({ n, bad });
      const bs = [...document.querySelectorAll('#kuis .icd-opt')]; bs[0].click(); const whys = document.querySelectorAll('#kuis .why'); const right = document.querySelectorAll('#kuis .icd-opt.right').length;
      if (whys.length !== bs.length || bs.length !== 4 || right !== 1 || [...whys].some(w => w.textContent.trim().length < 25)) bad.push(n + 1); n++; const nb = document.querySelector('#kuis .icd-btn.primary'); nb.click(); setTimeout(go, 10); } go(); }); });
  assert(qz.n === 14 && qz.bad.length === 0, 'kuis: 14 soal sah ' + JSON.stringify(qz.bad));
  const kc = await p.evaluate(() => ICD.cards.count('m04c-linux-git-make')); assert(kc === 18, 'flashcard 18: ' + kc);
  assert(errs.length === 0, 'tanpa error konsol ' + errs.join('|'));
  const mo = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true })).newPage();
  await mo.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); for (const v of ['v1', 'v2', 'v3', 'v4']) await (await mo.$('#' + v)).screenshot({ path: 'shots/m04c-m-' + v + '.png' });
  const ov = await mo.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert(ov <= 1, 'tanpa scroll horizontal pada 360 px (' + ov + ')');
  await b.close();
})().catch(e => { console.error('CRASH', e.message.split('\n')[0]); process.exit(1); });
async function tx2(p) { return (await p.textContent('#v2-tab')); }
