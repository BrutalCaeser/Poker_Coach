/**
 * BroadcastHUD.test.jsx
 * Vitest + @testing-library/react (jsdom)
 *
 * Covers:
 *   1. EquityBarBroadcast renders hero % and villain % (100 − hero) in the DOM
 *   2. Hand-strength label appears when heroHand is set; absent when null
 *   3. To-call strip appears when toCall > 0; absent when toCall = 0
 *   4. BroadcastHUD renders nothing when all props are empty/falsy
 *
 * Note: prefers-reduced-motion is not reliably testable in jsdom.
 * The components snap to final values when reduced-motion is detected,
 * but here we assert via aria-label (guaranteed to carry final values).
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import BroadcastHUD from '../BroadcastHUD.jsx';
import EquityBarBroadcast from '../EquityBarBroadcast.jsx';

// jsdom doesn't implement matchMedia — stub it so prefersReducedMotion()
// returns false (normal animation mode).
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

// ── 1. EquityBarBroadcast renders correct percentages ────────

describe('EquityBarBroadcast', () => {
  it('aria-label contains hero% and villain% (100−hero when villain omitted)', () => {
    render(
      <EquityBarBroadcast
        heroEquityPct={35.4}
        heroLabel="Hero"
        villainLabel="Villain"
      />
    );

    // The root has an aria-label with both values.
    const bar = screen.getByRole('img', { name: /35\.4%.*64\.6%/i });
    expect(bar).toBeInTheDocument();
  });

  it('uses explicit villainEquityPct when provided', () => {
    render(
      <EquityBarBroadcast
        heroEquityPct={60}
        villainEquityPct={40}
        heroLabel="Me"
        villainLabel="Them"
      />
    );

    const bar = screen.getByRole('img', { name: /60\.0%.*40\.0%/i });
    expect(bar).toBeInTheDocument();
  });

  it('renders hero label and villain label text', () => {
    render(
      <EquityBarBroadcast
        heroEquityPct={50}
        heroLabel="YOU"
        villainLabel="THEM"
      />
    );

    expect(screen.getByText('YOU')).toBeInTheDocument();
    expect(screen.getByText('THEM')).toBeInTheDocument();
  });
});

// ── 2. Hand-strength label ───────────────────────────────────

describe('BroadcastHUD — hand-strength label', () => {
  it('shows the label pill when heroHand is set', () => {
    render(<BroadcastHUD heroHand="FLUSH DRAW" />);
    expect(screen.getByText('FLUSH DRAW')).toBeInTheDocument();
  });

  it('does NOT render a label pill when heroHand is null', () => {
    render(<BroadcastHUD heroHand={null} toCall={10} />);
    // No .bhud__hand-label-text → nothing with pill class content
    expect(screen.queryByText(/FLUSH DRAW/i)).not.toBeInTheDocument();
  });

  it('renders several hand-strength categories correctly', () => {
    const { rerender } = render(<BroadcastHUD heroHand="TOP PAIR" />);
    expect(screen.getByText('TOP PAIR')).toBeInTheDocument();

    rerender(<BroadcastHUD heroHand="DRAWING DEAD" />);
    expect(screen.getByText('DRAWING DEAD')).toBeInTheDocument();

    rerender(<BroadcastHUD heroHand="STRAIGHT DRAW" />);
    expect(screen.getByText('STRAIGHT DRAW')).toBeInTheDocument();
  });
});

// ── 3. To-call strip ─────────────────────────────────────────

describe('BroadcastHUD — to-call strip', () => {
  it('shows the strip and amount when toCall > 0', () => {
    render(<BroadcastHUD toCall={12} potOdds="3.2:1" />);

    // aria-label on the strip div
    const strip = screen.getByLabelText(/to call \$12/i);
    expect(strip).toBeInTheDocument();

    // Visible amount text
    expect(screen.getByText('$12')).toBeInTheDocument();
  });

  it('shows pot odds ratio when potOdds is provided', () => {
    render(<BroadcastHUD toCall={20} potOdds="2.5:1" />);
    expect(screen.getByText('2.5:1')).toBeInTheDocument();
  });

  it('does NOT render the strip when toCall is 0', () => {
    render(<BroadcastHUD heroHand="FLUSH DRAW" toCall={0} />);
    expect(screen.queryByText(/to call/i)).not.toBeInTheDocument();
  });

  it('does NOT render the strip when toCall is falsy', () => {
    render(<BroadcastHUD heroHand="TOP PAIR" />);
    expect(screen.queryByText(/to call/i)).not.toBeInTheDocument();
  });
});

// ── 4. Full BroadcastHUD with equity bar ─────────────────────

describe('BroadcastHUD — equity bar integration', () => {
  it('renders the EquityBarBroadcast when equity prop is provided', () => {
    render(
      <BroadcastHUD
        heroHand="OPEN-ENDED STRAIGHT"
        toCall={15}
        potOdds="4.1:1"
        equity={{ heroEquityPct: 42.1, heroLabel: 'Hero', villainLabel: 'Villain' }}
      />
    );

    // Bar aria-label should be in the document
    const bar = screen.getByRole('img', { name: /42\.1%/i });
    expect(bar).toBeInTheDocument();

    // The hand label and strip also present
    expect(screen.getByText('OPEN-ENDED STRAIGHT')).toBeInTheDocument();
    expect(screen.getByText('$15')).toBeInTheDocument();
  });

  it('returns null and renders nothing when all props are empty', () => {
    const { container } = render(<BroadcastHUD />);
    // Component returns null → container has no children
    expect(container.firstChild).toBeNull();
  });
});
