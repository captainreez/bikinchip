// Hasilkan ikon PNG dan gambar OG dari src/static/favicon.svg. Jalankan sekali saat logo berubah.
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const fs = require('fs');
(async () => {
  const svg = fs.readFileSync('src/static/favicon.svg', 'utf8'), b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  for (const [n, z, pad] of [['favicon-32.png', 32, 0], ['apple-touch-icon.png', 180, 0], ['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['icon-maskable-512.png', 512, 64]]) {
    const p = await b.newPage({ viewport: { width: z, height: z } });
    await p.setContent(`<body style="margin:0;background:${pad ? '#0B5C7A' : 'transparent'}"><div style="width:${z - 2 * pad}px;height:${z - 2 * pad}px;margin:${pad}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div>`);
    await p.screenshot({ path: 'src/static/' + n, omitBackground: !pad }); await p.close();
  }
  const o = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await o.setContent(`<body style="margin:0;width:1200px;height:630px;background:linear-gradient(135deg,#0B5C7A,#083D52);color:#fff;font-family:system-ui,sans-serif;display:flex;flex-direction:column;justify-content:center;padding:0 96px;box-sizing:border-box">
  <div style="display:flex;align-items:center;gap:28px"><div style="width:120px;height:120px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div><div style="font-size:96px;font-weight:800;letter-spacing:-2px">bikinchip</div></div>
  <div style="font-size:52px;font-weight:600;margin-top:44px;line-height:1.2">Ayo jadi chip designer Indonesia.</div>
  <div style="font-size:30px;margin-top:24px;opacity:.85">Kurikulum IC design gratis dan open source, dari nol sampai tapeout.</div></body>`);
  await o.screenshot({ path: 'src/static/og.png' }); await b.close();
})();
