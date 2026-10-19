# scamcheck

Paste a suspicious SMS or WhatsApp message and get a plain answer in English or Urdu: does it look like a scam, which words give it away, and what to do next.

Built for the scams people in Pakistan actually get: fake JazzCash and Easypaisa alerts, "BISP payment" texts, prize and lottery messages, fake courier fees and e-challans, "I sent money by mistake", job offers that want a fee, and "share your OTP" requests. It reads English, Roman Urdu and Urdu script.

## What it does

1. **Rule check** (instant, in the browser, no AI): 18 warning signs written for Pakistani scams, such as a request for an OTP or PIN, a fee before a prize, an "official" message that gives a 03xx mobile number, a copycat site like `hbl-update-kyc.com`, or disguised spelling like `pr0c3ss1ng f33`.
2. **Explanation** by Gemma, an open-weight model: what the sender wants, the exact words that give it away (highlighted), and what to do now.
3. **"Has anyone reported it?"**: on a tap, searches the web for the phone number or website in the message.
4. **Read aloud** in English or Urdu, using the phone's own voice.
5. **Official helplines** (NCCIA 1799, PTA, JazzCash, Easypaisa, BISP 8171).

The answer is always *Likely a scam*, *Be careful*, or *No warning signs found*. Never "safe".

## Privacy

- Phone numbers, CNICs and account numbers are replaced with placeholders in the browser before the AI sees the message.
- Nothing is stored or logged.
- The web lookup runs only when you tap it, and only sends the number or site from the message.
- Quotes the AI makes up are dropped, and it is not allowed to suggest phone numbers.

## How well it works

Scored with `node scripts/eval_rules.mjs` on labeled SMS datasets (see [`data/README.md`](data/README.md)):

| Dataset | Messages | Scams caught (*Be careful* or higher) | False alarms |
|---|---|---|---|
| Pakistan SMS classification set | 4,895 | 82% | 2.1% |
| same, *Likely a scam* only | | 71% | 0.3% |
| UrduStack eval set | 86 | 83% | 1.6% |
| Roman Urdu phishing set (Zenodo) | 1,000 | 100% | 0% |

The rules were written while looking at the Zenodo set and adjusted after reading misses on the other two, so treat these as best-case numbers.

## Run it

Needs Node.js 20+.

```
node scripts/dev.mjs        # http://localhost:3000
node --test test/*.test.mjs # rule tests
```

Optional settings in a `.env` file:

| Variable | What it turns on |
|---|---|
| `GEMINI_API_KEY` | Gemma 4 via Google AI Studio (free key at aistudio.google.com) |
| `OLLAMA_URL` | Gemma running locally instead, e.g. `http://localhost:11434` with `ollama pull gemma4:e4b-it-qat` |
| `SERPAPI_KEY` | The "has anyone reported it?" web search |

Without any of them, the rule check still works.

## Limits

This is a second opinion, not a guarantee. A message it doesn't flag can still be a scam, and new tricks will slip past the rules until they're added. Never share an OTP, PIN or password, whatever any tool says. If you have already lost money, call your bank and the NCCIA helpline (1799) right away.

## License

MIT
