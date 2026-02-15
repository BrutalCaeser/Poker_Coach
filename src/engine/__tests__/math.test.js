import { describe, it, expect } from 'vitest';
import {
  potOdds, evOfCalling, impliedOddsF, assessImpliedOdds,
  spr, analyzeSPR, ruleOf2, ruleOf4, correctedRule,
  exactEquity1Card, exactEquity2Cards, equityShortcut, setMiningCheck,
} from '../math.js';

describe('pot odds', () => {
  it('calculates pot odds correctly', () => {
    // Call $3,500 into pot of $12,000 → 3500/(12000+3500) = 22.6%
    expect(potOdds(3500, 12000)).toBeCloseTo(0.2258, 3);
  });

  it('calculates half-pot bet scenario', () => {
    // Pot is $10,000, villain bets $5,000. New pot = $15,000. Call $5,000.
    // Pot odds = 5000 / (15000 + 5000) = 25%
    expect(potOdds(5000, 15000)).toBeCloseTo(0.25, 3);
  });

  it('returns 0 when call amount is 0', () => {
    expect(potOdds(0, 10000)).toBe(0);
  });
});

describe('EV of calling', () => {
  it('calculates positive EV when equity exceeds pot odds', () => {
    // 40% equity, pot $10,000, call $3,000
    const ev = evOfCalling(0.40, 10000, 3000);
    // EV = 0.40 * (10000 + 3000) - 0.60 * 3000 = 5200 - 1800 = 3400
    expect(ev).toBeCloseTo(3400, 0);
  });

  it('calculates negative EV when equity is below pot odds', () => {
    // 13% equity, pot $10,000, call $5,000
    const ev = evOfCalling(0.13, 10000, 5000);
    // EV = 0.13 * 15000 - 0.87 * 5000 = 1950 - 4350 = -2400
    expect(ev).toBeCloseTo(-2400, 0);
  });
});

describe('implied odds', () => {
  it('calculates F correctly for flush draw scenario', () => {
    // Scenario 2: Call $3,500, equity 19.6%, pot $8,500+$3,500 = $12,000 before call
    // F = (3500 / 0.196) - (12000 + 2*3500) = 17857 - 19000 ≈ -1143
    // Actually recalculating: pot is already including the bet
    // If pot = $8,500 (before bet), bet = $3,500, call = $3,500
    // Pot facing hero = $8,500 + $3,500 = $12,000
    // F = (3500 / 0.196) - (12000 + 2*3500) = 17857 - 19000 = -1143
    // Hmm, let me re-read the spec formula:
    // F = (Call / Equity) - (Pot + 2*Call)
    // where Pot = total pot before hero acts (including villain's bet)
    const f = impliedOddsF(3500, 0.196, 12000);
    expect(f).toBeCloseTo(-1143, -2);
  });

  it('returns positive F when direct odds are insufficient', () => {
    // Call $5,000, equity 15%, pot $10,000
    // F = (5000 / 0.15) - (10000 + 10000) = 33333 - 20000 = 13333
    const f = impliedOddsF(5000, 0.15, 10000);
    expect(f).toBeCloseTo(13333, -2);
  });

  it('returns Infinity for zero equity', () => {
    expect(impliedOddsF(1000, 0, 5000)).toBe(Infinity);
  });
});

describe('assess implied odds', () => {
  it('returns not_needed when F is negative', () => {
    const result = assessImpliedOdds(3500, 0.30, 12000, 50000);
    expect(result.feasibility).toBe('not_needed');
  });

  it('returns impossible when F exceeds remaining stack', () => {
    // Scenario 6: F far exceeds remaining stack
    const result = assessImpliedOdds(200000, 0.17, 280000, 250000);
    expect(result.feasibility).toBe('impossible');
  });

  it('returns very_achievable for small F relative to pot', () => {
    const result = assessImpliedOdds(3500, 0.196, 8500, 50000);
    // F should be small
    expect(result.feasibility).toBe('very_achievable');
  });
});

describe('SPR', () => {
  it('calculates SPR correctly', () => {
    expect(spr(50000, 10000)).toBe(5);
    expect(spr(10000, 10000)).toBe(1);
  });

  it('analyzes SPR categories', () => {
    expect(analyzeSPR(0.5).category).toBe('very_shallow');
    expect(analyzeSPR(2).category).toBe('short');
    expect(analyzeSPR(5).category).toBe('medium');
    expect(analyzeSPR(12).category).toBe('deep');
  });
});

describe('equity shortcuts', () => {
  it('Rule of 2: 9 outs = 18%', () => {
    expect(ruleOf2(9)).toBe(18);
  });

  it('Rule of 4: 8 outs = 32%', () => {
    expect(ruleOf4(8)).toBe(32);
  });

  it('Corrected Rule: 15 outs = 53%', () => {
    expect(correctedRule(15)).toBe(53);
  });

  it('exact equity 1 card: 9 outs = 9/46 ≈ 19.6%', () => {
    expect(exactEquity1Card(9)).toBeCloseTo(9 / 46, 5);
  });

  it('exact equity 2 cards: 9 outs = ~35%', () => {
    const exact = exactEquity2Cards(9);
    expect(exact).toBeCloseTo(0.35, 1);
  });

  it('Rule of 4 overestimates at 15 outs', () => {
    const r4 = ruleOf4(15); // 60%
    const exact = exactEquity2Cards(15) * 100; // ~54%
    expect(r4).toBe(60);
    expect(exact).toBeCloseTo(54.1, 0);
    expect(r4 - exact).toBeGreaterThan(5); // Significant overestimate
  });

  it('Corrected rule is closer to exact at 15 outs', () => {
    const corrected = correctedRule(15); // 53%
    const exact = exactEquity2Cards(15) * 100; // ~54%
    expect(Math.abs(corrected - exact)).toBeLessThan(2);
  });
});

describe('equityShortcut', () => {
  it('uses Rule of 2 for 1 card to come', () => {
    const result = equityShortcut(9, 1);
    expect(result.method).toBe('Rule of 2');
    expect(result.estimate).toBe(18);
  });

  it('uses Rule of 2 with warning when 2 cards but not all-in', () => {
    const result = equityShortcut(9, 2, false);
    expect(result.method).toBe('Rule of 2');
    expect(result.warning).toBeDefined();
  });

  it('uses Rule of 4 for ≤8 outs all-in with 2 cards', () => {
    const result = equityShortcut(8, 2, true);
    expect(result.method).toBe('Rule of 4');
    expect(result.estimate).toBe(32);
  });

  it('uses Corrected Rule for ≥9 outs all-in with 2 cards', () => {
    const result = equityShortcut(15, 2, true);
    expect(result.method).toBe('Corrected Rule (3×outs+8)');
    expect(result.estimate).toBe(53);
    expect(result.warning).toBeDefined(); // Should warn about Rule of 4 overestimate
  });
});

describe('set mining', () => {
  it('profitable when stacks are deep enough', () => {
    // Scenario 7: $1,500 call, $25K stacks → 16.7× > 15×
    const result = setMiningCheck(1500, 25000);
    expect(result.profitable).toBe(true);
    expect(result.ratio).toBeCloseTo(16.7, 0);
  });

  it('unprofitable when stacks are shallow', () => {
    const result = setMiningCheck(5000, 25000);
    // 5× < 15×
    expect(result.profitable).toBe(false);
  });
});
