// Warning signs common in scam SMS/WhatsApp messages sent in Pakistan.
// Runs in the browser (instant, works without the AI) and on the server (to ground the AI).
// Each rule: id, weight (how strongly it points to a scam), patterns (English, Roman Urdu, Urdu script).

export const RULES = [
  {
    id: 'secret',
    weight: 4,
    en: 'Asks for a code, PIN or password',
    ur: 'کوڈ، پن یا پاس ورڈ مانگ رہا ہے',
    why_en: 'No bank, wallet or government office ever asks you to send an OTP, PIN or password by message or call.',
    why_ur: 'کوئی بینک، والٹ یا سرکاری ادارہ کبھی میسج یا کال پر OTP، پن یا پاس ورڈ نہیں مانگتا۔',
    patterns: [
      /\b(otp|one[- ]time (pass(word)?|code)|verification code|code|pin|mpin|cvv|password)\b.{0,40}\b(send|share|bata\w*|bhej\w*|forward|reply|tell|give|de do|dein)\b/i,
      /\b(send|share|bata\w*|bhej\w*|forward|reply|tell|give)\b.{0,40}\b(otp|one[- ]time (pass(word)?|code)|verification code|code|pin|mpin|cvv|password)\b/i,
      /(کوڈ|پن|پاس ورڈ|خفیہ نمبر).{0,30}(بتا|بھیج|شیئر|دے)/,
    ],
    // Real banks end their OTP texts with "never share this code"; that is a warning, not a request.
    unless: [
      /\b(do not|don't|dont|never|na)\b.{0,15}\b(share|bata\w*|bhej\w*|disclose|tell|give)\b/i,
      /\b(share|bata\w*)\b.{0,10}\b(na|mat|nahi|nahin)\b/i,
      /(کسی کو نہ|کسی کے ساتھ شیئر نہ|نہ بتائیں|مت بتائیں)/,
    ],
  },
  {
    id: 'pay_to_get',
    weight: 3,
    en: 'Wants a fee before you get money or a parcel',
    ur: 'رقم یا پارسل دینے سے پہلے فیس مانگ رہا ہے',
    why_en: 'Real prizes, refunds and aid payments never ask you to pay a "fee", "tax" or "charges" first.',
    why_ur: 'اصلی انعام، ریفنڈ یا امداد کے لیے پہلے کوئی فیس، ٹیکس یا چارجز نہیں دینے پڑتے۔',
    patterns: [
      /\b(fee|fees|charges?|tax|registration|processing|delivery charges|customs( duty)?|clearance)\b/i,
      /(فیس|چارجز|ٹیکس|رجسٹریشن)/,
    ],
    needs: ['prize', 'parcel', 'aid', 'job'],
  },
  {
    id: 'prize',
    weight: 2,
    en: 'Says you won a prize or lucky draw',
    ur: 'کہتا ہے آپ نے انعام یا قرعہ اندازی جیتی ہے',
    why_en: 'You cannot win a draw you never entered. "Prize" messages are the most common scam bait.',
    why_ur: 'جس قرعہ اندازی میں آپ شامل ہی نہیں ہوئے، اس میں جیت نہیں سکتے۔',
    patterns: [
      /\b(prize|winner|lucky draw|lottery|jackpot|inaam|inam|qura|(you|u) (have )?won|jeet (gaye|gae|gya|gaya|liya))\b/i,
      /(انعام|قرعہ|لکی ڈرا|جیت گیا|جیت گئے|جیت لیا)/,
    ],
  },
  {
    id: 'aid',
    weight: 2,
    en: 'Uses a government aid programme (BISP, Ehsaas)',
    ur: 'سرکاری امدادی پروگرام (بی آئی ایس پی، احساس) کا نام لے رہا ہے',
    why_en: 'Scammers copy BISP and Ehsaas because many families wait for these payments. The real BISP SMS service is 8171, not a mobile number.',
    why_ur: 'دھوکے باز بی آئی ایس پی اور احساس کا نام استعمال کرتے ہیں۔ اصلی بی آئی ایس پی کا میسج 8171 سے آتا ہے، کسی موبائل نمبر سے نہیں۔',
    patterns: [
      /\b(bisp|ehsaa?s|benazir|kafaalat|8171|imdad\w*)\b/i,
      /(بینظیر|احساس|کفالت|امداد|8171)/,
    ],
  },
  {
    id: 'urgent',
    weight: 2,
    en: 'Rushes or threatens you',
    ur: 'جلدی کروا رہا ہے یا دھمکی دے رہا ہے',
    why_en: 'Scammers rush you so you act before you think. A real problem with your account can wait for you to call the official helpline.',
    why_ur: 'دھوکے باز جلدی اس لیے کرواتے ہیں تاکہ آپ سوچ نہ سکیں۔ اکاؤنٹ کا اصلی مسئلہ آفیشل ہیلپ لائن پر کال کرنے تک انتظار کر سکتا ہے۔',
    patterns: [
      /\b(urgent\w*|immediately|right now|within \d+ ?(hours?|hrs?|minutes?|mins?)|\d+ ?(hours?|hrs?|ghant\w*|minat\w*) (mein|main|me|ke liye|tak)|today only|last chance|foran|fori|abhi|jaldi)\b/i,
      /\b(block\w*|suspend\w*|band ho|deactivat\w*|closed?|expire\w*|legal action|arrest\w*|fir)\b/i,
      /(فوری|فوراً|ابھی|بلاک|بند ہو|معطل|گرفتار)/,
    ],
  },
  {
    id: 'link',
    weight: 2,
    en: 'Has a link to click',
    ur: 'کلک کرنے کے لیے لنک دیا گیا ہے',
    why_en: 'Links in unexpected messages often lead to fake login pages that steal your details. Shortened links hide where they really go.',
    why_ur: 'اچانک آنے والے میسج کے لنک اکثر جعلی صفحات پر لے جاتے ہیں جو آپ کی معلومات چرا لیتے ہیں۔',
    patterns: [
      /\b(wa\.me|bit\.ly|tinyurl\.com|cutt\.ly|t\.ly|rb\.gy|is\.gd|shorturl\.at|tiny\.cc|s\.id)\/\S+/i,
      /\bhttps?:\/\/\S+/i,
      /\b[a-z0-9-]+\.(xyz|top|click|online|site|live|shop|icu|buzz|info|vip)\b/i,
    ],
  },
  {
    id: 'mobile_sender',
    weight: 3,
    en: 'An "official" message that gives a personal mobile number',
    ur: 'سرکاری یا بینک کا میسج، مگر عام موبائل نمبر دیا گیا ہے',
    why_en: 'Banks, JazzCash, Easypaisa and BISP use short codes and official helplines, not 03xx mobile numbers.',
    why_ur: 'بینک، جاز کیش، ایزی پیسہ اور بی آئی ایس پی شارٹ کوڈ اور آفیشل ہیلپ لائن استعمال کرتے ہیں، 03 والے موبائل نمبر نہیں۔',
    patterns: [/(\+?92[\s-]?3\d{2}|\b03\d{2})[\s-]?\d{7}\b/],
    needs: ['brand', 'aid', 'prize', 'job'],
  },
  {
    id: 'brand',
    weight: 1,
    en: 'Uses the name of a bank, wallet or government office',
    ur: 'کسی بینک، والٹ یا سرکاری ادارے کا نام استعمال کر رہا ہے',
    why_en: 'Scammers borrow trusted names. The name alone proves nothing.',
    why_ur: 'دھوکے باز بھروسے والے نام استعمال کرتے ہیں۔ صرف نام سے کچھ ثابت نہیں ہوتا۔',
    patterns: [
      /\b(jazz ?cash|easy ?paisa|sada ?pay|naya ?pay|hbl|ubl|mcb|meezan|allied bank|bank alfalah|state bank|sbp|nadra|pta|fbr|fia|nccia|police|pak army|jazz|zong|telenor|ufone)\b/i,
      /(جاز کیش|ایزی پیسہ|بینک|نادرا|پی ٹی اے|ایف بی آر|ایف آئی اے|پولیس)/,
    ],
  },
  {
    id: 'mistake',
    weight: 3,
    en: '"I sent money to you by mistake"',
    ur: '"غلطی سے آپ کو پیسے بھیج دیے"',
    why_en: 'A classic trick: a fake "you received money" SMS, then a request to send it back. Check your real balance in the app first. Usually nothing arrived.',
    why_ur: 'پرانا طریقہ: پہلے جعلی "رقم موصول" کا میسج، پھر واپس بھیجنے کی درخواست۔ پہلے ایپ میں اپنا اصل بیلنس دیکھیں۔',
    patterns: [
      /\b(by mistake|wrongly|wrong number|ghalti|galti|ghalati)\b/i,
      /\b(wapis|wapas|return)\b.{0,40}\b(kar\w*|send|bhej\w*)\b/i,
      /(غلطی سے|واپس کر|واپس بھیج)/,
    ],
  },
  {
    id: 'parcel',
    weight: 1,
    en: 'About a parcel or delivery',
    ur: 'پارسل یا ڈیلیوری کے بارے میں',
    why_en: 'Fake courier messages ask for an "address update" or a small fee to steal card details.',
    why_ur: 'جعلی کوریئر میسج "ایڈریس اپڈیٹ" یا چھوٹی فیس کے بہانے کارڈ کی معلومات چراتے ہیں۔',
    patterns: [
      /\b(parcel|package|shipment|courier|delivery|tcs|leopards|m&p|pakistan post|dhl|fedex)\b/i,
      /(پارسل|کوریئر|ڈیلیوری)/,
    ],
  },
  {
    id: 'job',
    weight: 2,
    en: 'Easy money or "work from home" offer',
    ur: 'آسان کمائی یا "گھر بیٹھے کام" کی پیشکش',
    why_en: 'Task and "like videos for money" jobs pay a little at first, then ask you to "invest" and keep it.',
    why_ur: 'ویڈیو لائک کرنے جیسے کام شروع میں تھوڑے پیسے دیتے ہیں، پھر "انویسٹمنٹ" مانگ کر رکھ لیتے ہیں۔',
    patterns: [
      /\b(work from home|ghar baithe|online earning|daily (earning|income|profit)|per day|part[- ]time job|like (videos|posts)|tasks?|invest\w*|double your)\b/i,
      /(گھر بیٹھے|روزانہ کمائی|آن لائن کمائی|سرمایہ کاری)/,
    ],
  },
  {
    id: 'id_details',
    weight: 3,
    en: 'Asks for your CNIC, card or account details',
    ur: 'شناختی کارڈ، اے ٹی ایم کارڈ یا اکاؤنٹ کی تفصیل مانگ رہا ہے',
    why_en: 'With your CNIC and card details, someone can open accounts or take money in your name.',
    why_ur: 'آپ کے شناختی کارڈ اور کارڈ کی تفصیل سے کوئی آپ کے نام پر اکاؤنٹ کھول یا رقم نکال سکتا ہے۔',
    patterns: [
      /\b(cnic|id card|shanakhti|atm|debit card|credit card|card number|account number|iban)\b.{0,60}\b(send|share|bata\w*|bhej\w*|provide|reply|enter|confirm|verify)\b/i,
      /\b(send|share|bata\w*|bhej\w*|provide|reply|enter|confirm|verify)\b.{0,60}\b(cnic|id card|shanakhti|atm|card number|account number|iban)\b/i,
      /(شناختی کارڈ|اے ٹی ایم|کارڈ نمبر|اکاؤنٹ نمبر)/,
    ],
  },
];

// Returns { score, level, hits: [{ id, weight, label_en, label_ur, why_en, why_ur, matches: [text] }] }
export function check(text) {
  const found = {};
  for (const r of RULES) {
    const matches = [];
    for (const p of r.patterns) {
      const g = new RegExp(p.source, p.flags.includes('g') ? p.flags : p.flags + 'g');
      for (const m of text.matchAll(g)) if (m[0].trim()) matches.push(m[0].trim());
    }
    if (r.unless?.some((p) => p.test(text))) continue;
    if (matches.length) found[r.id] = { rule: r, matches: [...new Set(matches)] };
  }
  const hits = [];
  for (const { rule: r, matches } of Object.values(found)) {
    // Some signs only count alongside another (a fee is normal on a bill, suspicious with a "prize").
    if (r.needs && !r.needs.some((id) => found[id])) continue;
    hits.push({ id: r.id, weight: r.weight, label_en: r.en, label_ur: r.ur, why_en: r.why_en, why_ur: r.why_ur, matches });
  }
  hits.sort((a, b) => b.weight - a.weight);
  const score = hits.reduce((s, h) => s + h.weight, 0);
  const level = score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low';
  return { score, level, hits };
}

// Hides phone numbers, CNICs and long account numbers before text leaves the browser for the AI.
export function redact(text) {
  return text
    .replace(/\b\d{5}-?\d{7}-?\d\b/g, '[CNIC]')
    .replace(/(\+?92[\s-]?3\d{2}|\b03\d{2})[\s-]?\d{7}\b/g, '[MOBILE NUMBER]')
    .replace(/\b\d{10,}\b/g, '[ACCOUNT NUMBER]');
}
