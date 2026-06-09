// Outs counter: identifies which cards improve the hero's hand,
// grouped by draw type (flush, straight, pair, trips, full house, quads)

import { createDeck, removeCards } from './cards.js';
import { evaluate5, evaluate7, HAND_RANKS } from './evaluator.js';

const DRAW_TYPES = {
  FLUSH: 'flush',
  STRAIGHT: 'straight',
  PAIR: 'pair',
  TRIPS: 'trips',
  FULL_HOUSE: 'full_house',
  QUADS: 'quads',
  STRAIGHT_FLUSH: 'straight_flush',
  TWO_PAIR: 'two_pair',
};

/**
 * Best HAND_RANK achievable from community cards ALONE (no hole cards).
 * Used to decide whether a candidate card improves the HERO specifically, or
 * merely improves the board (which helps every player equally — not an out).
 * board+candidate is 4 cards (flop) or 5 cards (turn); flush/straight need 5.
 */
function boardCategory(cards) {
  if (cards.length >= 5) return evaluate5(cards).rank;
  const counts = {};
  for (const c of cards) counts[c.rank] = (counts[c.rank] || 0) + 1;
  const mult = Object.values(counts).sort((a, b) => b - a);
  if (mult[0] === 4) return HAND_RANKS.FOUR_OF_A_KIND;
  if (mult[0] === 3) return HAND_RANKS.THREE_OF_A_KIND;
  if (mult[0] === 2 && mult[1] === 2) return HAND_RANKS.TWO_PAIR;
  if (mult[0] === 2) return HAND_RANKS.PAIR;
  return HAND_RANKS.HIGH_CARD;
}

/**
 * Count "clean" outs for the hero given hole cards and board.
 * An out is a remaining card that raises the hero's hand category AND raises it
 * beyond what the community cards alone would make — i.e. the hero's hole cards
 * drive the improvement. Cards that merely pair the board (helping everyone, not
 * the hero) are NOT counted.
 *
 * NOTE: this is a range-INDEPENDENT "category improvement" count. It is not the
 * same as a curated teaching out-count (which may count only a primary draw),
 * nor a range-dependent "winning outs" count. See scripts/math-audit.mjs.
 *
 * @param {Array} holeCards - Hero's 2 hole cards
 * @param {Array} board - 3 or 4 community cards (flop or turn)
 * @returns {{ totalOuts, currentRank, outs: Array<{card, fromRank, toRank, drawType}>, byType: Object }}
 */
export function countOuts(holeCards, board) {
  if (board.length < 3 || board.length > 4) {
    throw new Error(`Board must have 3-4 cards, got ${board.length}`);
  }

  const allKnown = [...holeCards, ...board];
  const currentHand = evaluate7(allKnown);
  const remaining = removeCards(createDeck(), allKnown);

  const outs = [];
  const byType = {};

  for (const card of remaining) {
    const newCards = [...allKnown, card];
    const newHand = evaluate7(newCards);

    // Only count cards whose improvement comes from the hero's hole cards, not
    // from the board improving on its own (board-pairing helps everyone equally).
    const boardOnlyRank = boardCategory([...board, card]);
    if (newHand.rank > currentHand.rank && newHand.rank > boardOnlyRank) {
      const drawType = classifyImprovement(currentHand.rank, newHand.rank);
      outs.push({
        card,
        fromRank: currentHand.rank,
        toRank: newHand.rank,
        drawType,
      });
      byType[drawType] = (byType[drawType] || 0) + 1;
    }
  }

  return {
    totalOuts: outs.length,
    currentRank: currentHand.rank,
    outs,
    byType,
  };
}

/**
 * Classify the improvement type based on what hand rank we move to.
 */
function classifyImprovement(fromRank, toRank) {
  if (toRank === HAND_RANKS.STRAIGHT_FLUSH) return DRAW_TYPES.STRAIGHT_FLUSH;
  if (toRank === HAND_RANKS.FOUR_OF_A_KIND) return DRAW_TYPES.QUADS;
  if (toRank === HAND_RANKS.FULL_HOUSE) return DRAW_TYPES.FULL_HOUSE;
  if (toRank === HAND_RANKS.FLUSH) return DRAW_TYPES.FLUSH;
  if (toRank === HAND_RANKS.STRAIGHT) return DRAW_TYPES.STRAIGHT;
  if (toRank === HAND_RANKS.THREE_OF_A_KIND) return DRAW_TYPES.TRIPS;
  if (toRank === HAND_RANKS.TWO_PAIR) return DRAW_TYPES.TWO_PAIR;
  if (toRank === HAND_RANKS.PAIR) return DRAW_TYPES.PAIR;
  return 'other';
}

/**
 * Analyze draw quality for implied odds assessment.
 * Returns visibility rating: how easy it is for opponents to see the draw completed.
 */
export function analyzeDrawVisibility(byType) {
  const draws = [];

  if (byType[DRAW_TYPES.FLUSH]) {
    draws.push({
      type: 'Flush draw',
      outs: byType[DRAW_TYPES.FLUSH],
      visibility: 'high',
      impliedOdds: 'worst',
      reason: 'Third suited card on board is impossible to miss',
    });
  }

  if (byType[DRAW_TYPES.STRAIGHT]) {
    const count = byType[DRAW_TYPES.STRAIGHT];
    if (count >= 8) {
      draws.push({
        type: 'Open-ended straight draw',
        outs: count,
        visibility: 'medium',
        impliedOdds: 'medium',
        reason: 'Connected board cards signal straight possibilities',
      });
    } else {
      draws.push({
        type: 'Gutshot straight draw',
        outs: count,
        visibility: 'low',
        impliedOdds: 'good',
        reason: 'Gutshots on disconnected boards are hard to spot',
      });
    }
  }

  if (byType[DRAW_TYPES.PAIR]) {
    draws.push({
      type: 'Overcard outs',
      outs: byType[DRAW_TYPES.PAIR],
      visibility: 'high',
      impliedOdds: 'worst',
      reason: 'High cards on the turn/river are universal scare cards',
    });
  }

  if (byType[DRAW_TYPES.TRIPS] || byType[DRAW_TYPES.FULL_HOUSE]) {
    const outs = (byType[DRAW_TYPES.TRIPS] || 0) + (byType[DRAW_TYPES.FULL_HOUSE] || 0);
    draws.push({
      type: 'Set/trips outs',
      outs,
      visibility: 'very_low',
      impliedOdds: 'best',
      reason: 'Sets are nearly invisible — opponents stack off against them',
    });
  }

  return draws;
}

export { DRAW_TYPES };
