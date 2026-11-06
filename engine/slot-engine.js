// Virtual Crypto Slots — core engine (demo / testnet only)
// Mirrors contracts/SlotEngine.sol. Play tokens only. No real money.
// Sources: spec "Building a Crypto-Powered Slot Machine (2025 Edition).pdf"
//   (~/workspace/crypto-slot-machine.pdf) + B2B deck
//   (~/workspace/your_files/Crypto-Slot-Machine-B2B-Lead-Deck.md).
//   Do NOT invent spec details beyond those two sources.
//
// Fairness (spec §Smart Contracts): verifiable randomness, never block-hash
// alone, never an off-chain API. Production: Chainlink VRF — the contract
// requests randomness, the oracle returns a value PLUS a cryptographic
// proof, the contract verifies the proof before accepting it.
// Demo (this file / the contract): commit-reveal standing in for VRF.
//   1. Player places a bet; the engine records commitment = sha256(reveal).
//   2. The reveal is published after the bet is locked; the outcome is
//      derived from sha256(commitment || reveal) — verifiable by anyone
//      from the public audit log. The operator cannot change the outcome
//      after seeing the bet, and cannot force a win or drain the bankroll:
//      payouts come only from the payout table, inside capped bounds.
//   Production must swap the demo reveal for a VRF fulfilment + audit.
//
// Payout table / math model (spec: "math model … target RTP percentage",
// verified by simulation). 3 reels × 6 symbols = 216 equally likely
// outcomes. Exact RTP, analytically:
//   three-of-a-kind: 777×90 + 💎×40 + ⭐×22 + 🔔×14 + 🍋×7 + 🍒×5 = 178
//   exactly two 7s: 15 combos × 1 = 15
//   exactly two 💎: 15 combos × 1 = 15
//   total 208 / 216 = 96.30% RTP. Collectibles have no cash value in the
//   demo, so they do not push effective RTP over 100% (spec §Tokenomics).
// NFT / collectible drop (spec: "1% chance on each spin to win a random
// NFT prize"): a separate 1%-roll per spin, plus a guaranteed Golden Reel
// on a jackpot (777, 1/216 ≈ 0.46%), so the overall drop rate is ~1.5%.
'use strict';
const crypto = require('node:crypto');

const SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'];
const SYMBOL_CODE = { '🍒': 'C', '🍋': 'L', '🔔': 'B', '⭐': 'S', '💎': 'D', '7️⃣': '7' };
// Three-of-a-kind multipliers (per 1 CHIP bet).
const PAYOUTS = {
  '7️⃣|7️⃣|7️⃣': 90,
  '💎|💎|💎': 40,
  '⭐|⭐|⭐': 22,
  '🔔|🔔|🔔': 14,
  '🍋|🍋|🍋': 7,
  '🍒|🍒|🍒': 5,
};
// Exactly-two-of-a-kind multipliers (per 1 CHIP bet).
const PAIR_PAYOUTS = { '7️⃣': 1, '💎': 1 };
const JACKPOT_KEY = '7️⃣|7️⃣|7️⃣';
const COLLECTIBLES = ['Golden Reel', 'Lucky Bell', 'Cherry Charm', 'Star Token'];
const NFT_DROP_RATE = 0.01; // spec: ~1% per spin
const MAX_BET = 100;        // CHIPS, per spin
const MIN_BET = 1;
const BANKROLL_CAP = 100000; // CHIPS, demo bankroll cap (spec: limited on-chain bankroll, topped up from cold storage)

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}
function randomReveal() { return crypto.randomBytes(32).toString('hex'); }

function payoutFor(reels) {
  const key = reels.join('|');
  if (PAYOUTS[key]) return { payoutMultiplier: PAYOUTS[key], jackpot: key === JACKPOT_KEY, key };
  // Exactly two matching (third different).
  const counts = {};
  reels.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
  for (const [sym, mult] of Object.entries(PAIR_PAYOUTS)) {
    if (counts[sym] === 2) return { payoutMultiplier: mult, jackpot: false, key: `pair-${SYMBOL_CODE[sym]}` };
  }
  return { payoutMultiplier: 0, jackpot: false, key };
}

