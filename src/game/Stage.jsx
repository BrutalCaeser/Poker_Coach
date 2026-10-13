/**
 * Stage — the table. It never moves.
 * ==================================
 * Every step happens on the same felt, in the same four places, so the player
 * never has to re-find anything (the board-never-moves rule of chess trainers):
 *
 *   his seat   (top)       what you have to beat
 *   the river  (slot 5)    YOUR CHANCE: the card still to come
 *   the pot    (centre)    YOUR PRICE: your slice of it
 *   your seat  (bottom)    your hand, and your decision
 *
 * A step only changes which place is lit and what it shows. Geometry is fixed:
 * the river slot, the pot ring and both seats keep their size on every screen.
 *
 * His hand is never drawn as cards you can read. His two hole cards stay face
 * down (unknown), and what we ASSUME he has is a separate dashed "Our read" tag,
 * with the board card that makes his pair ringed to match. Two ghost "9 9"
 * cards used to read as pocket nines; the read is about his best hand, which
 * here is made WITH the board.
 */
import { Card, PotRing } from '../lesson/parts.jsx';

function CardBack({ size = 'sm' }) {
  return (
    <span className={`lx-card lx-card--${size} is-down`} role="img" aria-label="His card, face down">
      <span className="lx-card__inner">
        <span className="lx-card__back" />
      </span>
    </span>
  );
}

function River({ river, cls = '' }) {
  const filled = river && river.value != null;
  const long = filled && String(river.value).length > 3;
  return (
    <span
      className={`gx-river${filled ? ' is-filled' : ''}${long ? ' is-long' : ''}${river?.tone ? ` is-${river.tone}` : ''}${cls}`}
      data-zone="river"
      role="img"
      aria-label={river?.aria ?? 'The river: one card to come'}
    >
      {filled ? (
        <>
          <span className="gx-river__n">{river.value}</span>
          {river.sub && <span className="gx-river__sub">{river.sub}</span>}
        </>
      ) : (
        <span className="gx-river__q" aria-hidden="true">?</span>
      )}
    </span>
  );
}

/**
 * @param him    { read, chip }            read = our assumption about his best hand
 * @param you    { cards, chip }
 * @param board  four card ids
 * @param readRank  rank of the board card his read pairs with (ringed)
 * @param river  { value, sub, tone, aria } | null
 * @param pot    PotRing props
 * @param lit    the place where this step's answer lands (gets the glow)
 * @param dim    places not needed for this step (fade back, never vanish)
 */
export default function Stage({ him, you, board, readRank, river, pot, lit, dim = [] }) {
  const zone = (name) => `${lit === name ? ' is-lit' : ''}${dim.includes(name) ? ' is-dim' : ''}`;
  return (
    <div className="gx-stage">
      <div className={`gx-seat gx-seat--him${zone('him')}`} data-zone="him">
        <span className="gx-seat__cards">
          <CardBack />
          <CardBack />
        </span>
        <span className="gx-seat__meta">
          <span className="gx-seat__name">
            Him{him.chip && <span className="gx-seat__bet"> · {him.chip}</span>}
          </span>
          {him.read && (
            <span className="gx-read" aria-label={`Our read: ${him.read}`}>
              <span className="gx-read__k">Our read</span>
              <span className="gx-read__v">{him.read}</span>
            </span>
          )}
        </span>
      </div>

      <div className="gx-board" aria-label="Board">
        {board.map((c) => (
          <span key={c} className={`gx-bcard${readRank && rankOf(c) === readRank ? ' is-read' : ''}`}>
            <Card card={c} size="md" />
          </span>
        ))}
        <River river={river} cls={zone('river')} />
      </div>

      <div className={`gx-pot${zone('pot')}`} data-zone="pot">
        <PotRing size={80} stroke={8} {...pot} />
      </div>

      <div className={`gx-seat gx-seat--you${zone('you')}`} data-zone="you">
        <span className="gx-seat__cards">
          {you.cards.map((c) => <Card key={c} card={c} size="md" />)}
        </span>
        <span className="gx-seat__meta">
          <span className="gx-seat__name gx-seat__name--you">
            You{you.chip && <span className="gx-seat__bet"> · {you.chip}</span>}
          </span>
        </span>
      </div>
    </div>
  );
}

const RANK_FROM = { A: 14, K: 13, Q: 12, J: 11, T: 10 };
function rankOf(id) {
  return RANK_FROM[id[0]] ?? Number(id[0]);
}
