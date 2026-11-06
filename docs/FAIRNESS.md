# How fairness works

Source: spec "Building a Crypto-Powered Slot Machine (2025 Edition).pdf",
§Smart Contracts and §Security, plus the B2B deck, Slide 4.

## The rule (spec)

- Randomness must be **verifiable**. A naive block-hash seed is insecure —
  miners/validators can manipulate block hashes or selectively include
  transactions to bias outcomes.
- An off-chain RNG (calling an API) is not transparent or trustless.
- The industry-standard solution is a **Verifiable Random Function (VRF)**
  oracle — Chainlink VRF is the widely used one. The contract requests a
  random number; the oracle returns the number **plus a cryptographic
  proof**; the contract verifies the proof before accepting the result.
  Neither the contract owner nor the oracle can secretly tamper with it,
  and every player can audit that each spin had an equal chance.
- Once a bet is placed, **neither the user nor the operator can change the
  outcome** — it is entirely in the hands of the random oracle.
  Front-running is prevented by that ordering: the random seed is only
  provided after the bet transaction.

## What this demo does

The demo uses **commit-reveal** as a stand-in for VRF, so judges can verify
a spin without a VRF subscription:

1. Player places a bet. The engine records `commitment = SHA-256(reveal)`.
2. The bet is locked. Only then is the reveal published.
3. Outcome = `SHA-256(commitment + reveal)`. Reels are derived from that
   hash. Payout comes only from the payout table.
4. The audit log (in the app, and `SpinResolved` events on-chain) publishes
   commitment, reveal, hash, reels, bet, and payout for every spin.
   Anyone can recompute steps 1–3 and check the payout.

Verify in the app: press **Verify last spin**. Or in Node:
`node -e "const {verifySpin}=require('./engine/slot-engine'); …"`.

## What production must do (not in this demo)

- Replace the demo reveal with a Chainlink VRF fulfilment
  (`fulfillRandomWords`), verifying the proof on-chain.
- Fund the VRF subscription (LINK) and monitor it — if it runs out,
  randomness stops; pause bets until it resumes.
- Independent smart-contract audit before mainnet; publish the audit
  summary. No owner backdoor: the contract is immutable once audited, or
  any upgrade mechanism is itself secured.
- Pull payouts (already in the contract), ReentrancyGuard, capped
  bankroll, multisig treasury, cold storage for reserves.

## Payout math

3 reels × 6 symbols = 216 equally likely outcomes. Payout table:
777×90, 💎×40, ⭐×22, 🔔×14, 🍋×7, 🍒×5, exactly two 7s ×1,
exactly two 💎 ×1. Total payout units per 216 spins (bet 1):
178 + 15 + 15 = 208. **RTP = 208/216 = 96.30%.**
Run `node engine/slot-engine.js` for a Monte-Carlo check, and
`node --test engine/slot-engine.test.js` for the unit tests.
Collectibles have no cash value in the demo, so they do not push
effective RTP over 100% (spec §Tokenomics warning).
