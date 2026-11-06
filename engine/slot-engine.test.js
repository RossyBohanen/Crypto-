// Node built-in tests. Run: node --test engine/slot-engine.test.js
// (or: npm test). Analytic RTP is 208/216 = 96.30% — see slot-engine.js.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createSpin, verifySpin, resolveSpin, sha256Hex, simulateRTP, payoutFor, MAX_BET } = require('./slot-engine');

test('a spin is verifiable from its public audit record', () => {
  const spin = createSpin(10, 100000);
  assert.equal(verifySpin(spin.audit), true);
});

test('a tampered audit record fails verification', () => {
  const spin = createSpin(10, 100000);
  const tampered = { ...spin.audit, payout: spin.payout + 1000 };
  assert.equal(verifySpin(tampered), false);
});

test('reveal must match its commitment', () => {
  assert.throws(() => resolveSpin(sha256Hex('a'), 'b'), /does not match/);
});

test('bet bounds are enforced', () => {
  assert.throws(() => createSpin(0, 100000), /between/);
  assert.throws(() => createSpin(MAX_BET + 1, 100000), /between/);
});

test('payout table matches the spec math model', () => {
  assert.equal(payoutFor(['7️⃣', '7️⃣', '7️⃣']).payoutMultiplier, 90);
  assert.equal(payoutFor(['💎', '💎', '💎']).payoutMultiplier, 40);
  assert.equal(payoutFor(['🍒', '🍒', '🍒']).payoutMultiplier, 5);
  assert.equal(payoutFor(['7️⃣', '7️⃣', '🍒']).payoutMultiplier, 1); // exactly two 7s
  assert.equal(payoutFor(['💎', '🍋', '💎']).payoutMultiplier, 1); // exactly two diamonds
  assert.equal(payoutFor(['⭐', '⭐', '🍒']).payoutMultiplier, 0); // other pairs pay 0
  assert.equal(payoutFor(['🍒', '🍋', '🔔']).payoutMultiplier, 0);
});

test('jackpot spin drops a Golden Reel collectible', () => {
  for (let i = 0; i < 20000; i++) {
    const spin = createSpin(10, 100000);
    if (spin.jackpot) {
      assert.equal(spin.collectible, 'Golden Reel');
      assert.equal(spin.payoutMultiplier, 90);
      return;
    }
  }
  assert.fail('no jackpot in 20,000 spins — payout table is wrong');
});

test('RTP is 96.30% analytically, and simulation agrees within sampling noise (not an audit)', () => {
  // Analytic: 208 payout units / 216 outcomes = 0.9630. Simulation is a
  // sanity check only — the 90x jackpot makes per-spin variance high
  // (sd ≈ 6.9 per unit bet), so the band is deliberately wide.
  const { rtp, dropRate } = simulateRTP(100000, 10);
  assert.ok(rtp > 0.88 && rtp < 1.04, `RTP ${rtp} out of range (analytic 0.9630)`);
  assert.ok(dropRate > 0.005 && dropRate < 0.03, `collectible drop rate ${dropRate} out of range (~0.015 expected)`);
});
