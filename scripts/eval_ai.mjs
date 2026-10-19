// Score rules alone vs rules + Gemma on a fixed random sample.
// OLLAMA_URL=http://localhost:11434 node scripts/eval_ai.mjs [n=150]
// Writes data/results/ai-sample.json so the numbers can be checked later.
import fs from 'node:fs';
import { check, redact } from '../public/rules.js';
import { ask } from '../api/check.js';

const n = Number(process.argv[2] || 150);
const { SYSTEM_PROMPT: SYSTEM } = await import('../api/check.js');

// Same loaders as eval_rules.mjs (kept small on purpose).
function csv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...rest] = rows;
  return rest.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

let pool = [];
try {
  pool = pool.concat(csv(fs.readFileSync('data/pk-sms-unlicensed/Pakistan_sms_dataset.csv', 'utf8'))
    .filter((r) => ['fraud', 'Normal', 'Promotional'].includes(r.Label))
    .map((r) => ({ set: 'pk-sms', text: r.Messages, scam: r.Label === 'fraud', kind: r.Label })));
} catch {}
pool = pool.concat(csv(fs.readFileSync('data/urdustack/eval_dataset.csv', 'utf8'))
  .filter((r) => r.category !== 'toxic')
  .map((r) => ({ set: 'urdustack', text: r.text, scam: r.expected_label === '1', kind: r.category })));

// Deterministic shuffle so reruns use the same sample.
let seed = 42;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
pool = [...new Map(pool.map((r) => [r.text, r])).values()].sort(() => rand() - 0.5);
// Balance: half scams, half not.
const scams = pool.filter((r) => r.scam).slice(0, Math.ceil(n / 2));
const nots = pool.filter((r) => !r.scam).slice(0, Math.floor(n / 2));
const sample = [...scams, ...nots];

const LEVEL = { low: 0, medium: 1, high: 2 };
const FROM_AI = { no_signs: 'low', suspicious: 'medium', scam: 'high' };
const out = [];
for (const [i, r] of sample.entries()) {
  const rules = check(r.text);
  let ai = null, err = null;
  try {
    const hits = rules.hits.map((h) => h.id);
    const note = hits.length ? `A simple keyword check already noticed: ${hits.join(', ')}. Use it as a hint, not proof.` : 'A simple keyword check found no warning signs. Look carefully anyway.';
    const raw = await ask(SYSTEM.replace('LANGUAGE', 'simple English'), `${note}\n\nMessage:\n"""\n${redact(r.text)}\n"""`);
    ai = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)).verdict;
  } catch (e) { err = e.message; }
  const aiLevel = FROM_AI[ai] || null;
  const both = aiLevel && LEVEL[aiLevel] > LEVEL[rules.level] ? aiLevel : rules.level;
  out.push({ ...r, rules: rules.level, ai: aiLevel, both, err });
  if ((i + 1) % 10 === 0) console.log(`${i + 1}/${sample.length}`);
}

fs.mkdirSync('data/results', { recursive: true });
fs.writeFileSync('data/results/ai-sample.json', JSON.stringify(out.map(({ text, ...o }) => ({ ...o, text: o.set === 'pk-sms' ? undefined : text })), null, 1));

const pct = (a, b) => (b ? ((100 * a) / b).toFixed(1) : '-') + '%';
for (const key of ['rules', 'ai', 'both']) {
  for (const cut of ['medium', 'high']) {
    const ok = out.filter((r) => r[key]);
    const flagged = (r) => (cut === 'medium' ? r[key] !== 'low' : r[key] === 'high');
    const s = ok.filter((r) => r.scam), ns = ok.filter((r) => !r.scam);
    console.log(`${key.padEnd(5)} ${cut}+ : caught ${s.filter(flagged).length}/${s.length} (${pct(s.filter(flagged).length, s.length)}), false alarms ${ns.filter(flagged).length}/${ns.length} (${pct(ns.filter(flagged).length, ns.length)})`);
  }
}
console.log('AI errors:', out.filter((r) => r.err).length);
