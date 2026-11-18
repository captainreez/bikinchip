// Halaman utama: kurikulum (filter, graf, keyboard), glosarium, tools, pengaturan, palet pencarian, nav, bahasa UI.
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const U = f => require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + f;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined }); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  // ---- global: landmark, nav 5 item, teks internal
  const PAGES = ['index', 'kurikulum', 'belajar', 'glosarium', 'tools', 'referensi', 'pengaturan', 'tentang', 'styleguide', 'm00-orientasi'];
  for (const pg of PAGES) {
    await p.goto(U(pg + '.html')); await p.waitForTimeout(250);
    const g = await p.evaluate(() => ({ h1: document.querySelectorAll('h1').length, hdr: document.querySelectorAll('body > header').length, nav: document.querySelectorAll('.icd-mainnav a').length, main: document.querySelectorAll('main').length, ftr: document.querySelectorAll('footer').length, title: document.title, txt: document.body.innerText,
      cur: document.querySelectorAll('.icd-mainnav a[aria-current=page]').length, lang: document.documentElement.lang }));
    assert(g.h1 === 1 && g.hdr === 1 && g.main === 1 && g.ftr === 1 && g.nav === 5, `${pg}: landmark (1 h1, header, main, footer) dan 5 item nav`);
    assert(/bikinchip/.test(g.title) && g.lang === 'id', `${pg}: title "${g.title}"`);
    if (pg !== 'm00-orientasi' && pg !== 'styleguide') assert(!/Fase D|ICD-Core|icd\.v1|uji komponen|tanda uji|http\.server|Untuk pengembang/i.test(g.txt), `${pg}: tanpa teks internal`);
    if (!['m00-orientasi', 'index', 'styleguide', 'glosarium', 'referensi'].includes(pg)) assert(!/\bfile\b/i.test(g.txt.replace(/berkas/g, '')), `${pg}: kata "file" tidak muncul ke pengguna`);
  }
  for (const [pg, cur] of [['kurikulum', 'Kurikulum'], ['belajar', 'Belajar'], ['glosarium', 'Glosarium'], ['tools', 'Tools'], ['tentang', 'Tentang'], ['m00-orientasi', 'Kurikulum']]) {
    await p.goto(U(pg + '.html')); await p.waitForTimeout(150);
    assert((await p.textContent('.icd-mainnav a[aria-current=page]')) === cur, `${pg}: nav aktif = ${cur}`);
  }
  // ---- kurikulum
  await p.goto(U('kurikulum.html?part=5')); await p.waitForTimeout(300);
  assert(await p.getAttribute('#part-chips button:has-text("5 ·")', 'aria-pressed') === 'true', 'chip Part dari ?part=5 aktif');
  const dim = await p.evaluate(() => [...document.querySelectorAll('#graph .node')].map(n => [n.dataset.mod, n.classList.contains('dim')]));
  assert(dim.filter(x => !x[1]).map(x => x[0]).join() === 'M16,M17,M18,M19,M20' && dim.length === 35, 'filter Part 5: hanya M16-M20 tidak diredupkan');
  await p.click('#view-tabs [role=tab]:has-text("Daftar")'); await p.waitForTimeout(100);
  const lst = await p.locator('#modlist .modbtn').count(); assert(lst === 5, 'daftar menampilkan 5 modul Part 5 (bukan semua): ' + lst);
  await p.click('#part-chips button:has-text("Semua")'); assert(await p.locator('#modlist .modbtn').count() === 35, 'Semua: 35 modul');
  await p.selectOption('#track', 'ams'); const nl = await p.locator('#modlist .modbtn').count(); assert(nl > 0 && nl < 35, 'filter Track mempersempit daftar: ' + nl);
  await p.click('#view-tabs [role=tab]:has-text("Graf")'); await p.selectOption('#track', '');
  assert(await p.evaluate(() => document.querySelector('#graph [data-mod="M18"]').textContent.includes('Verifikasi fungsional')), 'node graf menampilkan nama lengkap');
  // keyboard graf
  await p.focus('#graph [data-mod="M00"]'); await p.keyboard.press('ArrowRight');
  const f1 = await p.evaluate(() => document.activeElement.dataset.mod); assert(f1 === 'M01' || f1 === 'M34', 'panah kanan pindah ke kolom berikutnya: ' + f1);
  await p.keyboard.press('Enter'); assert((await p.textContent('#detail')).includes(f1), 'Enter memilih node dan membuka detail');
  assert(await p.locator('#graph .node[tabindex="0"]').count() === 1, 'roving tabindex: satu node dapat di-Tab');
  const sc0 = await p.evaluate(() => document.querySelector('#graph').getAttribute('width')); await p.click('#z-in'); const sc1 = await p.evaluate(() => document.querySelector('#graph').getAttribute('width')); assert(+sc1 > +sc0, 'zoom in memperbesar graf');
  await p.click('#z-fit'); const sc2 = await p.evaluate(() => +document.querySelector('#graph').getAttribute('width')); assert(sc2 <= 1100, 'Pas memuat graf ke lebar layar: ' + sc2);
  await p.goto(U('kurikulum.html?modul=M06')); await p.waitForTimeout(300);
  const dt = await p.textContent('#detail'); assert(dt.includes('M06') && dt.includes('Segera') && dt.includes('Prasyarat') && dt.includes('M05'), 'deep link ?modul=M06: detail dengan prasyarat dan badge Segera');
  await p.goto(U('kurikulum.html?modul=M04')); await p.waitForTimeout(300);
  assert(await p.locator('#detail a.icd-btn.primary:has-text("Mulai"), #detail a.icd-btn.primary:has-text("Lanjutkan")').count() === 1, 'detail M04: tombol Mulai/Lanjutkan');
  // ---- glosarium
  await p.goto(U('glosarium.html')); await p.waitForTimeout(300);
  const nTerms = await p.locator('.term').count(); assert(nTerms > 200, 'glosarium induk memuat >200 istilah: ' + nTerms);
  assert(await p.locator('#az a').count() >= 10, 'indeks A–Z');
  await p.fill('#g-q', 'setup'); await p.waitForTimeout(100);
  assert(await p.locator('mark.hit').count() > 0 && await p.locator('.term').count() < nTerms, 'pencarian menyorot kata');
  await p.fill('#g-q', ''); await p.selectOption('#g-mod', 'M09'); const nm = await p.locator('.term').count(); assert(nm > 0 && nm < nTerms, 'filter modul M09: ' + nm);
  await p.selectOption('#g-mod', ''); await p.goto(U('glosarium.html#istilah-setup-time')); await p.waitForTimeout(500);
  assert(await p.evaluate(() => { const e = document.getElementById('istilah-setup-time'); const r = e && e.getBoundingClientRect(); return !!r && r.top >= 56 && r.bottom < innerHeight; }), 'anchor #istilah-setup-time terlihat di bawah header');
  // tooltip di lesson menaut ke glosarium
  await p.goto(U('m02b-transien-ac.html')); await p.waitForTimeout(300);
  const term = p.locator('button.icd-term').first(); await term.hover(); await p.waitForTimeout(500);
  assert(await p.locator('.icd-tip a[href^="glosarium.html#istilah-"]').count() === 1, 'tooltip istilah (hover) berisi tautan ke glosarium');
  // ---- tools
  await p.goto(U('tools.html#rc')); await p.waitForTimeout(300);
  assert((await p.textContent('#c-box')).includes('Konstanta waktu RC') && await p.getAttribute('#tabs [role=tab][aria-selected=true]', 'tabindex') === '0', 'deep link tools.html#rc');
  await p.fill('#c-box input >> nth=0', 'abc'); await p.waitForTimeout(100);
  assert(await p.getAttribute('#c-box input >> nth=0', 'aria-invalid') === 'true' && (await p.textContent('#c-box')).includes('Tidak terbaca') && (await p.textContent('#c-box')).includes('Perbaiki'), 'validasi inline: pesan error jelas');
  await p.fill('#c-box input >> nth=0', '10k'); await p.waitForTimeout(100);
  assert(await p.getAttribute('#c-box input >> nth=0', 'aria-invalid') === 'false', 'masukan benar menghapus error');
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await p.click('#c-box button:has-text("Salin hasil")'); await p.waitForTimeout(300);
  const clip = await p.evaluate(() => navigator.clipboard.readText().catch(() => 'x')); assert(clip === 'x' || /Konstanta waktu RC/.test(clip), 'tombol salin hasil: ' + clip.slice(0, 40).replace(/\n/g, ' '));
  await p.click('#tabs [role=tab]:has-text("Slack")'); assert(p.url().endsWith('#slack'), 'memilih tab memperbarui hash');
  // ---- pengaturan
  await p.goto(U('pengaturan.html')); await p.waitForTimeout(300);
  await p.click('#tema label:has-text("Gelap")'); assert(await p.getAttribute('html', 'data-theme') === 'dark', 'tema gelap dapat dipilih');
  await p.reload(); assert(await p.getAttribute('html', 'data-theme') === 'dark', 'pilihan tema tersimpan');
  await p.click('#tema label:has-text("Ikut sistem")');
  await p.evaluate(() => ICD.store.set('bookmarks', [{ file: 'm00-orientasi', sec: 's01', title: 'x', at: 1 }]));
  await p.click('#d-reset'); const dlg = p.locator('dialog.icd-dialog');
  assert((await dlg.textContent()).includes('Ekspor cadangan dulu') && await dlg.locator('input').count() === 1, 'reset: dialog menyarankan ekspor dan meminta mengetik "hapus"');
  await dlg.locator('button.danger').click(); assert(await dlg.count() === 1 && await p.evaluate(() => ICD.store.get('bookmarks').length) === 1, 'reset tanpa mengetik kata tidak menghapus');
  await dlg.locator('input').fill('hapus'); await dlg.locator('button.danger').click(); await p.waitForTimeout(200);
  assert(await p.evaluate(() => ICD.store.get('bookmarks').length) === 0 && (await p.textContent('#fb')).includes('dihapus'), 'reset dengan "hapus" menghapus data dan memberi umpan balik');
  const bad = require('os').tmpdir() + '/bad.json'; require('fs').writeFileSync(bad, '{nope');
  await p.setInputFiles('#d-file', bad); await p.waitForTimeout(200); assert((await p.textContent('#fb')).includes('Impor gagal'), 'impor berkas rusak: pesan gagal');
  const good = require('os').tmpdir() + '/good.json'; require('fs').copyFileSync(require('path').join(__dirname, 'fixtures', 'icd-1.4.0.json'), good);
  await p.setInputFiles('#d-file', good); await p.waitForTimeout(200); assert((await p.textContent('#imp-sum')).includes('flashcard'), 'impor: ringkasan isi berkas');
  await p.click('#imp-merge'); await p.waitForTimeout(200); assert((await p.textContent('#fb')).includes('Impor berhasil') && await p.evaluate(() => ICD.store.get('bookmarks').length) === 2, 'impor berhasil dan data masuk');
  assert(await p.evaluate(() => !!document.querySelector('label[for="d-file"]')), 'input impor punya label');
  // ---- palet pencarian
  await p.goto(U('kurikulum.html')); await p.waitForTimeout(300);
  await p.keyboard.press('Control+k'); assert(await p.locator('dialog.icd-palette input').evaluate(e => e === document.activeElement), 'Ctrl+K membuka palet, fokus di kolom cari');
  await p.keyboard.type('setup'); await p.waitForTimeout(600);
  const items = await p.locator('.icd-pal-list li').allTextContents(); assert(items.some(t => /Section/i.test(t)) || items.some(t => /Istilah/i.test(t)), 'palet menemukan section/istilah: ' + items.slice(0, 2).join(' | ').slice(0, 100));
  await p.keyboard.press('Escape'); assert(await p.locator('dialog.icd-palette').count() === 0, 'Esc menutup palet');
  await p.keyboard.press('/'); assert(await p.locator('dialog.icd-palette').count() === 1, 'tombol / membuka palet'); await p.keyboard.press('Escape');
  await p.waitForTimeout(300); await p.keyboard.press('Control+k'); await p.waitForSelector('dialog.icd-palette input:focus'); await p.keyboard.type('pengaturan'); await p.waitForSelector('.icd-pal-list li:has-text("Pengaturan")'); await p.waitForTimeout(700); console.log('      palet:', (await p.locator('.icd-pal-list li').first().textContent()).slice(0, 40)); await p.keyboard.press('Enter'); await p.waitForURL(/pengaturan\.html/); assert(true, 'Enter di palet membuka halaman');
  // ---- bottom nav hanya di ponsel
  assert(!(await p.isVisible('.icd-bottomnav')), 'desktop: bottom nav tersembunyi');
  const mo = await (await b.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true })).newPage(); await mo.goto(U('belajar.html')); await mo.waitForTimeout(250);
  assert(await mo.isVisible('.icd-bottomnav') && !(await mo.isVisible('.icd-mainnav')) && await mo.locator('.icd-bottomnav a').count() === 5, 'ponsel: bottom nav 5 item, bukan pill yang digulir');
  const small = await mo.evaluate(() => [...document.querySelectorAll('.icd-bottomnav a, .icd-top .icd-btn')].filter(e => { const r = e.getBoundingClientRect(); return r.height < 36 || r.width < 36; }).length); assert(small === 0, 'target sentuh header/bottom nav memadai');
  assert(errs.length === 0, 'tanpa error halaman ' + errs.join(' | '));
  await b.close();
})().catch(e => { console.log('CRASH ' + e.message); process.exit(1); });
