# Contracts

`SlotEngine.sol` — the demo slot engine, Solidity 0.8.20, OpenZeppelin
`ReentrancyGuard`. Targets **Aurora (EVM on NEAR)** for the hackathon:
the same EVM-first engine from the B2B deck, settled on NEAR via Aurora.

## Status: NOT deployed

No contract is deployed in this repo, on testnet or mainnet. Deployment is
a separate, Sidney-confirmed step. To deploy to Aurora testnet (when he
chooses to):

```sh
# Hardhat is the spec's recommended framework (spec §Smart Contracts).
npm install --save-dev hardhat @openzeppelin/contracts
npx hardhat compile
npx hardhat run --network aurora-testnet scripts/deploy.js
```

Fund the deployer with Aurora testnet tokens only. Never use mainnet
funds, never commit a private key, and never deploy to mainnet without
an independent audit (spec §Security).

## What the contract does

- `placeBet(commitment)` — locks a bet (1–100 play units) and a
  commitment, within the bankroll cap.
- `resolveSpin(spinId, reveal)` — owner-only in the demo; verifies the
  reveal against the commitment, derives the outcome, credits winnings
  to `pendingWinnings` (pull, not push), and records a collectible drop.
- `withdrawWinnings()` — player pulls winnings in a separate transaction.
- `pause()` / `unpause()`, `setPayoutTable()` (capped at 90×, never mid-spin).

## Production gaps (honest list)

- Demo randomness is commit-reveal. Production must use Chainlink VRF
  with proof verification, plus an audit, before mainnet.
- Collectibles are a registry here. Production mints ERC-721 / ERC-1155
  (OpenZeppelin) in a separate NFT contract, with marketplace integration.
- No VRF subscription, no audit, no multisig treasury in this repo.
  Those are production steps, not hackathon steps.
