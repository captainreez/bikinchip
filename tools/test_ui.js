// Alur belajar lintas halaman: beranda, belajar, lesson (tautan Segera, tanda otomatis, lanjutkan), rencana, daftar terbit baru.
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const U = f => require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + f;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  // beranda untuk pengunjung baru
  await p.goto(U('index.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  assert(await p.locator('#resume .resume').count() === 0, 'pengunjung baru: tanpa kartu Lanjutkan');
  assert((await p.textContent('#cta-start')) === 'Mulai dari M00', 'CTA utama: Mulai dari M00');
  const stats = await p.textContent('.statrow'); assert(/35\s*modul/.test(stats) && /98\s*lesson/.test(stats) && /9\s*Part/.test(stats) && /±1\.210\s*jam/.test(stats), 'statistik dari satu sumber: ' + stats.replace(/\s+/g, ' '));
  assert(!/tersedia|\b13\/98/.test(await p.textContent('.pg-hero')), 'hero tidak menampilkan "tersedia" atau 13/98');
  assert(await p.locator('#parts a[href^="kurikulum.html?part="]').count() === 9, 'sembilan kartu Part menaut ke kurikulum.html?part=N');
  await p.goto(U('belajar.html')); await p.waitForTimeout(300);
  assert(await p.isVisible('#empty') && await p.locator('#empty .steps li').count() === 3 && !(await p.isVisible('#dash')), 'belajar: empty state dengan 3 langkah');
  // lesson M04c
  await p.goto(U('m04c-linux-git-make.html')); await p.waitForTimeout(300);
  const nx = p.locator('.icd-nav a.next'); assert((await nx.getAttribute('href')) === 'belajar.html#kartu' && (await nx.textContent()).includes('Segera'), 'berikutnya M04d bertanda Segera');
  const soon = p.locator('#s16 a.icd-soon'); assert(await soon.count() === 1, 'tautan M04d di rujukan bertanda Segera');
  assert(/\S\sSegera$/.test((await soon.textContent()).trim()), 'ada spasi antara teks tautan dan badge Segera: ' + (await soon.textContent()).trim());
  await soon.click({ force: true }); await p.waitForTimeout(200); assert(p.url().endsWith('m04c-linux-git-make.html'), 'klik tautan Segera tidak pindah halaman');
  assert(await p.locator('a.icd-soon[href="m04b-assembly-toolchain-os.html"]').count() === 0, 'tautan M04b tetap normal');
  assert((await p.title()) === 'M04c Linux, shell, Git, Make, regex · bikinchip' || /· bikinchip$/.test(await p.title()), 'title lesson berakhir "· bikinchip": ' + (await p.title()));
  // tanda otomatis
  await p.evaluate(() => document.querySelector('#s02').scrollIntoView());
  const need = await p.evaluate(() => Math.min(180, Math.max(10, Math.round(document.querySelector('#s02').textContent.split(/\s+/).length / 6))));
  await p.locator('#s02 .icd-secend').scrollIntoViewIfNeeded(); await p.waitForTimeout((need + 2) * 1000);
  assert(await p.evaluate(() => ICD.store.get('progress.m04c-linux-git-make.sections.s02', false)) === true, 's02 ditandai otomatis setelah ' + need + ' detik');
  assert(await p.evaluate(() => ICD.store.get('progress.m04c-linux-git-make.sections.s01', false)) === false, 's01 (cuma lewat) tidak ditandai');
  await p.evaluate(() => document.querySelector('#s07').scrollIntoView()); await p.waitForTimeout(1800);
  assert(await p.evaluate(() => ICD.store.get('progress.m04c-linux-git-make.last')) === 's07', 'section terakhir tersimpan s07');
  await p.goto(U('m04c-linux-git-make.html')); await p.waitForTimeout(300);
  assert(await p.locator('.icd-resume').count() === 1 && (await p.textContent('.icd-resume')).includes('Contoh soal'), 'banner lanjut membaca');
  await p.click('.icd-resume a'); await p.waitForTimeout(300); assert(p.url().endsWith('#s07'), 'lompat ke #s07');
  // beranda dan belajar setelah ada progres
  await p.goto(U('index.html')); await p.waitForTimeout(300);
  const rs = await p.textContent('#resume'); assert(rs.includes('M04c') && rs.includes('1 dari 16 section'), 'beranda: kartu Lanjutkan M04c: ' + rs.replace(/\s+/g, ' ').slice(0, 120));
  assert(await p.locator('#resume a[href="m04c-linux-git-make.html#s07"]').count() === 1, 'Lanjutkan menuju #s07');
  await p.goto(U('belajar.html')); await p.waitForTimeout(300);
  assert(await p.isVisible('#dash') && !(await p.isVisible('#empty')), 'belajar: dashboard tampil setelah ada progres');
  assert((await p.textContent('#stats')).includes('flashcard jatuh tempo') && (await p.textContent('#stats')).includes('beruntun'), 'belajar: kartu statistik (streak, flashcard)');
  assert(await p.evaluate(() => ICD.progress.streak()) >= 1, 'streak minimal 1 hari');
  // rencana 3 minggu lalu
  await p.click('#plan-form summary'); const iso = new Date(Date.now() - 22 * 864e5).toISOString().slice(0, 10);
  await p.fill('#p-hours', '10'); await p.fill('#p-start', iso); await p.click('#p-make'); await p.waitForTimeout(200);
  const wk = await p.textContent('#b-week'); assert(wk.includes('Minggu ke-4'), 'rencana: minggu ke-4: ' + wk.replace(/\s+/g, ' ').slice(0, 160));
  await p.fill('#p-start', new Date(Date.now() - 6 * 7 * 864e5).toISOString().slice(0, 10)); await p.fill('#p-hours', '40'); await p.click('#p-make'); await p.waitForTimeout(200);
  assert((await p.textContent('#b-week')).includes('Segera') && (await p.textContent('#b-week')).includes('belum terbit'), 'minggu dengan lesson belum terbit memakai badge Segera');
  // daftar terbit baru dari penyimpanan
  await p.evaluate(() => { const a = ICD.avail.list(); a.push('m04d-python-tcl-algoritma'); ICD.store.set('meta.built', { list: a, core: '9.9' }); });
  await p.goto(U('m04c-linux-git-make.html')); await p.waitForTimeout(300);
  assert(await p.locator('.icd-nav a.next').getAttribute('href') === 'm04d-python-tcl-algoritma.html', 'daftar terbit baru: M04d jadi tautan biasa');
  // 360 px semua halaman utama
  const mo = await (await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true })).newPage();
  for (const pg of ['index', 'kurikulum', 'belajar', 'glosarium', 'tools', 'referensi', 'pengaturan', 'tentang', 'styleguide', 'm04c-linux-git-make']) {
    await mo.goto(U(pg + '.html')); await mo.waitForTimeout(250);
    assert(await mo.evaluate(() => document.documentElement.scrollWidth <= 360), `${pg}: 360 px tanpa scroll horizontal`);
  }
  assert(errs.length === 0, 'tanpa error konsol ' + errs.join(' | '));
  await b.close();
})().catch(e => { console.error('CRASH', e.message); process.exit(1); });
