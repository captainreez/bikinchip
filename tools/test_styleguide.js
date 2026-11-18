// Styleguide: semua komponen tampil, tabs bisa dipakai keyboard, dialog konfirmasi menuntut kata, kontras terang+gelap, 360 px.
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const U = f => require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + f;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined }); const errs = [];
  for (const scheme of ['light', 'dark']) {
    const c = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme }); const p = await c.newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(U('styleguide.html')); await p.waitForTimeout(300);
    assert(await p.getAttribute('html', 'data-theme') === scheme, `tema mengikuti sistem: ${scheme}`);
    const bad = await p.evaluate(() => [...document.querySelectorAll('.sg-sw .meta span')].filter(s => s.textContent.includes('✗')).map(s => s.parentNode.textContent));
    assert(bad.length === 0, `${scheme}: tidak ada swatch di bawah AA ${bad.join('|')}`);
    assert(await p.locator('.sg-sw > div').count() >= 11, `${scheme}: swatch tampil`);
    if (scheme === 'light') {
      await p.focus('#sg-tabs [role=tab]'); await p.keyboard.press('ArrowRight');
      assert(await p.getAttribute('#sg-tabs [role=tab]:nth-child(2)', 'aria-selected') === 'true' && (await p.textContent('#sg-tabs-out')).includes('kedua'), 'tabs: panah kanan memilih tab dua');
      await p.keyboard.press('End'); assert((await p.textContent('#sg-tabs-out')).includes('ketiga'), 'tabs: End ke tab terakhir');
      await p.click('#sg-dialog'); const d = p.locator('dialog.icd-dialog');
      await d.locator('button.danger').click(); assert(await d.count() === 1, 'dialog tetap terbuka jika kata belum diketik');
      await d.locator('input').fill('hapus'); await d.locator('button.danger').click(); await p.waitForTimeout(200);
      assert(await p.locator('dialog.icd-dialog').count() === 0, 'dialog tertutup setelah mengetik "hapus"');
      const small = await p.evaluate(() => [...document.querySelectorAll('.sg .icd-btn:not(.small)')].filter(x => x.getBoundingClientRect().height < 43.5).length);
      assert(small === 0, 'semua tombol standar ≥ 44 px');
    }
    await p.screenshot({ path: `shots/styleguide-${scheme}.png`, fullPage: true }); await c.close();
  }
  const m = await (await b.newContext({ viewport: { width: 360, height: 800 } })).newPage(); await m.goto(U('styleguide.html')); await m.waitForTimeout(300);
  assert(await m.evaluate(() => document.documentElement.scrollWidth) <= 360, '360 px tanpa scroll horizontal');
  assert(errs.length === 0, 'tanpa error ' + errs.join('|'));
  await b.close();
})().catch(e => { console.log('CRASH ' + e.message); process.exit(1); });
