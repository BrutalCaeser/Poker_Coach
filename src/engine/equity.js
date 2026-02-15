// Monte Carlo equity calculator
// For N players with known/unknown hands and partial/full board

import { createDeck, removeCards } from './cards.js';
import { evaluate7, compareHands } from './evaluator.js';

/**
 * Fisher-Yates shuffle (in-place, for performance in hot loop)
 */
function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

/**
 * Calculate equity for each player via Monte Carlo simulation.
 *
 * @param {Array} players - Array of { cards: [card, card] | null }
 *   cards = null means unknown hand (will be dealt randomly)
 * @param {Array} board - Array of known board cards (0-5 cards)
 * @param {number} iterations - Number of simulations (default 10000)
 * @returns {Array} Array of { equity, wins, ties } for each player
 */
export function calculateEquity(players, board = [], iterations = 10000) {
  const numPlayers = players.length;
  if (numPlayers < 2) throw new Error('Need at least 2 players');

  // Collect all known cards
  const knownCards = [...board];
  const unknownPlayerIndices = [];
  for (let i = 0; i < numPlayers; i++) {
    if (players[i].cards) {
      knownCards.push(...players[i].cards);
    } else {
      unknownPlayerIndices.push(i);
    }
  }

  // Build the remaining deck (remove all known cards)
  const remainingDeck = removeCards(createDeck(), knownCards);
  const boardCardsNeeded = 5 - board.length;
  const unknownHandCardsNeeded = unknownPlayerIndices.length * 2;

  // Results tracking
  const wins = new Array(numPlayers).fill(0);
  const ties = new Array(numPlayers).fill(0);

  // Reusable arrays for the hot loop
  const deckCopy = [...remainingDeck];

  for (let iter = 0; iter < iterations; iter++) {
    // Shuffle the remaining deck
    for (let i = deckCopy.length - 1; i >= 0; i--) {
      deckCopy[i] = remainingDeck[i];
    }
    shuffleInPlace(deckCopy);

    let deckIdx = 0;

    // Deal unknown hands
    const playerHands = new Array(numPlayers);
    for (let i = 0; i < numPlayers; i++) {
      if (players[i].cards) {
        playerHands[i] = players[i].cards;
      } else {
        playerHands[i] = [deckCopy[deckIdx++], deckCopy[deckIdx++]];
      }
    }

    // Deal remaining board cards
    const fullBoard = [...board];
    for (let i = 0; i < boardCardsNeeded; i++) {
      fullBoard.push(deckCopy[deckIdx++]);
    }

    // Evaluate each player's best hand
    const evals = new Array(numPlayers);
    for (let i = 0; i < numPlayers; i++) {
      evals[i] = evaluate7([...playerHands[i], ...fullBoard]);
    }

    // Find winner(s)
    let bestIdx = 0;
    let tiedWith = [0];
    for (let i = 1; i < numPlayers; i++) {
      const cmp = compareHands(evals[i], evals[bestIdx]);
      if (cmp > 0) {
        bestIdx = i;
        tiedWith = [i];
      } else if (cmp === 0) {
        tiedWith.push(i);
      }
    }

    if (tiedWith.length === 1) {
      wins[bestIdx]++;
    } else {
      for (const idx of tiedWith) {
        ties[idx]++;
      }
    }
  }

  // Calculate equity: (wins + 0.5 * ties) / total
  return players.map((_, i) => ({
    equity: (wins[i] + 0.5 * ties[i]) / iterations,
    wins: wins[i],
    ties: ties[i],
  }));
}
