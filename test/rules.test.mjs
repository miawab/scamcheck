// node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, redact } from '../public/rules.js';
import { EXAMPLES } from '../public/examples.js';

for (const ex of EXAMPLES) {
  test(`${ex.id}: ${ex.scam ? 'flagged' : 'not flagged'}`, () => {
    const r = check(ex.text);
    if (ex.scam) assert.notEqual(r.level, 'low', JSON.stringify(r.hits.map((h) => h.id)));
    else assert.equal(r.level, 'low', JSON.stringify(r.hits.map((h) => [h.id, h.matches])));
  });
}

test('a real OTP text is not treated as a code request', () => {
  const r = check('Your OTP is 1234. Do not share this code with anyone.');
  assert.ok(!r.hits.some((h) => h.id === 'secret'));
});

test('a code request is caught', () => {
  assert.ok(check('Please share the code you got on SMS').hits.some((h) => h.id === 'secret'));
});

test('redact hides numbers but keeps the words', () => {
  const out = redact('Call 0301-2345678 or +92 300 1234567, CNIC 35202-1234567-1, acct 12345678901234');
  assert.equal(out, 'Call [MOBILE NUMBER] or [MOBILE NUMBER], CNIC [CNIC], acct [ACCOUNT NUMBER]');
});
