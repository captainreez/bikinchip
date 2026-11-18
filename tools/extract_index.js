// Membuat src/glosarium.json (glosarium induk) dan src/search-index.json (section, istilah, modul) dari halaman yang sudah dibangun.
// Pakai: python3 tools/build.py docs && node tools/extract_index.js && python3 tools/build.py docs
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), SITE = path.resolve(process.env.SITE || path.join(ROOT, 'docs'));
const rd = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'src', f), 'utf8'));
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined }); const p = await (await b.newContext()).newPage();
  await p.goto('file://' + SITE + '/styleguide.html'); await p.waitForTimeout(200);
  const reg = await p.evaluate(() => ({ files: ICD.reg.files.map(f => ({ id: f.id, code: f.code, title: f.title, mod: f.mod })), mods: ICD.reg.modules.map(m => ({ id: m.id, title: m.title, part: m.part })), parts: ICD.reg.parts }));
  const built = reg.files.filter(f => fs.existsSync(path.join(SITE, f.id + '.html')));
  const terms = {}, order = {}; reg.files.forEach((f, i) => order[f.id] = i);
  const sections = [], notes = [];
  const add = (t, from) => {
    const key = t.slug; if (!terms[key]) { terms[key] = { id: key, en: t.en, idn: t.idn || '', def: t.def, mods: [], from }; }
    const x = terms[key]; if (t.mod && x.mods.indexOf(t.mod) < 0) x.mods.push(t.mod);
    if (t.def !== x.def) notes.push(`definisi beda untuk "${t.en}" (${x.from} vs ${from})`);
  };
  for (const f of built) {
    await p.goto('file://' + path.join(SITE, f.id + '.html')); await p.waitForTimeout(250);
    const r = await p.evaluate(() => ({ g: ICD.gloss.all().map(t => ({ en: t.en, idn: t.idn, def: t.def, mod: t.mod, slug: ICD.gloss.slug(t.en) })), s: [...document.querySelectorAll('section.icd-sec')].map(s => ({ id: s.id, t: (s.querySelector('h2') || {}).textContent || '' })) }));
    r.g.forEach(t => add(t, f.id));
    r.s.forEach(s => sections.push({ t: 'section', title: s.t.replace(/^\d+/, '').trim(), sub: `${f.code} · ${f.title}`, href: `${f.id}.html#${s.id}` }));
  }
  // istilah dasar hanya mengisi yang belum didefinisikan modul manapun (definisi modul lebih rinci)
  const SL = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  for (const t of rd('glosarium-dasar.json')) { const slug = SL(t.en); if (!terms[slug]) add({ ...t, slug }, 'dasar'); else if (t.mod && terms[slug].mods.indexOf(t.mod) < 0) terms[slug].mods.push(t.mod); }
  const gl = Object.values(terms).sort((a, b) => a.en.toLowerCase() < b.en.toLowerCase() ? -1 : 1).map(({ from, ...t }) => ({ ...t, mods: t.mods.sort() }));
  const kw = rd('keywords.json'), idx = [];
  reg.mods.forEach(m => idx.push({ t: 'modul', title: `${m.id} · ${m.title}`, sub: `Part ${m.part} · ${reg.parts[m.part]}`, href: `kurikulum.html?modul=${m.id}`, alt: kw[m.id] || '' }));
  gl.forEach(t => idx.push({ t: 'istilah', title: t.en + (t.idn && t.idn.toLowerCase() !== t.en.toLowerCase() ? ' · ' + t.idn : ''), sub: t.def, href: 'glosarium.html#istilah-' + t.id, alt: t.idn }));
  sections.forEach(s => idx.push(s));
  fs.writeFileSync(path.join(ROOT, 'src', 'glosarium.json'), JSON.stringify(gl, null, 0));
  fs.writeFileSync(path.join(ROOT, 'src', 'search-index.json'), JSON.stringify(idx));
  console.log(`glosarium: ${gl.length} istilah dari ${built.length} lesson; indeks: ${idx.length} entri (${sections.length} section)`);
  [...new Set(notes)].forEach(n => console.log('  perhatian: ' + n));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
