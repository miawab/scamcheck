import { check, redact } from './rules.js';
import { EXAMPLES } from './examples.js';

const T = {
  en: {
    title: 'Is this message a scam?',
    sub: 'Paste an SMS or WhatsApp message you are not sure about. You will get a plain answer and what to do next.',
    label: 'The message',
    placeholder: 'Paste the message here…',
    check: 'Check message',
    checking: 'Checking…',
    privacy: 'Phone numbers, CNICs and account numbers are hidden before the AI reads the message. Nothing is saved.',
    try: 'Or try an example:',
    want: 'What the sender wants',
    message: 'The message',
    signs: 'Warning signs',
    todo: 'What to do',
    helplines: 'Official helplines',
    limits: 'This is a second opinion, not a guarantee. Never share an OTP, PIN or password, whatever any tool says.',
    footer: 'scamcheck · rule check + an open-weight Gemma model · open source (MIT)',
    high: ['Likely a scam', 'Do not reply, pay, click or share any code.'],
    medium: ['Be careful', 'Some warning signs. Check with the official helpline before you do anything.'],
    low: ['No warning signs found', 'That does not prove it is safe. If it asks for money or a code, stop and check.'],
    ai_off: 'Showing the quick rule check only. The AI explanation is not available right now.',
    ai_busy: 'The AI is busy right now, so this is the quick rule check only. Try again in a minute.',
    slow_down: 'You have checked a lot of messages. This is the quick rule check only for now.',
    disagree: 'The keyword check and the AI did not agree, so we show the more careful answer.',
    by_ai: 'Explained by Gemma, an open-weight AI model. It can make mistakes.',
    empty: 'Paste a message first.',
    defaultSteps: {
      high: ['Do not reply, call back or click any link in it.', 'Never share an OTP, PIN, password or CNIC.', 'Block the number and report it (see helplines below).'],
      medium: ['Do not send money or codes yet.', 'Call the official helpline yourself (not a number from the message) to check.', 'Ask someone you trust.'],
      low: ['If it later asks for money, a code or your CNIC, stop and check again.'],
    },
    lines: [
      ['Cybercrime (NCCIA)', '1799'],
      ['PTA: report a scam number', '0800-55055 · complaint.pta.gov.pk'],
      ['JazzCash', '4444'],
      ['Easypaisa', '3737'],
      ['BISP: the real SMS service', '8171'],
    ],
  },
  ur: {
    title: 'کیا یہ میسج دھوکا ہے؟',
    sub: 'جس ایس ایم ایس یا واٹس ایپ میسج پر شک ہو، اسے یہاں پیسٹ کریں۔ آپ کو سیدھا جواب اور آگے کیا کرنا ہے، دونوں ملیں گے۔',
    label: 'میسج',
    placeholder: 'میسج یہاں پیسٹ کریں…',
    check: 'میسج چیک کریں',
    checking: 'چیک ہو رہا ہے…',
    privacy: 'اے آئی کے پڑھنے سے پہلے فون نمبر، شناختی کارڈ اور اکاؤنٹ نمبر چھپا دیے جاتے ہیں۔ کچھ بھی محفوظ نہیں کیا جاتا۔',
    try: 'یا کوئی مثال آزمائیں:',
    want: 'بھیجنے والا کیا چاہتا ہے',
    message: 'میسج',
    signs: 'خطرے کی نشانیاں',
    todo: 'اب کیا کریں',
    helplines: 'آفیشل ہیلپ لائنز',
    limits: 'یہ صرف دوسری رائے ہے، ضمانت نہیں۔ کوئی بھی ٹول کچھ بھی کہے، OTP، پن یا پاس ورڈ کبھی کسی کو نہ بتائیں۔',
    footer: 'scamcheck · رول چیک + اوپن ویٹ Gemma ماڈل · اوپن سورس (MIT)',
    high: ['غالباً دھوکا ہے', 'جواب نہ دیں، پیسے نہ بھیجیں، لنک نہ کھولیں، کوئی کوڈ نہ بتائیں۔'],
    medium: ['احتیاط کریں', 'کچھ خطرے کی نشانیاں ہیں۔ کچھ کرنے سے پہلے آفیشل ہیلپ لائن سے تصدیق کریں۔'],
    low: ['کوئی خطرے کی نشانی نہیں ملی', 'اس کا مطلب یہ نہیں کہ یہ یقینی طور پر محفوظ ہے۔ اگر پیسے یا کوڈ مانگے تو رک جائیں۔'],
    ai_off: 'صرف فوری رول چیک دکھایا جا رہا ہے۔ اے آئی کی وضاحت ابھی دستیاب نہیں۔',
    ai_busy: 'اے آئی ابھی مصروف ہے، اس لیے صرف فوری رول چیک ہے۔ ایک منٹ بعد دوبارہ کوشش کریں۔',
    slow_down: 'آپ نے بہت سے میسج چیک کیے ہیں۔ ابھی صرف فوری رول چیک دستیاب ہے۔',
    disagree: 'رول چیک اور اے آئی کا جواب مختلف تھا، اس لیے زیادہ محتاط جواب دکھایا گیا ہے۔',
    by_ai: 'وضاحت Gemma نے کی ہے، جو ایک اوپن ویٹ اے آئی ماڈل ہے۔ اس سے غلطی ہو سکتی ہے۔',
    empty: 'پہلے میسج پیسٹ کریں۔',
    defaultSteps: {
      high: ['جواب نہ دیں، واپس کال نہ کریں، کوئی لنک نہ کھولیں۔', 'OTP، پن، پاس ورڈ یا شناختی کارڈ نمبر کبھی نہ بتائیں۔', 'نمبر بلاک کریں اور رپورٹ کریں (نیچے ہیلپ لائنز دیکھیں)۔'],
      medium: ['ابھی پیسے یا کوڈ نہ بھیجیں۔', 'خود آفیشل ہیلپ لائن پر کال کر کے تصدیق کریں (میسج والے نمبر پر نہیں)۔', 'کسی بھروسے والے شخص سے پوچھیں۔'],
      low: ['اگر بعد میں پیسے، کوڈ یا شناختی کارڈ مانگے تو رک کر دوبارہ چیک کریں۔'],
    },
    lines: [
      ['سائبر کرائم (این سی سی آئی اے)', '1799'],
      ['پی ٹی اے: دھوکے والا نمبر رپورٹ کریں', '0800-55055 · complaint.pta.gov.pk'],
      ['جاز کیش', '4444'],
      ['ایزی پیسہ', '3737'],
      ['بی آئی ایس پی کا اصلی ایس ایم ایس', '8171'],
    ],
  },
};

