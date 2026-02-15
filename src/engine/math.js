// Mathematical formulas: pot odds, implied odds, EV, SPR, equity shortcuts

/**
 * Calculate pot odds as a percentage.
 * Pot odds % = Call / (Pot + Bet + Call)
 * Note: "Bet" here is the amount already in the pot from the current action.
 * For a simple scenario: pot odds = callAmount / (pot + callAmount)
 */
export function potOdds(callAmount, potSize) {
  if (callAmount <= 0) return 0;
  return callAmount / (potSize + callAmount);
}

/**
 * EV of calling.
 * EV = Equity × (Pot + Call) − (1 − Equity) × Call
 * Simplified: EV = Equity × (Pot + 2×Call) − Call
 * Note: this uses "Pot" as the total pot BEFORE hero's call (including villain's bet).
 */
export function evOfCalling(equity, potSize, callAmount) {
  return equity * (potSize + callAmount) - (1 - equity) * callAmount;
}

/**
 * Implied odds: how much more you need to extract on future streets.
 * F = (Call / Equity) − (Pot + 2×Call)
 * F < 0: Direct odds are sufficient (no implied odds needed)
 * F > 0: Need to extract F more from opponent
 * F > remaining stack: FOLD — physically impossible
 */
export function impliedOddsF(callAmount, equity, potSize) {
  if (equity <= 0) return Infinity;
  return (callAmount / equity) - (potSize + 2 * callAmount);
}

/**
 * Assess implied odds feasibility.
 * Returns an object with F value, whether it's achievable, and as % of pot.
 */
export function assessImpliedOdds(callAmount, equity, potSize, remainingStack) {
  const f = impliedOddsF(callAmount, equity, potSize);
  const potAfterCall = potSize + 2 * callAmount;
  const fAsPctOfPot = potAfterCall > 0 ? (f / potAfterCall) * 100 : 0;

  let feasibility;
  if (f < 0) {
    feasibility = 'not_needed'; // Direct odds sufficient
  } else if (f > remainingStack) {
    feasibility = 'impossible'; // Can't physically collect enough
  } else if (fAsPctOfPot <= 30) {
    feasibility = 'very_achievable'; // Easy to extract
  } else if (fAsPctOfPot <= 70) {
    feasibility = 'borderline'; // Possible but tough
  } else {
    feasibility = 'very_difficult'; // Hard to extract
  }

  return {
    f: Math.round(f * 100) / 100,
    feasibility,
    fAsPctOfPot: Math.round(fAsPctOfPot * 10) / 10,
    potAfterCall,
  };
}

/**
 * Stack-to-Pot Ratio.
 */
export function spr(remainingStack, potSize) {
  if (potSize <= 0) return Infinity;
  return remainingStack / potSize;
}

/**
 * SPR analysis: what the ratio means for play.
 */
export function analyzeSPR(sprValue) {
  if (sprValue < 1) {
    return { category: 'very_shallow', description: 'Essentially committed to the pot', impliedOdds: 'none' };
  } else if (sprValue <= 3) {
    return { category: 'short', description: 'Limited implied odds available', impliedOdds: 'poor' };
  } else if (sprValue <= 8) {
    return { category: 'medium', description: 'Reasonable implied odds for strong draws', impliedOdds: 'moderate' };
  } else {
    return { category: 'deep', description: 'Excellent implied odds for disguised hands', impliedOdds: 'excellent' };
  }
}

// --- Equity shortcut formulas (for display, not for the engine) ---

/**
 * Rule of 2: outs × 2 (one card to come — always safe, slight underestimate)
 */
export function ruleOf2(outs) {
  return outs * 2;
}

/**
 * Rule of 4: outs × 4 (two cards to come — ONLY valid for ≤8 outs)
 * WARNING: Overestimates at high outs. At 15 outs, says 60% but truth is 54%.
 */
export function ruleOf4(outs) {
  return outs * 4;
}

/**
 * Corrected Rule: 3 × outs + 8 (for ≥9 outs with 2 cards to come)
 * Replaces Rule of 4 for high-out situations.
 */
export function correctedRule(outs) {
  return 3 * outs + 8;
}

/**
 * Exact equity with 1 card to come (turn → river).
 * Equity = outs / 46
 */
export function exactEquity1Card(outs) {
  return outs / 46;
}

/**
 * Exact equity with 2 cards to come (flop → river).
 * Equity = 1 − ((47 − outs) × (46 − outs)) / (47 × 46)
 */
export function exactEquity2Cards(outs) {
  return 1 - ((47 - outs) * (46 - outs)) / (47 * 46);
}

/**
 * Smart equity shortcut: picks the right formula based on outs count
 * and number of cards to come.
 * @param {number} outs
 * @param {number} cardsTocome - 1 (turn to river) or 2 (flop to river)
 * @param {boolean} allIn - true if all money is in (no more betting)
 * @returns {{ estimate, exact, method, warning? }}
 */
export function equityShortcut(outs, cardsToCome, allIn = false) {
  if (cardsToCome === 1 || !allIn) {
    // Use Rule of 2 for 1 card or when there's still betting to come
    const estimate = ruleOf2(outs);
    const exact = exactEquity1Card(outs) * 100;
    return {
      estimate,
      exact: Math.round(exact * 10) / 10,
      method: 'Rule of 2',
      warning: cardsToCome === 2 && !allIn
        ? 'Using 1-card equity because there is still betting on the turn'
        : undefined,
    };
  }

  // 2 cards to come and all money is in
  const exact = exactEquity2Cards(outs) * 100;
  if (outs <= 8) {
    return {
      estimate: ruleOf4(outs),
      exact: Math.round(exact * 10) / 10,
      method: 'Rule of 4',
    };
  }

  // 9+ outs: use corrected rule
  const r4 = ruleOf4(outs);
  return {
    estimate: correctedRule(outs),
    exact: Math.round(exact * 10) / 10,
    method: 'Corrected Rule (3×outs+8)',
    warning: `Rule of 4 would say ${r4}% but actual is ${Math.round(exact * 10) / 10}% — corrected formula is more accurate`,
  };
}

/**
 * Set mining profitability check.
 * Need ~15× the call amount in effective stacks.
 */
export function setMiningCheck(callAmount, effectiveStack) {
  const ratio = effectiveStack / callAmount;
  const profitable = ratio >= 15;
  return {
    ratio: Math.round(ratio * 10) / 10,
    threshold: 15,
    profitable,
    reason: profitable
      ? `Stack depth (${Math.round(ratio)}×) exceeds 15× threshold — set mining is profitable`
      : `Stack depth (${Math.round(ratio)}×) is below 15× threshold — not enough implied odds to set mine`,
  };
}
