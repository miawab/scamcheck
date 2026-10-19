// Local preview without Vercel: node scripts/dev.mjs  ->  http://localhost:3000
// Serves public/ and runs api/check.js, reading GEMINI_API_KEY from .env if present.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import handler from '../api/check.js';

const root = path.resolve('public');
if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/check') {
    let body = '';
    for await (const c of req) body += c;
    try { req.body = JSON.parse(body || '{}'); } catch { req.body = {}; }
    res.status = (n) => { res.statusCode = n; return res; };
    res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
    return handler(req, res);
  }
  const file = path.join(root, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.statusCode = 404; return res.end('not found'); }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(3000, () => console.log('http://localhost:3000', process.env.GEMINI_API_KEY ? '(AI on)' : '(AI off: no GEMINI_API_KEY in .env)'));
