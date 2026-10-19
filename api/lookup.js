// POST { q } -> { q, results: [{ title, link, snippet, source }] }
// Searches Google (via SerpApi) for a phone number or website from the message, plus "scam" / "fraud",
// so people can see whether others have already reported it. Only runs when the person taps the button.

const PER_IP_PER_HOUR = 6;
const seenIp = new Map();
const cache = new Map(); // q -> { at, body }; saves searches on the free plan

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const q = normalise(String(req.body?.q || ''));
  if (!q) return res.status(400).json({ error: 'not_a_number_or_site' });
  if (!process.env.SERPAPI_KEY) return res.status(503).json({ error: 'lookup_off' });

  const hit = cache.get(q);
  if (hit && Date.now() - hit.at < 6 * 3600e3) return res.status(200).json(hit.body);

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || 'local';
  const now = Date.now();
  const recent = (seenIp.get(ip) || []).filter((t) => now - t < 3600e3);
  if (recent.length >= PER_IP_PER_HOUR) return res.status(429).json({ error: 'slow_down' });
  seenIp.set(ip, [...recent, now]);

  const params = new URLSearchParams({
    engine: 'google',
    q: `"${q}" scam`,
    gl: 'pk',
    hl: 'en',
    num: '8',
    api_key: process.env.SERPAPI_KEY,
  });
  try {
    const r = await fetch(`https://serpapi.com/search.json?${params}`, { signal: AbortSignal.timeout(30000) });
    if (!r.ok) {
      console.error('serpapi', r.status, (await r.text()).slice(0, 200));
      return res.status(502).json({ error: r.status === 429 ? 'lookup_busy' : 'lookup_error' });
    }
    const data = await r.json();
    const results = (data.organic_results || [])
      .filter((o) => mentions(`${o.title} ${o.snippet || ''}`, q))
      .slice(0, 5)
      .map((o) => ({ title: o.title, link: o.link, snippet: o.snippet || '', source: o.source || new URL(o.link).hostname }));
    const body = { q, results, searched: data.search_metadata?.created_at || null };
    cache.set(q, { at: now, body });
    return res.status(200).json(body);
  } catch (e) {
    console.error('serpapi', e.name, e.message);
    return res.status(502).json({ error: 'lookup_error' });
  }
}

// Accept a Pakistani mobile number (any common format -> 03xxxxxxxxx) or a bare domain.
export function normalise(s) {
  const digits = s.replace(/[^\d+]/g, '');
  const m = digits.match(/^(?:\+?92|0)?(3\d{9})$/);
  if (m) return `0${m[1]}`;
  const d = s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#\s]/)[0];
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) && d.length <= 80) return d;
  return '';
}

// Google sometimes returns pages that don't mention the number at all; keep only ones that do.
function mentions(text, q) {
  if (/^03\d{9}$/.test(q)) {
    const flat = text.replace(/[\s-]/g, '');
    return flat.includes(q) || flat.includes(q.slice(1)) || flat.includes(`92${q.slice(1)}`);
  }
  return true; // the search already asks for the exact domain in quotes
}
