/**
 * PlayerPod
 * =========
 * Broadcast "lower-third" nameplate — the per-player graphic seen on WSOP/PokerGO.
 *
 * Layout (L→R):
 *   [Avatar zone]  [Identity: flag + NAME + position]  [Stack]
 *
 * Avatar zone contains:
 *   • 44px avatar (pro medallion | silhouette | YOU ring)
 *   • TurnTimerArc orbiting the avatar when isActive
 *
 * Floating elements:
 *   • Hole cards (above/left of bar)
 *   • Bet chip (below bar, toward table center) when currentBet > 0
 *
 * States:
 *   isActive   — gold border + glow + turn-timer arc (timerFraction)
 *   isFolded   — desaturated + dim opacity
 *   isAllIn    — pulsing "ALL IN" pill replaces / overlays stack area
 *   isHero     — distinct gold "YOU" treatment for the user's own seat
 *
 * Accessibility:
 *   • Real text for name/stack — never color-alone conveyance.
 *   • aria-label on the pod root encodes all active states.
 *   • prefers-reduced-motion: arc snaps, pulses are removed.
 *
 * @param {Object}  props
 * @param {Object}  props.player            - Player data object
 * @param {string}  props.player.name       - Display name
 * @param {number}  props.player.stack      - Chip count (integer)
 * @param {string}  [props.player.position] - "BTN","SB","BB","UTG", etc.
 * @param {string}  [props.player.country]  - ISO-3166-1 alpha-2 or flag emoji
 * @param {boolean} [props.player.isPro]    - Pro player?
 * @param {string}  [props.player.avatarId] - Asset slug, e.g. "phil-ivey"
 * @param {string}  [props.player.behaviour]- Style descriptor, e.g. "TAG"
 * @param {string}  [props.player.era]      - Event/year sub-label
 * @param {number}  [props.seatIdx=0]       - 0-based seat index (used for silhouette hue)
 * @param {boolean} [props.isHero=false]    - This is the user's own seat
 * @param {boolean} [props.isActive=false]  - Currently acting
 * @param {boolean} [props.isFolded=false]  - Already folded
 * @param {boolean} [props.isAllIn=false]   - All-in
 * @param {number}  [props.currentBet=0]    - Amount bet this street (shows chip graphic)
 * @param {number}  [props.timerFraction=1] - 0 (expired) – 1 (full) for turn arc
 * @param {boolean} [props.revealCards=false] - Show hole cards face-up
 * @param {Array}   [props.holeCards]       - e.g. ["Ah","Kd"] — Card strings for the seat
 */

import { useState } from 'react';
import Card from '../Card.jsx';
import TurnTimerArc from './TurnTimerArc.jsx';
import './PlayerPod.css';

/* ── helpers ─────────────────────────────────────────────────── */

/** ISO 3166-1 alpha-2 → flag emoji (or pass-through if already emoji). */
function toFlagEmoji(country = '') {
  const trimmed = country.trim();
  if (!trimmed) return '';
  if (/^\p{Regional_Indicator}/u.test(trimmed)) return trimmed;
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    const base = 0x1f1e6 - 0x41;
    return [...trimmed.toUpperCase()]
      .map((c) => String.fromCodePoint(base + c.charCodeAt(0)))
      .join('');
  }
  return '';
}

/** Extract up to two initials. */
function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.slice(0, 2) ?? '??').toUpperCase();
}

/** Format a chip count with commas: 4620000 → "4,620,000". */
function formatStack(n) {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  return Math.round(n).toLocaleString('en-US');
}

/**
 * Seat hue palette — each seat index gets a subtly different hue for the
 * silhouette background, distinguishing opponents at a glance.
 * Stays cool (blue-purple range) so it never competes with the gold/red/green
 * semantic accents.
 */
const SEAT_HUES = [220, 240, 200, 260, 210, 230, 250, 215];
function seatHue(idx) {
  return SEAT_HUES[idx % SEAT_HUES.length];
}

/* ── sub-components ──────────────────────────────────────────── */

/**
 * Stylized silhouette SVG for regular opponents.
 * Hue-shifted per seat index so each opponent is visually distinct.
 */
function SilhouetteSVG({ hue }) {
  return (
    <svg
      className="pp-silhouette"
      viewBox="0 0 44 44"
      aria-hidden="true"
      focusable="false"
      style={{ '--silhouette-hue': hue }}
    >
      {/* Head */}
      <circle cx="22" cy="14" r="8" className="pp-silhouette__fill" />
      {/* Shoulders */}
      <path d="M6 42 C6 30 38 30 38 42 Z" className="pp-silhouette__fill" />
    </svg>
  );
}

/** Pro medallion — gold ring + portrait/monogram inside. */
function ProAvatar({ name, avatarId }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = getInitials(name);
  const hasAsset = avatarId && !imgFailed;

  return (
    <div className="pp-avatar pp-avatar--pro" aria-hidden="true">
      {hasAsset ? (
        <img
          src={`/avatars/${avatarId}.webp`}
          alt=""
          className="pp-avatar__portrait"
          onError={() => setImgFailed(true)}
          draggable={false}
        />
      ) : (
        <span className="pp-avatar__initials">{initials}</span>
      )}
      <div className="pp-avatar__sheen" />
    </div>
  );
}

