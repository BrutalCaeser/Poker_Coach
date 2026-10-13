/**
 * The generator's promises, checked across hundreds of seeds.
 * If any of these break, the game would teach with an invalid or misleading spot.
 */
import { describe, it, expect } from 'vitest';
import {
  genDrawSpot, genPrice, genDecide, genChain, generate, seedFor, boardIsClean, MIN_MARGIN, mulberry32,
} from '../variation.js';
import { parseCards } from '../../engine/cards.js';
import { evaluate7, HAND_RANKS } from '../../engine/evaluator.js';
import { priceForBet } from '../../lesson/lessonMath.js';

const seeds = (tag, n) => Array.from({ length: n }, (_, i) => seedFor(tag, i));

describe('seeded randomness', () => {
  it('same seed, same spot', () => {
    expect(genDrawSpot(42)).toEqual(genDrawSpot(42));
    expect(genChain(7)).toEqual(genChain(7));
  });

  it('different seeds give different spots', () => {
    const keys = new Set(seeds('uniq', 60).map((s) => genDrawSpot(s).hero.join() + genDrawSpot(s).board.join()));
    expect(keys.size).toBeGreaterThan(55);
  });

  it('mulberry32 stays in [0, 1)', () => {
    const r = mulberry32(1);
    for (let i = 0; i < 1000; i++) {
      const x = r();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe('drawing spots are always valid', () => {
  const spots = seeds('draw', 250).map((s) => genDrawSpot(s));

  it('46 unseen cards, outs between 6 and 21', () => {
    for (const s of spots) {
      expect(s.unseen).toBe(46);
      expect(s.outs).toBeGreaterThanOrEqual(6);
      expect(s.outs).toBeLessThanOrEqual(21);
    }
  });

  it('you are genuinely drawing: high card, no pair yet', () => {
    for (const s of spots) {
      expect(evaluate7(parseCards([...s.hero, ...s.board])).rank).toBe(HAND_RANKS.HIGH_CARD);
    }
  });

  it('the board never completes a hand for everyone', () => {
    for (const s of spots) expect(boardIsClean(parseCards(s.board))).toBe(true);
  });

  it('the read is always a pair of the top board card', () => {
    for (const s of spots) {
      expect(s.pairRank).toBe(Math.max(...parseCards(s.board).map((c) => c.rank)));
    }
  });

  it('teaches a real mix: flush draws, straight draws, and overcards all appear', () => {
    const has = (k) => spots.filter((s) => s.kinds[k]).length;
    expect(has('flush')).toBeGreaterThan(spots.length * 0.15);
    expect(has('straight')).toBeGreaterThan(spots.length * 0.3);
    expect(has('better-pair')).toBeGreaterThan(spots.length * 0.15);
  });

  it('the rule of 2 always lands inside the ±4 grading tolerance', () => {
    for (const s of spots) {
      expect(Math.abs(s.outs * 2 - Math.round(s.chance * 100))).toBeLessThanOrEqual(4);
    }
  });
});

describe('board validity rules', () => {
  it('rejects paired, four-flush and four-to-a-straight boards', () => {
    expect(boardIsClean(parseCards(['9s', '9d', '6c', '2h']))).toBe(false);
    expect(boardIsClean(parseCards(['9s', '2s', '6s', '8s']))).toBe(false);
    expect(boardIsClean(parseCards(['5c', '6d', '7h', '9s']))).toBe(false);
    expect(boardIsClean(parseCards(['Ac', '2d', '3h', '5s']))).toBe(false); // wheel window
    expect(boardIsClean(parseCards(['9s', '2d', '6s', '8h']))).toBe(true);
  });
});

describe('price spots', () => {
  it('price is the call over the FINAL pot, from both seats', () => {
    for (const s of seeds('price', 200)) {
      for (const seat of ['caller', 'bettor']) {
        const v = genPrice(s, seat);
        expect(v.seat).toBe(seat);
        expect(v.price).toBeCloseTo(v.bet / (v.potBeforeBet + 2 * v.bet), 12);
        expect(v.finalPot).toBe(v.potBeforeBet + 2 * v.bet);
        expect(Math.round(v.price * 100)).toBeGreaterThanOrEqual(15);
        expect(Math.round(v.price * 100)).toBeLessThanOrEqual(41);
      }
    }
  });
});

describe('decide spots', () => {
  const vs = seeds('decide', 400).map((s) => genDecide(s, 'caller'));

  it('are always clear: at least 4 points between chance and price', () => {
    for (const v of vs) expect(Math.abs(v.chance - v.price)).toBeGreaterThanOrEqual(MIN_MARGIN);
  });

  it('have a correct answer that matches the comparison', () => {
    for (const v of vs) expect(v.answer).toBe(v.chance > v.price ? 'call' : 'fold');
  });

  it('are balanced, so "always call" cannot pass', () => {
    const calls = vs.filter((v) => v.answer === 'call').length / vs.length;
    expect(calls).toBeGreaterThan(0.4);
    expect(calls).toBeLessThan(0.6);
  });

  it('displayed (rounded) numbers keep the right order', () => {
    for (const v of vs) {
      const c = Math.round(v.chance * 100);
      const p = Math.round(v.price * 100);
      expect(v.answer === 'call' ? c > p : c < p).toBe(true);
    }
  });
});

describe('full-line spots', () => {
  const vs = seeds('chain', 300).map((s) => genChain(s));

  it('are clear and consistent with the engine price', () => {
    for (const v of vs) {
      expect(v.price).toBeCloseTo(priceForBet(v.bet, v.potBeforeBet), 12);
      expect(Math.abs(v.chance - v.price)).toBeGreaterThanOrEqual(MIN_MARGIN);
      expect(v.answer).toBe(v.chance > v.price ? 'call' : 'fold');
    }
  });

  it('are balanced between call and fold (regression: was 81% fold)', () => {
    const calls = vs.filter((v) => v.answer === 'call').length / vs.length;
    expect(calls).toBeGreaterThan(0.4);
    expect(calls).toBeLessThan(0.65);
  });
});

describe('the bettor seat on the same table', () => {
  it('your hand is exactly one pair of the top card, with no clashing cards', async () => {
    const { genHand } = await import('../variation.js');
    const { parseCards } = await import('../../engine/cards.js');
    for (let i = 0; i < 300; i++) {
      const v = genHand(seedFor('bet', i), { seat: 'bettor', balanced: true });
      expect(new Set([...v.made, ...v.drawer, ...v.board]).size).toBe(8);
      const h = evaluate7(parseCards([...v.made, ...v.board]));
      expect(h.rank).toBe(HAND_RANKS.PAIR);
      expect(h.kickers[0]).toBe(v.pairRank);
    }
  });
});

describe('dispatch', () => {
  it('knows every step and rejects unknown ones', () => {
    for (const id of ['outs', 'chance', 'price', 'decide', 'chain']) expect(generate(id, 1, 'caller')).toBeTruthy();
    expect(() => generate('nope', 1)).toThrow();
  });
});
