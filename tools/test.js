const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--allow-file-access-from-files'] });
  const dir = require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/';
  let fail = 0;
  for (const [w, h] of [[1280, 900], [360, 740]]) for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
    for (const pg of (process.argv[2] || 'index.html').split(',')) {
      const p = await ctx.newPage(); const errs = [];
      p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
      await p.goto(dir + pg); await p.waitForTimeout(400);
      const info = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, theme: document.documentElement.dataset.theme,
        over: [...document.querySelectorAll('main *')].filter(e => { const r = e.getBoundingClientRect(); if (r.right <= innerWidth + 1 || r.width === 0) return false; for (let a = e.parentElement; a; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') return false; } return true; }).slice(0, 5).map(e => e.tagName + '.' + e.className + '#' + e.id) }));
      await p.screenshot({ path: `/home/claude/icd/shots/${pg.replace('.html','')}-${w}-${scheme}.png`, fullPage: true });
      const bad = errs.length || info.sw > info.cw + 1;
      if (bad) fail++;
      console.log(pg, w, scheme, info.theme, 'scrollW', info.sw, '/', info.cw, errs.join(' | ') || 'no errors', info.over.join(', '));
      await p.close();
    }
    await ctx.close();
  }
  await b.close(); process.exit(fail ? 1 : 0);
})();