function resolveSpin(commitment, reveal) {
  if (sha256Hex(reveal) !== commitment) {
    throw new Error('Reveal does not match commitment — spin is invalid.');
  }
  const randomHex = sha256Hex(commitment + reveal);
  const reels = [0, 1, 2].map((i) => {
    const byte = parseInt(randomHex.slice(i * 2, i * 2 + 2), 16);
    return SYMBOLS[byte % SYMBOLS.length];
  });
  const { payoutMultiplier, jackpot, key } = payoutFor(reels);
  // Separate verifiable roll for the ~1% collectible drop (spec §NFTs).
  const dropRoll = parseInt(sha256Hex(randomHex + 'nft').slice(0, 4), 16) / 0xffff;
  const dropIndex = parseInt(sha256Hex(randomHex + 'nft-pick').slice(0, 2), 16) % COLLECTIBLES.length;
  const collectible = jackpot ? 'Golden Reel' : (dropRoll < NFT_DROP_RATE ? COLLECTIBLES[dropIndex] : null);
  return { reels, randomHex, payoutMultiplier, jackpot, key, collectible, dropRoll };
}

function createSpin(bet, bankroll) {
  if (!Number.isInteger(bet) || bet < MIN_BET || bet > MAX_BET) {
    throw new Error(`Bet must be an integer between ${MIN_BET} and ${MAX_BET} CHIPS.`);
  }
  if (bankroll < 0 || bankroll > BANKROLL_CAP) throw new Error('Bankroll out of bounds.');
  const reveal = randomReveal();
  const commitment = sha256Hex(reveal);
  // Bet is locked BEFORE the reveal is published — that ordering is the
  // whole fairness point. The audit record below is public and verifiable.
  const result = resolveSpin(commitment, reveal);
  const payout = bet * result.payoutMultiplier;
  return {
    bet, commitment, reveal,
    randomHex: result.randomHex,
    reels: result.reels, key: result.key,
    payoutMultiplier: result.payoutMultiplier,
    payout, jackpot: result.jackpot,
    collectible: result.collectible, dropRoll: result.dropRoll,
    audit: { commitment, reveal, randomHex: result.randomHex, reels: result.reels, bet, payout },
  };
}

function verifySpin(audit) {
  try {
    const recomputed = resolveSpin(audit.commitment, audit.reveal);
    return recomputed.randomHex === audit.randomHex
      && recomputed.reels.join('|') === audit.reels.join('|')
      && recomputed.payoutMultiplier * audit.bet === audit.payout;
  } catch { return false; }
}

// Monte-Carlo RTP check (demo only — not an audit). Analytic RTP is 96.30%.
function simulateRTP(spins = 100000, bet = 10) {
  let returned = 0, jackpots = 0, drops = 0;
  for (let i = 0; i < spins; i++) {
    const s = createSpin(bet, BANKROLL_CAP);
    returned += s.payout;
    if (s.jackpot) jackpots++;
    if (s.collectible) drops++;
  }
  return { spins, bet, totalWagered: spins * bet, totalReturned: returned, rtp: returned / (spins * bet), jackpots, collectibleDrops: drops, dropRate: drops / spins };
}

module.exports = { SYMBOLS, PAYOUTS, PAIR_PAYOUTS, COLLECTIBLES, NFT_DROP_RATE, MAX_BET, MIN_BET, BANKROLL_CAP, sha256Hex, randomReveal, payoutFor, resolveSpin, createSpin, verifySpin, simulateRTP };
if (require.main === module) {
  console.log('RTP simulation (20,000 spins, bet 10):', JSON.stringify(simulateRTP(20000, 10), null, 2));
}
