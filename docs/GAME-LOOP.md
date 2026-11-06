# Game loop — Games With Real Economies

Track prompt: "Build NPCs with wallets, player-owned markets and economies
that evolve without a dev patch. Judges score the game loop, with a bonus
if players never notice the chain."

## Every 30 seconds (one spin)

1. Player picks a bet (1–100 CHIPS) or Max Bet, and presses SPIN.
2. Bet locks, commitment is recorded, reveal is published, reels resolve.
3. Payout (if any) is credited; a rare spin drops a collectible the
   player owns. The audit log shows the verifiable record.

## Every 5 minutes (a session)

- Player builds a balance from wins, and a collection of Golden Reels,
  Lucky Bells, Cherry Charms, and Star Tokens.
- Player sells a collectible to Mara the merchant — or keeps it.
  Mara's price moves with her stock and recent demand (her reasoning is
  shown in a tooltip on every price). Flood her with an item and it
  gets cheap; buy from her and it gets dear.
- **Fast-forward a week**: one button simulates 7 days of NPC trading
  with Mara, so a judge can watch the economy move in a minute.

## Every session (the economy)

- Collectibles are player-owned: they live in the player's inventory,
  can be sold to Mara, and (in the full design) listed on a player market
  or withdrawn to a marketplace. In this demo the market is Mara + the
  fast-forward simulation; a player-to-player market is a **suggestion**
  (see README, Suggestions — not decided, not built).
- The demo economy has no native token (per the deck: no native token at
  launch). CHIPS are play tokens only — they cannot be cashed out, and
  there is no token sale.

## What a judge should feel

A slot game first, a chain second. Wallet connection is one demo button,
no seed phrases, no gas prompts in the normal loop (per the track prompt:
social login, no wallet popups). The chain shows up only where it adds
something: provably fair spins, owned collectibles, and a merchant whose
prices actually move.
