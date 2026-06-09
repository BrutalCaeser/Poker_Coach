// revealMath.js — pure functions that turn a scenario (v1 or v2) at a decision
// point into all engine-computed numbers the reveal UI needs.

import { potOdds, exactEquity1Card, exactEquity2Cards } from './math.js';
import { calculateEquity } from './equity.js';
import { countOuts } from './outs.js';
import { parseCards } from './cards.js';

/**
 * Collect all community cards that are "on the board" at the moment the
 * decision is reached.
 *
 * Rules:
 *   1. Start with scenario.board (cards dealt before any actions).
 *   2. Walk scenario.actions in order. For every {type:"board"} action that
 *      appears BEFORE the first {type:"decision"} action, append its cards.
 *   3. Stop accumulating the moment we hit the decision action.
 *
 * @param {Object} scenario
 * @returns {string[]} array of card strings e.g. ["Qh","7s","2d"]
 */
function getBoardAtDecision(scenario) {
  const base = Array.isArray(scenario.board) ? [...scenario.board] : [];

  for (const action of scenario.actions) {
    if (action.type === 'decision') break;
    if (action.type === 'board' && Array.isArray(action.cards)) {
      base.push(...action.cards);
    }
  }

  return base;
}

/**
 * Determine whether this is an all-in decision.
 *
 * TRUE when:
 *   (a) decision.callAmount >= decision.heroStack  (calling commits the rest), OR
 *   (b) any bet/raise action before the decision has an `action` string
 *       matching /all-in|shove/i.
 *
 * @param {Object} scenario
 * @returns {boolean}
 */
function computeIsAllIn(scenario) {
  const { callAmount, heroStack } = scenario.decision;

  // Condition (a): call amount ≥ remaining stack
  if (callAmount >= heroStack) return true;

  // Condition (b): scan bet actions for all-in language
  for (const action of scenario.actions) {
    if (action.type === 'decision') break;
    if (action.type === 'bet' && typeof action.action === 'string') {
      if (/all-in|shove/i.test(action.action)) return true;
    }
  }

  return false;
}

/**
 * Convert an array of card strings into parsed card objects.
 * Returns null if the input is falsy, empty, or not a valid 2-element array.
 */
function parsePlayerCards(cardStrings) {
  if (!Array.isArray(cardStrings) || cardStrings.length !== 2) return null;
  try {
    return parseCards(cardStrings);
  } catch {
    return null;
  }
}

/**
 * Compute all reveal-math numbers for a scenario at its decision point.
 *
 * @param {Object} scenario — a scenario object from src/scenarios/index.js
 * @returns {{
 *   potOddsPct: number,
 *   isAllIn: boolean,
 *   villainsKnown: boolean,
 *   showdownEquityPct: number | null,
 *   boardLen: number,
 *   cleanOuts: number | null,
 *   improveEquity1Pct: number | null,
 *   improveEquity2Pct: number | null,
 * }}
 */
export function computeRevealMath(scenario) {
  const { decision, heroIndex } = scenario;
  const { callAmount, pot } = decision;

  // ── Pot odds ────────────────────────────────────────────────────────────────
  const potOddsPct = potOdds(callAmount, pot) * 100;

  // ── All-in flag ──────────────────────────────────────────────────────────────
  const isAllIn = computeIsAllIn(scenario);

  // ── Board at decision ────────────────────────────────────────────────────────
  const boardStrings = getBoardAtDecision(scenario);
  const boardLen = boardStrings.length;
  const boardCards = boardStrings.length > 0 ? parseCards(boardStrings) : [];

  // ── Villain hand visibility ──────────────────────────────────────────────────
  // A villain is "known" only if they have exactly 2 card strings.
  const numPlayers = scenario.players.length;
  let villainsKnown = true;
  for (let i = 0; i < numPlayers; i++) {
    if (i === heroIndex) continue;
    const villainCards = scenario.players[i].cards;
    if (!Array.isArray(villainCards) || villainCards.length !== 2) {
      villainsKnown = false;
      break;
    }
  }

  // ── Showdown equity (Monte Carlo) ────────────────────────────────────────────
  let showdownEquityPct = null;

  if (villainsKnown) {
    // Build player array for calculateEquity.
    // Players with unknown/invalid cards get cards: null so the sim deals them.
    const equityPlayers = scenario.players.map((p, i) => {
      const parsed = parsePlayerCards(p.cards);
      return { cards: parsed };
    });

    const results = calculateEquity(equityPlayers, boardCards, 10000);
    showdownEquityPct = results[heroIndex].equity * 100;
  }

  // ── Clean outs ───────────────────────────────────────────────────────────────
  // countOuts requires exactly 3 or 4 board cards. Null otherwise.
  let cleanOuts = null;
  let improveEquity1Pct = null;
  let improveEquity2Pct = null;

  if (boardLen === 3 || boardLen === 4) {
    const heroParsed = parsePlayerCards(scenario.players[heroIndex].cards);
    if (heroParsed !== null) {
      try {
        const outsResult = countOuts(heroParsed, boardCards);
        cleanOuts = outsResult.totalOuts;
        improveEquity1Pct = exactEquity1Card(cleanOuts) * 100;
        improveEquity2Pct = exactEquity2Cards(cleanOuts) * 100;
      } catch {
        // countOuts can throw on edge cases — leave nulls
      }
    }
  }

  return {
    potOddsPct,
    isAllIn,
    villainsKnown,
    showdownEquityPct,
    boardLen,
    cleanOuts,
    improveEquity1Pct,
    improveEquity2Pct,
  };
}

