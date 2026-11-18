// Server tiruan Supabase (auth + PostgREST tabel progress) dan server statis untuk menguji sinkron.
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');
const SITE = process.argv[2] || (process.env.SITE || 'docs');
const db = { rows: {}, otp: [], pushes: 0 };
let tokN = 0;
const USER = { id: '11111111-1111-1111-1111-111111111111', email: 'ani@example.com', user_metadata: { full_name: 'Ani Wijaya' } };
const valid = new Set();
function cors(res){ res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', 'apikey, authorization, content-type, prefer'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); }
function body(req){ return new Promise(r => { let b = ''; req.on('data', d => b += d); req.on('end', () => r(b ? JSON.parse(b) : null)); }); }
function tok(){ const t = 'tok' + (++tokN); valid.add(t); return t; }
http.createServer(async (req, res) => {
  cors(res); const u = url.parse(req.url, true);
  if (req.method === 'OPTIONS'){ res.writeHead(204); return res.end(); }
  if (u.pathname !== '/auth/v1/authorize' && req.headers.apikey !== 'anon-test-key'){ res.writeHead(401); return res.end('{"message":"no apikey"}'); }
  const auth = (req.headers.authorization || '').replace('Bearer ', '');
  if (u.pathname === '/__state'){ res.writeHead(200); return res.end(JSON.stringify(db)); }
  if (u.pathname === '/auth/v1/otp' && req.method === 'POST'){ const b = await body(req); db.otp.push({ email: b.email, redirect: u.query.redirect_to }); res.writeHead(200); return res.end('{}'); }
  if (u.pathname === '/auth/v1/authorize'){ res.writeHead(302, { Location: u.query.redirect_to + '#access_token=' + tok() + '&refresh_token=r' + tokN + '&expires_in=3600&token_type=bearer' }); return res.end(); }
  if (u.pathname === '/auth/v1/user'){ if (!valid.has(auth)){ res.writeHead(401); return res.end('{}'); } res.writeHead(200); return res.end(JSON.stringify(USER)); }
  if (u.pathname === '/auth/v1/token'){ await body(req); res.writeHead(200); return res.end(JSON.stringify({ access_token: tok(), refresh_token: 'r' + tokN, expires_in: 3600, user: USER })); }
  if (u.pathname === '/auth/v1/logout'){ valid.delete(auth); res.writeHead(204); return res.end(); }
  if (u.pathname === '/rest/v1/progress'){
    if (!valid.has(auth)){ res.writeHead(401); return res.end('{"message":"JWT"}'); }
    if (req.method === 'GET'){ const id = (u.query.user_id || '').replace('eq.', ''); res.writeHead(200); return res.end(JSON.stringify(db.rows[id] && id === USER.id ? [db.rows[id]] : [])); }
    if (req.method === 'POST'){ const b = await body(req); if (b.user_id !== USER.id){ res.writeHead(403); return res.end('{"message":"RLS"}'); } db.rows[b.user_id] = { data: b.data, updated_at: b.updated_at }; db.pushes++; res.writeHead(201); return res.end(); }
  }
  res.writeHead(404); res.end('{}');
}).listen(8788);
http.createServer((req, res) => {
  let p = decodeURIComponent(url.parse(req.url).pathname); if (p === '/') p = '/index.html';
  const f = path.join(SITE, p); if (!f.startsWith(SITE) || !fs.existsSync(f)){ res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/plain' }); fs.createReadStream(f).pipe(res);
}).listen(8787);
console.log('mock siap');
