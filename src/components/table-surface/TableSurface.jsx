/**
 * TableSurface — broadcast-quality poker table surface.
 *
 * Replaces the flat oval in Table.jsx with a full cinematic treatment:
 *  - Speed-cloth felt with woven texture + spotlit radial gradient
 *  - Printed betting line ellipse
 *  - Felt watermark logo
 *  - Multi-ring padded leather rail with gold seam
 *  - Chip-stack pot graphic + community board using imported Card
 *  - Dealer button
 *  - Action ticker strip
 *  - Children (player pods) positioned around the oval edge by seat count
 *
 * Props
 * ─────
 * @param {string[]}   board         – Card strings currently on the board (0-5)
 * @param {number}     pot           – Current pot; 0 hides the chip stack
 * @param {string|null} latestAction – One-line action text shown in the ticker
 * @param {string}     [dealerLabel='D'] – Text inside the dealer button
 * @param {string}     [venue]       – Venue theme: "wsop" | "tournament" | undefined
 * @param {number}     numPlayers    – Number of players (2-6); controls seat layout
 * @param {ReactNode}  children      – Player pod elements, one per seat in deal order
 */

import { useEffect, useRef, useState } from 'react';
import Card from '../Card.jsx';
import './TableSurface.css';

/* ── helpers ─────────────────────────────────────────────────── */

function formatAmount(amount) {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `$${amount.toLocaleString()}`;
  return `$${amount}`;
}

/**
 * Return an array of chip descriptors for a given pot size.
 * Each chip has a { color, label, offset } for the stacked SVG.
 * We show 3-6 chips; count scales log-ish with pot size.
 */
function buildChipStack(pot) {
  // Denomination thresholds → chip color map (TV-standard palette)
  const denominations = [
    { value: 10_000, color: '#2a2a2a', border: '#555', label: '10k' },  // black
    { value:  5_000, color: '#7a1a1a', border: '#c44', label: '5k'  },  // burgundy
    { value:  1_000, color: '#1a3a7a', border: '#4a7ec8', label: '1k' }, // blue
    { value:    500, color: '#6b1a6b', border: '#c84cc8', label: '500' },// purple
    { value:    100, color: '#1a5a1a', border: '#4aad4a', label: '100' },// green
    { value:     25, color: '#a07a1a', border: '#c8a03c', label: '25' }, // gold
    { value:      5, color: '#8a2a1a', border: '#d44', label: '5'   },   // red
    { value:      1, color: '#e8e0d0', border: '#aaa', label: '1'   },   // white
  ];

  // Greedily pick chips that represent this pot (simplified; visual only)
  const chips = [];
  let remaining = pot;
  for (const denom of denominations) {
    if (remaining >= denom.value) {
      chips.push(denom);
      remaining -= denom.value * Math.floor(remaining / denom.value);
      if (chips.length >= 6) break;
    }
  }
  // Always show at least 3 chips
  while (chips.length < 3) {
    chips.push(denominations[denominations.length - 1]);
  }
  return chips.slice(0, 6);
}

/* ── ChipStack SVG ───────────────────────────────────────────── */

function ChipStack({ pot }) {
  const chips = buildChipStack(pot);
  const chipH  = 14;   // visual height per chip (px, in SVG coords)
  const chipW  = 48;
  const stackH = chipH * chips.length + 6;

  return (
    <svg
      className="ts-chip-stack"
      width={chipW + 8}
      height={stackH}
      viewBox={`0 0 ${chipW + 8} ${stackH}`}
      aria-hidden="true"
    >
      {chips.slice().reverse().map((chip, i) => {
        const realIdx = chips.length - 1 - i;
        const y = i * chipH;
        const cx = (chipW + 8) / 2;

        return (
          <g key={realIdx}>
            {/* chip body ellipse (side face) */}
            <ellipse
              cx={cx}
              cy={y + chipH - 4}
              rx={chipW / 2}
              ry={5}
              fill={chip.color}
              stroke={chip.border}
              strokeWidth={1}
            />
            {/* chip top face */}
            <ellipse
              cx={cx}
              cy={y + 4}
              rx={chipW / 2}
              ry={5}
              fill={chip.color}
              stroke={chip.border}
              strokeWidth={1}
            />
            {/* connecting side rectangle */}
            <rect
              x={cx - chipW / 2}
              y={y + 4}
              width={chipW}
              height={chipH - 8}
              fill={chip.color}
            />
            {/* top highlight stripe */}
            <ellipse
              cx={cx}
              cy={y + 4}
              rx={chipW / 2 - 4}
              ry={3}
              fill="rgba(255,255,255,0.12)"
            />
            {/* denomination notches (decorative arcs on top face) */}
            <ellipse
              cx={cx}
              cy={y + 4}
              rx={chipW / 2 - 2}
              ry={4.5}
              fill="none"
              stroke={chip.border}
              strokeWidth={0.8}
              strokeDasharray="3 3"
            />
          </g>
        );
      })}
    </svg>
  );
}