const $ = (id) => document.getElementById(id);
const msg = $('msg');
const go = $('go');
let lang = 'en';
try { lang = localStorage.getItem('lang') === 'ur' ? 'ur' : 'en'; } catch {}
let last = null; // the last result, so switching language re-draws it

function setLang(l) {
  lang = l;
  try { localStorage.setItem('lang', l); } catch {}
  document.documentElement.lang = l;
  document.documentElement.dir = l === 'ur' ? 'rtl' : 'ltr';
  for (const b of document.querySelectorAll('.lang button')) b.setAttribute('aria-pressed', String(b.dataset.lang === l));
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = T[l][el.dataset.t];
  for (const el of document.querySelectorAll('[data-ph]')) el.placeholder = T[l][el.dataset.ph];
  if (!go.disabled) go.textContent = T[l].check;
  if (last) draw(last);
}

for (const b of document.querySelectorAll('.lang button')) b.addEventListener('click', () => {
  // Re-ask the AI in the new language if a result is showing; the rule check re-draws instantly.
  setLang(b.dataset.lang);
  if (last?.ai) run();
});

for (const ex of EXAMPLES) {
  const c = document.createElement('button');
  c.type = 'button';
  c.className = 'chip';
  c.textContent = ex.label;
  if (/[؀-ۿ]/.test(ex.label)) c.lang = 'ur';
  c.addEventListener('click', () => { msg.value = ex.text; count(); run(); });
  $('examples').append(c);
}

function count() { $('count').textContent = `${msg.value.length} / 1500`; }
msg.addEventListener('input', count);
go.addEventListener('click', run);
msg.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); });

async function run() {
  const text = msg.value.trim();
  if (!text) { msg.focus(); msg.placeholder = T[lang].empty; return; }
  const rules = check(text);
  last = { text, rules, ai: null, aiError: null };
  draw(last); // show the instant rule check straight away

  go.disabled = true;
  go.innerHTML = `<span class="spin" aria-hidden="true"></span>${T[lang].checking}`;
  try {
    const r = await fetch('/api/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: redact(text), lang, hits: rules.hits.map((h) => h.id) }),
    });
    const body = await r.json().catch(() => ({}));
    if (last.text !== text) return; // a newer check started
    if (r.ok) last.ai = body;
    else last.aiError = ['ai_busy', 'slow_down'].includes(body.error) ? body.error : 'ai_off';
  } catch {
    last.aiError = 'ai_off';
  } finally {
    go.disabled = false;
    go.textContent = T[lang].check;
  }
  draw(last);
}

