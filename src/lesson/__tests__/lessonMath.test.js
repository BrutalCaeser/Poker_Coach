/**
 * The lesson's numbers, locked to exact enumeration.
 * The previous explanation shipped "20 clean outs" for this spot. These tests
 * exist so a wrong count can never ship again.
 */
import { describe, it, expect } from 'vitest';
import {
  priceForBet, breakEvenBet, heroGrid, heroCounts, truthCounts,
  gradeSelection, longRunSequence, classifyCard, money,
} from '../lessonMath.js';
import { parseCards } from '../../engine/cards.js';

const HERO = ['Ks', '7h'];
const VILLAIN = ['Qs', '9h'];
const TURN = ['9s', '2d', '6s', '8s'];

describe('price', () => {
  it('300K into a 210K pot costs 37% of the final pot', () => {
    expect(priceForBet(300_000, 210_000)).toBeCloseTo(300 / 810, 10);
    expect(Math.round(priceForBet(300_000, 210_000) * 100)).toBe(37);
  });

  it('break-even bet for an 18/46 chance is about 378K', () => {
    const b = breakEvenBet(18 / 46, 210_000);
    expect(b).toBeGreaterThan(370_000);
    expect(b).toBeLessThan(385_000);
    expect(priceForBet(b, 210_000)).toBeCloseTo(18 / 46, 10);
  });

  it('price can never reach 50%, so a 50%+ chance never has a break-even bet', () => {
    expect(breakEvenBet(0.5, 210_000)).toBe(Infinity);
  });
});

describe('hero view — 46 unseen cards, read: "he has a pair of nines"', () => {
  const grid = heroGrid(HERO, TURN, 9);
  const counts = heroCounts(grid);

  it('sees 46 unseen cards', () => expect(counts.unseen).toBe(46));

  it('counts 18 winners: 9 spades, 6 straight cards, 3 kings', () => {
    expect(counts.wins).toBe(18);
    const cells = grid.flat().filter((c) => c.wins);
    expect(cells.filter((c) => c.kind === 'flush')).toHaveLength(9);
    expect(cells.filter((c) => c.kind === 'straight')).toHaveLength(6);
    expect(cells.filter((c) => c.kind === 'better-pair')).toHaveLength(3);
  });

  it('a 7 off-suit is a trap: sevens lose to nines', () => {
    const hole = parseCards(HERO), board = parseCards(TURN);
    expect(classifyCard(hole, board, { rank: 7, suit: 'd' }, 9)).toEqual({ kind: 'small-pair', wins: false });
    expect(classifyCard(hole, board, { rank: 7, suit: 's' }, 9).wins).toBe(true); // 7♠ is a flush
  });

  it('a card that pairs the board does not beat a pair of nines', () => {
    const hole = parseCards(HERO), board = parseCards(TURN);
    expect(classifyCard(hole, board, { rank: 8, suit: 'h' }, 9).kind).toBe('board-pair');
  });

  it('keeps seen cards in place as ghost slots (4 × 13 grid)', () => {
    expect(grid).toHaveLength(4);
    grid.forEach((row) => expect(row).toHaveLength(13));
    expect(grid.flat().filter((c) => c.seen)).toHaveLength(6);
  });
});

describe('truth — his real hand, Q♠ 9♥', () => {
  const t = truthCounts(HERO, VILLAIN, TURN);

  it('17 of 44 river cards win, no ties (38.6%)', () => {
    expect(t.unseen).toBe(44);
    expect(t.wins).toBe(17);
    expect(t.ties).toBe(0);
    expect(t.equity).toBeCloseTo(17 / 44, 10);
  });

  it('the only hero-view winner that vanishes is the Q♠ in his hand', () => {
    const heroWinners = new Set(heroCounts(heroGrid(HERO, TURN, 9)).winners);
    const lost = [...heroWinners].filter((c) => !t.winners.includes(c));
    expect(lost).toEqual(['Qs']);
  });

  it('still clears the 37% price', () => {
    expect(t.equity).toBeGreaterThan(priceForBet(300_000, 210_000));
  });
});

describe('grading taps', () => {
  const grid = heroGrid(HERO, TURN, 9);

  it('explains misses and wrong taps by kind', () => {
    const spades = ['2s', '3s', '4s', '5s', '7s', 'Ts', 'Js', 'Qs', 'As'];
    const g = gradeSelection(grid, new Set([...spades, '7d']));
    expect(g.found).toBe(9);
    expect(g.total).toBe(18);
    expect(g.missedByKind.straight).toHaveLength(6);
    expect(g.missedByKind['better-pair']).toEqual(['Kh', 'Kd', 'Kc']);
    expect(g.wrongByKind['small-pair']).toEqual(['7d']);
    expect(g.perfect).toBe(false);
  });

  it('a perfect count is recognised', () => {
    const all = new Set(heroCounts(grid).winners);
    expect(gradeSelection(grid, all).perfect).toBe(true);
  });
});

describe('long run', () => {
  it('spreads exactly `wins` wins through 100 plays', () => {
    const seq = longRunSequence(39, 100);
    expect(seq).toHaveLength(100);
    expect(seq.filter(Boolean)).toHaveLength(39);
  });
});

describe('money formatting', () => {
  it('formats K and M compactly', () => {
    expect(money(300_000)).toBe('300K');
    expect(money(1_590_000)).toBe('1.59M');
    expect(money(-300_000)).toBe('−300K');
  });
});
