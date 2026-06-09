/**
 * EquityBarBroadcast
 * ==================
 * PokerGO/ESPN-style dual win-percentage bar.
 *
 * Layout (full width):
 *   [ HERO LABEL  35.4%] [====blue fill ··· red fill====] [64.6%  VILLAIN LABEL ]
 *                         ▲ divider tick at equity split
 *
 * The fill animates from 50/50 center outward to the real split over ~1 s
 * using --ease-out. prefers-reduced-motion → snaps to final instantly.
 *
 * Props:
 *   heroEquityPct   number  0-100  (required)
 *   villainEquityPct number 0-100  (optional — defaults to 100 - heroEquityPct)
 *   heroLabel       string         (optional — default "HERO")
 *   villainLabel    string         (optional — default "VILLAIN")
 *   breakEvenPct    number         (optional — renders a gold tick at this %)
 */

import { useState, useEffect, useRef } from 'react';
import './BroadcastHUD.css';

/* ── helpers ─────────────────────────────────────────────── */

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Count from startVal → endVal over duration ms using ease-out cubic. */
function useCountUp(target, duration, active, startVal = 0) {
  const [display, setDisplay] = useState(
    !active || prefersReducedMotion() ? target : startVal
  );
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active || prefersReducedMotion()) {
      setDisplay(target);
      return;
    }
    const from = startVal;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setDisplay(+(from + (target - from) * eased).toFixed(1));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(target);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, active, startVal]);

  return display;
}

/* ── component ───────────────────────────────────────────── */

export default function EquityBarBroadcast({
  heroEquityPct,
  villainEquityPct,
  heroLabel = 'HERO',
  villainLabel = 'VILLAIN',
  breakEvenPct,
}) {
  const villain =
    villainEquityPct != null
      ? villainEquityPct
      : Math.max(0, 100 - (heroEquityPct ?? 0));

  const hero = heroEquityPct ?? 0;

  const reduced = prefersReducedMotion();
  const [active, setActive] = useState(reduced);

  // Animated split position: starts at 50, slides to real hero%
  const [splitPct, setSplitPct] = useState(reduced ? hero : 50);

  useEffect(() => {
    if (reduced) {
      setSplitPct(hero);
      return;
    }
    // Brief delay so the browser paints the 50/50 state first (dramatic reveal).
    const delay = setTimeout(() => {
      setActive(true);
    }, 80);
    return () => clearTimeout(delay);
  }, [hero, reduced]);

  useEffect(() => {
    if (!active || reduced) return;
    const duration = 1000;
    const from = 50;
    const to = hero;
    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setSplitPct(+(from + (to - from) * eased).toFixed(2));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setSplitPct(to);
      }
    };

    const rafRef = { current: requestAnimationFrame(animate) };
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, hero, reduced]);

  // Count-up numerals that follow the split animation
  const heroDisplay = useCountUp(hero, 1000, active || reduced, reduced ? hero : 50);
  const villainDisplay = useCountUp(villain, 1000, active || reduced, reduced ? villain : 50);

  // Hero is "ahead" (>50%) → use green instead of blue
  const heroAhead = hero > 50;
  const heroFillClass = heroAhead
    ? 'bhud-eb__fill--hero-green'
    : 'bhud-eb__fill--hero-blue';

  const showBreakEven = breakEvenPct != null;

  return (
    <div
      className="bhud-eb"
      role="img"
      aria-label={`Win percentages: ${heroLabel} ${hero.toFixed(1)}%, ${villainLabel} ${villain.toFixed(1)}%`}
    >
      {/* ── Labels row ── */}
      <div className="bhud-eb__labels" aria-hidden="true">
        <span className="bhud-eb__player bhud-eb__player--hero">{heroLabel}</span>
        <span className="bhud-eb__player bhud-eb__player--villain">{villainLabel}</span>
      </div>

      {/* ── Bar strip ── */}
      <div className="bhud-eb__strip" aria-hidden="true">
        {/* Hero fill — left side, from 0 to splitPct% */}
        <div
          className={`bhud-eb__fill bhud-eb__fill--hero ${heroFillClass}`}
          style={{ width: `${splitPct}%` }}
        />

        {/* Villain fill — right side, from splitPct to 100% */}
        <div
          className="bhud-eb__fill bhud-eb__fill--villain"
          style={{ width: `${100 - splitPct}%` }}
        />

        {/* Gold divider tick at the split */}
        <div
          className="bhud-eb__divider"
          style={{ left: `${splitPct}%` }}
        />

        {/* Optional break-even tick (silver) */}
        {showBreakEven && (
          <div
            className="bhud-eb__breakeventick"
            style={{ left: `${breakEvenPct}%` }}
            title={`Break-even: ${breakEvenPct}%`}
          />
        )}
      </div>

      {/* ── Numerals row ── */}
      <div className="bhud-eb__numerals" aria-hidden="true">
        <span className={`bhud-eb__pct bhud-eb__pct--hero ${heroAhead ? 'bhud-eb__pct--green' : 'bhud-eb__pct--blue'}`}>
          {heroDisplay.toFixed(1)}%
        </span>
        <span className="bhud-eb__pct bhud-eb__pct--villain">
          {villainDisplay.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
