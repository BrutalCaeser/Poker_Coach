/**
 * Table Component
 * ===============
 * Oval poker table with green felt background.
 * Renders player positions around the table (2-6 players),
 * community cards in the center, and pot amount in gold monospace.
 * Hero position is always at the bottom, prominent.
 *
 * @param {Object} props
 * @param {Array}  props.players    - Array of player objects from the scenario
 * @param {number} props.heroIndex  - Index of the hero player
 * @param {Array}  props.board      - Array of board card strings currently dealt
 * @param {number} props.pot        - Current pot size
 * @param {boolean} [props.revealAll=false] - Whether to show all player cards face-up
 */
import Card from './Card.jsx';
import './Table.css';

/**
 * Format a number as a dollar amount (e.g., 12500 → "$12,500")
 */
function formatAmount(amount) {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${amount.toLocaleString()}`;
  }
  return `$${amount}`;
}

/**
 * Reorder players so hero is always last in the array (bottom of table).
 * Returns { ordered, heroSeatIndex } where heroSeatIndex is the index in
 * the ordered array.
 */
function reorderPlayers(players, heroIndex) {
  const n = players.length;
  const ordered = [];
  // Start from the player after hero and wrap around
  for (let i = 1; i <= n; i++) {
    const idx = (heroIndex + i) % n;
    ordered.push({ ...players[idx], originalIndex: idx });
  }
  // Hero is last (bottom of table)
  return ordered;
}

export default function Table({
  players,
  heroIndex,
  board = [],
  pot = 0,
  revealAll = false,
}) {
  const numPlayers = players.length;
  const orderedPlayers = reorderPlayers(players, heroIndex);
  const tableClass = `table table--${numPlayers}`;

  return (
    <div className="table-container">
      <div className={tableClass}>
        {/* Player seats */}
        {orderedPlayers.map((player, seatIdx) => {
          const isHero = player.originalIndex === heroIndex;
          const hasCards = player.cards && player.cards.length > 0;
          const showCards = isHero || revealAll;
          const cardSize = isHero ? 'lg' : 'sm';

          return (
            <div
              key={seatIdx}
              className={`table__seat ${isHero ? 'table__seat--hero' : ''}`}
            >
              {/* Cards above info for top seats, below for hero */}
              {!isHero && (
                <div className="seat__cards">
                  {hasCards && showCards ? (
                    player.cards.map((cardStr, i) => (
                      <Card
                        key={i}
                        card={cardStr}
                        faceUp={true}
                        size={cardSize}
                      />
                    ))
                  ) : (
                    <>
                      <Card faceUp={false} size={cardSize} />
                      <Card faceUp={false} size={cardSize} />
                    </>
                  )}
                </div>
              )}

              <div className={`seat__info ${isHero ? 'seat__info--hero' : ''}`}>
                <span className={`seat__name ${isHero ? 'seat__name--hero' : ''}`}>
                  {player.name}
                </span>
                <span className="seat__stack">{formatAmount(player.stack)}</span>
                <span className="seat__position">{player.position}</span>
              </div>

              {isHero && (
                <div className="seat__cards">
                  {hasCards ? (
                    player.cards.map((cardStr, i) => (
                      <Card
                        key={i}
                        card={cardStr}
                        faceUp={true}
                        size={cardSize}
                        dealing={true}
                      />
                    ))
                  ) : (
                    <>
                      <Card faceUp={false} size={cardSize} />
                      <Card faceUp={false} size={cardSize} />
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Center: board cards + pot */}
        <div className="table__center">
          <div className="table__board">
            {board.map((cardStr, i) => (
              <Card
                key={i}
                card={cardStr}
                faceUp={true}
                size="md"
                dealing={true}
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
          {pot > 0 && (
            <div className="table__pot anim-chips">
              Pot: {formatAmount(pot)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
