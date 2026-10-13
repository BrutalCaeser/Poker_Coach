/**
 * The lesson's visual vocabulary. Deliberately tiny: every explanation is
 * drawn with the same few primitives so intuition carries from hand to hand.
 *
 *   PotRing   — the pot is a ring. Your call is a slice of it. The slice IS
 *               the price. (Replaces the 3D chip stack: chips don't teach.)
 *   DeckGrid  — the deck is a grid of the real unseen cards, suits as rows and
 *               ranks as columns, so a flush reads as a row, a straight as two
 *               columns, a better pair as a column.
 *   ShareBars — price and chance on ONE 0-100 scale, so they read as the same
 *               kind of number.
 *   LongRun   — 100 plays as 100 squares. A frequency, not a slot machine.
 */
import { useEffect, useState } from 'react';
import { RANK_LABEL, SUIT_GLYPH, money } from './lessonMath.js';

const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ── Card ───────────────────────────────────────────────────── */

const RANK_FROM = { A: 14, K: 13, Q: 12, J: 11, T: 10 };
function parse(str) {
  const r = str[0];
  return { rank: RANK_FROM[r] ?? Number(r), suit: str[1] };
}

export function Card({ card, size = 'md', faceDown = false, dim = false, flip = false }) {
  const { rank, suit } = parse(card);
  const red = suit === 'h' || suit === 'd';
  const label = `${RANK_LABEL[rank]}${SUIT_GLYPH[suit]}`;
  return (
    <span
      className={`lx-card lx-card--${size}${faceDown ? ' is-down' : ''}${dim ? ' is-dim' : ''}${flip ? ' is-flip' : ''}`}
      role="img"
      aria-label={faceDown ? 'Face-down card' : label}
    >
      <span className="lx-card__inner">
        <span className={`lx-card__face${red ? ' is-red' : ''}`} aria-hidden="true">
          <span className="lx-card__rank">{RANK_LABEL[rank]}</span>
          <span className="lx-card__suit">{SUIT_GLYPH[suit]}</span>
        </span>
        <span className="lx-card__back" aria-hidden="true" />
      </span>
    </span>
  );
}

/* ── PotRing ────────────────────────────────────────────────── */

/**
 * @param base  chips already in the pot
 * @param mine  what you'd add (drawn as a gold slice); 0 = just the pot
 */
