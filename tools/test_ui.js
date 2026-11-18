const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const U = f => require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + f;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(U('index.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  const st = await p.textContent('#b-status'); assert(/13 dari \d+ file modul sudah tersedia; berikutnya dibuat: M04d/.test(st), 'status ketersediaan: ' + st);
  assert(await p.locator('#b-avail tbody tr').count() === 13, 'tabel materi tersedia 13 baris');
  assert(await p.locator('#b-avail .icd-chip.new').count() === 13, 'semua bertanda baru di browser kosong');
  assert((await p.textContent('#b-next')).includes('M00 · Orientasi') && await p.locator('#b-next a:has-text("Mulai")').count() === 1, 'langkah berikutnya: mulai M00');
  assert((await p.textContent('#b-week')).includes('Belum ada rencana'), 'tanpa rencana');
  await p.screenshot({ path: 'shots/ui-index-awal.png', fullPage: false });
  // m04c: next soon, link soon
  await p.goto(U('m04c-linux-git-make.html')); await p.waitForTimeout(300);
  const nx = await p.locator('.icd-nav a.next').getAttribute('href'); assert(nx === 'index.html#belajar' && (await p.textContent('.icd-nav a.next')).includes('segera hadir'), 'nav berikutnya: segera hadir');
  const soon = p.locator('#s16 a.icd-soon'); assert(await soon.count() === 1, 'tautan M04d di rujukan bertanda segera');
  await soon.click({ force: true }); await p.waitForTimeout(200); assert(p.url().endsWith('m04c-linux-git-make.html'), 'klik tautan segera tidak pindah halaman');
  assert(await p.locator('a.icd-soon[href="m04b-assembly-toolchain-os.html"]').count() === 0, 'tautan M04b tetap normal');
  // auto read s02
  await p.locator('#s02 .icd-secfoot').scrollIntoViewIfNeeded(); await p.evaluate(() => document.querySelector('#s02').scrollIntoView());
  await p.locator('#s02 .icd-secfoot').scrollIntoViewIfNeeded();
  const need = await p.evaluate(() => Math.min(180, Math.max(10, Math.round(document.querySelector('#s02').textContent.split(/\s+/).length / 6))));
  console.log('      s02 butuh', need, 'detik');
  await p.waitForTimeout((need + 2) * 1000);
  const auto = await p.evaluate(() => ICD.store.get('progress.m04c-linux-git-make.sections.s02', false)); assert(auto === true, 's02 ditandai otomatis setelah ' + need + ' s');
  assert((await p.textContent('#s02 .icd-secfoot')).includes('Selesai dibaca'), 'tombol berubah menjadi selesai');
  const s01 = await p.evaluate(() => ICD.store.get('progress.m04c-linux-git-make.sections.s01', false)); assert(s01 === false, 's01 (cuma lewat) tidak ditandai');
  await p.locator('#s07').scrollIntoViewIfNeeded(); await p.evaluate(() => document.querySelector('#s07').scrollIntoView()); await p.waitForTimeout(1800);
  assert(await p.evaluate(() => ICD.store.get('progress.m04c-linux-git-make.last')) === 's07', 'bagian terakhir tersimpan s07');
  // resume banner
  await p.goto(U('m04c-linux-git-make.html')); await p.waitForTimeout(300);
  assert(await p.locator('.icd-resume').count() === 1 && (await p.textContent('.icd-resume')).includes('Contoh soal'), 'banner lanjut membaca');
  await p.screenshot({ path: 'shots/ui-resume.png' });
  await p.click('.icd-resume a'); await p.waitForTimeout(300); assert(p.url().endsWith('#s07'), 'lompat ke #s07');
  // index after
  await p.goto(U('index.html')); await p.waitForTimeout(300);
  const nt = await p.textContent('#b-next'); assert(nt.includes('M04c · Linux') && nt.includes('1 dari 16 bagian dibaca'), 'langkah berikutnya = M04c: ' + nt.slice(0, 120));
  assert(await p.locator('#b-next a[href="m04c-linux-git-make.html#s07"]').count() === 1, 'tombol lanjut ke #s07');
  assert((await p.textContent('#b-next')).includes('Masih terbuka lebih awal di urutan: M00'), 'mengingatkan M00 yang belum selesai');
  assert(await p.locator('#b-avail .icd-chip.new').count() === 12, 'M04c tidak lagi baru');
  // plan 3 minggu lalu
  const d = new Date(Date.now() - 22 * 864e5); const iso = d.toISOString().slice(0, 10);
  await p.fill('#p-hours', '10'); await p.fill('#p-start', iso); await p.click('#p-make'); await p.waitForTimeout(200);
  const wk = await p.textContent('#b-week'); assert(wk.includes('Minggu ke-4'), 'minggu ke-4: ' + wk.slice(0, 200));
  console.log('      ', wk.replace(/\s+/g, ' ').slice(0, 300));
  await p.screenshot({ path: 'shots/ui-belajar.png' });
  await p.fill('#p-start', new Date(Date.now() - 6 * 7 * 864e5).toISOString().slice(0, 10)); await p.fill('#p-hours', '40'); await p.click('#p-make'); await p.waitForTimeout(200);
  const wk2 = await p.textContent('#b-week'); assert(wk2.includes('segera') && wk2.includes('belum dibuat'), 'minggu dengan materi belum ada: chip segera');
  // halaman lama mempelajari daftar baru
  await p.evaluate(() => { const a = ICD.avail.list(); a.push('m04d-python-tcl-algoritma'); ICD.store.set('meta.built', { list: a, core: '9.9' }); });
  await p.goto(U('m04c-linux-git-make.html')); await p.waitForTimeout(300);
  assert(await p.locator('.icd-nav a.next').getAttribute('href') === 'm04d-python-tcl-algoritma.html', 'daftar baru dari penyimpanan: M04d jadi tautan biasa');
  await p.goto(U('index.html')); await p.waitForTimeout(300);
  assert((await p.textContent('#b-status')).includes('14 dari'), 'beranda: 14 tersedia');
  // auto-read off
  await p.uncheck('#d-auto'); assert(await p.evaluate(() => ICD.store.get('settings.autoRead')) === false, 'tanda otomatis bisa dimatikan');
  await p.check('#d-auto');
  assert(errs.length === 0, 'tanpa error konsol ' + errs.join(' | '));
  const mo = await (await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true })).newPage();
  await mo.goto(U('index.html')); await mo.waitForTimeout(300); await (await mo.$('#belajar')).screenshot({ path: 'shots/ui-m-belajar.png' });
  assert(await mo.evaluate(() => document.documentElement.scrollWidth <= 360), 'beranda 360 px tanpa scroll horizontal');
  await b.close();
})().catch(e => { console.error('CRASH', e.message); process.exit(1); });
