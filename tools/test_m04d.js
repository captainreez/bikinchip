const { chromium } = require(process.env.PLAYWRIGHT || 'playwright'); const fs = require('fs'); const cp = require('child_process');
const assert = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const F = 'm04d-python-tcl-algoritma', LAB = 'lab/m04d/';
const sh = c => cp.execSync(c, { cwd: LAB, encoding: 'utf8', shell: '/bin/bash' });
const nf = x => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const sg = x => x < 0 ? '−' + (-x) : String(x);
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); await p.waitForTimeout(300);
  const setr = async (id, v) => { await p.evaluate(([i, x]) => { const e = document.querySelector(i); e.value = x; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [id, String(v)]); };
  const sel = async (id, v) => { await p.selectOption(id, String(v)); };
  const out = async id => p.textContent(id);
  const fwd = async (v, n) => { for (let i = 0; i < n; i++) await p.click('#' + v + ' button:has-text("Maju")'); };
  const s = await p.evaluate(() => { const txt = pre => [...pre.querySelectorAll('code')].map(c => { const k = c.cloneNode(true); k.querySelectorAll('.ln').forEach(x => x.remove()); return k.textContent; }).join('');
    return { secs: document.querySelectorAll('section.icd-sec').length, viz: document.querySelectorAll('.icd-viz').length, guides: document.querySelectorAll('.icd-guide').length,
    rawTerms: [...document.querySelectorAll('span[data-term]')].map(x => x.dataset.term).filter(t => !ICD.gloss.has || !ICD.gloss.has(t)),
    layers: document.querySelectorAll('.icd-layers').length,
    links: [...document.querySelectorAll('main a[href*=".html"]')].map(a => a.getAttribute('href').split('#')[0]).filter(h => !/^(index|kurikulum|belajar|glosarium|tools|referensi|pengaturan|tentang|privasi|masuk|styleguide)\.html$/.test(h) && !ICD.reg.file(h.replace('.html', ''))),
    code: [...document.querySelectorAll('#s08 pre')].map(txt), lab: [...document.querySelectorAll('#s14 pre')].map(txt), sols: [...document.querySelectorAll('#s11 details.icd-sol')].filter(d => /^Solusi/.test(d.querySelector('summary').textContent)).length }; });
  console.log(JSON.stringify({ secs: s.secs, viz: s.viz, guides: s.guides, layers: s.layers, codes: s.code.length, labn: s.lab.length, sols: s.sols, raw: s.rawTerms, links: s.links }));
  assert(s.secs === 16 && s.viz === 4 && s.guides === 4 && s.layers === 3, '16 bagian, 4 visualisasi, 4 eksperimen, 3 konsep berlapis');
  assert(s.rawTerms.length === 0 && s.links.length === 0, 'istilah dan tautan sah');
  assert(s.sols === 9, '9 latihan dengan solusi tersembunyi');
  const A = async (name, id, ...subs) => { const t = await out(id); const bad = subs.filter(x => !t.includes(x)); if (bad.length) console.log('      ', t); assert(bad.length === 0, name + (bad.length ? ' GAGAL: ' + bad.join(' | ') : '')); };
  const rd = f => fs.readFileSync(LAB + f, 'utf8').trim();
  const files = ['alias_demo.py', 'sort_counts.py', 'sta_dag.py', 'dp_demo.py', 'sample_timing.rpt', 'logreport.py', 'report.tcl', 'tcl_subst.tcl', 'netlist_graph.py', 'maze_route.py', 'graph_algos.py', 'test_algos.py'];
  assert(files.every((f, i) => s.code[i] && s.code[i].trim() === rd(f)) && s.code.length === files.length, 'dua belas file kode identik dengan lab/m04d');
  const labText = s.lab.join('\n');
  const real = ['alias_demo.py', 'sort_counts.py', 'sta_dag.py', 'netlist_graph.py', 'maze_route.py', 'graph_algos.py', 'dp_demo.py'].map(f => sh('python3 ' + f).trim());
  assert(real.every(r => labText.includes(r)) && labText.includes(sh('tclsh report.tcl sample_timing.rpt').trim()) && labText.includes(sh('tclsh tcl_subst.tcl').trim()), 'semua keluaran lab sama dengan eksekusi sungguhan');
  assert(sh('python3 test_algos.py 2>&1').includes('OK') && sh('python3 logreport.py sample_timing.rpt').split('\n').slice(0, 3).join('\n') === sh('tclsh report.tcl sample_timing.rpt').split('\n').slice(0, 3).join('\n'), 'test_algos lulus; Python dan Tcl memberi ringkasan sama');
  // v1: tiga bentuk cocok dengan alias_demo.py
  await p.locator('#v1').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await A('v1: siap', '#v1-out', 'b = a[:] · diproses 0 dari 4 (sementara) · a=— · b=—');
  const ad = sh('python3 alias_demo.py').split('\n').slice(0, 3).map(l => /^(\w+)\s+a=(.*) b=(.*) b_is_a=(\w+) b0_is_a0=(\w+)$/.exec(l));
  for (const m of ad) { await sel('#v1-form', m[1]); await fwd('v1', 4); await A('v1: ' + m[1], '#v1-out', 'diproses 4 dari 4 (selesai) · a=' + m[2] + ' · b=' + m[3] + ' · b is a: ' + m[4] + ' · b[0] is a[0]: ' + m[5]); }
  await sel('#v1-form', 'shallow'); await fwd('v1', 2); await A('v1: salinan dangkal langkah 2', '#v1-out', 'a=[[1, 2], [3]] · b=[[1, 2], [3]] · b is a: False · b[0] is a[0]: True');
  assert(await p.locator('#v1-objs .o').count() === 4, 'v1: 4 objek setelah salinan dangkal');
  await (await p.$('#v1')).screenshot({ path: 'shots/m04d-v1.png' });
  // v2: cocok dengan sort_counts.py
  await p.locator('#v2').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  const sc = {}; let kind = null; sh('python3 sort_counts.py').split('\n').forEach(l => { const m = /^n=\s*(\d+) insertion=\s*(\d+) merge=\s*(\d+) quick=\s*(\d+)/.exec(l.trim()); if (m) sc[kind].push(m.slice(1).map(Number)); else if (l.trim()) { kind = l.trim(); sc[kind] = []; } });
  await A('v2: awal', '#v2-out', 'acak · n = 4 · insertion 4 · merge 4 · quick 4 · n pertama');
  for (const k of ['random', 'sorted', 'reverse']) {
    await sel('#v2-kind', k); await fwd('v2', 8); const t = await out('#v2-tab'); const L = sc[k][8];
    await A('v2: ' + k + ' n=1024', '#v2-out', 'n = 1.024 · insertion ' + nf(L[1]) + ' · merge ' + nf(L[2]) + ' · quick ' + nf(L[3]));
    assert(sc[k].every(r => t.includes(nf(r[1])) && t.includes(nf(r[2])) && t.includes(nf(r[3]))) && await p.locator('#v2-tab tbody tr').count() === 9, 'v2: ' + k + ' sembilan baris sama dengan Python');
  }
  await sel('#v2-kind', 'random'); await fwd('v2', 8); await A('v2: kemiringan acak', '#v2-out', 'kemiringan terakhir: insertion 1,99, merge 1,17, quick 1,28');
  await (await p.$('#v2')).screenshot({ path: 'shots/m04d-v2.png' });
  // v3: cocok dengan sta_dag.py untuk banyak kombinasi
  await p.locator('#v3').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  const combos = []; for (const [T, sl] of [[9, 'none'], [9, 'G1'], [9, 'G2'], [9, 'G3'], [9, 'G4'], [9, 'G5'], [9, 'G6'], [12, 'G2'], [6, 'none'], [14, 'G2'], [7, 'G6']]) combos.push([T, sl]);
  const py = JSON.parse(sh('python3 -c "import json,sta_dag as s;r={};\nfor T,sl in %s:\n o,a,k,p=s.analyze(s.GATES,T,None if sl==\'none\' else sl,3);r[str(T)+sl]=[a,k,p]\nprint(json.dumps(r))"' .replace('%s', JSON.stringify(combos).replace(/"/g, "'"))));
  await A('v3: siap', '#v3-out', 'T = 9 · lambat: tidak ada · diproses 0 dari 9 (sementara)');
  for (const [T, sl] of combos) {
    await setr('#v3-t', T); await sel('#v3-slow', sl); await fwd('v3', 9); const [a, k, path] = py[T + sl];
    const worst = Math.min(k.G5, k.G6);
    await A('v3: T=' + T + ' ' + sl, '#v3-out', 'diproses 9 dari 9 (selesai) · slack G5 = ' + sg(k.G5) + ', G6 = ' + sg(k.G6) + ' · jalur kritis: ' + path.join(' → ') + ' · ' + (worst < 0 ? 'MELANGGAR' : 'memenuhi timing'));
    const t = await out('#v3-tab'); assert(t.length > 0 && (await p.locator('#v3-tab tbody tr').count()) === 9, 'v3: tabel 9 simpul');
  }
  await setr('#v3-t', 9); await sel('#v3-slow', 'G2'); await fwd('v3', 9);
  const arr = await p.evaluate(() => [...document.querySelectorAll('#v3-dag .nd')].map(g => g.textContent.replace(/\s+/g, ' ')).join('|'));
  assert(arr.includes('G5 d=4t = 12') && arr.includes('G3 d=2t = 8') && arr.includes('G2 d=6t = 6'), 'v3: arrival pada graf G2 lambat: ' + arr);
  assert(await p.locator('#v3-dag .nd.crit').count() === 4 && await p.locator('#v3-dag .nd.bad').count() === 1 && await p.locator('#v3-dag .ed.crit').count() === 3, 'v3: jalur kritis 4 simpul (termasuk masukan C), 1 simpul melanggar, 3 tepi kritis (' + await p.locator('#v3-dag .nd.crit').count() + ')');
  await sel('#v3-slow', 'none'); await fwd('v3', 3); await A('v3: sementara', '#v3-out', 'diproses 3 dari 9 (sementara) · terakhir: C dengan arrival 0');
  await fwd('v3', 1); await A('v3: G1', '#v3-out', 'terakhir: G1 dengan arrival 2');
  await (await p.$('#v3')).screenshot({ path: 'shots/m04d-v3.png' });
  // v4: sepuluh baris cocok dengan tclsh sungguhan
  await p.locator('#v4').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  const tcl = sh('tclsh tcl_subst.tcl').trim().split('\n'); const pairs = []; for (let i = 0; i < tcl.length; i += 2) pairs.push([tcl[i].slice(2), tcl[i + 1]]);
  assert(pairs.length === 10 && await p.locator('#v4-ex option').count() === 10, 'v4: sepuluh contoh');
  for (let i = 0; i < 10; i++) {
    await sel('#v4-ex', i); for (let j = 0; j < 8 && !(await out('#v4-out')).includes('selesai'); j++) await fwd('v4', 1);
    const t = await out('#v4-out'); assert(t === pairs[i][0] + ' · selesai · ' + pairs[i][1], 'v4: ' + pairs[i][0] + ' sama dengan tclsh: ' + pairs[i][1] + (t.endsWith(pairs[i][1]) ? '' : ' (' + t + ')'));
  }
  await sel('#v4-ex', 7); await fwd('v4', 3); const wr = await p.locator('#v4-words .w').count(); assert(wr === 2 || wr === 3, 'v4: baris kata tampil bertahap (' + wr + ')');
  await (await p.$('#v4')).screenshot({ path: 'shots/m04d-v4.png' });
  // kuis dan kartu
  const qz = await p.evaluate(() => { let n = 0, bad = []; return new Promise(res => { function go() { const q = document.querySelector('#kuis .q'); if (!q) return res({ n, bad });
      const bs = [...document.querySelectorAll('#kuis .icd-opt')]; bs[0].click(); const whys = document.querySelectorAll('#kuis .why'); const right = document.querySelectorAll('#kuis .icd-opt.right').length;
      if (whys.length !== bs.length || bs.length !== 4 || right !== 1 || [...whys].some(w => w.textContent.trim().length < 25)) bad.push(n + 1); n++; const nb = document.querySelector('#kuis .icd-btn.primary'); nb.click(); setTimeout(go, 10); } go(); }); });
  assert(qz.n === 14 && qz.bad.length === 0, 'kuis: 14 soal sah ' + JSON.stringify(qz.bad));
  const kc = await p.evaluate(() => ICD.cards.count('m04d-python-tcl-algoritma')); assert(kc === 18, 'flashcard 18: ' + kc);
  assert(errs.length === 0, 'tanpa error konsol ' + errs.join('|'));
  const mo = await (await b.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true })).newPage();
  await mo.goto(require('url').pathToFileURL(require('path').resolve(process.env.SITE || 'docs')).href + '/' + F + '.html'); for (const v of ['v1', 'v2', 'v3', 'v4']) await (await mo.$('#' + v)).screenshot({ path: 'shots/m04d-m-' + v + '.png' });
  const ov = await mo.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert(ov <= 1, 'tanpa scroll horizontal pada 360 px (' + ov + ')');
  await b.close();
})().catch(e => { console.error('CRASH', e.message.split('\n')[0]); process.exit(1); });
