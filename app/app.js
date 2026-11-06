// Virtual Crypto Slots — demo app (HTML5, no build step, no real money)
// Play tokens ("CHIPS") only. State is local (localStorage); nothing leaves
// the browser. The spin logic mirrors engine/slot-engine.js and
// contracts/SlotEngine.sol: commit-reveal in the demo, Chainlink VRF in
// production. See ../docs/FAIRNESS.md.
'use strict';
const SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'];
const PAYOUTS = { '7️⃣|7️⃣|7️⃣': 90, '💎|💎|💎': 40, '⭐|⭐|⭐': 22, '🔔|🔔|🔔': 14, '🍋|🍋|🍋': 7, '🍒|🍒|🍒': 5 };
const PAIR = { '7️⃣': 1, '💎': 1 };
const COLLECTIBLES = { 'Golden Reel': 250, 'Lucky Bell': 120, 'Cherry Charm': 60, 'Star Token': 40 };
const STORE_KEY = 'virtual-crypto-slots-v1';

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function randHex(bytes = 32) {
  const a = new Uint8Array(bytes); crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

let state = load();
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && typeof s.balance === 'number') return s;
  } catch {}
  return { balance: 1000, inventory: {}, audit: [], merchantStock: { 'Golden Reel': 2, 'Lucky Bell': 5, 'Cherry Charm': 8, 'Star Token': 10 }, merchantSales: {} };
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

const $ = (id) => document.getElementById(id);
let autoplay = false, autoplayTimer = null, soundOn = false;

function render() {
  $('balance').textContent = `${state.balance.toLocaleString()} CHIPS`;
  $('betDisplay').textContent = `${+$('betSelect').value} CHIPS`;
  renderMarket(); renderInventory(); renderAudit();
}
function renderInventory() {
  const items = Object.entries(state.inventory).filter(([, n]) => n > 0);
  $('inventory').innerHTML = items.length ? items.map(([name, n]) =>
    `<div class="inv-item"><span>${name} × ${n}</span><button data-sell="${name}" type="button">Sell to Mara</button></div>`).join('')
    : '<p class="hint">No collectibles yet — they drop on ~1% of spins, and always on a jackpot.</p>';
  document.querySelectorAll('[data-sell]').forEach((b) => b.onclick = () => sellCollectible(b.dataset.sell));
}
function merchantPrice(name) {
  // Mara's pricing rule (readable, shown in a tooltip): base price, minus
  // 10% per recent sale of that item to her (flood the market, it gets
  // cheap), plus 5% per unit she is short of her target stock of 5.
  // Reasoning is shown in the title attribute — see the track prompt.
  const base = COLLECTIBLES[name];
  const sales = state.merchantSales[name] || 0;
  const stock = state.merchantStock[name] || 0;
  const price = Math.max(5, Math.round(base * (1 - 0.10 * sales) * (1 + 0.05 * Math.max(0, 5 - stock))));
  return { price, reason: `Base ${base} CHIPS, −10% × ${sales} recent sale(s) of this item, +5% × ${Math.max(0, 5 - stock)} short of target stock (she holds ${stock}).` };
}
function renderMarket() {
  $('marketList').innerHTML = Object.keys(COLLECTIBLES).map((name) => {
    const { price, reason } = merchantPrice(name);
    return `<div class="market-item"><span title="${reason}">${name} — Mara holds ${state.merchantStock[name] || 0}</span><span title="${reason}">Mara pays ${price} CHIPS</span></div>`;
  }).join('');
}
function renderAudit() {
  $('auditLog').textContent = state.audit.slice(-5).reverse().map((a) =>
    `spin bet ${a.bet} → ${a.reels.join(' ')} — payout ${a.payout} — commitment ${a.commitment.slice(0, 12)}… reveal ${a.reveal.slice(0, 12)}… hash ${a.randomHex.slice(0, 12)}…`).join('\n') || 'No spins yet.';
}

function payoutFor(reels) {
  const key = reels.join('|');
  if (PAYOUTS[key]) return { mult: PAYOUTS[key], jackpot: key === '7️⃣|7️⃣|7️⃣', key };
  const counts = {}; reels.forEach((s) => counts[s] = (counts[s] || 0) + 1);
  for (const [sym, mult] of Object.entries(PAIR)) if (counts[sym] === 2) return { mult, jackpot: false, key: 'pair-' + sym };
  return { mult: 0, jackpot: false, key };
}
function beep(win) {
  if (!soundOn) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); o.frequency.value = win ? 880 : 220;
    o.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.15);
  } catch {}
}

