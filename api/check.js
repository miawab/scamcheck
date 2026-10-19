// POST { text, lang: 'en' | 'ur', hits: [rule ids] } -> { verdict, want, flags: [{ quote, why }], steps: [..] }
// The browser already hid phone numbers, CNICs and account numbers before sending.
// Gemma (open-weight) explains the message; we keep only flags it quotes word for word from the message.

import * as trace from './_tracing.js';

// Two ways to reach the same open-weight model family:
//   GEMINI_API_KEY  -> Gemma 4 hosted on Google AI Studio (the public site)
//   OLLAMA_URL      -> Gemma 4 running locally through Ollama (development, or fully offline use)
const OLLAMA = process.env.OLLAMA_URL;
const MODEL = process.env.GEMMA_MODEL || (OLLAMA ? 'gemma4:e4b-it-qat' : 'gemma-4-26b-a4b-it');
const MAX_CHARS = 1500;
const PER_IP_PER_HOUR = 20;
const seen = new Map(); // ip -> [timestamps]; resets when the function goes cold, which is fine for a demo

export const SYSTEM_PROMPT = `You help people in Pakistan decide whether an SMS or WhatsApp message is a scam.
Common scams there: fake BISP/Ehsaas payments asking for a fee, fake JazzCash/Easypaisa "account blocked" messages asking for a code, "I sent money by mistake, send it back", fake courier fees, prize/lucky draw messages, "work from home" task jobs, requests for CNIC or card details.
Phone numbers, CNICs and account numbers were replaced with [MOBILE NUMBER], [CNIC], [ACCOUNT NUMBER] for privacy.

Reply with JSON only, no markdown:
{"verdict": "scam" | "suspicious" | "no_signs",
 "want": one short sentence: what the sender is trying to get the reader to do,
 "flags": [{"quote": exact words copied from the message, "why": one short sentence}],
 "steps": [1 to 3 short, concrete things the reader should do now]}

Rules:
- "quote" must be copied character for character from the message. If you can't quote it, leave it out.
- Never invent phone numbers, websites or helplines. Do not include any phone number in your reply.
- Normal messages from friends, real bank alerts that say "never share your code", and bills are "no_signs".
- Plain words, short sentences, for someone who is not technical.
- Write "want", "why" and "steps" in LANGUAGE. Keep "quote" in the message's original language.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { text, lang, hits } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'empty' });
  if (text.length > MAX_CHARS) return res.status(400).json({ error: 'too_long' });
  if (!process.env.GEMINI_API_KEY && !OLLAMA) return res.status(503).json({ error: 'ai_off' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || 'local';
  const now = Date.now();
  const recent = (seen.get(ip) || []).filter((t) => now - t < 3600e3);
  if (recent.length >= PER_IP_PER_HOUR) return res.status(429).json({ error: 'slow_down' });
  seen.set(ip, [...recent, now]);

  const language = lang === 'ur' ? 'Urdu (Urdu script)' : 'simple English';
  const ruleNote = Array.isArray(hits) && hits.length
    ? `A simple keyword check already noticed: ${hits.slice(0, 12).join(', ')}. Use it as a hint, not proof.`
    : 'A simple keyword check found no warning signs. Look carefully anyway.';

  const [status, body] = await trace.agent('scamcheck', text, async (run) => {
    await trace.tool('scamcheck', 'rule_check', 'Keyword rules for Pakistani scams, run in the browser', { hits }, () => {});
    try {
      const raw = await ask(SYSTEM_PROMPT.replace('LANGUAGE', language), `${ruleNote}\n\nMessage:\n"""\n${text}\n"""`, 'scamcheck');
      const parsed = parse(raw);
      const out = clean(parsed, text);
      run.setAttributes({
        'gen_ai.output.messages': trace.outputMessages(JSON.stringify(out)),
        'scamcheck.verdict': out.verdict,
        'scamcheck.rule_hits': (hits || []).length,
        'scamcheck.quotes_dropped': (Array.isArray(parsed.flags) ? parsed.flags.length : 0) - out.flags.length,
      });
      return [200, out];
    } catch (e) {
      console.error('gemma', e.name, e.message);
      trace.failed(e);
      return [502, { error: e.status === 429 ? 'ai_busy' : 'ai_error' }];
    }
  });
  await trace.flush();
  return res.status(status).json(body);
}

export const aiOn = () => Boolean(process.env.GEMINI_API_KEY || OLLAMA);

// agentName: which agent run this call belongs to, for tracing.
export function ask(system, user, agentName = 'scamcheck') {
  return trace.chat(agentName, OLLAMA ? 'ollama' : 'gcp.gemini', MODEL, user, async (span) => {
    const { text, inTokens, outTokens } = await callModel(system, user);
    span.setAttributes({
      'gen_ai.usage.input_tokens': inTokens || 0,
      'gen_ai.usage.output_tokens': outTokens || 0,
      'gen_ai.output.messages': trace.outputMessages(text),
    });
    return text;
  });
}

async function callModel(system, user) {
  if (OLLAMA) {
    const r = await fetch(`${OLLAMA}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        format: 'json',
        options: { temperature: 0.2, num_predict: 700 },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      }),
      signal: AbortSignal.timeout(120000),
    });
    if (!r.ok) throw Object.assign(new Error(`ollama ${r.status}`), { status: r.status });
    const data = await r.json();
    return { text: data.message?.content || '', inTokens: data.prompt_eval_count, outTokens: data.eval_count };
  }
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) throw Object.assign(new Error(`gemini ${r.status}: ${(await r.text()).slice(0, 200)}`), { status: r.status });
  const data = await r.json();
  return {
    text: (data.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join(''),
    inTokens: data.usageMetadata?.promptTokenCount,
    outTokens: data.usageMetadata?.candidatesTokenCount,
  };
}

function parse(raw) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('no json');
  return JSON.parse(raw.slice(start, end + 1));
}

const squash = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
const noNumbers = (s) => String(s || '').replace(/\+?\d[\d\s-]{6,}\d/g, '').slice(0, 300);

// Keep the model honest: drop quotes that aren't really in the message, strip any phone numbers it wrote.
function clean(out, text) {
  const verdict = ['scam', 'suspicious', 'no_signs'].includes(out.verdict) ? out.verdict : 'suspicious';
  const msg = squash(text);
  const flags = (Array.isArray(out.flags) ? out.flags : [])
    .filter((f) => f && typeof f.quote === 'string' && f.quote.trim() && msg.includes(squash(f.quote)))
    .slice(0, 6)
    .map((f) => ({ quote: f.quote.trim().slice(0, 200), why: noNumbers(f.why) }));
  const steps = (Array.isArray(out.steps) ? out.steps : []).slice(0, 3).map(noNumbers).filter(Boolean);
  return { verdict, want: noNumbers(out.want), flags, steps, model: MODEL };
}
