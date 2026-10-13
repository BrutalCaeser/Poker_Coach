/**
 * variation — endless, valid practice spots, generated and checked by the engine.
 * ===============================================================================
 * An opening trainer can drill a fixed line because chess openings are fixed.
 * Poker spots are not: the cards and numbers change every hand, so memorising
 * answers is useless. What the engine CAN do is produce unlimited variations of
 * the same kind of spot, which means the only way to clear a step is to have
 * actually learned it.
 *
 * Every generator is seeded (mulberry32) so a variation is reproducible from its
 * seed: tests can pin exact spots, and a bug report can name one.
 *
 * Validity rules for a "drawing hand on the turn" (one card to come):
 *   - You have no pair yet (high card): you are genuinely drawing.
 *   - The board is unpaired, has no four of a suit, and no four cards inside a
 *     five-rank window. Those boards make one card complete a hand for EVERYONE,
 *     which turns "your outs" into a trick question.
 *   - The read is always stated: "give him a pair of <top board card>".
 *   - Outs between 6 and 21. Below 6 the lesson is "fold, you have nothing";
 *     above 21 the rule of 2 drifts past the ±4 grading tolerance
 *     (exact is outs/46 ≈ outs × 2.17).
 */
import { createDeck, cardToString, parseCards } from '../engine/cards.js';
import { evaluate7, HAND_RANKS } from '../engine/evaluator.js';
import { heroGrid, heroCounts, priceForBet } from '../lesson/lessonMath.js';

