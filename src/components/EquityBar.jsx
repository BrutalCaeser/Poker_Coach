/**
 * EquityBar Component
 * ====================
 * Post-decision reveal: two animated horizontal bars showing
 * draw equity (this street) and showdown equity (full run-out).
 *
 * Props:
 *   mode              {"draw" | "allin"}
 *   drawEquityPct     number  0-100  hero single-street improve equity (required when mode="draw")
 *   showdownEquityPct number  0-100  hero full run-out equity vs villain(s)
 *   breakEvenPct      number  0-100  pot-odds threshold
 *   verdict           {"call" | "fold" | "raise"}
 *   note              string  optional small caption
 */
import { useState, useEffect, useRef } from 'react';
import './EquityBar.css';

/* ── helpers ─────────────────────────────────────────────── */

/** Detect whether the user has requested reduced motion. */
function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * useCountUp — animates a number from 0 to `target` over `duration` ms.
 * Snaps instantly when reduced motion is on or when `active` is false.
 */
function useCountUp(target, duration, active) {
  const [display, setDisplay] = useState(
    !active || prefersReducedMotion() ? target : 0
  );
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active || prefersReducedMotion()) {
      setDisplay(target);
      return;
    }
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(+(target * eased).toFixed(1));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(target);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, active]);

  return display;
}

/* ── sub-components ─────────────────────────────────────── */

/**
 * SingleBar — one horizontal track.
 *
 * fillPct        : how far the hero slice extends (0-100)
 * breakEvenPct   : optional marker line position (0-100)
 * colorScheme    : "gold" | "green" | "red"  — hero fill color
 * active         : whether to start the fill animation
 * delay          : CSS animation-delay string for the fill keyframe
 * isDrawing Dead : both bars ~0
 */
