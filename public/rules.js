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
      /\b(otp|one[- ]time (pass(word)?|code)|verification code|code|pin|mpin|cvv|password)\b.{0,40}\b(send|share|bata\w*|bhej\w*|forward|reply|tell|give|de do|dein|dain|call|sms)\b/i,
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
      /\b(fee|fees|charges?|tax|registration|processing|delivery charges|customs( duty)?|clearance|advance( payment)?|security deposit)\b/i,
      /(فیس|چارجز|ٹیکس|رجسٹریشن|ایڈوانس)/,
    ],
    needs: ['prize', 'parcel', 'aid', 'job', 'job_offer'],
  },
  {
    id: 'prize',
    weight: 2,
    en: 'Says you won a prize or lucky draw',
    ur: 'کہتا ہے آپ نے انعام یا قرعہ اندازی جیتی ہے',
    why_en: 'You cannot win a draw you never entered. "Prize" messages are the most common scam bait.',
    why_ur: 'جس قرعہ اندازی میں آپ شامل ہی نہیں ہوئے، اس میں جیت نہیں سکتے۔',
    patterns: [
      /\b(prize|winner|lucky draw|lottery|jackpot|inaam|inam|qura|(you|u) (have )?won(?!['’])|jeet (gaye|gae|gya|gaya|liya))\b/i,
      /\b(your (mobile )?(number|no\.?|sim)|you are|you're|u r|aap|apka|apki|apko)\b.{0,40}\bselect(ed|ion)?\b/i,
      /\bcongratulation\w*\b.{0,80}\b(rs\.?|rupees|pkr|lac|lakh|cash|bike|gold|umrah|car|motorcycle)\b/i,
      /(انعام|قرعہ|لکی ڈرا|جیت گیا|جیت گئے|جیت لیا|منتخب)/,
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
      /\b(block\w*|suspend\w*|band ho|deactivat\w*|closed?|expire\w*|freez\w*|hack\w*|legal action|arrest\w*|fir|warna)\b/i,
      /(فوری|فوراً|ابھی|بلاک|بند ہو|معطل|گرفتار)/,
    ],
    // "Anything urgent?" from a friend is normal. Pressure only counts next to another sign.
    needs: ['secret', 'pay_to_get', 'prize', 'aid', 'link', 'fake_site', 'mobile_sender', 'contact_number', 'mistake', 'id_details', 'account_takeover', 'job', 'brand', 'challan', 'send_money', 'award'],
  },
  {
    id: 'link',
    weight: 1,
    en: 'Has a link to click',
    ur: 'کلک کرنے کے لیے لنک دیا گیا ہے',
    why_en: 'Links in unexpected messages often lead to fake login pages that steal your details. Shortened links hide where they really go.',
    why_ur: 'اچانک آنے والے میسج کے لنک اکثر جعلی صفحات پر لے جاتے ہیں جو آپ کی معلومات چرا لیتے ہیں۔',
    patterns: [
      /\b(wa\.me|bit\.ly|tinyurl\.com|cutt\.ly|t\.ly|rb\.gy|is\.gd|shorturl\.at|tiny\.cc|s\.id)\/\S+/i,
      /\bhttps?:\/\/\S+/i,
      /\b[a-z0-9-]+\.(xyz|top|click|online|site|live|shop|icu|buzz|info|vip|cc|men)\b/i,
    ],
    // Shop promotions carry "send REG/UNSUB to stop" lines required for registered senders.
    unless: [/\b(to (block|stop|unsub\w*|opt out)|send (reg|unsub|stop|off)\b|text '?unsub)/i],
  },
  {
    id: 'mobile_sender',
    weight: 3,
    en: 'An "official" message that gives a personal mobile number',
    ur: 'سرکاری یا بینک کا میسج، مگر عام موبائل نمبر دیا گیا ہے',
    why_en: 'Banks, JazzCash, Easypaisa and BISP use short codes and official helplines, not 03xx mobile numbers.',
    why_ur: 'بینک، جاز کیش، ایزی پیسہ اور بی آئی ایس پی شارٹ کوڈ اور آفیشل ہیلپ لائن استعمال کرتے ہیں، 03 والے موبائل نمبر نہیں۔',
    patterns: [/(\+?92[\s-]?3\d{2}|\b03\d{2})[\s-]?\d{6,8}\b/, /\b3[0-4]\d{8}\b/],
    needs: ['brand', 'aid', 'prize', 'award', 'job', 'job_offer', 'send_money'],
  },
  {
    id: 'send_money',
    weight: 2,
    en: 'Asks you to send money to a wallet or number',
    ur: 'کسی والٹ یا نمبر پر پیسے بھیجنے کو کہہ رہا ہے',
    why_en: 'Scammers pose as a friend or relative from a new number. Call the person on the number you already have before sending anything.',
    why_ur: 'دھوکے باز نئے نمبر سے دوست یا رشتہ دار بن کر پیسے مانگتے ہیں۔ کچھ بھیجنے سے پہلے اسی شخص کو اس کے پرانے نمبر پر کال کریں۔',
    patterns: [
      /\b(send|tr?an?s?fer\w*|bhej\w*|kar do|karo)\b.{0,30}(\d[\d,]*\s*(rs|rupees|pkr)?|\brs\.?\s*\d+|\brupees)\b.{0,40}\b(easy ?paisa|jazz ?cash|sada ?pay|naya ?pay|account|number)\b/i,
      /\b(need|chahiye|zaroorat|urgently)\b.{0,40}(\d[\d,]{2,}|rupees|\brs\b).{0,80}\b(send|bhej\w*|transfer)\b/i,
      /(پیسے|روپے).{0,30}(بھیج|بھیجیں|بھیج دیں).{0,30}(ایزی پیسہ|جاز کیش|اکاؤنٹ|نمبر)/,
    ],
  },
  {
    id: 'award',
    weight: 2,
    en: 'Promises a reward or gift',
    ur: 'انعام یا تحفے کا وعدہ',
    why_en: 'A reward you did nothing for, plus "call this number" or a link, is how most prize scams start.',
    why_ur: 'بغیر کچھ کیے ملنے والا انعام، ساتھ میں "اس نمبر پر کال کریں" یا لنک، زیادہ تر دھوکوں کا آغاز ہوتا ہے۔',
    patterns: [/\b(awarded|award|reward|free gift|gift|to win|win (a|an)|free amount)\b/i, /(تحفہ|تحفے|ایوارڈ)/],
    needs: ['contact_number', 'mobile_sender', 'link', 'pay_to_get', 'id_details', 'urgent'],
  },
  {
    id: 'job_offer',
    weight: 0, // context only: a job offer is normal, a job offer that wants a fee is not
    en: 'A job offer',
    ur: 'نوکری کی پیشکش',
    why_en: '',
    why_ur: '',
    patterns: [/\b(jobs?|naukri|nokri|vacanc\w*|hiring|data entry|placement|interview|joining|salary|tankhwah)\b/i, /(نوکری|ملازمت|تنخواہ)/],
  },
  {
    id: 'contact_number',
    weight: 2,
    en: 'Tells you to call, text or send details to a number',
    ur: 'کسی نمبر پر کال، میسج یا تفصیل بھیجنے کو کہہ رہا ہے',
    why_en: 'A real bank or office tells you to use its official app or helpline, not a number written in a message.',
    why_ur: 'اصلی بینک یا ادارہ اپنی آفیشل ایپ یا ہیلپ لائن استعمال کرنے کا کہتا ہے، میسج میں لکھے نمبر پر نہیں۔',
    patterns: [
      /\b(is|iss|this|es|neeche|niche|below|given)\s+(number|no\.?|num)\b.{0,25}\b(par|pr|pe|on|to)?\s*(call|sms|rabta|raabta|contact|whatsapp|send|bhej\w*|reply|msg|message)/i,
      /\b(call|sms|rabta|raabta|contact|whatsapp|send|bhej\w*|reply)\w*\b.{0,15}\b(is|iss|this|es)\s+(number|no\.?)\b/i,
      /\b(details|tafseel\w*|maloomat|information|info)\b.{0,15}\b(send|bhej\w*|update|share|de|dain|dein)\b/i,
      /\b(contact|call|whatsapp|rabta|raabta)\w*\b.{0,15}\b(us|our|hamare|humare)\b.{0,15}\b(number|no\.?|whatsapp)\b/i,
      /\b(call|contact|whatsapp|text)\b\s+(us\s+|now\s+)?((at|on)\s+)?(this\s+)?(\+?92|0)?3\d{2}[\s-]?\d{6,8}/i,
      /\b(send|text|message)\b.{0,15}\b(me|us)\b.{0,15}\b(on|at|to)\b.{0,10}\b(this|my|our)\b.{0,10}\bnumber\b/i,
      /(اس نمبر پر|اس نمبر سے|نیچے دیے گئے نمبر).{0,20}(رابطہ|کال|میسج|بھیج)/,
    ],
    needs: ['brand', 'aid', 'prize', 'award', 'urgent', 'mistake', 'job', 'job_offer', 'secret', 'pay_to_get', 'send_money'],
  },
  {
    id: 'fake_site',
    weight: 3,
    en: 'A website that copies a real name',
    ur: 'ایسی ویب سائٹ جو کسی اصلی ادارے کا نام نقل کر رہی ہے',
    why_en: 'Real sites are short and official (like jazzcash.com.pk). Extra words around a bank or wallet name, like "hbl-update-kyc", are a common trick.',
    why_ur: 'اصلی ویب سائٹس سیدھی اور آفیشل ہوتی ہیں۔ بینک یا والٹ کے نام کے ساتھ اضافی الفاظ، جیسے "hbl-update-kyc"، ایک عام دھوکا ہے۔',
    patterns: [
      /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]*(?:jazz ?cash|easypaisa|sadapay|nayapay|hbl|ubl|mcb|meezan|alfalah|bisp|ehsaas|nadra|pta|fbr|psca|echallan|tcs|leopards|pakpost|pakistanpost|daraz)[a-z0-9]*-[a-z0-9-]+\.[a-z.]{2,}/i,
      /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9]+-(?:jazz ?cash|easypaisa|sadapay|nayapay|hbl|ubl|mcb|meezan|alfalah|bisp|ehsaas|nadra|pta|fbr|psca|echallan|tcs|leopards|pakpost|daraz)[a-z0-9-]*\.[a-z.]{2,}/i,
    ],
  },
  {
    id: 'challan',
    weight: 2,
    en: 'A traffic e-challan with a link to pay',
    ur: 'ٹریفک ای چالان کے ساتھ ادائیگی کا لنک',
    why_en: 'Safe City says real e-challan SMS contain no links. Check a challan yourself on echallan.psca.gop.pk and pay only through the e-Pay Punjab app.',
    why_ur: 'سیف سٹی کے مطابق اصلی ای چالان ایس ایم ایس میں کوئی لنک نہیں ہوتا۔ چالان خود echallan.psca.gop.pk پر چیک کریں اور صرف ای پے پنجاب ایپ سے ادائیگی کریں۔',
    patterns: [/\b(e-?challan|e-?chalan|challan|chalan|e-?ticket)\b/i, /(چالان)/],
    needs: ['link', 'fake_site', 'urgent'],
  },
  {
    id: 'account_takeover',
    weight: 3,
    en: 'Wants your WhatsApp or SIM code',
    ur: 'آپ کا واٹس ایپ یا سم کا کوڈ مانگ رہا ہے',
    why_en: 'That code lets someone take over your WhatsApp and message your contacts asking for money in your name.',
    why_ur: 'اس کوڈ سے کوئی آپ کا واٹس ایپ لے کر آپ کے نام پر آپ کے رشتہ داروں سے پیسے مانگ سکتا ہے۔',
    patterns: [
      /\b(whats ?app|whatsapp|wa|sim)\b.{0,60}\b(code|otp|verification|6[- ]digit|six[- ]digit)\b/i,
      /\b(6|six)[- ]digit\b.{0,40}\b(code|otp)\b/i,
      /(واٹس ایپ|سم).{0,40}(کوڈ)/,
    ],
    unless: [
      /\b(do not|don't|dont|never)\b.{0,15}\b(share|give|tell)\b/i,
      /(کسی کو نہ|شیئر نہ)/,
    ],
    needs: ['secret', 'contact_number', 'urgent', 'parcel'],
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
      /\b(work from home|ghar baithe|online earning|daily (earning|income|profit)|per day|part[- ]time job|like (videos|posts)|rating (hotels|apps|products)|remote task|task (job|role|work)|invest\w*.{0,40}\b(profit|return|double|guaranteed)|double your|guaranteed (job|income|profit|placement))\b/i,
      /\bearn\w*\b.{0,15}\d[\d,]*\s*(k\b|rs|rupees|pkr)?.{0,20}\b(per|a|every|daily|weekly|monthly|roz)\b/i,
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
  // Also match a cleaned-up copy, so "pr0c3ss1ng f33" and "j o b" are read as "processing fee" and "job".
  const plain = unmask(text);
  const found = {};
  for (const r of RULES) {
    const matches = [];
    for (const src of plain === text ? [text] : [text, plain]) {
      for (const p of r.patterns) {
        const g = new RegExp(p.source, p.flags.includes('g') ? p.flags : p.flags + 'g');
        for (const m of src.matchAll(g)) if (m[0].trim()) matches.push(m[0].trim());
      }
    }
    if (r.unless?.some((p) => p.test(text))) continue;
    if (matches.length) found[r.id] = { rule: r, matches: [...new Set(matches)] };
  }
  const hits = [];
  for (const { rule: r, matches } of Object.values(found)) {
    // Some signs only count alongside another (a fee is normal on a bill, suspicious with a "prize").
    if (r.needs && !r.needs.some((id) => found[id])) continue;
    if (!r.weight) continue;
    hits.push({ id: r.id, weight: r.weight, label_en: r.en, label_ur: r.ur, why_en: r.why_en, why_ur: r.why_ur, matches });
  }
  hits.sort((a, b) => b.weight - a.weight);
  const score = hits.reduce((s, h) => s + h.weight, 0);
  const level = score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low';
  return { score, level, hits };
}

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's' };

// Undo common tricks for slipping past filters: digits for letters inside words, and spaced-out letters.
export function unmask(text) {
  return text
    .replace(/\b(?:[a-z] ){3,}[a-z]\b/gi, (m) => m.replace(/ /g, '')) // "j o b" -> "job"
    .replace(/[a-z@$]*[0-9@$][a-z0-9@$]*/gi, (w) => (/[a-z]/i.test(w) && /[a-z].*[0-9@$]|[0-9@$].*[a-z]/i.test(w) && !/^\d+(k|rs|pkr|lac|lakh)$/i.test(w)
      ? w.replace(/[013457@$]/g, (c) => LEET[c])
      : w));
}

// Hides phone numbers, CNICs and long account numbers before text leaves the browser for the AI.
export function redact(text) {
  return text
    .replace(/\b\d{5}-?\d{7}-?\d\b/g, '[CNIC]')
    .replace(/(\+?92[\s-]?3\d{2}|\b03\d{2})[\s-]?\d{6,8}\b|\b3[0-4]\d{8}\b/g, '[MOBILE NUMBER]')
    .replace(/\b\d{10,}\b/g, '[ACCOUNT NUMBER]');
}
