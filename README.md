# Virtual Crypto Slots

**NEAR Hackathon — Track 09: Games With Real Economies (`games`)**
**Solo builder:** Sidney Bohanen, Good Lyfe Consulting, Farmington Hills, Michigan
**Status:** working demo prototype. **Play tokens only — no real money, no real-money gambling, no licence claim.**

> Every crypto casino team rebuilds the same hard parts: secure randomness,
> bet settlement, payout logic, bankroll protection, and NFT minting.
> Players don't trust black-box outcomes. Virtual Crypto Slots is the
> B2B slot engine that solves those parts once — provably fair spins,
> automated payouts, and collectible rewards — for licensed operators.
> This hackathon entry is a playable demo of that engine, adapted to NEAR.

## What it is

A playable 3-reel slot game where the economy is the gameplay:

- **Spin:** pick a bet (1–100 CHIPS), press SPIN. Wins pay from a published
  payout table (RTP **96.30%**, analytic — see below).
- **Provably fair:** every spin is commit-reveal in the demo (production:
  Chainlink VRF with proof verified on-chain). Anyone can verify a spin
  from the audit log. See [docs/FAIRNESS.md](docs/FAIRNESS.md).
- **Own what you win:** rare spins drop a collectible (Golden Reel,
  Lucky Bell, Cherry Charm, Star Token — ~1% per spin, plus a guaranteed
  Golden Reel on a jackpot). Collectibles live in your inventory.
- **A real economy:** Mara is an NPC merchant with her own wallet and
  inventory. She sets prices from stock and recent demand — flood her
  with an item and it gets cheap. Sell to her, or keep your collectibles.
  **Fast-forward a week** simulates 7 days of NPC trading in a minute,
  so you can watch the economy move without a dev patch.
- **NEAR, invisible in normal play:** demo wallet in one click, no seed
  phrases, no gas prompts in the game loop (per the track prompt).
  The engine is EVM-first and targets **Aurora (EVM on NEAR)**;
  collectibles follow the **NEP-245** multi-token pattern.

## Do X, see Y (for judges — human and AI)

Run the demo locally (no install, no account, no keys):

```sh
# 1. Serve the demo (from this repo root, so the README/docs links work)
npm run serve
#    — or: python3 -m http.server 8000
# 2. Open http://localhost:8000/app/ in a browser.
```

- **Do:** press SPIN with the default 10-CHIP bet.
  **See:** reels spin, a win (or loss) credits, and the audit log gains a
  verifiable record (commitment / reveal / hash).
- **Do:** press **Verify last spin**.
  **See:** "✓ Verified — reveal matches commitment and hash matches outcome."
- **Do:** keep spinning until a collectible drops (or press SPIN ~100 times;
  drop rate is ~1% plus jackpot), then sell it to Mara.
  **See:** your balance rises by Mara's price, and her price for that item
  falls 10% on the next sale (her reasoning is in the price tooltip).
- **Do:** press **Fast-forward a week of trading**.
  **See:** a 7-day log of NPC trades with Mara, and her prices and stock move.
- **Do:** run the engine tests and RTP simulation.
  **See:** `npm test` (6 tests, all passing) and `npm run rtp`
  (simulated RTP ≈ 96.3%).

Contract (not deployed — see [contracts/README.md](contracts/README.md)):

```sh
npm install --save-dev hardhat @openzeppelin/contracts
npx hardhat compile   # contracts/SlotEngine.sol
```

## Payout math (spec math model)

3 reels × 6 symbols = 216 equally likely outcomes.

| Result | Pays |
|---|---|
| 7️⃣ 7️⃣ 7️⃣ (jackpot) | 90× + Golden Reel |
| 💎 💎 💎 | 40× |
| ⭐ ⭐ ⭐ | 22× |
| 🔔 🔔 🔔 | 14× |
| 🍋 🍋 🍋 | 7× |
| 🍒 🍒 🍒 | 5× |
| Exactly two 7️⃣ | 1× |
| Exactly two 💎 | 1× |

Total payout units per 216 spins (bet 1): 178 + 15 + 15 = **208.
RTP = 208/216 = 96.30%.** Collectibles have no cash value in the demo,
so they do not push effective RTP over 100%.