function SingleBar({
  fillPct,
  breakEvenPct,
  colorScheme,
  active,
  delay,
  drawingDead,
}) {
  const reduced = prefersReducedMotion();

  // width animates via CSS custom property driven by a class
  // We set it via inline style so we can stagger independently.
  const [width, setWidth] = useState(reduced ? fillPct : 0);

  useEffect(() => {
    if (reduced) {
      setWidth(fillPct);
      return;
    }
    if (!active) return;
    // Small RAF defer so the browser paints at 0 first (enabling the transition).
    const raf = requestAnimationFrame(() => setWidth(fillPct));
    return () => cancelAnimationFrame(raf);
  }, [active, fillPct, reduced]);

  const fillStyle = {
    width: `${width}%`,
    transitionDelay: reduced ? '0ms' : delay,
  };

  const showMarker = breakEvenPct != null;

  return (
    <div className="eb-track" role="presentation">
      {/* Muted slate remainder */}
      <div className="eb-track__field" aria-hidden="true" />
      {/* Hero fill */}
      <div
        className={`eb-track__fill eb-track__fill--${colorScheme}${drawingDead ? ' eb-track__fill--dead' : ''}`}
        style={fillStyle}
        aria-hidden="true"
      />
      {/* Break-even marker */}
      {showMarker && (
        <div
          className="eb-track__marker"
          style={{ left: `${breakEvenPct}%` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/* ── main component ─────────────────────────────────────── */

export default function EquityBar({
  mode = 'draw',
  drawEquityPct,
  showdownEquityPct = 0, // guard: never null (unknown-villain scenarios would pass 0)
  breakEvenPct,
  verdict,
  note,
}) {
  const reduced = prefersReducedMotion();

  // Two-phase reveal: bar1 first, then bar2 after ~400ms stagger.
  const [bar1Active, setBar1Active] = useState(reduced);
  const [bar2Active, setBar2Active] = useState(reduced);

  useEffect(() => {
    if (reduced) return;
    // Bar 1 starts immediately (or only bar 2 if allin mode).
    const t1 = setTimeout(() => setBar1Active(true), 80);
    const t2 = setTimeout(() => setBar2Active(true), mode === 'allin' ? 80 : 480);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [mode, reduced]);

  // Count-up numbers
  const drawDisplay = useCountUp(
    drawEquityPct ?? 0,
    700,
    mode === 'draw' && bar1Active
  );
  const showdownDisplay = useCountUp(showdownEquityPct, 700, bar2Active);

  // Drawing dead: both values effectively 0
  const drawingDead =
    (drawEquityPct != null ? drawEquityPct : 0) < 1 &&
    showdownEquityPct < 1;

  // Draw bar pass/fail
  const drawPasses =
    mode === 'draw' &&
    drawEquityPct != null &&
    drawEquityPct >= breakEvenPct;

  // Draw bar color: green if passes, gold if not, dim if drawing dead
  const drawColorScheme = drawingDead ? 'dead' : drawPasses ? 'green' : 'gold';

  // Showdown bar is always gold (informational, not pass/fail)
  const showdownColorScheme = drawingDead ? 'dead' : 'gold';

  // Accessibility labels
  const drawAriaLabel =
    mode === 'draw'
      ? `Draw equity ${(drawEquityPct ?? 0).toFixed(1)} percent, ${
          drawPasses
            ? `above the ${breakEvenPct} percent break-even — clears the price`
            : `below the ${breakEvenPct} percent break-even — needs implied odds`
        }`
      : undefined;

  const showdownAriaLabel =
    mode === 'allin'
      ? `Showdown equity ${showdownEquityPct.toFixed(1)} percent, ${
          showdownEquityPct >= breakEvenPct
            ? `above the ${breakEvenPct} percent break-even`
            : `below the ${breakEvenPct} percent break-even`
        }`
      : `Showdown equity ${showdownEquityPct.toFixed(1)} percent against villain's actual hand`;

  return (
    <div className={`equity-bar-root${drawingDead ? ' equity-bar-root--dead' : ''}`}>
      {/* ── Bar 1: Draw equity (mode="draw" only) ────────── */}
      {mode === 'draw' && (
        <div
          className="eb-section eb-section--draw"
          aria-label={drawAriaLabel}
        >
          <div className="eb-section__header">
            <span className="eb-section__title">Your equity this street</span>
            <span className={`eb-pct mono${drawPasses && !drawingDead ? ' eb-pct--green' : !drawingDead ? ' eb-pct--gold' : ' eb-pct--dead'}`}>
              {drawDisplay.toFixed(1)}%
            </span>
          </div>

          <SingleBar
            fillPct={drawEquityPct ?? 0}
            breakEvenPct={breakEvenPct}
            colorScheme={drawColorScheme}
            active={bar1Active}
            delay="0ms"
            drawingDead={drawingDead}
          />

          <div className="eb-section__footer">
            {/* Break-even label */}
            {!drawingDead && (
              <span
                className="eb-marker-label"
                style={{ left: `${Math.min(Math.max(breakEvenPct, 5), 88)}%` }}
              >
                need {breakEvenPct}%
              </span>
            )}

            {/* Pass/fail verdict text */}
            <span
              className={`eb-verdict-text${drawPasses && !drawingDead ? ' eb-verdict-text--pass' : ' eb-verdict-text--fail'}`}
            >
              {drawingDead
                ? 'Drawing dead — fold'
                : drawPasses
                ? '✓ clears the price'
                : 'short — needs implied odds'}
            </span>
          </div>

          <p className="eb-subtitle">
            (chance to improve on the next card — what the call price is measured against)
          </p>
        </div>
      )}

      {/* ── Bar 2: Showdown equity ───────────────────────── */}
      <div
        className={`eb-section eb-section--showdown${mode === 'allin' ? ' eb-section--allin' : ''}`}
        aria-label={showdownAriaLabel}
      >
        <div className="eb-section__header">
          <span className="eb-section__title">
            {mode === 'allin'
              ? 'Your equity (all-in — no more streets)'
              : 'If it goes to showdown'}
          </span>
          <span className={`eb-pct mono${drawingDead ? ' eb-pct--dead' : ' eb-pct--gold'}`}>
            {showdownDisplay.toFixed(1)}%
          </span>
        </div>

        {/* All-in mode: break-even marker lives on THIS bar */}
        <SingleBar
          fillPct={showdownEquityPct}
          breakEvenPct={mode === 'allin' ? breakEvenPct : undefined}
          colorScheme={showdownColorScheme}
          active={bar2Active}
          delay={mode === 'allin' ? '0ms' : '80ms'}
          drawingDead={drawingDead}
        />

        {mode === 'allin' && !drawingDead && (
          <div className="eb-section__footer">
            <span
              className="eb-marker-label"
              style={{ left: `${Math.min(Math.max(breakEvenPct, 5), 88)}%` }}
            >
              need {breakEvenPct}%
            </span>
            <span
              className={`eb-verdict-text${showdownEquityPct >= breakEvenPct ? ' eb-verdict-text--pass' : ' eb-verdict-text--fail'}`}
            >
              {showdownEquityPct >= breakEvenPct
                ? '✓ clears the price'
                : '✗ doesn’t clear the price'}
            </span>
          </div>
        )}

        {drawingDead && mode === 'allin' && (
          <div className="eb-section__footer">
            <span className="eb-verdict-text eb-verdict-text--fail">
              Drawing dead — fold
            </span>
          </div>
        )}

        <p className="eb-subtitle">
          {mode === 'allin'
            ? '(equity all-in — this is the number to measure against pot odds)'
            : '(full run-out vs villain’s actual hand)'}
        </p>
      </div>

      {/* ── Verdict chip ────────────────────────────────── */}
      {verdict && (
        <div className={`eb-verdict-chip eb-verdict-chip--${verdict}`}>
          {verdict === 'call' && '→ Call'}
          {verdict === 'fold' && '→ Fold'}
          {verdict === 'raise' && '→ Raise'}
        </div>
      )}

      {/* ── Optional note ───────────────────────────────── */}
      {note && <p className="eb-note">{note}</p>}
    </div>
  );
}
