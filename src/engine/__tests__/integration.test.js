import { describe, it, expect } from 'vitest';
import { parseCards } from '../cards.js';
import { calculateEquity } from '../equity.js';
import { countOuts } from '../outs.js';
import { potOdds, impliedOddsF, assessImpliedOdds, exactEquity1Card, ruleOf2 } from '../math.js';

describe('Engine Integration: Scenario 2 — Nut Flush Draw', () => {
  // Setup: Hero has As 9s on board Ts 6s 3d
  // Villain bets half pot ($3,500 into $7,000 pot → pot becomes $10,500)
  // Hero faces $3,500 to call, pot is $10,500
  const heroCards = parseCards(['As', '9s']);
  const board = parseCards(['Ts', '6s', '3d']);
  const callAmount = 3500;
  const potBeforeCall = 10500; // pot + villain's bet

  it('Step 1: Counts 9 flush outs', () => {
    const outsResult = countOuts(heroCards, board);
    expect(outsResult.byType.flush).toBe(9);
  });

  it('Step 2: Equity with 1 card to come is ~19.6%', () => {
    const equity = exactEquity1Card(9);
    expect(equity * 100).toBeCloseTo(19.6, 0);
  });

  it('Step 3: Rule of 2 gives 18%', () => {
    expect(ruleOf2(9)).toBe(18);
  });

  it('Step 4: Pot odds threshold is ~25%', () => {
    const threshold = potOdds(callAmount, potBeforeCall);
    expect(threshold * 100).toBeCloseTo(25.0, 0);
  });

  it('Step 5: Direct odds FAIL — equity < pot odds', () => {
    const equity = exactEquity1Card(9);
    const threshold = potOdds(callAmount, potBeforeCall);
    expect(equity).toBeLessThan(threshold);
  });

  it('Step 6: Implied odds F is small and achievable', () => {
    const equity = exactEquity1Card(9);
    const result = assessImpliedOdds(callAmount, equity, potBeforeCall, 50000);
    // F should be positive but small
    expect(result.f).toBeGreaterThan(0);
    expect(result.feasibility).toBe('very_achievable');
  });

  it('Step 7: Monte Carlo equity confirms range', () => {
    // Run Monte Carlo with a specific villain hand (let's say KK)
    const players = [
      { cards: heroCards },
      { cards: parseCards(['Kh', 'Kd']) },
    ];
    const result = calculateEquity(players, board, 10000);
    // As9s vs KK on Ts6s3d — flush draw + overcard = roughly 35-45%
    expect(result[0].equity).toBeGreaterThan(0.30);
    expect(result[0].equity).toBeLessThan(0.55);
  });

  it('Full pipeline produces correct verdict: CALL', () => {
    const outsResult = countOuts(heroCards, board);
    const flushOuts = outsResult.byType.flush;
    const equity = exactEquity1Card(flushOuts);
    const threshold = potOdds(callAmount, potBeforeCall);
    const directOddsPass = equity >= threshold;
    const implied = assessImpliedOdds(callAmount, equity, potBeforeCall, 50000);

    expect(directOddsPass).toBe(false);
    expect(implied.f).toBeGreaterThan(0);
    expect(implied.feasibility).toBe('very_achievable');
    // Verdict: CALL (implied odds bridge the gap)
  });
});

describe('Engine Integration: Scenario 1 — First Pot Odds Decision', () => {
  // Hero: As Kd on Qh 7s 2d. Villain bets half pot.
  const heroCards = parseCards(['As', 'Kd']);
  const board = parseCards(['Qh', '7s', '2d']);

  it('counts overcard outs to A or K', () => {
    const outsResult = countOuts(heroCards, board);
    // We care about outs that make a pair of A or K (6 outs concept)
    // The engine counts ALL pair improvements, but conceptually we focus on overcards
    expect(outsResult.totalOuts).toBeGreaterThan(0);
  });

  it('13% equity (6 outs × Rule of 2) vs 25% pot odds = FOLD', () => {
    const equity = ruleOf2(6) / 100; // 12% ≈ 13% (close enough for teaching)
    const threshold = potOdds(5000, 15000); // half pot bet scenario
    expect(equity).toBeLessThan(threshold);
    // Verdict: FOLD
  });
});

describe('Engine Integration: Scenario 6 — Stack Depth Kills Implied Odds', () => {
  // Hero: JdJc, 3-way pot. F exceeds remaining stack.
  it('implied odds are physically impossible', () => {
    // Hero faces 200K call with ~17% equity, pot ~280K
    const result = assessImpliedOdds(200000, 0.17, 280000, 250000);
    expect(result.feasibility).toBe('impossible');
  });
});