export function PotRing({ base, mine = 0, size = 168, stroke = 14, center, sub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = base + mine;
  const target = total > 0 ? mine / total : 0;
  const reduced = reduceMotion();
  const [animated, setAnimated] = useState(0);

  // Animate only via rAF; with reduced motion the target renders directly.
  useEffect(() => {
    if (reduced) return undefined;
    const id = requestAnimationFrame(() => setAnimated(target));
    return () => cancelAnimationFrame(id);
  }, [target, reduced]);
  const share = reduced ? target : animated;

  return (
    <div className="lx-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="lx-ring__track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="lx-ring__mine"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={`${share * c} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="lx-ring__center">
        <span className="lx-ring__value">{center ?? money(total)}</span>
        {sub && <span className="lx-ring__sub">{sub}</span>}
      </div>
    </div>
  );
}

/* ── ShareBars ──────────────────────────────────────────────── */

export function ShareBars({ need, have, needLabel = 'You pay', haveLabel = 'You win' }) {
  const [on, setOn] = useState(reduceMotion());
  useEffect(() => {
    if (reduceMotion()) return;
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const row = (label, value, tone) => (
    <div className={`lx-bar lx-bar--${tone}`}>
      <div className="lx-bar__head">
        <span className="lx-bar__label">{label}</span>
        <span className="lx-bar__value">
          {value}
          <span className="lx-bar__unit"> in 100</span>
        </span>
      </div>
      <div className="lx-bar__track" aria-hidden="true">
        <div className="lx-bar__fill" style={{ width: on ? `${value}%` : 0 }} />
      </div>
    </div>
  );
  return (
    <div
      className="lx-bars"
      role="img"
      aria-label={`${needLabel} ${need} in 100. ${haveLabel} ${have} in 100.`}
    >
      {row(needLabel, need, 'you')}
      {row(haveLabel, have, 'win')}
    </div>
  );
}

/* ── DeckGrid ───────────────────────────────────────────────── */

/**
 * mode:
 *   'pick'    — tap to select; suit and rank headers select a whole row/column
 *   'checked' — show winners, misses and wrong taps
 *   'truth'   — his real cards removed (cells in `his` are struck)
 */
export function DeckGrid({ grid, mode = 'pick', selected, onToggle, onToggleMany, his = [] }) {
  const ranks = grid[0].map((c) => c.rank);
  const pickable = mode === 'pick';

  const cellsFor = (pred) =>
    grid.flat().filter((c) => !c.seen && pred(c)).map((c) => c.id);

  return (
    <div className={`lx-grid lx-grid--${mode}`}>
      <div className="lx-grid__corner" aria-hidden="true" />
      {ranks.map((rank) => (
        <button
          key={`r${rank}`}
          type="button"
          className="lx-grid__head lx-grid__head--rank"
          onClick={() => pickable && onToggleMany(cellsFor((c) => c.rank === rank))}
          disabled={!pickable}
          aria-label={`Select every ${RANK_LABEL[rank]}`}
        >
          {RANK_LABEL[rank]}
        </button>
      ))}

      {grid.map((row) => {
        const suit = row[0].suit;
        return [
          <button
            key={`s${suit}`}
            type="button"
            className={`lx-grid__head lx-grid__head--suit${suit === 'h' || suit === 'd' ? ' is-red' : ''}`}
            onClick={() => pickable && onToggleMany(cellsFor((c) => c.suit === suit))}
            disabled={!pickable}
            aria-label={`Select every ${SUIT_GLYPH[suit]}`}
          >
            {SUIT_GLYPH[suit]}
          </button>,
          ...row.map((c) => {
            const red = c.suit === 'h' || c.suit === 'd';
            if (c.seen) {
              return (
                <span key={c.id} className="lx-cell is-seen" title={c.seen === 'yours' ? 'In your hand' : 'On the board'}>
                  <span className={red ? 'is-red' : ''}>{RANK_LABEL[c.rank]}</span>
                </span>
              );
            }
            const isSel = selected?.has(c.id);
            const isHis = his.includes(c.id);
            let state = '';
            if (mode === 'pick') state = isSel ? 'is-sel' : '';
            else if (isHis) state = 'is-his';
            else if (c.wins && (mode === 'truth' || isSel)) state = 'is-win';
            else if (c.wins) state = 'is-missed';
            else if (isSel) state = 'is-wrong';

            const name = `${RANK_LABEL[c.rank]}${SUIT_GLYPH[c.suit]}`;
            return (
              <button
                key={c.id}
                type="button"
                className={`lx-cell ${state}`}
                onClick={() => pickable && onToggle(c.id)}
                disabled={!pickable}
                aria-pressed={pickable ? !!isSel : undefined}
                aria-label={`${name}${isHis ? ', in his hand' : ''}${state === 'is-win' ? ', wins' : ''}${state === 'is-missed' ? ', wins, missed' : ''}${state === 'is-wrong' ? ', does not win' : ''}`}
              >
                <span className={red ? 'is-red' : ''}>{RANK_LABEL[c.rank]}</span>
              </button>
            );
          }),
        ];
      })}
    </div>
  );
}

/* ── LongRun ────────────────────────────────────────────────── */

export function LongRun({ seq, winAmount, lossAmount }) {
  const reduced = reduceMotion();
  const [ticked, setTicked] = useState(0);

  // Fill two squares per tick (~1.5s total). Deterministic order, no suspense.
  useEffect(() => {
    if (reduced) return undefined;
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setTicked(Math.min(i, seq.length));
      if (i >= seq.length) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [seq, reduced]);
  const shown = reduced ? seq.length : ticked;

  const played = seq.slice(0, shown);
  const wins = played.filter(Boolean).length;
  const losses = played.length - wins;
  const net = wins * winAmount - losses * lossAmount;

  return (
    <div className="lx-run">
      <div className="lx-run__grid" role="img" aria-label={`${seq.filter(Boolean).length} wins and ${seq.length - seq.filter(Boolean).length} losses out of ${seq.length}`}>
        {seq.map((w, i) => (
          <span key={i} className={`lx-run__cell${i < shown ? (w ? ' is-win' : ' is-loss') : ''}`} />
        ))}
      </div>
      <div className="lx-run__tally" aria-live="polite">
        <span><b className="t-win">{wins}</b> won</span>
        <span><b>{losses}</b> lost</span>
        <span className="lx-run__net">
          {net >= 0 ? '+' : ''}
          {money(net)}
        </span>
      </div>
    </div>
  );
}