// ---------------------------------------------------------------------------
// V2 helpers
// ---------------------------------------------------------------------------

/**
 * Collect all community cards visible at a specific DecisionPoint in a v2 scenario.
 *
 * Algorithm:
 *   1. Start with scenario.board (pre-action cards).
 *   2. Walk scenario.actions in order.
 *      - Accumulate {type:"board"} cards as they appear.
 *      - Stop when the {type:"decision"} whose decisionId === dp.id is reached.
 *
 * @param {Object} scenario
 * @param {Object} dp - The DecisionPoint whose board state we want
 * @returns {string[]}
 */
function getBoardAtDP(scenario, dp) {
  const base = Array.isArray(scenario.board) ? [...scenario.board] : [];

  for (const action of scenario.actions) {
    if (action.type === 'decision' && action.decisionId === dp.id) break;
    if (action.type === 'board' && Array.isArray(action.cards)) {
      base.push(...action.cards);
    }
  }

  return base;
}

/**
 * Determine whether a specific DecisionPoint is an all-in situation.
 *
 * TRUE when:
 *   (a) dp.callAmount >= dp.heroStack, OR
 *   (b) any bet/raise action before this DP's decision action mentions /all-in|shove/i
 *
 * @param {Object} scenario
 * @param {Object} dp
 * @returns {boolean}
 */
function computeIsAllInForDP(scenario, dp) {
  if (dp.callAmount >= dp.heroStack) return true;

  for (const action of scenario.actions) {
    if (action.type === 'decision' && action.decisionId === dp.id) break;
    if (action.type === 'bet' && typeof action.action === 'string') {
      if (/all-in|shove/i.test(action.action)) return true;
    }
  }

  return false;
}

/**
 * Compute all reveal-math numbers for a specific DecisionPoint in a v2 scenario.
 *
 * This mirrors computeRevealMath but sources pot/callAmount/heroStack from the
 * DecisionPoint rather than scenario.decision, and computes the board state up
 * to that exact decision action.
 *
 * @param {Object} scenario - A v2 scenario with decisionPoints[]
 * @param {number} dpIndex  - Index into scenario.decisionPoints[]
 * @returns {{
 *   potOddsPct: number,
 *   isAllIn: boolean,
 *   villainsKnown: boolean,
 *   showdownEquityPct: number | null,
 *   boardLen: number,
 *   cleanOuts: number | null,
 *   improveEquity1Pct: number | null,
 *   improveEquity2Pct: number | null,
 * }}
 */
export function computeRevealMathForDP(scenario, dpIndex) {
  const dp = scenario.decisionPoints[dpIndex];
  const { heroIndex } = scenario;
  const { callAmount, pot } = dp;

  // ── Pot odds ────────────────────────────────────────────────────────────────
  const potOddsPct = potOdds(callAmount, pot) * 100;

  // ── All-in flag ──────────────────────────────────────────────────────────────
  const isAllIn = computeIsAllInForDP(scenario, dp);

  // ── Board at this DP ─────────────────────────────────────────────────────────
  const boardStrings = getBoardAtDP(scenario, dp);
  const boardLen = boardStrings.length;
  const boardCards = boardStrings.length > 0 ? parseCards(boardStrings) : [];

  // ── Villain hand visibility ──────────────────────────────────────────────────
  const numPlayers = scenario.players.length;
  let villainsKnown = true;
  for (let i = 0; i < numPlayers; i++) {
    if (i === heroIndex) continue;
    const villainCards = scenario.players[i].cards;
    if (!Array.isArray(villainCards) || villainCards.length !== 2) {
      villainsKnown = false;
      break;
    }
  }

  // ── Showdown equity (Monte Carlo) ────────────────────────────────────────────
  let showdownEquityPct = null;

  if (villainsKnown) {
    const equityPlayers = scenario.players.map((p) => ({
      cards: parsePlayerCards(p.cards),
    }));
    const results = calculateEquity(equityPlayers, boardCards, 10000);
    showdownEquityPct = results[heroIndex].equity * 100;
  }

  // ── Clean outs ───────────────────────────────────────────────────────────────
  let cleanOuts = null;
  let improveEquity1Pct = null;
  let improveEquity2Pct = null;

  if (boardLen === 3 || boardLen === 4) {
    const heroParsed = parsePlayerCards(scenario.players[heroIndex].cards);
    if (heroParsed !== null) {
      try {
        const outsResult = countOuts(heroParsed, boardCards);
        cleanOuts = outsResult.totalOuts;
        improveEquity1Pct = exactEquity1Card(cleanOuts) * 100;
        improveEquity2Pct = exactEquity2Cards(cleanOuts) * 100;
      } catch {
        // countOuts can throw on edge cases — leave nulls
      }
    }
  }

  return {
    potOddsPct,
    isAllIn,
    villainsKnown,
    showdownEquityPct,
    boardLen,
    cleanOuts,
    improveEquity1Pct,
    improveEquity2Pct,
  };
}
