// Menjamin data icd.v1 lama tetap utuh di build baru, dan ekspor/impor bolak-balik identik.
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs'), path = require('path');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const S = 'http://127.0.0.1:8787/';
const strip = o => { const c = JSON.parse(JSON.stringify(o)); delete c.meta; return c; }; // meta berisi cap waktu/daftar terbit yang boleh bertambah
const PAGES = (process.env.MIGRASI_PAGES || 'index.html').split(',');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  for (const fx of fs.readdirSync(path.join(__dirname, 'fixtures')).filter(f => f.endsWith('.json'))) {
    const exp = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', fx), 'utf8'));
    for (const pg of PAGES) {
      const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await c.newPage(); const errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await p.addInitScript(d => { if (!sessionStorage.getItem('__seed')) { localStorage.setItem('icd.v1', JSON.stringify(d)); sessionStorage.setItem('__seed', '1'); } }, exp.data);
      await p.goto(S + pg); await p.waitForTimeout(500);
      const now = await p.evaluate(() => JSON.parse(JSON.stringify(ICD.store.all())));
      const ok = JSON.stringify(strip(now)) === JSON.stringify(strip(exp.data));
      if (!ok) { const k = Object.keys(exp.data).filter(k => JSON.stringify(strip(now)[k]) !== JSON.stringify(strip(exp.data)[k])); console.log('      beda di:', k.join(',')); }
      assert(ok, `${fx} dibuka di ${pg}: semua data identik`);
      // ekspor -> reset -> impor
      const rt = await p.evaluate(() => { const t = ICD.store.exportJSON(); ICD.store.reset(); const empty = JSON.stringify(ICD.store.all().progress); ICD.store.importJSON(t, 'ganti'); return { t, empty, after: JSON.parse(JSON.stringify(ICD.store.all())) }; });
      assert(rt.empty === '{}', `${fx} ${pg}: reset mengosongkan`);
      assert(JSON.stringify(strip(rt.after)) === JSON.stringify(strip(exp.data)), `${fx} ${pg}: ekspor→reset→impor identik`);
      const ex2 = JSON.parse(rt.t); assert(ex2.app === 'icd' && ex2.schema === 1, `${fx} ${pg}: format ekspor tetap (app=icd, schema=1)`);
      // berkas ekspor lama dapat diimpor (mode gabung) tanpa menghilangkan apa pun
      const mg = await p.evaluate(t => { ICD.store.reset(); ICD.store.set('bookmarks', [{ file: 'x', sec: 's01', at: 1 }]); ICD.store.importJSON(t, 'gabung'); return ICD.store.get('bookmarks').length; }, JSON.stringify(exp));
      assert(mg === 3, `${fx} ${pg}: impor mode gabung menyatukan bookmark (3)`);
      assert(errs.length === 0, `${fx} ${pg}: tanpa error halaman ${errs.join('|')}`);
      await c.close();
    }
  }
  await b.close();
})().catch(e => { console.log('CRASH ' + e.message); process.exit(1); });
