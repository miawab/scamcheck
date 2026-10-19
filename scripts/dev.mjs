// Local preview without Vercel: node scripts/dev.mjs  ->  http://localhost:3000
// Serves public/ and runs api/check.js, reading GEMINI_API_KEY from .env if present.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';

// This PC's network stalls on IPv6 for some hosts (SerpApi); Vercel doesn't need this.
dns.setDefaultResultOrder('ipv4first');

const root = path.resolve('public');
if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
// Import after .env is read: the handlers pick their AI provider when they load.
const api = {
  '/api/check': (await import('../api/check.js')).default,
  '/api/lookup': (await import('../api/lookup.js')).default,
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (api[url.pathname]) {
    let body = '';
    for await (const c of req) body += c;
    try { req.body = JSON.parse(body || '{}'); } catch { req.body = {}; }
    res.status = (n) => { res.statusCode = n; return res; };
    res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
    return api[url.pathname](req, res);
  }
  const file = path.join(root, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!file.startsWith(root) || !fs.existsSync(file)) { res.statusCode = 404; return res.end('not found'); }
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(3000, () => console.log('http://localhost:3000',
  process.env.GEMINI_API_KEY ? '(AI: Google AI Studio)' : process.env.OLLAMA_URL ? '(AI: local Ollama)' : '(AI off: set GEMINI_API_KEY or OLLAMA_URL in .env)',
  process.env.SERPAPI_KEY ? '(lookup on)' : '(lookup off)'));
