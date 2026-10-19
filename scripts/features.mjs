// Turn messages into a table of numbers (one column per warning sign, plus a few simple counts)
// so a tabular model like TabPFN can learn how much each sign matters.
// node scripts/features.mjs  ->  data/results/features-{zenodo,pk-sms,urdustack}.csv
import fs from 'node:fs';
import { RULES, check } from '../public/rules.js';

export const COLUMNS = [
  ...RULES.map((r) => `rule_${r.id}`),
  'rule_score', 'chars', 'digits_share', 'has_url', 'has_mobile', 'urdu_script', 'upper_share',
];

export function features(text) {
  const { hits, score } = check(text);
  const ids = new Set(hits.map((h) => h.id));
  const letters = text.replace(/[^a-z]/gi, '');
  return [
    ...RULES.map((r) => (ids.has(r.id) ? 1 : 0)),
    score,
    text.length,
    +(text.replace(/\D/g, '').length / Math.max(1, text.length)).toFixed(3),
    /https?:\/\/|www\.|\b[a-z0-9-]+\.(com|pk|cc|xyz|top|me|ly)\b/i.test(text) ? 1 : 0,
    /(\+?92|\b0)?3\d{2}[\s-]?\d{7}\b/.test(text) ? 1 : 0,
    /[؀-ۿ]/.test(text) ? 1 : 0,
    +(letters.replace(/[^A-Z]/g, '').length / Math.max(1, letters.length)).toFixed(3),
  ];
}

if (process.argv[1].endsWith('features.mjs')) {
  const { SETS } = await import('./eval_rules.mjs');
  fs.mkdirSync('data/results', { recursive: true });
  for (const [name, load] of Object.entries(SETS)) {
    let rows;
    try { rows = load(); } catch { continue; }
    const lines = [[...COLUMNS, 'scam'].join(',')];
    for (const r of rows) lines.push([...features(r.text), r.scam ? 1 : 0].join(','));
    fs.writeFileSync(`data/results/features-${name}.csv`, lines.join('\n'));
    console.log(name, rows.length);
  }
}
