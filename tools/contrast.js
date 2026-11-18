// Memeriksa kontras WCAG 2.x untuk pasangan teks/latar di core.css (tema terang dan gelap).
// Pakai: node tools/contrast.js   (exit 1 jika ada pasangan di bawah ambang)
const fs = require('fs'), path = require('path');
const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.css'), 'utf8');
function block(sel) {
  const i = css.indexOf(sel + '{'); if (i < 0) throw new Error('blok tidak ada: ' + sel);
  const j = css.indexOf('\n}', i); const o = {};
  css.slice(i, j).replace(/--([a-z0-9-]+):([^;]+);/g, (_, k, v) => { o[k] = v.trim(); });
  return o;
}
const light = block(':root'), dark = Object.assign({}, light, block(':root[data-theme="dark"]'));
function val(theme, k, depth = 0) {
  let v = theme[k]; if (v == null) throw new Error('token ' + k);
  const m = /^var\(--([a-z0-9-]+)\)$/.exec(v); return m && depth < 6 ? val(theme, m[1], depth + 1) : v;
}
const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(x => x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const TEXT = 4.5, UI = 3;
// [latar, teks, ambang, keterangan]
const pairs = [];
['surface-0', 'surface-1', 'surface-2', 'surface-3'].forEach(s => {
  ['text', 'text-2', 'text-3', 'accent'].forEach(f => pairs.push([s, f, TEXT, 'teks']));
  ['success', 'warning', 'danger'].forEach(f => pairs.push([s, f, TEXT, 'teks status']));
  ['line-strong'].forEach(f => pairs.push([s, f, UI * 0 + 1.4, 'garis (dekoratif)']));
});
pairs.push(['accent', 'accent-ink', TEXT, 'tombol primary'], ['accent-hover', 'accent-ink', TEXT, 'tombol primary hover']);
pairs.push(['success-bg', 'success', TEXT, 'badge selesai'], ['warning-bg', 'warning', TEXT, 'badge segera'], ['danger-bg', 'danger', TEXT, 'danger pada latar danger']);
['s-clock', 's-data', 's-ctrl', 's-reset', 's-vdd', 's-vss', 's-analog', 's-hi', 's-x', 's-z'].forEach(f => pairs.push(['surface-1', f, UI, 'warna sinyal (garis/teks besar)']));
let bad = 0;
for (const [name, th] of [['terang', light], ['gelap', dark]]) {
  for (const [bg, fg, min, what] of pairs) {
    const r = ratio(val(th, bg), val(th, fg)); const ok = r >= min;
    if (!ok) { bad++; console.log(`FAIL ${name}: ${fg} di atas ${bg} = ${r.toFixed(2)} (min ${min}) [${what}]`); }
  }
  // tombol danger: teks putih (terang) / gelap (gelap) di atas --danger
  const dtxt = name === 'terang' ? '#FFFFFF' : '#1A0709'; const rd = ratio(val(th, 'danger'), dtxt);
  if (rd < TEXT) { bad++; console.log(`FAIL ${name}: tombol danger ${rd.toFixed(2)}`); }
}
console.log(bad ? `${bad} pasangan gagal` : `ok   semua ${pairs.length * 2 + 2} pasangan lulus AA`);
process.exit(bad ? 1 : 0);
