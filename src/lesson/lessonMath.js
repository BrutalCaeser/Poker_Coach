/**
 * lessonMath — every number the lesson shows, computed from the engine.
 * ======================================================================
 * The old reveal hand-typed its numbers and got the centre wrong ("20 clean
 * outs" — the real count is 17 of 44). Nothing in the lesson is typed in: the
 * grid, the counts, the price, the long run and the break-even bet all come
 * from these functions, which are unit-tested against exact enumeration.
 *
 * Two points of view, kept strictly apart:
 *   HERO VIEW — what you can know in the seat: 46 unseen cards, and a read on
 *               his hand ("give him a pair of nines"). The decision is graded
 *               on this.
 *   TRUTH     — his real hole cards: 44 unseen cards. Shown only after you
 *               commit, as the twist.
 */
import { parseCards, createDeck, cardToString } from '../engine/cards.js';
import { evaluate7, compareHands, HAND_RANKS } from '../engine/evaluator.js';

/** Grid layout: high rank on the left, spades first (the flush row reads first). */
export const RANK_ORDER = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
export const SUIT_ORDER = ['s', 'h', 'd', 'c'];
export const RANK_LABEL = {
  14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: '10',
  9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2',
};
export const SUIT_GLYPH = { s: '♠', h: '♥', d: '♦', c: '♣' };

const key = (c) => cardToString(c);

/* ── price ──────────────────────────────────────────────────── */

/**
 * Your share of the final pot if you call.
 * He bets `bet` into `potBeforeBet`; you call `bet`; the pot becomes
 * potBeforeBet + 2·bet, of which you paid `bet`.
 */
export function priceForBet(bet, potBeforeBet) {
  return bet / (potBeforeBet + 2 * bet);
}

/** The bet at which calling stops paying, for a given chance of winning. */
export function breakEvenBet(winShare, potBeforeBet) {
  if (winShare >= 0.5) return Infinity; // price can never exceed 50%
  return (winShare * potBeforeBet) / (1 - 2 * winShare);
}

/* ── hero view: what beats "a pair of nines" ───────────────── */

/**
 * Classify one possible river card from the seat, against a read of
 * "he has a pair of `pairRank`". Returns why it does or doesn't win, so the
 * feedback can explain each tap rather than just mark it.
 *
 * kinds:  flush | straight | better-pair  → wins
 *         board-pair | small-pair | nothing → doesn't
 */
export function classifyCard(hole, board, card, pairRank = 9) {
  const hand = evaluate7([...hole, ...board, card]);
  if (hand.rank === HAND_RANKS.FLUSH || hand.rank === HAND_RANKS.STRAIGHT_FLUSH) {
    return { kind: 'flush', wins: true };
  }
  if (hand.rank === HAND_RANKS.STRAIGHT) return { kind: 'straight', wins: true };
  if (hand.rank > HAND_RANKS.PAIR) return { kind: 'better', wins: true };

  if (hand.rank === HAND_RANKS.PAIR) {
    const pr = hand.kickers[0];
    if (pr > pairRank) return { kind: 'better-pair', wins: true };
    if (board.some((b) => b.rank === card.rank)) return { kind: 'board-pair', wins: false };
    return { kind: 'small-pair', wins: false };
  }
  return { kind: 'nothing', wins: false };
}

/**
 * The full 4 × 13 grid from the seat. Seen cards (your hand, the board) stay in
 * place as ghost slots so the structure of the deck reads: a flush is a ROW, a
 * straight is two COLUMNS, a better pair is a COLUMN.
 */
export function heroGrid(holeStrs, boardStrs, pairRank = 9) {
  const hole = parseCards(holeStrs);
  const board = parseCards(boardStrs);
  const seen = new Map([
    ...hole.map((c) => [key(c), 'yours']),
    ...board.map((c) => [key(c), 'board']),
  ]);

  return SUIT_ORDER.map((suit) =>
    RANK_ORDER.map((rank) => {
      const card = { rank, suit };
      const id = key(card);
      if (seen.has(id)) return { id, rank, suit, seen: seen.get(id) };
      const { kind, wins } = classifyCard(hole, board, card, pairRank);
      return { id, rank, suit, seen: null, kind, wins };
    })
  );
}

export function heroCounts(grid) {
  const cells = grid.flat().filter((c) => !c.seen);
  const winners = cells.filter((c) => c.wins);
  return { unseen: cells.length, wins: winners.length, winners: winners.map((c) => c.id) };
}

/* ── truth: his real cards ──────────────────────────────────── */

/** Exact enumeration of every river card against his actual hand. */
export function truthCounts(holeStrs, villainStrs, boardStrs) {
  const hole = parseCards(holeStrs);
  const villain = parseCards(villainStrs);
  const board = parseCards(boardStrs);
  const known = new Set([...hole, ...villain, ...board].map(key));
  const unseen = createDeck().filter((c) => !known.has(key(c)));

  const winners = [];
  let ties = 0;
  for (const c of unseen) {
    const r = compareHands(evaluate7([...hole, ...board, c]), evaluate7([...villain, ...board, c]));
    if (r > 0) winners.push(key(c));
    else if (r === 0) ties++;
  }
  return {
    unseen: unseen.length,
    wins: winners.length,
    ties,
    winners,
    equity: (winners.length + ties / 2) / unseen.length,
  };
}

/* ── feedback on what the user tapped ───────────────────────── */

/**
 * Compare the user's taps with the hero-view winners and explain the gaps by
 * KIND, so feedback teaches ("you missed the kings: a king gives you a pair of
 * kings, which beats his nines") instead of just marking right and wrong.
 */
export function gradeSelection(grid, selected) {
  const cells = grid.flat().filter((c) => !c.seen);
  const found = cells.filter((c) => c.wins && selected.has(c.id));
  const missed = cells.filter((c) => c.wins && !selected.has(c.id));
  const wrong = cells.filter((c) => !c.wins && selected.has(c.id));
  const byKind = (list) =>
    list.reduce((acc, c) => {
      (acc[c.kind] ||= []).push(c.id);
      return acc;
    }, {});
  return {
    total: cells.filter((c) => c.wins).length,
    found: found.length,
    missedByKind: byKind(missed),
    wrongByKind: byKind(wrong),
    perfect: missed.length === 0 && wrong.length === 0,
  };
}

/* ── the long run ───────────────────────────────────────────── */

/**
 * `wins` wins spread evenly through `n` plays. Deliberately NOT random: this is
 * a picture of a frequency, not a slot machine, so there is no suspense to it.
 */
export function longRunSequence(wins, n = 100) {
  return Array.from({ length: n }, (_, i) => Math.floor(((i + 1) * wins) / n) > Math.floor((i * wins) / n));
}

/* ── formatting ─────────────────────────────────────────────── */

export function money(n) {
  const sign = n < 0 ? '−' : '';
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${sign}${(a / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
  if (a >= 1_000) return `${sign}${Math.round(a / 1_000)}K`;
  return `${sign}${a}`;
}

export const pct = (x) => Math.round(x * 100);
