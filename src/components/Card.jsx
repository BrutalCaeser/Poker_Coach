/**
 * Card Component
 * ==============
 * Renders a single playing card — face-up or face-down.
 *
 * Face-up: rank + colored suit on cream background with shadow & rounded corners.
 * Face-down: dark blue back with subtle diagonal pattern.
 *
 * Size variants: 'lg' (hero), 'md' (board), 'sm' (opponent), 'xs' (mini).
 *
 * @param {Object} props
 * @param {string} [props.rank]   - Rank character: 'A','K','Q','J','T','9'...'2'
 * @param {string} [props.suit]   - Suit character: 'h','d','c','s'
 * @param {boolean} [props.faceUp=true] - Whether the card is face-up
 * @param {string} [props.size='md']    - Size variant: 'lg','md','sm','xs'
 * @param {boolean} [props.dealing=false] - Animate the card dealing in
 * @param {string} [props.className]    - Additional CSS class names
 */
import './Card.css';

const SUIT_SYMBOLS = {
  h: '♥',
  d: '♦',
  c: '♣',
  s: '♠',
};

const SUIT_NAMES = {
  h: 'hearts',
  d: 'diamonds',
  c: 'clubs',
  s: 'spades',
};

const RANK_DISPLAY = {
  'A': 'A', 'K': 'K', 'Q': 'Q', 'J': 'J', 'T': '10',
  '9': '9', '8': '8', '7': '7', '6': '6', '5': '5',
  '4': '4', '3': '3', '2': '2',
};

/**
 * Parse a card string like "Ah" into { rank, suit }.
 */
function parseCardString(cardStr) {
  if (!cardStr || cardStr.length < 2) return null;
  const rank = cardStr[0].toUpperCase();
  const suit = cardStr[cardStr.length - 1].toLowerCase();
  if (!RANK_DISPLAY[rank] || !SUIT_SYMBOLS[suit]) return null;
  return { rank, suit };
}

export default function Card({
  rank,
  suit,
  card: cardStr,
  faceUp = true,
  size = 'md',
  dealing = false,
  className = '',
  style,
}) {
  // Support either rank+suit props or a card string like "Ah"
  let r = rank;
  let s = suit;
  if (cardStr && !r) {
    const parsed = parseCardString(cardStr);
    if (parsed) {
      r = parsed.rank;
      s = parsed.suit;
    }
  }

  const sizeClass = `card--${size}`;
  const suitClass = s && faceUp ? `card--${SUIT_NAMES[s]}` : '';
  const faceClass = faceUp ? 'card--face-up' : 'card--face-down';
  const dealClass = dealing ? 'card--dealing' : '';

  const classes = [
    'card',
    sizeClass,
    faceClass,
    suitClass,
    dealClass,
    className,
  ].filter(Boolean).join(' ');

  if (!faceUp) {
    return (
      <div
        className={classes}
        role="img"
        aria-label="Face-down card"
        style={style}
      />
    );
  }

  const rankDisplay = RANK_DISPLAY[r] || r;
  const suitSymbol = SUIT_SYMBOLS[s] || '';
  const suitLabel = SUIT_NAMES[s] || '';
  const ariaLabel = `${rankDisplay} of ${suitLabel}`;

  return (
    <div
      className={classes}
      role="img"
      aria-label={ariaLabel}
      style={style}
    >
      {/* Top-left corner pip */}
      <div className="card__corner card__corner--tl">
        <span className="card__corner-rank">{rankDisplay}</span>
        <span className="card__corner-suit">{suitSymbol}</span>
      </div>

      {/* Center content */}
      <div className="card__content">
        <span className="card__rank">{rankDisplay}</span>
        <span className="card__suit">{suitSymbol}</span>
      </div>

      {/* Bottom-right corner pip (rotated 180°) */}
      <div className="card__corner card__corner--br">
        <span className="card__corner-rank">{rankDisplay}</span>
        <span className="card__corner-suit">{suitSymbol}</span>
      </div>
    </div>
  );
}
