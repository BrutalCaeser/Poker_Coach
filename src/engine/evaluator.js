// Hand evaluator: 5-card ranking and 7-card best-hand extraction
// Hand ranks: High Card(0), Pair(1), Two Pair(2), Three of a Kind(3),
//             Straight(4), Flush(5), Full House(6), Four of a Kind(7), Straight Flush(8)

export const HAND_RANKS = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
};

export const HAND_NAMES = [
  'High Card', 'Pair', 'Two Pair', 'Three of a Kind',
  'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush',
];

/**
 * Evaluate a 5-card hand. Returns { rank, kickers } where rank is 0-8
 * and kickers is an array of values used for tiebreaking (highest first).
 */
export function evaluate5(cards) {
  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);

  // Count rank occurrences
  const counts = {};
  for (const r of ranks) {
    counts[r] = (counts[r] || 0) + 1;
  }

  const groups = Object.entries(counts)
    .map(([r, c]) => ({ rank: Number(r), count: c }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);

  const isFlush = suits.every((s) => s === suits[0]);

  // Check for straight (including A-2-3-4-5 wheel)
  let isStraight = false;
  let straightHigh = 0;
  const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);
  if (uniqueRanks.length >= 5) {
    // Normal straight check
    if (uniqueRanks[0] - uniqueRanks[4] === 4) {
      isStraight = true;
      straightHigh = uniqueRanks[0];
    }
    // Wheel: A-2-3-4-5
    if (!isStraight && uniqueRanks[0] === 14 &&
        uniqueRanks[1] === 5 && uniqueRanks[2] === 4 &&
        uniqueRanks[3] === 3 && uniqueRanks[4] === 2) {
      isStraight = true;
      straightHigh = 5; // 5-high straight
    }
  }

  // Straight flush
  if (isFlush && isStraight) {
    return { rank: HAND_RANKS.STRAIGHT_FLUSH, kickers: [straightHigh] };
  }

  // Four of a kind
  if (groups[0].count === 4) {
    const kicker = groups[1].rank;
    return { rank: HAND_RANKS.FOUR_OF_A_KIND, kickers: [groups[0].rank, kicker] };
  }

  // Full house
  if (groups[0].count === 3 && groups[1].count === 2) {
    return { rank: HAND_RANKS.FULL_HOUSE, kickers: [groups[0].rank, groups[1].rank] };
  }

  // Flush
  if (isFlush) {
    return { rank: HAND_RANKS.FLUSH, kickers: ranks };
  }

  // Straight
  if (isStraight) {
    return { rank: HAND_RANKS.STRAIGHT, kickers: [straightHigh] };
  }

  // Three of a kind
  if (groups[0].count === 3) {
    const kickers = groups.slice(1).map((g) => g.rank);
    return { rank: HAND_RANKS.THREE_OF_A_KIND, kickers: [groups[0].rank, ...kickers] };
  }

  // Two pair
  if (groups[0].count === 2 && groups[1].count === 2) {
    const pairs = [groups[0].rank, groups[1].rank].sort((a, b) => b - a);
    const kicker = groups[2].rank;
    return { rank: HAND_RANKS.TWO_PAIR, kickers: [...pairs, kicker] };
  }

  // Pair
  if (groups[0].count === 2) {
    const kickers = groups.slice(1).map((g) => g.rank).sort((a, b) => b - a);
    return { rank: HAND_RANKS.PAIR, kickers: [groups[0].rank, ...kickers] };
  }

  // High card
  return { rank: HAND_RANKS.HIGH_CARD, kickers: ranks };
}

/**
 * Generate all C(n,5) 5-card combinations from an array of cards.
 */
function combinations5(cards) {
  const result = [];
  const n = cards.length;
  for (let i = 0; i < n - 4; i++) {
    for (let j = i + 1; j < n - 3; j++) {
      for (let k = j + 1; k < n - 2; k++) {
        for (let l = k + 1; l < n - 1; l++) {
          for (let m = l + 1; m < n; m++) {
            result.push([cards[i], cards[j], cards[k], cards[l], cards[m]]);
          }
        }
      }
    }
  }
  return result;
}

/**
 * Compare two evaluated hands. Returns positive if a wins, negative if b wins, 0 for tie.
 */
export function compareHands(a, b) {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < Math.min(a.kickers.length, b.kickers.length); i++) {
    if (a.kickers[i] !== b.kickers[i]) return a.kickers[i] - b.kickers[i];
  }
  return 0;
}

/**
 * Evaluate the best 5-card hand from 7 cards (2 hole + 5 board).
 * Checks all C(7,5) = 21 combinations.
 */
export function evaluate7(cards) {
  if (cards.length < 5) throw new Error(`Need at least 5 cards, got ${cards.length}`);
  if (cards.length === 5) return evaluate5(cards);

  const combos = combinations5(cards);
  let best = null;
  for (const combo of combos) {
    const hand = evaluate5(combo);
    if (!best || compareHands(hand, best) > 0) {
      best = hand;
    }
  }
  return best;
}

/**
 * Get a human-readable name for an evaluated hand.
 */
export function handName(evaluated) {
  return HAND_NAMES[evaluated.rank];
}
