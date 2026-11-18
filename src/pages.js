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
ICD.pg = { DESC: DESC, LABEL: LABEL, pct: pct, hrs: hrs, fmtDate: fmtDate, badge: badge, lessonStatus: lessonStatus, hasProgress: hasProgress, planFiles: planFiles,
  nextTarget: nextTarget, weekOf: weekOf, sectionTitle: sectionTitle, statRow: statRow };
})();
