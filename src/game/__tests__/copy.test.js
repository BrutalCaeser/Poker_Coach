/**
 * Feedback must name real cards correctly and never leak an answer in a hint.
 */
import { describe, it, expect } from 'vitest';
import {
  withArticle, rankPlural, outsFeedback, outsHint, chanceFeedback, chanceHint,
  priceFeedback, priceHint, decideFeedback, readWords,
} from '../copy.js';
import { genDrawSpot, genPrice, seedFor } from '../variation.js';
import { gradeSelection } from '../../lesson/lessonMath.js';

describe('rank words', () => {
  it('uses the right article and plural', () => {
    expect(withArticle(14)).toBe('an ace');
    expect(withArticle(8)).toBe('an eight');
    expect(withArticle(13)).toBe('a king');
    expect(rankPlural(6)).toBe('sixes');
    expect(readWords(9)).toBe('a pair of nines, the top card on the board');
  });
});

describe('outs feedback', () => {
  it('explains every miss and wrong tap by kind, in plain words', () => {
    // Moneymaker's turn: tap the spades and the 7♦ trap.
    const spot = { pairRank: 9 };
    const grade = {
      missedByKind: { straight: ['5h', '5d', '5c', 'Th', 'Td', 'Tc'], 'better-pair': ['Kh', 'Kd', 'Kc'] },
      wrongByKind: { 'small-pair': ['7d'] },
    };
    const text = outsFeedback(grade, spot.pairRank).map((l) => l.text);
    expect(text).toContain('Any ten or five completes a straight.');
    expect(text).toContain('Kings count: a king gives you a pair of kings, which beats his nines.');
    expect(text).toContain('A seven gives you sevens, which lose to his nines.');
  });

  it('never produces an empty sentence for any generated spot', () => {
    for (let i = 0; i < 80; i++) {
      const spot = genDrawSpot(seedFor('fb', i));
      const lines = outsFeedback(gradeSelection(spot.grid, new Set()), spot.pairRank);
      expect(lines.length).toBeGreaterThan(0);
      for (const l of lines) expect(l.text.length).toBeGreaterThan(10);
    }
  });
});

describe('hints teach the method, never this spot’s answer', () => {
  it('outs and chance hints contain no outs count or result', () => {
    for (let i = 0; i < 40; i++) {
      const s = genDrawSpot(seedFor('hint', i));
      expect(outsHint(s.pairRank)).not.toMatch(new RegExp(`\\b${s.outs}\\b`));
      expect(chanceHint(s.unseen)).not.toMatch(new RegExp(`\\b${Math.round(s.chance * 100)}\\b`));
    }
  });

  it('price hint is generic from both seats', () => {
    expect(priceHint('caller')).toMatch(/your call/);
    expect(priceHint('bettor')).toMatch(/his call/);
  });
});

describe('price feedback diagnoses the classic slips', () => {
  const v = { ...genPrice(seedFor('slip', 1)), potBeforeBet: 200_000, bet: 100_000, finalPot: 400_000, seat: 'caller' };

  it('bet measured against the pot (50 instead of 25)', () => {
    expect(priceFeedback({ correct: false, guess: 50, exact: 25, v })).toMatch(/measures the bet against the pot/);
  });

  it('forgot the call itself (33 instead of 25)', () => {
    expect(priceFeedback({ correct: false, guess: 33, exact: 25, v })).toMatch(/not the call itself/);
  });

  it('bettor seat: your bet sets his price', () => {
    expect(priceFeedback({ correct: true, guess: 25, exact: 25, v: { ...v, seat: 'bettor' } })).toMatch(/Your bet sets his price/);
  });
});

describe('chance and decide feedback', () => {
  it('chance names the cards behind the number', () => {
    expect(chanceFeedback({ correct: false, guess: 30, exact: 20, outs: 9, unseen: 46 })).toBe(
      'It’s about 20 in 100: 9 of the 46 cards win. You said 30. With one card to come, each out is worth about 2.'
    );
  });

  it('decide states the comparison and, when missed, the rule', () => {
    const v = { chance: 0.2, price: 0.33, answer: 'fold', seat: 'caller' };
    expect(decideFeedback({ correct: false, v })).toBe('20 is less than 33: folding saves money. Call only when your chance is bigger than your price.');
    expect(decideFeedback({ correct: true, v: { ...v, seat: 'bettor' } })).toMatch(/^Yes\. He wins 20 in 100 and pays 33/);
  });
});

describe('visual cues (the short form shown first)', () => {
  it('outs cues are a card chip plus a few words', async () => {
    const { outsCues } = await import('../copy.js');
    const cues = outsCues(
      {
        missedByKind: { flush: ['2s', '3s'], straight: ['5h', 'Th'], 'better-pair': ['Kh'] },
        wrongByKind: { 'small-pair': ['7d'], 'board-pair': ['8h'], nothing: ['3c'] },
      },
      9
    );
    // Two rows at most: the biggest miss and the biggest trap. The grid marks the rest.
    expect(cues).toEqual([
      { tone: 'missed', cue: '♠', text: 'makes your flush' },
      { tone: 'wrong', cue: '7', text: 'pairs you below his nines' },
    ]);
    for (const c of cues) expect(c.text.split(' ').length).toBeLessThanOrEqual(5);
  });

  it('outs cues fall back in importance order, and vanish on a perfect answer', async () => {
    const { outsCues } = await import('../copy.js');
    expect(outsCues({ missedByKind: { straight: ['5h', 'Th'] }, wrongByKind: { 'board-pair': ['8h'], nothing: ['3c', 'Ad'] } }, 9)).toEqual([
      { tone: 'missed', cue: '10 · 5', text: 'makes your straight' },
      { tone: 'wrong', cue: '8', text: 'pairs the board: helps both' },
    ]);
    expect(outsCues({ missedByKind: {}, wrongByKind: { nothing: ['3c', 'Ad'] } }, 9)).toEqual([
      { tone: 'wrong', cue: 'A · 3', text: 'no help' },
    ]);
    expect(outsCues({ missedByKind: {}, wrongByKind: {} }, 9)).toEqual([]);
  });

  it('price, chance and decide cues are equations, not sentences', async () => {
    const { priceCue, priceSlip, chanceCue, decideCue } = await import('../copy.js');
    const v = { potBeforeBet: 200_000, bet: 100_000, finalPot: 400_000, price: 0.25 };
    expect(priceCue(v)).toBe('100K ÷ 400K');
    expect(priceSlip(50, v)).toBe('Both bets join the pot');
    expect(priceSlip(33, v)).toBe('Count the call too');
    expect(priceSlip(10, v)).toBeNull();
    expect(chanceCue(9)).toBe('9 outs × 2 ≈ 18');
    expect(decideCue({ chance: 0.2, price: 0.33, answer: 'fold' })).toBe('20 < 33 → fold');
  });
});
