// revealMath.test.js — vitest suite for computeRevealMath
// Tests cover: pot-odds sanity, isAllIn regression lock, cleanOuts check,
// Monte Carlo equity ranges, and null-equity guard.

import { describe, it, expect, beforeAll } from 'vitest';
import { scenarios, getScenarioById } from '../../scenarios/index.js';
import { computeRevealMath } from '../revealMath.js';
import { potOdds } from '../math.js';

// ---------------------------------------------------------------------------
// Pre-compute all 15 results once (Monte Carlo × 15 ≈ 80s total).
// All test suites that need results share this cache.
// ---------------------------------------------------------------------------

/** @type {Map<string, ReturnType<computeRevealMath>>} */
const resultCache = new Map();

beforeAll(async () => {
  for (const s of scenarios) {
    resultCache.set(s.id, computeRevealMath(s));
  }
}, 180000); // 3-minute timeout for the full Monte Carlo batch

/** Retrieve a pre-computed result by scenario id. */
function cached(id) {
  const r = resultCache.get(id);
  if (!r) throw new Error(`No cached result for scenario: ${id}`);
  return r;
}

// ---------------------------------------------------------------------------
// 1. Sanity: every scenario runs without throwing + pot-odds formula check
// ---------------------------------------------------------------------------

describe('computeRevealMath — all 15 scenarios', () => {
  it('returns without throwing for every scenario (uses beforeAll cache)', () => {
    // If beforeAll succeeded and populated the cache for all 15, we're good.
    expect(resultCache.size).toBe(15);
    for (const [, result] of resultCache) {
      expect(result).toBeDefined();
    }
  });

  it('potOddsPct equals potOdds(callAmount, pot)*100 for every scenario', () => {
    for (const s of scenarios) {
      const result = cached(s.id);
      const expected = potOdds(s.decision.callAmount, s.decision.pot) * 100;
      expect(result.potOddsPct).toBeCloseTo(expected, 6);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. isAllIn regression lock (hard-asserted from observed values 2026-06-08)
//
//  1  first-pot-odds              → false
//  2  nut-flush-draw              → false
//  3  all-in-coin-flip            → true   (Nadia "shoves all-in for $10,000")
//  4  short-stack-shove           → true   (Luca "shoves all-in for $45,000")
//  5  overcards-no-draw           → false
//  6  stack-depth-kills-implied   → false
//  7  set-mining-math             → false
//  8  monster-draw                → false
//  9  gutshot-short-stack         → false
// 10  overpair-vs-flush           → false
// 11  blockers-3bet-pot           → false
// 12  semi-bluff-raise            → false
// 13  multiway-ak-dilution        → false
// 14  reverse-implied-odds        → false
// 15  tournament-bubble           → false
// ---------------------------------------------------------------------------

describe('isAllIn regression lock', () => {
  const expectedIsAllIn = {
    'first-pot-odds':            false,
    'nut-flush-draw':            false,
    'all-in-coin-flip':          true,
    'short-stack-shove':         true,
    'overcards-no-draw':         false,
    'stack-depth-kills-implied': false,
    'set-mining-math':           false,
    'monster-draw':              false,
    'gutshot-short-stack':       false,
    'overpair-vs-flush':         false,
    'blockers-3bet-pot':         false,
    'semi-bluff-raise':          false,
    'multiway-ak-dilution':      false,
    'reverse-implied-odds':      false,
    'tournament-bubble':         false,
  };

  for (const [id, expected] of Object.entries(expectedIsAllIn)) {
    it(`isAllIn === ${expected} for "${id}"`, () => {
      expect(cached(id).isAllIn).toBe(expected);
    });
  }

  // Spec-required explicit assertions
  it('isAllIn is TRUE for all-in-coin-flip (#3)', () => {
    expect(cached('all-in-coin-flip').isAllIn).toBe(true);
  });

  it('isAllIn is FALSE for nut-flush-draw (#2)', () => {
    expect(cached('nut-flush-draw').isAllIn).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. cleanOuts: first-pot-odds (#1) must equal 6
// ---------------------------------------------------------------------------

describe('cleanOuts', () => {
  it('cleanOuts === 6 for first-pot-odds (As,Kd on Qh,7s,2d flop)', () => {
    expect(cached('first-pot-odds').cleanOuts).toBe(6);
  });

  it('cleanOuts is null when boardLen is 0 (pre-flop scenarios)', () => {
    // Scenarios whose decision occurs before any board cards are shown
    const preFlopIds = [
      'all-in-coin-flip',
      'short-stack-shove',
      'set-mining-math',
      'blockers-3bet-pot',
      'tournament-bubble',
      'stack-depth-kills-implied',
    ];
    for (const id of preFlopIds) {
      const r = cached(id);
      expect(r.boardLen).toBe(0);
      expect(r.cleanOuts).toBeNull();
      expect(r.improveEquity1Pct).toBeNull();
      expect(r.improveEquity2Pct).toBeNull();
    }
  });

  it('cleanOuts is non-null when boardLen is 3 or 4', () => {
    // Scenarios that reach the flop or turn before the decision
    const flopIds = [
      'first-pot-odds',
      'nut-flush-draw',
      'overcards-no-draw',
      'monster-draw',
      'semi-bluff-raise',
      'multiway-ak-dilution',
    ];
    for (const id of flopIds) {
      const r = cached(id);
      expect(r.boardLen).toBeGreaterThanOrEqual(3);
      expect(r.boardLen).toBeLessThanOrEqual(4);
      expect(r.cleanOuts).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// 4. showdownEquityPct — Monte Carlo ranges (±4pp tolerances for randomness)
// ---------------------------------------------------------------------------

describe('showdownEquityPct — Monte Carlo', () => {
  it('all-in-coin-flip (#3): hero equity within ±4pp of 46%', () => {
    const { showdownEquityPct } = cached('all-in-coin-flip');
    expect(showdownEquityPct).not.toBeNull();
    expect(showdownEquityPct).toBeGreaterThan(42);
    expect(showdownEquityPct).toBeLessThan(50);
  });

  it('stack-depth-kills-implied (#6): hero equity within ±4pp of 17%', () => {
    const { showdownEquityPct } = cached('stack-depth-kills-implied');
    expect(showdownEquityPct).not.toBeNull();
    expect(showdownEquityPct).toBeGreaterThan(13);
    expect(showdownEquityPct).toBeLessThan(21);
  });

  it('showdownEquityPct is non-null for all 15 scenarios (all villains have fully specified 2-card hands)', () => {
    // All 15 scenarios in this codebase have fully specified villain hands.
    // villainsKnown must be true and equity must never be null.
    for (const s of scenarios) {
      const r = cached(s.id);
      expect(r.villainsKnown).toBe(true);
      expect(r.showdownEquityPct).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Structural shape: returned object has all required keys with correct types
// ---------------------------------------------------------------------------

describe('return shape', () => {
  it('result has all required keys with correct types for every scenario', () => {
    for (const s of scenarios) {
      const r = cached(s.id);
      expect(typeof r.potOddsPct).toBe('number');
      expect(typeof r.isAllIn).toBe('boolean');
      expect(typeof r.villainsKnown).toBe('boolean');
      // showdownEquityPct: number or null
      expect(r.showdownEquityPct === null || typeof r.showdownEquityPct === 'number').toBe(true);
      expect(typeof r.boardLen).toBe('number');
      // cleanOuts: number or null
      expect(r.cleanOuts === null || typeof r.cleanOuts === 'number').toBe(true);
      // improveEquity1Pct and improveEquity2Pct: null iff cleanOuts is null
      if (r.cleanOuts === null) {
        expect(r.improveEquity1Pct).toBeNull();
        expect(r.improveEquity2Pct).toBeNull();
      } else {
        expect(typeof r.improveEquity1Pct).toBe('number');
        expect(typeof r.improveEquity2Pct).toBe('number');
      }
    }
  });
});
