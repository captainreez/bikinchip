// Uji alur akun bikinchip terhadap server tiruan (tools/mock_supabase.js). Bangun situs uji dengan config requireLogin+google.
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const S = 'http://127.0.0.1:8787/', M = 'http://127.0.0.1:8788';
const st = () => fetch(M + '/__state', { headers: { apikey: 'anon-test-key' } }).then(r => r.json());
const lastMail = async kind => (await st()).mails.filter(m => m.kind === kind).pop();
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined }); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  const msg = () => p.textContent('#msg');
  // gerbang
  await p.goto(S + 'index.html'); await p.waitForURL(/masuk\.html\?next=index\.html$/);
  assert(true, 'beranda tanpa akun dialihkan ke masuk.html?next=index.html');
  await p.goto(S + 'm04c-linux-git-make.html#s07'); await p.waitForURL(/masuk\.html/);
  assert(decodeURIComponent(p.url()).endsWith('next=m04c-linux-git-make.html#s07'), 'tujuan asli (dengan #bagian) dibawa: ' + decodeURIComponent(p.url().split('?')[1]));
  assert(await p.isVisible('#v-main') && await p.isVisible('#g-btn') && await p.isHidden('#v-off'), 'formulir dan tombol Google tampil');
  assert((await p.textContent('.pitch h1')) === 'Ayo jadi chip designer Indonesia.', 'judul pitch');
  assert(await p.locator('#path li').count() === 9 && (await p.textContent('#trust')).includes('35 modul'), 'sembilan bagian dan angka');
  await p.screenshot({ path: 'shots/masuk-desktop.png' });
  // daftar
  await p.click('#t-up'); await p.fill('#up-name', 'Ani Wijaya'); await p.fill('#up-email', 'ani@example.com'); await p.fill('#up-pw', 'pendek');
  await p.click('#f-up button[type=submit]'); assert((await msg()).includes('minimal 8 karakter'), 'validasi panjang sandi');
  await p.fill('#up-pw', 'rahasia123'); await p.click('#f-up button[type=submit]'); assert((await msg()).includes('persetujuan kebijakan privasi'), 'wajib setuju privasi');
  await p.check('#up-ok'); await p.click('#f-up button[type=submit]'); await p.waitForTimeout(500);
  assert((await msg()).includes('tautan konfirmasi ke ani@example.com') && (await msg()).includes('sekali saja'), 'daftar: minta konfirmasi sekali');
  // masuk sebelum konfirmasi
  await p.click('#t-in'); await p.fill('#in-email', 'ani@example.com'); await p.fill('#in-pw', 'rahasia123'); await p.click('#f-in button[type=submit]'); await p.waitForTimeout(400);
  assert((await msg()).includes('Email belum dikonfirmasi'), 'belum konfirmasi: pesan jelas');
  await p.click('#msg .lnk'); await p.waitForTimeout(400); assert((await msg()).includes('dikirim ulang'), 'kirim ulang konfirmasi');
  // klik tautan konfirmasi
  const conf = await lastMail('signup'); assert(conf.link.startsWith(S + 'masuk.html?next=m04c-linux-git-make.html'), 'tautan konfirmasi kembali ke masuk.html dengan tujuan');
  await p.goto(conf.link); await p.waitForURL(/m04c-linux-git-make\.html#s07$/, { timeout: 8000 });
  assert(true, 'konfirmasi → langsung ke halaman tujuan (#s07)');
  await p.waitForTimeout(500); assert((await p.textContent('.icd-acct')).includes('Ani'), 'nama di topbar setelah konfirmasi');
  const ex = await p.evaluate(() => JSON.parse(localStorage.getItem('icd.auth')).expires_at - Date.now());
  assert(ex > 3000e3 && ex <= 3600e3, 'masa berlaku sesi wajar (~1 jam): ' + Math.round(ex / 1000) + ' s');
  // keluar
  await p.click('.icd-acct'); await p.click('dialog button:has-text("Keluar")'); await p.waitForURL(/masuk\.html/);
  assert(true, 'keluar → kembali ke halaman masuk');
  await p.goto(S + 'index.html'); await p.waitForURL(/masuk\.html/); assert(true, 'setelah keluar, beranda kembali terkunci');
  // sandi salah, lalu benar (tanpa email lagi)
  await p.fill('#in-email', 'ani@example.com'); await p.fill('#in-pw', 'salah12345'); await p.click('#f-in button[type=submit]'); await p.waitForTimeout(400);
  assert((await msg()) === 'Email atau kata sandi salah.', 'sandi salah');
  const mailsBefore = (await st()).mails.length;
  await p.fill('#in-pw', 'rahasia123'); await p.click('#f-in button[type=submit]'); await p.waitForURL(/index\.html$/, { timeout: 8000 });
  assert((await st()).mails.length === mailsBefore, 'masuk dengan sandi → beranda, tanpa email baru');
  await p.goto(S + 'masuk.html'); await p.waitForURL(/index\.html$/); assert(true, 'sudah masuk: masuk.html langsung ke beranda');
  await p.click('.icd-acct'); await p.click('dialog button:has-text("Keluar")'); await p.waitForURL(/masuk\.html/);
  // lupa sandi
  await p.fill('#in-email', 'ani@example.com'); await p.click('#to-forgot'); assert(await p.isVisible('#v-forgot') && (await p.inputValue('#fg-email')) === 'ani@example.com', 'lupa sandi: email terbawa');
  await p.click('#v-forgot button[type=submit]'); await p.waitForTimeout(400); assert((await p.textContent('#fg-msg')).includes('tautan untuk membuat kata sandi baru'), 'tautan reset dikirim');
  const rec = await lastMail('recovery'); await p.goto(rec.link); await p.waitForSelector('#v-reset:not([hidden])', { timeout: 8000 });
  assert(true, 'tautan reset → formulir sandi baru');
  await p.fill('#rs-pw', 'barubaru99'); await p.fill('#rs-pw2', 'beda'); await p.click('#v-reset button[type=submit]'); assert((await p.textContent('#rs-msg')).includes('tidak sama'), 'sandi baru tidak cocok');
  await p.fill('#rs-pw2', 'barubaru99'); await p.click('#v-reset button[type=submit]'); await p.waitForURL(/index\.html$/, { timeout: 8000 });
  assert(true, 'sandi baru tersimpan → beranda');
  await p.click('.icd-acct'); await p.click('dialog button:has-text("Keluar")'); await p.waitForURL(/masuk\.html/);
  await p.fill('#in-email', 'ani@example.com'); await p.fill('#in-pw', 'barubaru99'); await p.click('#f-in button[type=submit]'); await p.waitForURL(/index\.html$/, { timeout: 8000 });
  assert(true, 'masuk dengan sandi baru');
  // privasi: hapus data server
  await p.goto(S + 'privasi.html'); await p.waitForTimeout(800);
  assert((await st()).rows['11111111-1111-1111-1111-111111111111'] !== undefined, 'ada data di server sebelum dihapus');
  assert(await p.isVisible('#pv-del'), 'tombol hapus data tampil');
  await p.click('#pv-btn'); await p.click('dialog button:has-text("Hapus")'); await p.waitForURL(/masuk\.html/, { timeout: 8000 });
  assert((await st()).rows['11111111-1111-1111-1111-111111111111'] === undefined, 'data belajar di server terhapus dan keluar');
  // Google
  const g = await (await b.newContext()).newPage(); g.on('pageerror', e => errs.push(e.message));
  await g.goto(S + 'm00-orientasi.html'); await g.waitForURL(/masuk\.html/); await g.click('#g-btn'); await g.waitForURL(/m00-orientasi\.html$/, { timeout: 8000 });
  assert(true, 'Google → kembali ke halaman asal');
  // privasi publik
  const pv = await (await b.newContext()).newPage(); await pv.goto(S + 'privasi.html'); await pv.waitForTimeout(300);
  assert(pv.url().endsWith('privasi.html') && await pv.isHidden('#pv-del'), 'privasi bisa dibaca tanpa akun');
  // next tidak boleh keluar situs
  await pv.goto(S + 'masuk.html?next=https%3A%2F%2Fevil.example%2F'); await pv.evaluate(() => ICD.store && 0);
  const src = await pv.evaluate(() => { const s = [...document.scripts].pop().textContent; return /\^\[a-z0-9-\]\+\\\.html/.test(s); }); assert(src, 'parameter next dibatasi ke halaman situs');
  // offline
  const off = await (await b.newContext()).newPage(); const site = require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/';
  await off.goto(site + 'index.html'); await off.waitForTimeout(300); assert(off.url().endsWith('index.html') && await off.locator('.icd-acct').count() === 0, 'offline: beranda tanpa gerbang');
  await off.goto(site + 'masuk.html'); await off.waitForTimeout(300); assert(await off.isVisible('#v-off'), 'offline: masuk.html menampilkan pesan versi offline');
  // mobile
  const mo = await (await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true })).newPage();
  await mo.goto(S + 'masuk.html'); await mo.waitForTimeout(500); await mo.screenshot({ path: 'shots/masuk-m.png', fullPage: true });
  assert(await mo.evaluate(() => document.documentElement.scrollWidth <= 360), 'masuk.html 360 px tanpa scroll horizontal');
  await mo.emulateMedia({ colorScheme: 'dark' }); await mo.evaluate(() => ICD.theme.set('dark')); await mo.screenshot({ path: 'shots/masuk-m-dark.png' });
  assert(errs.length === 0, 'tanpa error halaman ' + errs.join('|'));
  await b.close();
})().catch(e => { console.error('CRASH', e.message.split('\n')[0]); process.exit(1); });
