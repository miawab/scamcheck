// Score the rule check against labeled datasets.
// node scripts/eval_rules.mjs [--misses] [--only=<set>]
//   zenodo     Roman Urdu phishing SMS (CC BY 4.0). The rules were tuned while looking at it, so its score is optimistic.
//   pk-sms     Pakistan SMS classification set (no license: local testing only, never committed). Held out.
//   urdustack  UrduStack eval set (MIT), scam vs harmless rows only. Held out.
import fs from 'node:fs';
import { check } from '../public/rules.js';

function csv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...rest] = rows;
  return rest.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

const SETS = {
  zenodo: () => JSON.parse(fs.readFileSync('data/zenodo-21810885/messages.json', 'utf8'))
    .map((r) => ({ text: r.Raw_text, scam: r.Labels === '1', kind: r.Source_Type })),
  'pk-sms': () => csv(fs.readFileSync('data/pk-sms-unlicensed/Pakistan_sms_dataset.csv', 'utf8'))
    .filter((r) => ['fraud', 'Normal', 'Promotional'].includes(r.Label))
    .map((r) => ({ text: r.Messages, scam: r.Label === 'fraud', kind: r.Label })),
  urdustack: () => csv(fs.readFileSync('data/urdustack/eval_dataset.csv', 'utf8'))
    .filter((r) => r.category !== 'toxic')
    .map((r) => ({ text: r.text, scam: r.expected_label === '1', kind: `${r.category}/${r.description}` })),
};

const showMisses = process.argv.includes('--misses');
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7);
const pct = (n, d) => (d ? ((100 * n) / d).toFixed(1) : '-') + '%';

for (const [name, load] of Object.entries(SETS)) {
  if (only && name !== only) continue;
  let rows;
  try { rows = load(); } catch { console.log(`\n${name}: not downloaded, skipped`); continue; }
  const scams = rows.filter((r) => r.scam).length;
  console.log(`\n== ${name}: ${rows.length} messages (${scams} scams, ${rows.length - scams} not)`);
  for (const cut of ['medium', 'high']) {
    let tp = 0, fp = 0;
    const missed = [], falses = {};
    for (const r of rows) {
      const { level } = check(r.text);
      const flagged = cut === 'medium' ? level !== 'low' : level === 'high';
      if (r.scam && flagged) tp++;
      else if (r.scam) missed.push(r);
      else if (flagged) { fp++; (falses[r.kind] ||= []).push(r.text); }
    }
    console.log(`  ${cut}+ : caught ${tp}/${scams} scams (${pct(tp, scams)}), false alarms ${fp}/${rows.length - scams} (${pct(fp, rows.length - scams)})`);
    if (showMisses && cut === 'medium') {
      const sample = [...new Set(missed.map((r) => r.text))];
      console.log(`  missed (${sample.length} unique), first 15:\n    - ` + sample.slice(0, 15).join('\n    - '));
      for (const [k, a] of Object.entries(falses)) console.log(`  false alarms in ${k} (${a.length}), first 8:\n    - ` + [...new Set(a)].slice(0, 8).join('\n    - '));
    }
  }
}