/** "YOU" hero avatar — gold ring + text treatment. */
function HeroAvatar() {
  return (
    <div className="pp-avatar pp-avatar--hero" aria-hidden="true">
      <span className="pp-avatar__you">YOU</span>
    </div>
  );
}

/** Regular opponent silhouette avatar. */
function RegularAvatar({ name, seatIdx }) {
  return (
    <div
      className="pp-avatar pp-avatar--regular"
      aria-hidden="true"
      style={{ '--seat-hue': seatHue(seatIdx) }}
    >
      <SilhouetteSVG hue={seatHue(seatIdx)} />
    </div>
  );
}

/** Bet chip graphic — gold-rimmed circle with the amount. */
function BetChip({ amount }) {
  return (
    <div className="pp-bet-chip" aria-label={`Current bet: ${formatStack(amount)}`}>
      <span className="pp-bet-chip__amount">{formatStack(amount)}</span>
    </div>
  );
}

/** "ALL IN" pulsing pill. */
function AllInPill() {
  return (
    <div className="pp-allin-pill" aria-label="All in">
      <span>ALL IN</span>
    </div>
  );
}

/* ── main component ──────────────────────────────────────────── */

export default function PlayerPod({
  player,
  seatIdx       = 0,
  isHero        = false,
  isActive      = false,
  isFolded      = false,
  isAllIn       = false,
  currentBet    = 0,
  timerFraction = 1,
  revealCards   = false,
  holeCards,
}) {
  const {
    name      = 'Player',
    stack     = 0,
    position,
    country,
    isPro     = false,
    avatarId,
    behaviour,
    era,
  } = player ?? {};

  const flagEmoji  = country ? toFlagEmoji(country) : '';
  const stackStr   = formatStack(stack);
  const hasBet     = currentBet > 0;
  const hasCards   = Array.isArray(holeCards) && holeCards.length > 0;

  /* Build aria-label — encodes all meaningful state in text. */
  const stateLabels = [
    isActive  ? 'active'  : null,
    isFolded  ? 'folded'  : null,
    isAllIn   ? 'all-in'  : null,
    isHero    ? 'your seat' : null,
  ].filter(Boolean);

  const ariaLabel = [
    name,
    position ? `(${position})` : null,
    `stack ${stackStr}`,
    hasBet ? `bet ${formatStack(currentBet)}` : null,
    ...stateLabels,
  ].filter(Boolean).join(', ');

  /* CSS class list on the root */
  const rootClasses = [
    'pp',
    isActive  ? 'pp--active'  : '',
    isFolded  ? 'pp--folded'  : '',
    isAllIn   ? 'pp--allin'   : '',
    isHero    ? 'pp--hero'    : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="pp-wrapper">
      {/* ── Hole cards — float above the bar ── */}
      {hasCards && (
        <div className="pp-cards" aria-label={`Hole cards for ${name}`}>
          {holeCards.map((cardStr, i) => (
            <Card
              key={i}
              card={cardStr}
              faceUp={revealCards}
              size="sm"
            />
          ))}
        </div>
      )}

      {/* ── Main bar ── */}
      <div
        className={rootClasses}
        role="region"
        aria-label={ariaLabel}
      >
        {/* Left: avatar zone with optional timer arc */}
        <div className="pp-avatar-zone">
          {isActive && (
            <div className="pp-timer-arc" aria-hidden="true">
              <TurnTimerArc
                fraction={timerFraction}
                size={54}
                strokeWidth={3}
              />
            </div>
          )}

          {isHero ? (
            <HeroAvatar />
          ) : isPro ? (
            <ProAvatar name={name} avatarId={avatarId} />
          ) : (
            <RegularAvatar name={name} seatIdx={seatIdx} />
          )}
        </div>

        {/* Middle: identity */}
        <div className="pp-identity">
          {/* Flag + position row */}
          <div className="pp-identity__top">
            {flagEmoji && (
              <span
                className="pp-flag"
                role="img"
                aria-label={country}
              >
                {flagEmoji}
              </span>
            )}
            {position && (
              <span className="pp-position">{position}</span>
            )}
          </div>

          {/* Name */}
          <span className="pp-name">{name.toUpperCase()}</span>

          {/* Style descriptor (behaviour) — small muted line */}
          {behaviour && !isFolded && (
            <span className="pp-behaviour">{behaviour}</span>
          )}
        </div>

        {/* Right: stack / all-in / bet */}
        <div className="pp-stack-zone">
          {isAllIn ? (
            <AllInPill />
          ) : (
            <span className="pp-stack" aria-label={`Stack: ${stackStr}`}>
              {stackStr}
            </span>
          )}
        </div>
      </div>

      {/* ── Bet chip — floats below bar toward table center ── */}
      {hasBet && (
        <div className="pp-bet-zone">
          <BetChip amount={currentBet} />
        </div>
      )}
    </div>
  );
}