const LEVEL = { low: 0, medium: 1, high: 2 };
const FROM_AI = { no_signs: 'low', suspicious: 'medium', scam: 'high' };

function draw({ text, rules, ai, aiError }) {
  const t = T[lang];
  const aiLevel = ai ? FROM_AI[ai.verdict] : null;
  // Show the more careful of the two answers.
  const level = aiLevel && LEVEL[aiLevel] > LEVEL[rules.level] ? aiLevel : rules.level;

  $('result').hidden = false;
  const v = $('verdict');
  v.className = `verdict ${level}`;
  v.innerHTML = `${icon(level)}<div><strong></strong><p></p></div>`;
  v.querySelector('strong').textContent = t[level][0];
  v.querySelector('p').textContent = t[level][1];

  $('want-block').hidden = !ai?.want;
  $('want').textContent = ai?.want || '';

  // Highlight the phrases the rules matched and the AI quoted.
  // The AI saw "[MOBILE NUMBER]" where the real number was, so highlight the pieces around it.
  const aiPieces = (ai?.flags || []).flatMap((f) => f.quote.split(/\[(?:MOBILE NUMBER|CNIC|ACCOUNT NUMBER)\]/).map((p) => p.trim()));
  const phrases = [...rules.hits.flatMap((h) => h.matches), ...aiPieces];
  $('marked').innerHTML = highlight(text, phrases);

  const items = [];
  for (const f of ai?.flags || []) items.push({ title: f.why, quote: f.quote });
  for (const h of rules.hits) {
    if (h.weight < 2 && rules.hits.length > 1) continue; // "uses a bank name" alone isn't worth a line
    items.push({ title: h[`label_${lang}`], why: h[`why_${lang}`], quote: h.matches[0] });
  }
  $('flags-block').hidden = !items.length;
  $('flags').replaceChildren(...items.slice(0, 8).map((i) => {
    const li = document.createElement('li');
    const b = document.createElement('b');
    b.textContent = i.title;
    li.append(b);
    if (i.why) { const p = document.createElement('div'); p.className = 'why'; p.textContent = i.why; li.append(p); }
    if (i.quote) { const q = document.createElement('q'); q.textContent = i.quote; li.append(q); }
    return li;
  }));

  const steps = ai?.steps?.length && level !== 'low' ? ai.steps : t.defaultSteps[level];
  $('steps').replaceChildren(...steps.map((s) => Object.assign(document.createElement('li'), { textContent: s })));
  $('helplines').replaceChildren(...t.lines.map(([name, num]) => {
    const li = document.createElement('li');
    li.append(`${name}: `);
    const b = document.createElement('b');
    b.dir = 'ltr';
    b.textContent = num;
    li.append(b);
    return li;
  }));

  const notes = [];
  if (aiError) notes.push(t[aiError]);
  if (ai) notes.push(t.by_ai);
  if (aiLevel && Math.abs(LEVEL[aiLevel] - LEVEL[rules.level]) === 2) notes.push(t.disagree);
  $('ai-note').textContent = notes.join(' ');
}

function highlight(text, phrases) {
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ranges = [];
  const lower = text.toLowerCase();
  for (const p of new Set(phrases.filter((p) => p && p.length > 1))) {
    let i = lower.indexOf(p.toLowerCase());
    while (i >= 0) { ranges.push([i, i + p.length]); i = lower.indexOf(p.toLowerCase(), i + p.length); }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  let out = '';
  let pos = 0;
  for (const [s, e] of ranges) {
    if (e <= pos) continue;
    const start = Math.max(s, pos);
    out += esc(text.slice(pos, start)) + '<mark>' + esc(text.slice(start, e)) + '</mark>';
    pos = e;
  }
  return out + esc(text.slice(pos));
}

function icon(level) {
  const paths = {
    high: '<circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 17h.01"/>',
    medium: '<path d="M12 3 2 21h20z"/><path d="M12 10v4M12 18h.01"/>',
    low: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[level]}</svg>`;
}

setLang(lang);
count();
