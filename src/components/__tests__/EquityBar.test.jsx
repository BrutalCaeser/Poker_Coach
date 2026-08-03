/**
 * EquityBar.test.jsx
 * Vitest + @testing-library/react (jsdom)
 *
 * Covers:
 *   1. mode="draw"   → both bars rendered, draw % text present
 *   2. mode="allin"  → only showdown bar, no draw bar, break-even marker present
 *   3. Pass case     → draw ≥ breakEven shows ✓ / pass affordance
 *   4. Fail case     → draw < breakEven shows amber "needs implied odds" text
 *   5. Showdown %    → always rendered regardless of mode
 *
 * Note: prefers-reduced-motion is not reliably testable in jsdom.
 * We assert that final values are present in the DOM (which the
 * component guarantees — reduced-motion snaps immediately to target).
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import EquityBar from '../EquityBar.jsx';

// jsdom doesn't implement matchMedia — stub it so prefersReducedMotion()
// returns false (normal mode) and RAF-based animation paths are exercised.
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

// ── 1. mode="draw" renders both bars ────────────────────────

describe('mode="draw"', () => {
  it('renders both the draw section and the showdown section', () => {
    render(
      <EquityBar
        mode="draw"
        drawEquityPct={30}
        showdownEquityPct={45}
        breakEvenPct={25}
        verdict="call"
      />
    );

    // Draw bar section title
    expect(
      screen.getByText(/your equity this street/i)
    ).toBeInTheDocument();

    // Showdown bar section title
    expect(
      screen.getByText(/if it goes to showdown/i)
    ).toBeInTheDocument();
  });

  it('renders the draw percentage as text', () => {
    render(
      <EquityBar
        mode="draw"
        drawEquityPct={19.6}
        showdownEquityPct={38}
        breakEvenPct={25}
        verdict="fold"
      />
    );

    // The count-up starts at 0 in an animated environment (jsdom with RAF),
    // but the aria-label always contains the final value — verify that.
    const drawSection = screen.getByLabelText(/draw equity 19\.6 percent/i);
    expect(drawSection).toBeInTheDocument();
  });
});

// ── 2. mode="allin": only showdown bar + break-even marker ──

describe('mode="allin"', () => {
  it('does NOT render the "this street" bar', () => {
    render(
      <EquityBar
        mode="allin"
        showdownEquityPct={42}
        breakEvenPct={33}
        verdict="call"
      />
    );

    expect(
      screen.queryByText(/your equity this street/i)
    ).not.toBeInTheDocument();
  });

  it('renders the allin showdown bar title', () => {
    render(
      <EquityBar
        mode="allin"
        showdownEquityPct={42}
        breakEvenPct={33}
        verdict="call"
      />
    );

    expect(
      screen.getByText(/your equity \(all-in/i)
    ).toBeInTheDocument();
  });

  it('renders a break-even marker for the showdown bar in allin mode', () => {
    const { container } = render(
      <EquityBar
        mode="allin"
        showdownEquityPct={42}
        breakEvenPct={33}
        verdict="call"
      />
    );

    // The marker line is rendered as .eb-track__marker
    const marker = container.querySelector('.eb-track__marker');
    expect(marker).not.toBeNull();
  });

  it('positions the break-even marker at the correct left%', () => {
    const { container } = render(
      <EquityBar
        mode="allin"
        showdownEquityPct={42}
        breakEvenPct={33}
        verdict="call"
      />
    );

    const marker = container.querySelector('.eb-track__marker');
    expect(marker.style.left).toBe('33%');
  });
});

// ── 3. Pass case: draw ≥ breakEven ──────────────────────────

describe('pass case (drawEquityPct >= breakEvenPct)', () => {
  // Natural-frequency redesign (2026-07-27): the footer now states the MARGIN
  // ("clears by 10") rather than a bare pass/fail, so the reader never has to
  // subtract two percentages. 35 - 25 = 10.
  it('states the margin over break-even instead of a bare pass/fail', () => {
    render(
      <EquityBar
        mode="draw"
        drawEquityPct={35}
        showdownEquityPct={50}
        breakEvenPct={25}
        verdict="call"
      />
    );

    expect(screen.getByText(/clears by 10/i)).toBeInTheDocument();
  });

  it('leads with the natural-frequency readout ("35 in 100")', () => {
    render(
      <EquityBar
        mode="draw"
        drawEquityPct={35}
        showdownEquityPct={50}
        breakEvenPct={25}
        verdict="call"
      />
    );

    // Frequency is primary; "in 100" appears for both the draw and showdown bars.
    expect(screen.getAllByText(/in 100/i).length).toBeGreaterThan(0);
    const array = screen.getAllByRole('img', { name: /out of 100/i });
    expect(array.length).toBeGreaterThan(0);
    expect(array[0]).toHaveAttribute(
      'aria-label',
      expect.stringContaining('break-even point at 25')
    );
  });

  it('aria-label mentions "clears the price" for a passing draw', () => {
    render(
      <EquityBar
        mode="draw"
        drawEquityPct={35}
        showdownEquityPct={50}
        breakEvenPct={25}
        verdict="call"
      />
    );

    const drawSection = screen.getByLabelText(/clears the price/i);
    expect(drawSection).toBeInTheDocument();
  });
});

// ── 4. Fail case: draw < breakEven ──────────────────────────

describe('fail case (drawEquityPct < breakEvenPct)', () => {
  // 20 (rounded from 19.6) - 25 = short by 5.
  it('states how far short of break-even the draw is', () => {
    render(
      <EquityBar
        mode="draw"
        drawEquityPct={19.6}
        showdownEquityPct={38}
        breakEvenPct={25}
        verdict="fold"
      />
    );

    expect(screen.getByText(/short by 5/i)).toBeInTheDocument();
  });

  it('aria-label mentions "needs implied odds" for a failing draw', () => {
    render(
      <EquityBar
        mode="draw"
        drawEquityPct={19.6}
        showdownEquityPct={38}
        breakEvenPct={25}
        verdict="fold"
      />
    );

    const drawSection = screen.getByLabelText(/needs implied odds/i);
    expect(drawSection).toBeInTheDocument();
  });
});

// ── 5. Showdown % is always in the DOM ──────────────────────

describe('showdown equity', () => {
  it('showdown section is present in draw mode', () => {
    render(
      <EquityBar
        mode="draw"
        drawEquityPct={30}
        showdownEquityPct={55}
        breakEvenPct={25}
        verdict="call"
      />
    );

    // The aria-label on the showdown section carries the final value
    expect(
      screen.getByLabelText(/showdown equity 55\.0 percent/i)
    ).toBeInTheDocument();
  });

  it('showdown section is present in allin mode', () => {
    render(
      <EquityBar
        mode="allin"
        showdownEquityPct={42}
        breakEvenPct={33}
        verdict="call"
      />
    );

    expect(
      screen.getByLabelText(/showdown equity 42\.0 percent/i)
    ).toBeInTheDocument();
  });
});

// ── 6. Verdict chip and note rendering ──────────────────────

describe('verdict chip', () => {
  it('renders the call chip when verdict="call"', () => {
    render(
      <EquityBar
        mode="draw"
        drawEquityPct={30}
        showdownEquityPct={50}
        breakEvenPct={25}
        verdict="call"
      />
    );
    expect(screen.getByText(/→ Call/)).toBeInTheDocument();
  });

  it('renders the fold chip when verdict="fold"', () => {
    render(
      <EquityBar
        mode="draw"
        drawEquityPct={10}
        showdownEquityPct={15}
        breakEvenPct={25}
        verdict="fold"
      />
    );
    expect(screen.getByText(/→ Fold/)).toBeInTheDocument();
  });

  it('renders an optional note when provided', () => {
    render(
      <EquityBar
        mode="allin"
        showdownEquityPct={42}
        breakEvenPct={33}
        verdict="call"
        note="Villain is tight — implied odds are slim."
      />
    );
    expect(
      screen.getByText(/villain is tight/i)
    ).toBeInTheDocument();
  });
});