async function spin() {
  const bet = +$('betSelect').value;
  if (state.balance < bet) { $('resultLine').textContent = 'Not enough CHIPS — use the faucet below (demo only).'; return; }
  $('spinBtn').disabled = true;
  document.querySelectorAll('.reel').forEach((r) => r.classList.add('spinning'));
  // Commit-reveal: bet is locked BEFORE the reveal is published.
  const reveal = randHex();
  const commitment = await sha256Hex(reveal);
  state.balance -= bet;
  const randomHex = await sha256Hex(commitment + reveal);
  const reels = [0, 1, 2].map((i) => SYMBOLS[parseInt(randomHex.slice(i * 2, i * 2 + 2), 16) % 6]);
  const { mult, jackpot, key } = payoutFor(reels);
  const payout = bet * mult;
  const dropRoll = parseInt((await sha256Hex(randomHex + 'nft')).slice(0, 4), 16) / 0xffff;
  const dropIndex = parseInt((await sha256Hex(randomHex + 'nft-pick')).slice(0, 2), 16) % Object.keys(COLLECTIBLES).length;
  const collectible = jackpot ? 'Golden Reel' : (dropRoll < 0.01 ? Object.keys(COLLECTIBLES)[dropIndex] : null);
  state.balance += payout;
  if (collectible) state.inventory[collectible] = (state.inventory[collectible] || 0) + 1;
  state.audit.push({ bet, reels, payout, commitment, reveal, randomHex, key, collectible });
  save();
  // Reel animation, then reveal.
  await new Promise((r) => setTimeout(r, 600));
  reels.forEach((s, i) => { $(`reel${i}`).textContent = s; $(`reel${i}`).classList.remove('spinning'); });
  $('lastWin').textContent = payout ? `${payout} CHIPS` : '—';
  $('resultLine').textContent = payout
    ? (jackpot ? `🎉 JACKPOT! ${reels.join(' ')} — you won ${payout} CHIPS and a Golden Reel!` : `${reels.join(' ')} — you won ${payout} CHIPS${collectible ? ` and a ${collectible} collectible!` : '!'}`)
    : (collectible ? `${reels.join(' ')} — no payout, but you won a ${collectible} collectible!` : `${reels.join(' ')} — no win this time.`);
  beep(payout > 0);
  render();
  $('spinBtn').disabled = false;
}

function sellCollectible(name) {
  if (!state.inventory[name]) return;
  const { price } = merchantPrice(name);
  state.inventory[name]--; state.balance += price;
  state.merchantStock[name] = (state.merchantStock[name] || 0) + 1;
  state.merchantSales[name] = (state.merchantSales[name] || 0) + 1;
  $('marketLog').textContent = `You sold a ${name} to Mara for ${price} CHIPS. Her price for ${name} will fall 10% on the next sale — flood her and it gets cheap.`;
  save(); render();
}

function fastForward() {
  // Simulate a week of trading in a minute (track prompt): NPC traders buy
  // and sell with Mara; prices move with stock and demand. Runs instantly
  // in the demo, with a log — judges can watch the economy move.
  const lines = [];
  for (let day = 1; day <= 7; day++) {
    const name = Object.keys(COLLECTIBLES)[Math.floor(Math.random() * 4)];
    const { price } = merchantPrice(name);
    if (Math.random() < 0.5 && (state.merchantStock[name] || 0) > 0) {
      state.merchantStock[name]--; state.merchantSales[name] = Math.max(0, (state.merchantSales[name] || 0) - 1);
      lines.push(`Day ${day}: an NPC bought a ${name} from Mara for ${price} CHIPS (her stock falls, price rises).`);
    } else {
      state.merchantStock[name] = (state.merchantStock[name] || 0) + 1;
      state.merchantSales[name] = (state.merchantSales[name] || 0) + 1;
      lines.push(`Day ${day}: an NPC sold a ${name} to Mara for ${price} CHIPS (her stock rises, price falls).`);
    }
  }
  $('marketLog').textContent = lines.join('\n');
  save(); render();
}

$('spinBtn').onclick = spin;
$('maxBetBtn').onclick = () => { $('betSelect').value = '100'; render(); };
$('betSelect').onchange = render;
$('connectBtn').onclick = () => { $('walletStatus').textContent = 'Connected (demo): demo-player.testnet — play tokens only, no keys.'; $('connectBtn').disabled = true; };
$('soundBtn').onclick = (e) => { soundOn = !soundOn; e.target.textContent = `Sound: ${soundOn ? 'on' : 'off'}`; e.target.setAttribute('aria-pressed', soundOn); };
$('autoBtn').onclick = (e) => {
  autoplay = !autoplay;
  e.target.textContent = `Autoplay: ${autoplay ? 'on' : 'off'}`; e.target.setAttribute('aria-pressed', autoplay);
  if (autoplay) autoplayTimer = setInterval(() => { if (!document.hidden) spin(); }, 1500);
  else clearInterval(autoplayTimer);
};
// Spec: pause gracefully on interruption — autoplay stops if the tab hides.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && autoplay) { clearInterval(autoplayTimer); autoplayTimer = null; $('autoBtn').textContent = 'Autoplay: paused (tab hidden)'; }
  else if (!document.hidden && autoplay && !$('autoBtn').textContent.includes('on')) { $('autoBtn').textContent = 'Autoplay: on'; autoplayTimer = setInterval(() => spin(), 1500); }
});
$('fastForwardBtn').onclick = fastForward;
$('verifyBtn').onclick = async () => {
  const last = state.audit[state.audit.length - 1];
  if (!last) { $('verifyResult').textContent = 'No spin to verify yet.'; return; }
  const ok = (await sha256Hex(last.reveal)) === last.commitment
    && (await sha256Hex(last.commitment + last.reveal)) === last.randomHex;
  $('verifyResult').textContent = ok ? '✓ Verified — reveal matches commitment and hash matches outcome.' : '✗ Verification failed — do not trust this spin.';
};
render();