/* ── seeded randomness ─────────────────────────────────────── */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit seed from any parts (FNV-1a). */
export function seedFor(...parts) {
  let h = 0x811c9dc5;
  for (const ch of parts.join('|')) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function dealFrom(r, n) {
  const deck = createDeck();
  const out = [];
  for (let i = 0; i < n; i++) out.push(deck.splice(Math.floor(r() * deck.length), 1)[0]);
  return out;
}

/* ── board validity ────────────────────────────────────────── */

export function boardIsClean(board) {
  const ranks = board.map((c) => c.rank);
  if (new Set(ranks).size !== ranks.length) return false; // paired board

  const perSuit = {};
  for (const c of board) perSuit[c.suit] = (perSuit[c.suit] || 0) + 1;
  if (Math.max(...Object.values(perSuit)) >= 4) return false; // one card flushes everyone

  const span = (rs) => Math.max(...rs) - Math.min(...rs);
  const low = ranks.map((r) => (r === 14 ? 1 : r)); // ace plays low too
  if (span(ranks) <= 4 || span(low) <= 4) return false; // one card straightens everyone
  return true;
}

/* ── pot sizes and bet sizes ───────────────────────────────── */

export const POTS = [40, 60, 80, 100, 120, 150, 200, 240, 300, 400].map((k) => k * 1000);

/** Bet sizes as fractions of the pot. Each maps to a price worth knowing by heart. */
export const BET_FRACTIONS = [1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4, 1, 1.5, 2];

const roundTo = (x, step) => Math.max(step, Math.round(x / step) * step);

function betFor(pot, fraction) {
  return roundTo(pot * fraction, pot >= 100_000 ? 10_000 : 5_000);
}

/* ── step 1 & 2: a drawing hand on the turn ────────────────── */

function kindsOf(grid) {
  const kinds = {};
  for (const c of grid.flat()) if (c.wins) kinds[c.kind] = (kinds[c.kind] || 0) + 1;
  return kinds;
}

export function genDrawSpot(seed, { minOuts = 6, maxOuts = 21 } = {}) {
  const r = mulberry32(seed);
  for (let attempt = 0; attempt < 5000; attempt++) {
    const cards = dealFrom(r, 6);
    const hero = cards.slice(0, 2);
    const board = cards.slice(2);
    if (!boardIsClean(board)) continue;
    if (evaluate7([...hero, ...board]).rank !== HAND_RANKS.HIGH_CARD) continue;

    const pairRank = Math.max(...board.map((c) => c.rank));
    const heroStr = hero.map(cardToString);
    const boardStr = board.map(cardToString);
    const grid = heroGrid(heroStr, boardStr, pairRank);
    const { wins, unseen } = heroCounts(grid);
    if (wins < minOuts || wins > maxOuts) continue;

    return {
      seed,
      hero: heroStr,
      board: boardStr,
      pairRank,
      grid,
      outs: wins,
      unseen,
      chance: wins / unseen,
      kinds: kindsOf(grid),
    };
  }
  throw new Error(`genDrawSpot: no valid spot for seed ${seed}`);
}

/* ── every step deals a full hand for the table ────────────── */

/**
 * The table never changes between steps, so every step deals a complete hand:
 * the drawing hand, the board, a pot and a bet. The step only decides which
 * part of the table it asks about.
 *
 * Seats:
 *   caller  you hold the draw; he holds "a pair of <top card>"
 *   bettor  roles swap on the same felt: YOU hold the pair (real cards) and
 *           HE holds the draw (face down, outs stated). Same maths, his side.
 */
export const MIN_MARGIN = 0.04;

/**
 * A concrete one-pair hand of `pairRank` for the bettor seat. Built, then
 * VERIFIED by the engine: your pair card and kicker can share a suit with
 * three board cards and quietly make a flush (found in 1 of 300 spots), which
 * would change the lesson. Anything that isn't exactly one pair is redrawn.
 */
function madeHand(r, pairRank, used, board) {
  const deck = createDeck().filter((c) => !used.has(cardToString(c)));
  const pairCards = deck.filter((c) => c.rank === pairRank);
  for (let i = 0; i < 400; i++) {
    const a = pairCards[Math.floor(r() * pairCards.length)];
    const rest = deck.filter((c) => c !== a && c.rank !== pairRank);
    const k = rest[Math.floor(r() * rest.length)];
    if (!a || !k) continue;
    const h = evaluate7([a, k, ...board]);
    if (h.rank === HAND_RANKS.PAIR && h.kickers[0] === pairRank) return [cardToString(a), cardToString(k)];
  }
  throw new Error('madeHand: no clean one-pair hand');
}

function pricedOptions(chance, balanced) {
  const out = [];
  for (const potBeforeBet of POTS) {
    for (const f of BET_FRACTIONS) {
      const bet = betFor(potBeforeBet, f);
      const price = priceForBet(bet, potBeforeBet);
      const margin = chance - price;
      if (balanced && Math.abs(margin) < MIN_MARGIN) continue;
      out.push({ potBeforeBet, bet, fraction: f, price, answer: margin > 0 ? 'call' : 'fold' });
    }
  }
  return out;
}

/**
 * @param balanced  true for steps that grade a decision: only CLEAR spots
 *                  (≥ 4 points between chance and price), and call/fold
 *                  balanced 50/50 so "always fold" can't pass. A small draw can
 *                  only ever be a fold, so a wanted "call" asks for 10+ outs.
 */
export function genHand(seed, { seat = 'caller', balanced = false } = {}) {
  const r = mulberry32(seed ^ 0x9e3779b9);
  const want = balanced ? (r() < 0.5 ? 'call' : 'fold') : null;
  const spot = genDrawSpot(seed, { minOuts: want === 'call' ? 10 : 6 });

  const options = pricedOptions(spot.chance, balanced);
  const preferred = want ? options.filter((o) => o.answer === want) : options;
  const pool = preferred.length ? preferred : options;
  const chosen = pool[Math.floor(r() * pool.length)];

  const used = new Set([...spot.hero, ...spot.board]);
  const made = seat === 'bettor' ? madeHand(r, spot.pairRank, used, parseCards(spot.board)) : null;

  return {
    ...spot,
    ...chosen,
    seat,
    finalPot: chosen.potBeforeBet + 2 * chosen.bet,
    drawer: spot.hero, // the drawing hand: yours as caller, his as bettor
    made, // your pair, bettor seat only
  };
}

/* Thin, named entry points (kept for readability and tests). */
export const genPrice = (seed, seat = 'caller') => genHand(seed, { seat });
export const genDecide = (seed, seat = 'caller') => genHand(seed, { seat, balanced: true });
export const genChain = (seed) => genHand(seed, { seat: 'caller', balanced: true });

/* ── dispatch ──────────────────────────────────────────────── */

export function generate(stepId, seed, seat = 'caller') {
  switch (stepId) {
    case 'outs':
    case 'chance':
      return genHand(seed, { seat: 'caller' });
    case 'price':
      return genPrice(seed, seat);
    case 'decide':
      return genDecide(seed, seat);
    case 'chain':
      return genChain(seed);
    default:
      throw new Error(`generate: unknown step "${stepId}"`);
  }
}
