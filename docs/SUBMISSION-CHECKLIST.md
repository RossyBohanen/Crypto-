# Submission checklist — NEAR Hackathon

Source: https://nearhackathon.com/HACKATHON.md and
https://github.com/nearai/near-hackathon-prompt-examples/blob/main/SUBMITTING.md
(read live before submitting — dates and rules may change).

## Before you submit

- [ ] The repository is public, and the README has "do X, see Y" steps an AI judge can follow.
- [ ] Your demo post is live on X, says you built it at NEAR HACKATHON, tags @NEARProtocol and #NEARHackathon, and has a video or screenshots attached.
- [ ] You have a mainnet NEAR account for the prize payout, either your own or the team's. **Sidney says he has one — he supplies it himself at submission time. It is NOT in this repo and must not be invented here.**
- [ ] You've selected every track your project fits. This entry: `games` (Games With Real Economies). Do not add other tracks unless the project genuinely fits them.
- [ ] There are no keys or secrets anywhere in the repo history.
- [ ] You're submitting before **Nov 14, 2026, 23:59 UTC**.
- [ ] You have read the consent notice and agree: "I agree that the organizers may use these details to review our submission and contact us about this hackathon."

## Submission payload (template — fill in only with Sidney's own values)

Submit through the form at https://nearhackathon.com/#apply, or via the
API (`POST https://nearhackathon.com/api/applications`) only after Sidney
has confirmed the exact payload. One submission per project; it cannot be
edited after sending — mistakes go through
https://nearhackathon.com/request-changes. Do NOT add a `website` field
(it is a spam trap: any non-empty value rejects the submission).

```json
{
  "requestId": "<uuid-generated-once>",
  "projectName": "Virtual Crypto Slots",
  "leadName": "Sidney Bohanen",
  "email": "<Sidney's contact email — his value>",
  "size": "1",
  "tracks": ["games"],
  "nearAddress": "<Sidney's mainnet NEAR payout account — his value, NOT in this repo>",
  "projectUrl": "<public repo URL — after Sidney pushes it>",
  "demoUrl": "<public X demo post URL — after Sidney posts it>",
  "idea": "Crypto casinos rebuild the same hard parts — secure randomness, bet settlement, payouts, bankroll protection. Virtual Crypto Slots is a B2B slot engine demo adapted to NEAR (EVM engine via Aurora): provably fair spins, automated payouts, and collectible rewards. Players spin with play tokens, win collectibles they own, and trade with Mara, an NPC merchant whose prices move with stock and demand. Track: Games With Real Economies — judged on the game loop, with the chain invisible in normal play.",
  "consent": true
}
```

Field rules (HACKATHON.md): projectName 2–80 chars; leadName 2–80 chars;
email max 160 chars, at most 2 submissions per email; size one of
`1`, `2 - 4`, `4 - 6`, `6 - 8`, `8+`; nearAddress 2–64 chars, lowercase,
named account (e.g. `team.near`) or 64-char implicit account; idea
20–2000 chars. A 201 response means the submission is saved. A 409 means
the repository was already submitted — do not submit again.

## Prizes (for reference)

$250,000 total. Grand prize $55,000 (1). Each of the 13 tracks:
1st $10,000, 2nd $3,000, 3rd $2,000. Amounts fixed in USD, paid in NEAR
to the account in the submission, single payment within 30 days of results.
Judging Nov 16–18, results by Nov 18, 23:59 UTC.
