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
 * @param {string}  [props.venue]          - Venue theme: "wsop" | "tournament" | (default)
 */
import Card from './Card.jsx';
import PlayerAvatar from './PlayerAvatar.jsx';
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
  venue,
}) {
  const numPlayers = players.length;
  const orderedPlayers = reorderPlayers(players, heroIndex);
  // Venue CSS modifier class e.g. "table--venue-wsop", "table--venue-tournament"
  const venueClass = venue ? ` table--venue-${venue}` : '';
  const tableClass = `table table--${numPlayers}${venueClass}`;

  return (
    <div className="table-container">
      <div className={tableClass}>
        {/* Player seats */}
        {orderedPlayers.map((player, seatIdx) => {
          const isHero = player.originalIndex === heroIndex;
          const hasCards = player.cards && player.cards.length > 0;
          const showCards = isHero || revealAll;
          const cardSize = isHero ? 'lg' : 'sm';

          // Keyboard a11y: tabIndex + aria-describedby live on .table__seat
          // (the element whose :focus-within reveals the tooltip), not on seat__info.
          return (
            <div
              key={seatIdx}
              className={`table__seat ${isHero ? 'table__seat--hero' : ''}${player.isPro ? ' table__seat--pro' : ''}`}
              tabIndex={!isHero && player.behaviour ? 0 : undefined}
              aria-describedby={
                !isHero && player.behaviour
                  ? `behaviour-${seatIdx}`
                  : undefined
              }
            >
              {/* Cards above avatar+info for opponent seats */}
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

              {/* Avatar portrait / hero ring */}
              <PlayerAvatar
                name={player.name}
                avatarId={player.avatarId}
                isPro={player.isPro}
                country={player.country}
                behaviour={player.behaviour}
                era={player.era}
                isHero={isHero}
              />

              {/*
               * Seat info chip — stack, position, behaviour tooltip.
               * For pro seats the name is rendered inside PlayerAvatar;
               * we still show the stack + position here for quick scanning.
               */}
              <div
                className={`seat__info ${isHero ? 'seat__info--hero' : ''}${player.isPro ? ' seat__info--pro' : ''}`}
              >
                {/* Name shown in chip only for non-pro seats (pro shows it in the medallion) */}
                {!player.isPro && (
                  <span className={`seat__name ${isHero ? 'seat__name--hero' : ''}`}>
                    {player.name}
                  </span>
                )}
                <span className="seat__stack">{formatAmount(player.stack)}</span>
                <span className="seat__position">{player.position}</span>
                {!isHero && player.behaviour && (
                  <span
                    id={`behaviour-${seatIdx}`}
                    className="seat__behaviour"
                    role="tooltip"
                  >
                    {player.behaviour}
                  </span>
                )}
              </div>

              {/* Hero cards below the avatar+info */}
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
