import { describe, it, expect } from 'vitest';
import { evaluate5, evaluate7, compareHands, handName, HAND_RANKS } from '../evaluator.js';
import { parseCards } from '../cards.js';

describe('evaluator', () => {
  describe('evaluate5', () => {
    it('detects high card', () => {
      const cards = parseCards(['Ah', '9s', '7d', '5c', '2h']);
      const result = evaluate5(cards);
      expect(result.rank).toBe(HAND_RANKS.HIGH_CARD);
      expect(result.kickers).toEqual([14, 9, 7, 5, 2]);
    });

    it('detects pair', () => {
      const cards = parseCards(['Ah', 'Ad', '9s', '7c', '2h']);
      const result = evaluate5(cards);
      expect(result.rank).toBe(HAND_RANKS.PAIR);
      expect(result.kickers[0]).toBe(14); // pair rank
    });

    it('detects two pair', () => {
      const cards = parseCards(['Ah', 'Ad', '9s', '9c', '2h']);
      const result = evaluate5(cards);
      expect(result.rank).toBe(HAND_RANKS.TWO_PAIR);
      expect(result.kickers).toEqual([14, 9, 2]);
    });

    it('detects three of a kind', () => {
      const cards = parseCards(['Ah', 'Ad', 'Ac', '9s', '2h']);
      const result = evaluate5(cards);
      expect(result.rank).toBe(HAND_RANKS.THREE_OF_A_KIND);
      expect(result.kickers[0]).toBe(14);
    });

    it('detects straight', () => {
      const cards = parseCards(['9h', '8d', '7c', '6s', '5h']);
      const result = evaluate5(cards);
      expect(result.rank).toBe(HAND_RANKS.STRAIGHT);
      expect(result.kickers).toEqual([9]);
    });

    it('detects ace-high straight', () => {
      const cards = parseCards(['Ah', 'Kd', 'Qc', 'Js', 'Th']);
      const result = evaluate5(cards);
      expect(result.rank).toBe(HAND_RANKS.STRAIGHT);
      expect(result.kickers).toEqual([14]);
    });

    it('detects wheel (A-2-3-4-5)', () => {
      const cards = parseCards(['Ah', '2d', '3c', '4s', '5h']);
      const result = evaluate5(cards);
      expect(result.rank).toBe(HAND_RANKS.STRAIGHT);
      expect(result.kickers).toEqual([5]); // 5-high straight
    });

    it('detects flush', () => {
      const cards = parseCards(['Ah', 'Kh', '9h', '6h', '2h']);
      const result = evaluate5(cards);
      expect(result.rank).toBe(HAND_RANKS.FLUSH);
      expect(result.kickers).toEqual([14, 13, 9, 6, 2]);
    });

    it('detects full house', () => {
      const cards = parseCards(['Ah', 'Ad', 'Ac', 'Ks', 'Kh']);
      const result = evaluate5(cards);
      expect(result.rank).toBe(HAND_RANKS.FULL_HOUSE);
      expect(result.kickers).toEqual([14, 13]);
    });

    it('detects four of a kind', () => {
      const cards = parseCards(['Ah', 'Ad', 'Ac', 'As', '2h']);
      const result = evaluate5(cards);
      expect(result.rank).toBe(HAND_RANKS.FOUR_OF_A_KIND);
      expect(result.kickers).toEqual([14, 2]);
    });

    it('detects straight flush', () => {
      const cards = parseCards(['9h', '8h', '7h', '6h', '5h']);
      const result = evaluate5(cards);
      expect(result.rank).toBe(HAND_RANKS.STRAIGHT_FLUSH);
      expect(result.kickers).toEqual([9]);
    });

    it('detects royal flush (ace-high straight flush)', () => {
      const cards = parseCards(['Ah', 'Kh', 'Qh', 'Jh', 'Th']);
      const result = evaluate5(cards);
      expect(result.rank).toBe(HAND_RANKS.STRAIGHT_FLUSH);
      expect(result.kickers).toEqual([14]);
    });

    it('detects wheel straight flush', () => {
      const cards = parseCards(['Ah', '2h', '3h', '4h', '5h']);
      const result = evaluate5(cards);
      expect(result.rank).toBe(HAND_RANKS.STRAIGHT_FLUSH);
      expect(result.kickers).toEqual([5]);
    });
  });

  describe('compareHands', () => {
    it('higher rank wins', () => {
      const pair = evaluate5(parseCards(['Ah', 'Ad', '9s', '7c', '2h']));
      const trips = evaluate5(parseCards(['Ah', 'Ad', 'Ac', '7s', '2h']));
      expect(compareHands(trips, pair)).toBeGreaterThan(0);
    });

    it('same rank compares kickers', () => {
      const pairA = evaluate5(parseCards(['Ah', 'Ad', '9s', '7c', '2h']));
      const pairK = evaluate5(parseCards(['Kh', 'Kd', '9s', '7c', '2h']));
      expect(compareHands(pairA, pairK)).toBeGreaterThan(0);
    });

    it('exact tie returns 0', () => {
      const h1 = evaluate5(parseCards(['Ah', 'Kd', '9s', '7c', '2h']));
      const h2 = evaluate5(parseCards(['As', 'Kc', '9h', '7d', '2s']));
      expect(compareHands(h1, h2)).toBe(0);
    });

    it('two pair tiebreak by high pair then low pair then kicker', () => {
      const tp1 = evaluate5(parseCards(['Ah', 'Ad', '9s', '9c', '2h']));
      const tp2 = evaluate5(parseCards(['Ah', 'Ad', '8s', '8c', '2h']));
      expect(compareHands(tp1, tp2)).toBeGreaterThan(0);
    });
  });

  describe('evaluate7', () => {
    it('finds best hand from 7 cards', () => {
      // 7 cards: should find the flush
      const cards = parseCards(['Ah', 'Kh', '9h', '6h', '2h', 'Qs', '3d']);
      const result = evaluate7(cards);
      expect(result.rank).toBe(HAND_RANKS.FLUSH);
    });

    it('finds full house from 7 cards', () => {
      const cards = parseCards(['Ah', 'Ad', 'Ac', 'Ks', 'Kh', '7d', '3c']);
      const result = evaluate7(cards);
      expect(result.rank).toBe(HAND_RANKS.FULL_HOUSE);
      expect(result.kickers).toEqual([14, 13]);
    });

    it('picks the best straight from multiple possible', () => {
      // 6-7-8-9-T-J should pick J-high straight
      const cards = parseCards(['Jh', 'Td', '9c', '8s', '7h', '6d', '2c']);
      const result = evaluate7(cards);
      expect(result.rank).toBe(HAND_RANKS.STRAIGHT);
      expect(result.kickers).toEqual([11]); // J-high
    });

    it('works with exactly 5 cards', () => {
      const cards = parseCards(['Ah', 'Kh', 'Qh', 'Jh', 'Th']);
      const result = evaluate7(cards);
      expect(result.rank).toBe(HAND_RANKS.STRAIGHT_FLUSH);
    });

    it('finds best hand in a real scenario', () => {
      // Hero: As Ks, Board: Qh 7s 2d (Scenario 1 from spec)
      // AK high with no pair
      const cards = parseCards(['As', 'Kd', 'Qh', '7s', '2d']);
      const result = evaluate7(cards);
      expect(result.rank).toBe(HAND_RANKS.HIGH_CARD);
      expect(result.kickers[0]).toBe(14); // Ace high
    });

    it('throws for fewer than 5 cards', () => {
      expect(() => evaluate7(parseCards(['Ah', 'Kh', 'Qh']))).toThrow();
    });
  });

  describe('handName', () => {
    it('returns correct names', () => {
      expect(handName({ rank: 0 })).toBe('High Card');
      expect(handName({ rank: 4 })).toBe('Straight');
      expect(handName({ rank: 8 })).toBe('Straight Flush');
    });
  });
});
