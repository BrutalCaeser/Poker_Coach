import { describe, it, expect } from 'vitest';
import {
  createCard, parseCard, cardToString, cardToDisplay,
  createDeck, shuffle, cardsEqual, removeCards, parseCards,
} from '../cards.js';

describe('cards', () => {
  describe('createCard', () => {
    it('creates a card with rank and suit', () => {
      const card = createCard(14, 'h');
      expect(card).toEqual({ rank: 14, suit: 'h' });
    });
  });

  describe('parseCard', () => {
    it('parses face cards', () => {
      expect(parseCard('Ah')).toEqual({ rank: 14, suit: 'h' });
      expect(parseCard('Ks')).toEqual({ rank: 13, suit: 's' });
      expect(parseCard('Qd')).toEqual({ rank: 12, suit: 'd' });
      expect(parseCard('Jc')).toEqual({ rank: 11, suit: 'c' });
      expect(parseCard('Ts')).toEqual({ rank: 10, suit: 's' });
    });

    it('parses number cards', () => {
      expect(parseCard('2h')).toEqual({ rank: 2, suit: 'h' });
      expect(parseCard('9s')).toEqual({ rank: 9, suit: 's' });
    });

    it('handles uppercase suit chars', () => {
      expect(parseCard('AH')).toEqual({ rank: 14, suit: 'h' });
    });

    it('throws on invalid input', () => {
      expect(() => parseCard('')).toThrow();
      expect(() => parseCard('X')).toThrow();
      expect(() => parseCard('1x')).toThrow();
    });
  });

  describe('cardToString', () => {
    it('converts card back to string', () => {
      expect(cardToString({ rank: 14, suit: 'h' })).toBe('Ah');
      expect(cardToString({ rank: 10, suit: 's' })).toBe('Ts');
      expect(cardToString({ rank: 2, suit: 'd' })).toBe('2d');
    });
  });

  describe('cardToDisplay', () => {
    it('uses suit symbols', () => {
      expect(cardToDisplay({ rank: 14, suit: 'h' })).toBe('A\u2665');
      expect(cardToDisplay({ rank: 13, suit: 's' })).toBe('K\u2660');
    });
  });

  describe('createDeck', () => {
    it('creates 52 cards', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(52);
    });

    it('has no duplicates', () => {
      const deck = createDeck();
      const strs = deck.map(cardToString);
      expect(new Set(strs).size).toBe(52);
    });

    it('contains all ranks and suits', () => {
      const deck = createDeck();
      const hasAceHearts = deck.some((c) => c.rank === 14 && c.suit === 'h');
      const has2Clubs = deck.some((c) => c.rank === 2 && c.suit === 'c');
      expect(hasAceHearts).toBe(true);
      expect(has2Clubs).toBe(true);
    });
  });

  describe('shuffle', () => {
    it('returns 52 cards', () => {
      const deck = createDeck();
      const shuffled = shuffle(deck);
      expect(shuffled).toHaveLength(52);
    });

    it('does not mutate original', () => {
      const deck = createDeck();
      const original = [...deck];
      shuffle(deck);
      expect(deck).toEqual(original);
    });

    it('contains all original cards', () => {
      const deck = createDeck();
      const shuffled = shuffle(deck);
      const sortFn = (a, b) => a.rank - b.rank || a.suit.localeCompare(b.suit);
      expect([...shuffled].sort(sortFn)).toEqual([...deck].sort(sortFn));
    });
  });

  describe('cardsEqual', () => {
    it('returns true for matching cards', () => {
      expect(cardsEqual({ rank: 14, suit: 'h' }, { rank: 14, suit: 'h' })).toBe(true);
    });
    it('returns false for different cards', () => {
      expect(cardsEqual({ rank: 14, suit: 'h' }, { rank: 14, suit: 's' })).toBe(false);
    });
  });

  describe('removeCards', () => {
    it('removes specified cards from deck', () => {
      const deck = createDeck();
      const toRemove = parseCards(['Ah', 'Ks']);
      const remaining = removeCards(deck, toRemove);
      expect(remaining).toHaveLength(50);
      expect(remaining.some((c) => c.rank === 14 && c.suit === 'h')).toBe(false);
    });
  });

  describe('parseCards', () => {
    it('parses an array of card strings', () => {
      const cards = parseCards(['Ah', 'Ks', '2d']);
      expect(cards).toHaveLength(3);
      expect(cards[0]).toEqual({ rank: 14, suit: 'h' });
      expect(cards[2]).toEqual({ rank: 2, suit: 'd' });
    });
  });
});