## What is new for this hackathon (Q-002 / Q-003)

The B2B engine existed before as a design guide and a 10-slide deck —
**no code**. All code in this repo is new work for the hackathon window
(Nov 1–14, 2026): the NEAR adaptation (Aurora target, NEP-245-style
collectibles, NPC merchant economy, social-login demo wallet), the
playable HTML5 demo, the Solidity contract, the payout math, and the
tests. The deck and guide are the disclosed baseline; see
[docs/FAIRNESS.md](docs/FAIRNESS.md) and the deck at
`../your_files/Crypto-Slot-Machine-B2B-Lead-Deck.md` (not in this repo).

## Sources (do not invent beyond these)

- Spec: "Building a Crypto-Powered Slot Machine (2025 Edition).pdf"
  (Drive id `10QSlFrMak5BPCTATJSp6UgvCYzgr6lkc`, local copy
  `~/workspace/crypto-slot-machine.pdf`) — UI/UX (mobile-first, Max Bet /
  Autoplay, thumb-reach, onboarding), HTML5/web stack, Chainlink VRF,
  OpenZeppelin, Hardhat, NFT rewards (~1% drop), licensing (Curaçao /
  Malta / Isle of Man), KYC/AML, responsible gambling, geo-fencing,
  security (ReentrancyGuard, pull payouts, audit, multisig cold storage),
  tokenomics (sinks, burns, no over-rewarding).
- B2B deck: `~/workspace/your_files/Crypto-Slot-Machine-B2B-Lead-Deck.md`
  — Version B lead (B2B virtual-machine slot engine, EVM-first, for
  licensed operators), provably fair spins, automated payouts, NFT
  rewards, configurability, compliance limits.
- NEAR Hackathon: https://nearhackathon.com/HACKATHON.md and
  https://github.com/nearai/near-hackathon-prompt-examples
  (tracks/09-games.md, SUBMITTING.md). Submission closes
  **Nov 14, 2026, 23:59 UTC**. Judging Nov 16–18, results by Nov 18.

## Compliance — read this before anything else

- **This demo is not a casino, not a token sale, and not legal advice.**
- **The engine is NOT a licence.** Operators still need their own gambling
  licence, KYC/AML, responsible-gambling hooks, and geo-blocking. The
  engine does not make an unlicensed operator licensed.
- **No native token at launch** (per the deck). CHIPS are play tokens only:
  they cannot be bought, sold, or cashed out. There is no ICO, no
  profit-share, and no promise of financial return.
- **No real-money play in this demo.** No mainnet deployment, no mainnet
  funds. Production requires a VRF integration, an independent audit,
  and gambling counsel before launch.
- Funding ask, first chain beyond Aurora-for-this-demo, team, and
  compliance lead are **not stated here** — they are blanks in the deck
  for Sidney to fill, not invented figures.

## Suggestions — NOT Sidney's decisions, NOT built (unless noted)

The following were added at Muse's suggestion for the Games With Real
Economies track, drawn from the deck's optional modules and the spec.
**None of these is Sidney's decision, and none changes the core B2B
positioning, funding, licence, or compliance claims above.** Items marked
"seeded in this demo" already exist in a minimal form; everything else is
an idea for Sidney to approve or reject.

1. **Game loop — daily streaks and a bonus round (suggestion).** A
   daily-return streak that grants a free spin, and a bonus round
   triggered by three 🍒 (e.g. pick-a-chest for extra CHIPS or a
   collectible). *Not built.* It would need a free-spin economy that
   keeps effective RTP under 100% (spec §Tokenomics).
2. **Player-owned economy — player market stalls (suggestion, seeded).**
   *Seeded in this demo:* Mara's Market — sell collectibles to an NPC
   merchant at dynamic prices. *Suggestion, not built:* let players list
   collectibles for other players, with Mara taking a small CHIPS fee
   on each sale as an economy sink (spec: sinks keep an economy balanced).
