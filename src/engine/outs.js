// Outs counter: identifies which cards improve the hero's hand,
// grouped by draw type (flush, straight, pair, trips, full house, quads)

import { createDeck, removeCards } from './cards.js';
import { evaluate7, HAND_RANKS } from './evaluator.js';

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
 * Count outs for the hero's hand given hole cards and board.
 * An "out" is any remaining card that improves the hand to a better category.
 *
 * @param {Array} holeCards - Hero's 2 hole cards
 * @param {Array} board - 3 or 4 community cards (flop or turn)
 * @returns {{ totalOuts, outs: Array<{card, fromRank, toRank, drawType}>, byType: Object }}
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

    if (newHand.rank > currentHand.rank) {
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
