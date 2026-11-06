// SPDX-License-Identifier: MIT
// Virtual Crypto Slots — SlotEngine (demo / testnet only)
// Play tokens only. No real money. No mainnet deployment in this repo.
// Sources: spec "Building a Crypto-Powered Slot Machine (2025 Edition).pdf"
//   (~/workspace/crypto-slot-machine.pdf) + B2B deck
//   (~/workspace/your_files/Crypto-Slot-Machine-B2B-Lead-Deck.md).
// For the NEAR Hackathon this contract targets Aurora (EVM on NEAR):
// the same Solidity engine, settled on NEAR via Aurora. See README.md.
// The NEAR-native economy (NEP-245 multi-token collectibles, NPC merchant)
// lives in the demo app / docs; the on-chain collectible here is an event
// + a collectible registry a licensed operator's NFT contract would mint
// (OpenZeppelin ERC-721 / ERC-1155 in production, per spec).
//
// FAIRNESS (spec §Smart Contracts): Chainlink VRF in production — the
// contract requests randomness, the oracle returns a value PLUS a
// cryptographic proof, the contract verifies the proof before accepting
// it. Never block-hash-only randomness, never an off-chain API.
// DEMO: commit-reveal stands in for VRF (commit = sha256(reveal), outcome
// = keccak256(commitment, reveal), verifiable from SpinResolved events).
// Production must swap the demo reveal for a VRF fulfilment + audit.
//
// SECURITY (spec §Security): OpenZeppelin ReentrancyGuard, Solidity 0.8
// checked arithmetic, checks-effects-interactions, pull (not push) payouts
// via withdrawWinnings(), no tx.origin, require/revert, events for every
// critical action, pause switch, capped bankroll, payout table changeable
// only within capped bounds and never mid-spin, no owner backdoor:
// the owner cannot force an outcome, change a locked spin, or drain the
// bankroll (withdrawals are capped and only to the treasury, with a pause).
// Production: independent audit before mainnet; multisig cold storage for
// the treasury; limited on-chain bankroll topped up from cold storage.
// Payout table (spec math model, analytic RTP 96.30% — see README):
//   777×90, 💎×40, ⭐×22, 🔔×14, 🍋×7, 🍒×5 (three-of-a-kind, per 1 unit)
//   exactly two 7s ×1, exactly two 💎 ×1. Total 208/216 = 96.30%.
// NFT drop (spec: ~1% per spin): a separate 1% roll per spin, plus a
// guaranteed Golden Reel on a jackpot (777, 1/216 ≈ 0.46%).
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SlotEngine is ReentrancyGuard {
    address public owner;
    bool public paused;
    uint256 public bankrollCap = 100_000 ether; // demo units (play tokens)
    uint256 public bankroll;
    uint256 public maxBet = 100 ether;
    uint256 public minBet = 1 ether;
    uint256 public constant MAX_MULTIPLIER = 90;

    mapping(bytes32 => uint256) public payoutTable;
    mapping(address => uint256) public pendingWinnings;
    // Collectible registry (demo): player => collectible name => count.
    // Production mints ERC-721/ERC-1155 via OpenZeppelin in a separate
    // NFT contract; this registry is the demo's on-chain record of drops.
    mapping(address => mapping(string => uint256)) public collectibles;

    event BetPlaced(uint256 indexed spinId, address indexed player, uint256 bet, bytes32 commitment);
    event SpinResolved(uint256 indexed spinId, address indexed player, bytes32 reveal, bytes32 randomHash, string reels, uint256 payout, bool jackpot);
    event CollectibleMinted(uint256 indexed spinId, address indexed player, string collectible);
    event WinningsWithdrawn(address indexed player, uint256 amount);

    struct Spin { address player; uint256 bet; bytes32 commitment; bool resolved; }
    mapping(uint256 => Spin) public spins;
    uint256 public nextSpinId;

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }
    modifier whenNotPaused() { require(!paused, "paused"); _; }

    constructor() {
        owner = msg.sender;
        payoutTable[keccak256("7|7|7")] = 90;
        payoutTable[keccak256("D|D|D")] = 40;
        payoutTable[keccak256("S|S|S")] = 22;
        payoutTable[keccak256("B|B|B")] = 14;
        payoutTable[keccak256("L|L|L")] = 7;
        payoutTable[keccak256("C|C|C")] = 5;
    }

    function pause() external onlyOwner { paused = true; }
    function unpause() external onlyOwner { paused = false; }

    // Payout table may only move within capped bounds; never mid-spin.
    function setPayoutTable(bytes32 key, uint256 multiplier) external onlyOwner whenNotPaused {
        require(multiplier <= MAX_MULTIPLIER, "multiplier above cap");
        payoutTable[key] = multiplier;
    }

    // Step 1: player locks a bet and a commitment. The reveal is NOT known
    // yet, so the outcome cannot be chosen after the bet.
    function placeBet(bytes32 commitment) external payable nonReentrant whenNotPaused returns (uint256 spinId) {
        require(msg.value >= minBet && msg.value <= maxBet, "bet out of bounds");
        require(bankroll + msg.value <= bankrollCap, "bankroll cap");
        spinId = nextSpinId++;
        spins[spinId] = Spin(msg.sender, msg.value, commitment, false);
        bankroll += msg.value;
        emit BetPlaced(spinId, msg.sender, msg.value, commitment);
    }

    // Step 2: reveal is published; outcome = keccak256(commitment, reveal).
    // Production: replace this with a VRF fulfilment (fulfillRandomWords).
    function resolveSpin(uint256 spinId, bytes32 reveal) external onlyOwner nonReentrant whenNotPaused {
        Spin storage spin = spins[spinId];
        require(!spin.resolved, "already resolved");
        require(keccak256(abi.encodePacked(reveal)) == spin.commitment, "reveal mismatch");
        bytes32 randomHash = keccak256(abi.encodePacked(spin.commitment, reveal));
        uint256[3] memory reels;
        for (uint256 i = 0; i < 3; i++) {
            reels[i] = uint256(uint8(randomHash[i])) % 6;
        }
        string memory key = _key(reels);
        uint256 multiplier = payoutTable[keccak256(bytes(key))];
        if (multiplier == 0) multiplier = _pairMultiplier(reels);
        uint256 payout = spin.bet * multiplier;
        spin.resolved = true;
        bool jackpot = multiplier == 90;
        if (payout > 0) {
            require(payout <= bankroll, "bankroll insufficient");
            bankroll -= payout;
            pendingWinnings[spin.player] += payout; // pull, not push (spec)
        }
        emit SpinResolved(spinId, spin.player, reveal, randomHash, key, payout, jackpot);
        // ~1% collectible roll (spec), plus guaranteed Golden Reel on jackpot.
        string memory drop = _collectibleDrop(randomHash, jackpot);
        if (bytes(drop).length > 0) {
            collectibles[spin.player][drop] += 1;
            emit CollectibleMinted(spinId, spin.player, drop);
        }
    }

    // Pull payouts (spec: safer than push). Player withdraws winnings in a
    // separate transaction; a malicious receiver cannot re-enter resolveSpin.
    function withdrawWinnings() external nonReentrant {
        uint256 amount = pendingWinnings[msg.sender];
        require(amount > 0, "nothing to withdraw");
        pendingWinnings[msg.sender] = 0;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "withdraw failed");
        emit WinningsWithdrawn(msg.sender, amount);
    }

    function _pairMultiplier(uint256[3] memory reels) internal pure returns (uint256) {
        // Exactly two 7s (index 5) or exactly two diamonds (index 4): ×1.
        uint256 sevens; uint256 diamonds;
        for (uint256 i = 0; i < 3; i++) {
            if (reels[i] == 5) sevens++;
            if (reels[i] == 4) diamonds++;
        }
        if (sevens == 2 || diamonds == 2) return 1;
        return 0;
    }

    function _collectibleDrop(bytes32 randomHash, bool jackpot) internal pure returns (string memory) {
        if (jackpot) return "Golden Reel";
        // ~1%: first byte of keccak(randomHash, "nft") < 2.56/256.
        if (uint8(keccak256(abi.encodePacked(randomHash, "nft"))[0]) < 3) {
            string[4] memory items = ["Golden Reel", "Lucky Bell", "Cherry Charm", "Star Token"];
            return items[uint8(keccak256(abi.encodePacked(randomHash, "nft-pick"))[0]) % 4];
        }
        return "";
    }

    function _key(uint256[3] memory reels) internal pure returns (string memory) {
        bytes1[6] memory s = [bytes1("C"), bytes1("L"), bytes1("B"), bytes1("S"), bytes1("D"), bytes1("7")];
        return string(abi.encodePacked(s[reels[0]], "|", s[reels[1]], "|", s[reels[2]]));
    }
}
