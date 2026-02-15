// Card system: creation, deck, shuffle, parsing, display

const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const SUITS = ['h', 'd', 'c', 's'];
const RANK_NAMES = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8',
  9: '9', 10: 'T', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};
const RANK_FROM_CHAR = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  't': 10, 'j': 11, 'q': 12, 'k': 13, 'a': 14,
};
const SUIT_SYMBOLS = { h: '\u2665', d: '\u2666', c: '\u2663', s: '\u2660' };
const SUIT_NAMES = { h: 'Hearts', d: 'Diamonds', c: 'Clubs', s: 'Spades' };

export function createCard(rank, suit) {
  return { rank, suit };
}

export function parseCard(str) {
  if (!str || str.length < 2) throw new Error(`Invalid card string: "${str}"`);
  const rankChar = str[0];
  const suitChar = str[str.length - 1].toLowerCase();
  const rank = RANK_FROM_CHAR[rankChar] || parseInt(rankChar);
  if (!rank || rank < 2 || rank > 14) throw new Error(`Invalid rank in "${str}"`);
  if (!SUITS.includes(suitChar)) throw new Error(`Invalid suit in "${str}"`);
  return createCard(rank, suitChar);
}

export function cardToString(card) {
  return `${RANK_NAMES[card.rank]}${card.suit}`;
}

export function cardToDisplay(card) {
  return `${RANK_NAMES[card.rank]}${SUIT_SYMBOLS[card.suit]}`;
}

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(createCard(rank, suit));
    }
  }
  return deck;
}

export function shuffle(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function cardsEqual(a, b) {
  return a.rank === b.rank && a.suit === b.suit;
}

export function removeCards(deck, cardsToRemove) {
  return deck.filter(
    (card) => !cardsToRemove.some((r) => cardsEqual(card, r))
  );
}

export function parseCards(strs) {
  return strs.map(parseCard);
}

export { RANKS, SUITS, RANK_NAMES, SUIT_SYMBOLS, SUIT_NAMES };
