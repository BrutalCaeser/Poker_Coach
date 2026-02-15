import { describe, it, expect } from 'vitest';
import { calculateEquity } from '../equity.js';
import { parseCards } from '../cards.js';

describe('equity calculator', () => {
  it('AA vs KK preflop is approximately 82/18', () => {
    const players = [
      { cards: parseCards(['Ah', 'As']) },
      { cards: parseCards(['Kh', 'Ks']) },
    ];
    const result = calculateEquity(players, [], 15000);
    // AA vs KK is ~82% vs ~18%
    expect(result[0].equity).toBeCloseTo(0.82, 1);
    expect(result[1].equity).toBeCloseTo(0.18, 1);
  });

  it('AKs vs QQ preflop is approximately 46/54', () => {
    const players = [
      { cards: parseCards(['As', 'Ks']) },
      { cards: parseCards(['Qh', 'Qd']) },
    ];
    const result = calculateEquity(players, [], 15000);
    // AKs vs QQ is roughly 46% vs 54%
    expect(result[0].equity).toBeCloseTo(0.46, 1);
    expect(result[1].equity).toBeCloseTo(0.54, 1);
  });

  it('equities sum to approximately 1.0', () => {
    const players = [
      { cards: parseCards(['Ah', 'Kh']) },
      { cards: parseCards(['Qs', 'Qd']) },
    ];
    const result = calculateEquity(players, [], 10000);
    const sum = result.reduce((s, r) => s + r.equity, 0);
    expect(sum).toBeCloseTo(1.0, 1);
  });

  it('handles a flop board correctly', () => {
    // A9s on Ts6s3d — flush draw situation (Scenario 2)
    const players = [
      { cards: parseCards(['As', '9s']) },
      { cards: parseCards(['Kh', 'Kd']) }, // Opponent has KK
    ];
    const board = parseCards(['Ts', '6s', '3d']);
    const result = calculateEquity(players, board, 15000);
    // With 9 flush outs + overcards, equity should be around 40-50%
    expect(result[0].equity).toBeGreaterThan(0.30);
    expect(result[0].equity).toBeLessThan(0.60);
  });

  it('handles fully dealt board (river)', () => {
    // Known board, known hands — should be deterministic-ish
    const players = [
      { cards: parseCards(['Ah', 'Kh']) },
      { cards: parseCards(['Qs', 'Qd']) },
    ];
    const board = parseCards(['Qh', 'Jh', 'Th', '2s', '3c']);
    // AK has a royal flush, QQ has trips — AK should win 100%
    const result = calculateEquity(players, board, 1000);
    expect(result[0].equity).toBe(1.0);
    expect(result[1].equity).toBe(0.0);
  });

  it('handles 3-player scenario', () => {
    const players = [
      { cards: parseCards(['Jd', 'Jc']) },
      { cards: parseCards(['Ah', 'Kh']) },
      { cards: parseCards(['Qs', 'Qd']) },
    ];
    const result = calculateEquity(players, [], 10000);
    const sum = result.reduce((s, r) => s + r.equity, 0);
    expect(sum).toBeCloseTo(1.0, 1);
    // All three should have meaningful equity
    result.forEach((r) => expect(r.equity).toBeGreaterThan(0.1));
  });

  it('handles unknown player hands', () => {
    const players = [
      { cards: parseCards(['Ah', 'As']) },
      { cards: null }, // random hand
    ];
    const result = calculateEquity(players, [], 10000);
    // AA vs random should be ~85%
    expect(result[0].equity).toBeGreaterThan(0.75);
    expect(result[0].equity).toBeLessThan(0.92);
  });

  it('throws with fewer than 2 players', () => {
    expect(() => calculateEquity([{ cards: parseCards(['Ah', 'As']) }])).toThrow();
  });
});
