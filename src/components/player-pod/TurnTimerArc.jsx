/**
 * TurnTimerArc
 * ============
 * An SVG conic-like arc that depletes around the player avatar as the turn
 * timer runs down. Rendered as a stroked SVG circle with a strokeDashoffset
 * technique (no conic-gradient — better cross-browser + GPU composited).
 *
 * Color: green (1.0→0.5) → amber (0.5→0.2) → red (0.2→0)
 * Accessibility: prefers-reduced-motion snaps to the final value immediately.
 *
 * @param {Object}  props
 * @param {number}  [props.fraction=1]  - 0 (expired) to 1 (full). Default 1.
 * @param {number}  [props.size=52]     - Diameter in px (matches the avatar area).
 * @param {number}  [props.strokeWidth=3] - Arc stroke width in px.
 * @param {string}  [props.className]   - Extra class names.
 */
import './TurnTimerArc.css';

/* ── arc color interpolation ────────────────────────────────── */

/**
 * Lerp between two hex colors given t in [0,1].
 * t=0 → colorA, t=1 → colorB.
 */
function lerpColor(colorA, colorB, t) {
  const parse = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(colorA);
  const [r2, g2, b2] = parse(colorB);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

const GREEN  = '#5aad5a';
const AMBER  = '#e0a030';
const RED    = '#d94f63';

/** Map fraction (0–1) to an arc stroke color. */
function arcColor(fraction) {
  const f = Math.max(0, Math.min(1, fraction));
  if (f >= 0.5) {
    // green → amber  (f: 1→0.5 maps t: 0→1)
    return lerpColor(GREEN, AMBER, (1 - f) * 2);
  }
  // amber → red  (f: 0.5→0 maps t: 0→1)
  return lerpColor(AMBER, RED, (0.5 - f) * 2);
}

/* ── component ──────────────────────────────────────────────── */

export default function TurnTimerArc({
  fraction = 1,
  size = 52,
  strokeWidth = 3,
  className = '',
}) {
  const f = Math.max(0, Math.min(1, fraction));

  // SVG circle: center at (size/2, size/2), radius fills inside the stroke
  const radius     = (size - strokeWidth) / 2;
  const cx         = size / 2;
  const cy         = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Start arc from the top (−90° offset) by rotating the SVG
  const dashOffset = circumference * (1 - f);
  const color      = arcColor(f);

  // Tiny glow when arc is still substantial
  const glowFilter = f > 0.15 ? 'url(#arc-glow)' : 'none';

  const pct = Math.round(f * 100);

  return (
    <svg
      className={`tta ${className}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="arc-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Track — dim ring showing the full circle */}
      <circle
        className="tta__track"
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
      />

      {/* Arc — the depleting segment */}
      <circle
        className="tta__arc"
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        filter={glowFilter}
        /* Rotate so arc starts from 12 o'clock */
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{
          /* CSS transition for smooth depletion; snapped by prefers-reduced-motion in CSS */
          transition: 'stroke-dashoffset 0.3s linear, stroke 0.3s linear',
        }}
      />
    </svg>
  );
}
