const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const S = 'http://127.0.0.1:8787/', M = 'http://127.0.0.1:8788';
const state = () => fetch(M + '/__state', { headers: { apikey: 'anon-test-key' } }).then(r => r.json());
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined }); const errs = [];
  const dev = async () => { const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); return p; };
  const A = await dev();
  await A.goto(S + 'm04c-linux-git-make.html'); await A.waitForTimeout(300);
  assert((await A.textContent('.icd-acct')) === 'Masuk', 'tombol Masuk tampil di topbar');
  assert(await A.locator('.icd-top .brand svg.icd-logo').count() === 1 && (await A.textContent('.icd-top .brand')) === 'bikinchip', 'brand bikinchip + logo');
  // progres lokal sebelum login
  await A.click('#s03 .icd-secfoot button:has-text("Tandai")');
  await A.evaluate(() => ICD.store.update('cards', a => { a = a || {}; a['m04c-linux-git-make:perm'] = { file: 'm04c-linux-git-make', ef: 2.5, n: 1, iv: 1, due: 1, seen: 1 }; return a; }));
  // login email: dialog
  await A.click('.icd-acct'); await A.waitForSelector('dialog.icd-dialog');
  await A.fill('dialog input[type=email]', 'salah'); await A.click('dialog button:has-text("Kirim tautan")');
  assert((await A.textContent('dialog')).includes('Alamat email belum benar'), 'validasi email');
  await A.fill('dialog input[type=email]', 'ani@example.com'); await A.click('dialog button:has-text("Kirim tautan")'); await A.waitForTimeout(400);
  assert((await A.textContent('dialog')).includes('Tautan masuk sudah dikirim ke ani@example.com'), 'tautan email terkirim');
  let st = await state(); assert(st.otp.length === 1 && st.otp[0].redirect === S + 'm04c-linux-git-make.html', 'OTP dengan redirect ke halaman ini');
  // login Google (redirect)
  await A.click('dialog button:has-text("Masuk dengan Google")'); await A.waitForURL(/m04c-linux-git-make\.html$/); await A.waitForTimeout(1200);
  assert(!A.url().includes('access_token'), 'token dihapus dari URL');
  assert((await A.textContent('.icd-acct')).includes('Ani'), 'nama pengguna tampil: ' + await A.textContent('.icd-acct'));
  st = await state(); const row = st.rows['11111111-1111-1111-1111-111111111111'];
  assert(row && row.data.progress['m04c-linux-git-make'].sections.s03 === true, 'progres lokal terdorong ke akun');
  // perubahan setelah login otomatis didorong
  await A.click('#s05 .icd-secfoot button:has-text("Tandai")'); await A.waitForTimeout(7000);
  st = await state(); assert(st.rows['11111111-1111-1111-1111-111111111111'].data.progress['m04c-linux-git-make'].sections.s05 === true, 'perubahan baru terdorong otomatis (debounce 4 s)');
  // perangkat B dengan progres lokal lain
  const B = await dev();
  await B.goto(S + 'm00-orientasi.html'); await B.waitForTimeout(300);
  await B.click('#s01 .icd-secfoot button:has-text("Tandai")');
  await B.evaluate(() => ICD.store.update('cards', a => { a = a || {}; a['m04c-linux-git-make:perm'] = { file: 'm04c-linux-git-make', ef: 2.6, n: 3, iv: 6, due: 9, seen: 4 }; return a; }));
  await B.goto(S + 'index.html'); await B.waitForTimeout(300);
  assert(await B.locator('#resume button:has-text("Masuk untuk sinkron")').count() === 1 && await B.locator('#resume a.gh').count() === 1, 'beranda: ajakan masuk dan tautan GitHub');
  await B.click('.icd-acct'); await B.click('dialog button:has-text("Masuk dengan Google")'); await B.waitForURL(/index\.html$/); await B.waitForTimeout(1500);
  const bp = await B.evaluate(() => [ICD.store.get('progress.m04c-linux-git-make.sections.s03'), ICD.store.get('progress.m04c-linux-git-make.sections.s05'), ICD.store.get('progress.m00-orientasi.sections.s01'), ICD.store.get('cards', {})['m04c-linux-git-make:perm'].seen]);
  assert(bp.join() === 'true,true,true,4', 'B: gabungan progres A + lokal B, kartu yang lebih sering diulang menang: ' + bp.join());
  assert((await B.textContent('#b-avail')).includes('2/16'), 'dasbor B memperlihatkan progres dari A');
  assert(await B.locator('#resume .acct').count() === 0, 'ajakan masuk hilang setelah login');
  // A menarik progres B
  await A.reload(); await A.waitForTimeout(1500);
  const ap = await A.evaluate(() => [ICD.store.get('progress.m00-orientasi.sections.s01'), ICD.store.get('cards', {})['m04c-linux-git-make:perm'].seen]);
  assert(ap.join() === 'true,4', 'A: menarik progres B setelah reload: ' + ap.join());
  // token kedaluwarsa -> refresh
  await A.evaluate(() => { const s = JSON.parse(localStorage.getItem('icd.auth')); s.expires_at = Date.now() - 1000; localStorage.setItem('icd.auth', JSON.stringify(s)); });
  await A.evaluate(() => ICD.sync.now()); await A.waitForTimeout(600);
  assert(await A.evaluate(() => JSON.parse(localStorage.getItem('icd.auth')).expires_at > Date.now() && !ICD.sync.state().err), 'token diperbarui otomatis');
  // akun & keluar
  await A.click('.icd-acct'); assert((await A.textContent('dialog')).includes('Ani Wijaya (ani@example.com)'), 'dialog akun');
  await A.click('dialog button:has-text("Keluar")'); await A.waitForTimeout(200);
  assert((await A.textContent('.icd-acct')) === 'Masuk' && await A.evaluate(() => ICD.store.get('progress.m00-orientasi.sections.s01')) === true, 'keluar: tombol Masuk, progres lokal tetap');
  // file:// tidak menampilkan login
  const F = await dev(); await F.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs', 'index.html')).href); await F.waitForTimeout(300);
  assert(await F.locator('.icd-acct').count() === 0, 'versi offline (file://) tanpa tombol masuk');
  await (await (await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true })).newPage()).goto(S + 'index.html');
  const mo = (await b.contexts())[3].pages()[0]; await mo.waitForTimeout(400); await mo.screenshot({ path: 'shots/brand-m-index.png' });
  assert(await mo.evaluate(() => document.documentElement.scrollWidth <= 360), '360 px tanpa scroll horizontal');
  await B.screenshot({ path: 'shots/brand-index.png' });
  assert(errs.length === 0, 'tanpa error halaman ' + errs.join('|'));
  await b.close();
})().catch(e => { console.error('CRASH', e.message); process.exit(1); });