/* ── DealerButton ────────────────────────────────────────────── */

function DealerButton({ label = 'D' }) {
  return (
    <div className="ts-dealer" aria-label="Dealer button" role="img">
      <span className="ts-dealer__label">{label}</span>
    </div>
  );
}

/* ── ActionTicker ────────────────────────────────────────────── */

function ActionTicker({ action }) {
  const [displayed, setDisplayed] = useState(action);
  const [key, setKey] = useState(0);
  const prev = useRef(action);

  useEffect(() => {
    if (action !== prev.current) {
      prev.current = action;
      setKey(k => k + 1);
      setDisplayed(action);
    }
  }, [action]);

  if (!displayed) return null;

  return (
    <div className="ts-ticker" aria-live="polite" aria-atomic="true">
      <span key={key} className="ts-ticker__text">{displayed}</span>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */

export default function TableSurface({
  board = [],
  pot = 0,
  latestAction = null,
  dealerLabel = 'D',
  venue,
  numPlayers = 2,
  children,
}) {
  const venueClass = venue ? ` ts--venue-${venue}` : '';
  const countClass = ` ts--${numPlayers}`;
  const rootClass  = `ts${countClass}${venueClass}`;

  return (
    <div className="ts-wrap">
      <div className={rootClass}>

        {/* ── Seat wrappers FIRST so `.ts-seat:nth-child(i)` positioning matches
             (the betting-line/logo/center must NOT occupy seat child-slots) ── */}
        {Array.isArray(children)
          ? children.map((child, i) => (
              <div key={i} className="ts-seat">{child}</div>
            ))
          : children
            ? <div className="ts-seat">{children}</div>
            : null
        }

        {/* ── Felt texture pseudo-elements handled in CSS ── */}

        {/* ── Betting line (thin cream ellipse printed on felt) ── */}
        <div className="ts-betting-line" aria-hidden="true" />

        {/* ── Felt watermark logo ── */}
        <svg className="ts-logo" aria-hidden="true" viewBox="0 0 320 40" preserveAspectRatio="xMidYMid meet">
          <text
            x="50%"
            y="75%"
            textAnchor="middle"
            fill="rgba(255,255,255,0.05)"
            fontFamily="Arial Narrow, Arial, Helvetica, sans-serif"
            fontWeight="700"
            fontSize="22"
            letterSpacing="8"
          >
            POKER DECISIONS
          </text>
        </svg>

        {/* ── Center area: pot + board + dealer button + ticker ── */}
        <div className="ts-center">

          {/* Pot chip stack */}
          {pot > 0 && (
            <div className="ts-pot anim-chips">
              <ChipStack pot={pot} />
              <div className="ts-pot__label">
                <span className="ts-pot__word">POT</span>
                <span className="ts-pot__amount">{formatAmount(pot)}</span>
              </div>
            </div>
          )}

          {/* Community board */}
          <div className="ts-board">
            {board.map((cardStr, i) => (
              <Card
                key={cardStr + i}
                card={cardStr}
                faceUp={true}
                size="md"
                dealing={true}
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>

          {/* Dealer button + action ticker row */}
          <div className="ts-bottom-row">
            <DealerButton label={dealerLabel} />
            <ActionTicker action={latestAction} />
          </div>

        </div>

      </div>
    </div>
  );
}
