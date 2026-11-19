/* Pembantu bersama halaman utama (bukan halaman lesson): ICD.pg */
(function(){
'use strict';
var ICD = window.ICD, el = ICD.el, reg = ICD.reg, P = ICD.progress, store = ICD.store;
var DESC = ['',
  'Matematika, rangkaian listrik, representasi data, dan alat kerja (C, Linux, Git, Python).',
  'Semikonduktor, transistor dari BJT sampai FinFET dan GAA, dan penguat analog dasar.',
  'Logika kombinasional dan sekuensial, CMOS VLSI, sampai layout standard cell.',
  'RISC-V, pipeline, cache, multicore, GPU/NPU, dan protokol SoC.',
  'SystemVerilog, teknik RTL, verifikasi (UVM), formal, dan FPGA.',
  'Sintesis, STA, floorplan sampai routing, signoff, tapeout, low-power, dan DFT.',
  'Desain analog, ADC/DAC, PLL, SerDes, dan memori (SRAM, DRAM, Flash).',
  'Fabrikasi, packaging 3D, keandalan, keamanan hardware, dan functional safety.',
  'Teknologi terkini dan cara membangun karier di chip design.'];
var LABEL = { belum: 'Belum mulai', berjalan: 'Berjalan', selesai: 'Selesai', soon: 'Segera' };
var CLS = { belum: 'st-todo', berjalan: 'st-doing', selesai: 'st-done', soon: 'st-soon' };

function pct(fr){ var v = fr * 100; return (v > 0 && v < 1 ? v.toFixed(1) : String(Math.round(v))) + '%'; }
function hrs(h){ return (Math.round(h * 10) / 10).toLocaleString('id-ID') + ' jam'; }
function fmtDate(d){ return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
function badge(status, avail){ var s = avail === false ? 'soon' : status; return el('span', { class: 'icd-badge ' + CLS[s], text: LABEL[s] }); }
function lessonStatus(f){ return ICD.avail.has(f.id) ? P.fileStatus(f.id) : 'soon'; }
function hasProgress(){ var p = store.get('progress', {}); return Object.keys(p).some(function(k){ return reg.file(k) && ((p[k].sections && Object.keys(p[k].sections).some(function(s){ return p[k].sections[s]; })) || p[k].visited); }); }

function planFiles(){
  var plan = store.get('plan', null), set = plan && plan.track && reg.tracks[plan.track] ? reg.tracks[plan.track].files : null;
  return reg.files.filter(function(f){ return !set || set[f.id]; });
}
/* lesson berikutnya yang layak dibuka: yang terakhir dibaca (jika belum selesai), kalau tidak yang pertama belum selesai menurut jalur */
function nextTarget(){
  var lastF = store.get('meta.lastFile', null), lf = lastF && reg.file(lastF);
  if (!lf){ var prog = store.get('progress', {}), lt = 0; Object.keys(prog).forEach(function(id){ if (reg.file(id) && prog[id].visited > lt){ lt = prog[id].visited; lf = reg.file(id); } }); }
  if (lf && ICD.avail.has(lf.id) && P.fileStatus(lf.id) !== 'selesai'){ var ls = store.get('progress.' + lf.id + '.last', null); return { f: lf, href: lf.id + '.html' + (ls ? '#' + ls : ''), resume: true, section: ls }; }
  var fo = planFiles().filter(function(f){ return ICD.avail.has(f.id) && P.fileStatus(f.id) !== 'selesai'; })[0];
  if (fo) return { f: fo, href: fo.id + '.html', resume: P.fileStatus(fo.id) !== 'belum' };
  return null;
}
function weekOf(plan){
  if (!plan) return null;
  var h = plan.hours || 10, start = plan.start ? new Date(plan.start + 'T00:00:00') : new Date(plan.at || Date.now());
  var wk = Math.max(0, Math.floor((Date.now() - start.getTime()) / (7 * 864e5)));
  var cum = 0, items = [];
  planFiles().forEach(function(f){ var a = cum, b = cum + f.hours; cum = b; if (b > wk * h + 0.01 && a < (wk + 1) * h - 0.01) items.push(f); });
  return { n: wk + 1, items: items, start: new Date(start.getTime() + wk * 7 * 864e5), weeks: Math.ceil(cum / h) };
}
function sectionTitle(file, sid){
  var x = (ICD.index || []).filter(function(e){ return e.t === 'section' && e.href === file + '.html#' + sid; })[0];
  return x ? x.title : '';
}
function statRow(items){
  var ul = el('ul', { class: 'statrow' });
  items.forEach(function(x){ ul.appendChild(el('li', null, [el('b', { text: String(x[0]) }), x[1]])); });
  return ul;
}

/* ---------- hero: wafer fab (canvas), dipakai beranda dan halaman masuk ---------- */
var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function fab(hero, cv, opt){
  opt = opt || {}; var ctx = cv.getContext && cv.getContext('2d'); if (!ctx) return;
  var W, H, dpr, R, cx, cy, d, dies = [], px = -1e4, py = -1e4, run = false, vis = true, raf = 0;
  function hash(a, b){ var h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function layout(){
    var r = hero.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var wide = W >= 800; R = wide ? Math.min(H * (opt.r || 0.8), W * 0.4) : W * 0.8; cx = wide ? W * (opt.cx || 0.74) : W * 0.62; cy = wide ? H * (opt.cy || 0.52) : H * 0.88; d = R / (wide ? 11 : 8);
    dies = []; var n = Math.ceil(R / d);
    for (var gx = -n; gx <= n; gx++) for (var gy = -n; gy <= n; gy++){
      var x = gx * d, y = gy * d * 0.8, hw = d * 0.4, hh = d * 0.32;
      if (Math.hypot(Math.abs(x) + hw, Math.abs(y) + hh) > R * 0.94) continue;
      dies.push({ x: x, y: y, w: hw * 2, h: hh * 2, bad: hash(gx, gy) < 0.13 });
    }
    draw(performance.now());
  }
  function draw(t){
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    var sy = window.pageYOffset || 0, ang = -0.3 + sy * 0.0009 + (REDUCE ? 0 : t * 0.000025), ca = Math.cos(ang), sa = Math.sin(ang), sc = 1 + Math.min(sy, 600) * 0.0003;
    var bx = REDUCE ? -1e4 : ((t * 0.09) % (W + 500)) - 250;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc);
    var g = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R); g.addColorStop(0, '#2C6C84'); g.addColorStop(1, '#0C3547');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.2832); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(159,221,240,.35)'; ctx.stroke();
    ctx.rotate(ang);
    for (var i = 0; i < dies.length; i++){
      var D = dies[i], sx = cx + (D.x * ca - D.y * sa) * sc, syy = cy + (D.x * sa + D.y * ca) * sc;
      var hb = Math.exp(-Math.pow((sx - bx) / (d * 2.2), 2)), hp = Math.exp(-(Math.pow(sx - px, 2) + Math.pow(syy - py, 2)) / (d * d * 6)), k = Math.min(1, hb * 0.9 + hp);
      if (D.bad){ ctx.fillStyle = 'rgba(8,22,30,' + (0.55 + k * 0.2) + ')'; ctx.strokeStyle = 'rgba(232,176,74,' + (0.25 + k * 0.5) + ')'; }
      else { ctx.fillStyle = 'rgba(92,193,224,' + (0.12 + k * 0.6) + ')'; ctx.strokeStyle = 'rgba(159,221,240,' + (0.3 + k * 0.6) + ')'; }
      ctx.lineWidth = 1; ctx.fillRect(D.x - D.w / 2, D.y - D.h / 2, D.w, D.h); ctx.strokeRect(D.x - D.w / 2 + 0.5, D.y - D.h / 2 + 0.5, D.w - 1, D.h - 1);
      if (!D.bad){ ctx.fillStyle = 'rgba(255,255,255,' + (0.1 + k * 0.5) + ')'; ctx.fillRect(D.x - D.w * 0.25, D.y - D.h * 0.2, D.w * 0.5, D.h * 0.4); }
    }
    ctx.restore();
  }
  function loop(t){ raf = 0; if (!run || !vis || document.hidden) return; draw(t); raf = requestAnimationFrame(loop); }
  function start(){ if (REDUCE || raf) return; run = true; raf = requestAnimationFrame(loop); }
  hero.addEventListener('pointermove', function(e){ var r = hero.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; if (REDUCE) draw(0); });
  hero.addEventListener('pointerleave', function(){ px = py = -1e4; if (REDUCE) draw(0); });
  if (window.ResizeObserver) new ResizeObserver(layout).observe(hero); else window.addEventListener('resize', layout);
  if (REDUCE) window.addEventListener('scroll', function(){ draw(0); }, { passive: true });
  if (window.IntersectionObserver) new IntersectionObserver(function(es){ vis = es[0].isIntersecting; if (vis) start(); }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) start(); });
  layout(); start();
}


ICD.pg = { fab: fab, REDUCE: REDUCE, DESC: DESC, LABEL: LABEL, pct: pct, hrs: hrs, fmtDate: fmtDate, badge: badge, lessonStatus: lessonStatus, hasProgress: hasProgress, planFiles: planFiles,
  nextTarget: nextTarget, weekOf: weekOf, sectionTitle: sectionTitle, statRow: statRow };
})();
