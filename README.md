# scamcheck

Paste a suspicious SMS or WhatsApp message and get a plain answer in English or Urdu: does it look like a scam, which words give it away, and what to do next.

Built for the scams people in Pakistan actually get: fake JazzCash and Easypaisa alerts, "BISP payment" texts, prize and lottery messages, fake courier fees, and "share your OTP" requests.

## How it works

1. **Rule check** (instant, no AI): looks for known warning signs such as requests for an OTP or PIN, shortened links, urgency, and payments to a personal number.
2. **AI explanation**: an open-weight Gemma model reads the message and explains, in simple words, what the sender wants and why that is risky.

The rule check runs even when the AI is unavailable.

## Limits

This is a second opinion, not a guarantee. A message it marks as safe can still be a scam. Never share an OTP, PIN or password, whatever any tool says.

## License

MIT