3. **NFT rewards — tiered collectibles (suggestion, seeded).**
   *Seeded:* four collectibles, ~1% drop rate, jackpot guarantees a
   Golden Reel. *Suggestion, not built:* tiers (Common / Rare / Epic),
   with Golden Reel as Epic, and a set bonus — holding three different
   collectibles unlocks a free-spin bonus. Any utility must stay cosmetic
   or loyalty-based, not pay-to-win, and must clear the target market's
   NFT rules (Malta banned NFT-based gambling in 2024, per the spec).
4. **Jackpot — progressive jackpot pool (suggestion, not built).**
   A visible pool funded by 1% of each bet (demo: capped, play tokens
   only), paid on 777 in addition to the 90× win. The deck lists jackpot
   pools as an optional module kept out of the core contract — that
   separation should be kept: the pool is a module, not the engine.
5. **Operator demo — operator dashboard (suggestion, not built).**
   A demo dashboard for a licensed operator to configure, within audited
   bounds, the payout table / RTP, jackpot pool rules, supported tokens,
   and NFT drop rates (deck Slide 3 configurability), plus a simulated-RTP
   test panel and an audit-log export. This is the B2B selling surface:
   it shows an operator the engine without touching the core contract.
6. **Tournaments and leaderboards (suggestion, not built).** Weekly
   leaderboard (most spins / biggest win, play tokens only) and a
   tournament mode. The spec notes cloud backends for high scores and
   leaderboards; this would need one, and must not turn play tokens
   into prizes of value.

If Sidney approves any suggestion, it should be built as a separate,
clearly labelled addition — not silently folded into the core engine.

## Still missing for submission

- **NEAR payout account:** Sidney says he has one. He supplies it himself
  at submission time. It is **not** in this repo and was **not** invented.
- **Public repo:** Sidney pushes this folder to GitHub and makes it public
  before Nov 14, 23:59 UTC. Do not push on his behalf without his say-so.
- **X demo post:** Sidney records and posts the demo himself (script in
  [docs/DEMO-SCRIPT.md](docs/DEMO-SCRIPT.md)) and supplies the link.
- **Submission form:** Sidney (or his agent, only after he confirms the
  exact payload) submits via https://nearhackathon.com/#apply. See
  [docs/SUBMISSION-CHECKLIST.md](docs/SUBMISSION-CHECKLIST.md).
- **Contract deployment:** not deployed; optional for the demo (local-only
  demo is eligible per HACKATHON.md Q-012). Aurora testnet deployment is
  a Sidney-confirmed step — see [contracts/README.md](contracts/README.md).

## Project layout

```
app/                  Playable HTML5 demo (index.html, app.js, styles.css)
contracts/            SlotEngine.sol (Aurora/EVM, OpenZeppelin) + README
engine/               slot-engine.js (shared logic) + slot-engine.test.js
docs/                 FAIRNESS.md, GAME-LOOP.md, DEMO-SCRIPT.md,
                      SUBMISSION-CHECKLIST.md
README.md  LICENSE  package.json  .gitignore
```

## Technical risks / shortcuts (honest list)

- **Demo randomness is commit-reveal, not VRF.** It is verifiable and
  fair for a demo, but it is not production randomness. VRF + audit are
  required before mainnet — see [docs/FAIRNESS.md](docs/FAIRNESS.md).
- **Contract is not deployed and not audited.** The Solidity compiles
  cleanly with solc 0.8.20 + OpenZeppelin 4.9.6 (verified during this
  build; a type error in the reel-key helper was found and fixed by that
  compile check), but it has not been deployed to Aurora testnet and has
  not been audited. Do not present it as audited or production-ready.
- **NEAR-native parts are demo-level.** The economy (NEP-245-style
  collectibles, Mara's pricing) runs in the browser demo, not in a Rust
  NEAR contract. The on-chain piece is the Aurora Solidity engine. A
  full NEAR-native contract is a follow-on, not in this prototype.
- **RTP is analytic + simulated, not certified.** 96.30% is computed from
  the payout table and checked by Monte-Carlo simulation. A fairness
  certification (e.g. iTech Labs / GLI, per the spec) is a production step.
- **No real wallet integration in the demo.** The "Connect demo wallet"
  button is a labelled demo. Real play would use NEAR Wallet Selector /
  social login and Aurora + ethers.js — integration is not built here.
