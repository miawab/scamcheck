// POST { q, lang } -> { q, results: [{ title, link, snippet, source }], read: { reported, summary } | null }
// Searches Google (via SerpApi) for a phone number or website from the message, plus "scam",
// so people can see whether others have already reported it. Only runs when the person taps the button.
// Gemma then reads the results and says in one line what they show, citing nothing it wasn't given.
import { ask, aiOn } from './check.js';
import * as trace from './_tracing.js';

const PER_IP_PER_HOUR = 6;
const PER_DAY = 25; // the free SerpApi plan has 250 searches a month
const seenIp = new Map();
let day = { date: '', count: 0 };
const cache = new Map(); // q -> { at, body }; saves searches on the free plan

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const q = normalise(String(req.body?.q || ''));
  const lang = req.body?.lang === 'ur' ? 'ur' : 'en';
  if (!q) return res.status(400).json({ error: 'not_a_number_or_site' });
  if (!process.env.SERPAPI_KEY) return res.status(503).json({ error: 'lookup_off' });

  const hit = cache.get(q);
  if (hit && Date.now() - hit.at < 6 * 3600e3) return res.status(200).json({ ...hit.body, read: await readResults(hit, lang) });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || 'local';
  const now = Date.now();
  const recent = (seenIp.get(ip) || []).filter((t) => now - t < 3600e3);
  if (recent.length >= PER_IP_PER_HOUR) return res.status(429).json({ error: 'slow_down' });
  const today = new Date(now).toISOString().slice(0, 10);
  if (day.date !== today) day = { date: today, count: 0 };
  if (day.count >= PER_DAY) return res.status(429).json({ error: 'lookup_busy' });
  day.count++;
  seenIp.set(ip, [...recent, now]);

  const params = new URLSearchParams({
    engine: 'google',
    q: `"${q}" scam`,
    gl: 'pk',
    hl: 'en',
    num: '8',
    api_key: process.env.SERPAPI_KEY,
  });
  const [status, out] = await trace.agent('scamcheck-lookup', q, async (run) => {
    try {
      const body = await trace.tool('scamcheck-lookup', 'web_search', 'Google results via SerpApi for the number or site plus "scam"', { q }, async (span) => {
        const r = await fetch(`https://serpapi.com/search.json?${params}`, { signal: AbortSignal.timeout(30000) });
        if (!r.ok) throw Object.assign(new Error(`serpapi ${r.status}: ${(await r.text()).slice(0, 200)}`), { status: r.status });
        const data = await r.json();
        const results = (data.organic_results || [])
          .filter((o) => mentions(`${o.title} ${o.snippet || ''}`, q))
          .slice(0, 5)
          .map((o) => ({ title: o.title, link: o.link, snippet: o.snippet || '', source: o.source || new URL(o.link).hostname }));
        span.setAttributes({ 'scamcheck.results_raw': (data.organic_results || []).length, 'scamcheck.results_kept': results.length });
        return { q, results, searched: data.search_metadata?.created_at || null };
      });
      const entry = { at: now, body, read: {} };
      cache.set(q, entry);
      const read = await readResults(entry, lang);
      run.setAttributes({ 'scamcheck.results': body.results.length, 'scamcheck.reported': read?.reported || 'none' });
      return [200, { ...body, read }];
    } catch (e) {
      console.error('serpapi', e.name, e.message);
      trace.failed(e);
      return [502, { error: e.status === 429 ? 'lookup_busy' : 'lookup_error' }];
    }
  });
  await trace.flush();
  return res.status(status).json(out);
}

// One plain sentence on what the search results say, from the results alone. Cached per language.
async function readResults(entry, lang) {
  const { q, results } = entry.body;
  if (!results.length || !aiOn()) return null;
  if (entry.read[lang]) return entry.read[lang];
  const language = lang === 'ur' ? 'Urdu (Urdu script)' : 'simple English';
  const list = results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.source}\n   ${r.snippet}`).join('\n');
  try {
    const raw = await ask(
      `You summarise web search results for someone checking whether a phone number or website is a scam.
Reply with JSON only: {"reported": "yes" | "no" | "unclear", "summary": one or two short sentences in ${language}}.
"yes" only if the results themselves say people reported THIS number or site as a scam or fake. Say what kind of scam if they say it.
Use only what the results say. Do not add advice, phone numbers or links.`,
      `Search: "${q}" scam\n\nResults:\n${list}`,
      'scamcheck-lookup',
    );
    const out = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    const read = {
      reported: ['yes', 'no', 'unclear'].includes(out.reported) ? out.reported : 'unclear',
      summary: String(out.summary || '').replace(/\+?\d[\d\s-]{6,}\d/g, '').slice(0, 300),
    };
    entry.read[lang] = read;
    return read;
  } catch (e) {
    console.error('lookup read', e.message);
    return null;
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
