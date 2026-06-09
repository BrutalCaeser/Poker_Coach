/**
 * PlayerPod.test.jsx
 * Vitest + @testing-library/react (jsdom)
 *
 * Covers:
 *   1. Renders player name and stack
 *   2. isFolded applies the folded CSS class
 *   3. isAllIn shows "ALL IN" text
 *   4. isHero shows the "YOU" treatment
 *   5. currentBet > 0 renders the bet chip
 *   6. isActive renders the timer arc
 *   7. Hole cards render (face-down by default, face-up when revealCards)
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import PlayerPod from '../PlayerPod.jsx';

/* jsdom does not implement matchMedia — stub it out */
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

/* ── shared fixture ─────────────────────────────────────────── */

const basePlayer = {
  name: 'Phil Ivey',
  stack: 4620000,
  position: 'BTN',
  country: 'US',
  isPro: true,
  avatarId: 'phil-ivey',
  behaviour: 'Tight-aggressive',
  era: '2003 WSOP',
};

const heroPlayer = {
  name: 'You',
  stack: 1500000,
  position: 'BB',
};

/* ── 1. Name and stack ──────────────────────────────────────── */

describe('basic render', () => {
  it('renders the player name', () => {
    render(<PlayerPod player={basePlayer} />);
    // Name is rendered toUpperCase in the component
    expect(screen.getByText('PHIL IVEY')).toBeInTheDocument();
  });

  it('renders the formatted stack count', () => {
    render(<PlayerPod player={basePlayer} />);
    // 4,620,000 — comma-separated
    expect(screen.getByText('4,620,000')).toBeInTheDocument();
  });

  it('renders the position label', () => {
    render(<PlayerPod player={basePlayer} />);
    expect(screen.getByText('BTN')).toBeInTheDocument();
  });

  it('renders with only required props (player + no state)', () => {
    const minPlayer = { name: 'Bob', stack: 100 };
    render(<PlayerPod player={minPlayer} />);
    expect(screen.getByText('BOB')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});

/* ── 2. isFolded class ──────────────────────────────────────── */

describe('isFolded', () => {
  it('applies the pp--folded CSS class to the bar', () => {
    const { container } = render(
      <PlayerPod player={basePlayer} isFolded />
    );
    const bar = container.querySelector('.pp');
    expect(bar).toHaveClass('pp--folded');
  });

  it('does NOT apply pp--folded when not folded', () => {
    const { container } = render(
      <PlayerPod player={basePlayer} isFolded={false} />
    );
    const bar = container.querySelector('.pp');
    expect(bar).not.toHaveClass('pp--folded');
  });

  it('encodes "folded" in the aria-label', () => {
    render(<PlayerPod player={basePlayer} isFolded />);
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-label', expect.stringContaining('folded'));
  });
});

/* ── 3. isAllIn ─────────────────────────────────────────────── */

describe('isAllIn', () => {
  it('shows "ALL IN" text when isAllIn=true', () => {
    render(<PlayerPod player={basePlayer} isAllIn />);
    expect(screen.getByText('ALL IN')).toBeInTheDocument();
  });

  it('does NOT show "ALL IN" when isAllIn=false', () => {
    render(<PlayerPod player={basePlayer} isAllIn={false} />);
    expect(screen.queryByText('ALL IN')).not.toBeInTheDocument();
  });

  it('applies the pp--allin CSS class', () => {
    const { container } = render(
      <PlayerPod player={basePlayer} isAllIn />
    );
    expect(container.querySelector('.pp')).toHaveClass('pp--allin');
  });

  it('encodes "all-in" in the aria-label', () => {
    render(<PlayerPod player={basePlayer} isAllIn />);
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-label', expect.stringContaining('all-in'));
  });
});

/* ── 4. isHero — "YOU" treatment ────────────────────────────── */

describe('isHero', () => {
  it('renders the YOU text in the avatar for the hero seat', () => {
    render(<PlayerPod player={heroPlayer} isHero />);
    // Both the avatar (.pp-avatar__you) and the name (.pp-name) contain "YOU"
    // when the heroPlayer's name is "You" — confirm at least one matches
    const youElements = screen.getAllByText('YOU');
    expect(youElements.length).toBeGreaterThanOrEqual(1);
    // Confirm at least one is the avatar treatment specifically
    const avatarYou = youElements.find((el) =>
      el.classList.contains('pp-avatar__you')
    );
    expect(avatarYou).toBeDefined();
  });

  it('applies the pp--hero CSS class', () => {
    const { container } = render(
      <PlayerPod player={heroPlayer} isHero />
    );
    expect(container.querySelector('.pp')).toHaveClass('pp--hero');
  });

  it('does NOT show "YOU" for non-hero seats', () => {
    render(<PlayerPod player={basePlayer} isHero={false} />);
    expect(screen.queryByText('YOU')).not.toBeInTheDocument();
  });

  it('encodes "your seat" in the aria-label for hero', () => {
    render(<PlayerPod player={heroPlayer} isHero />);
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-label', expect.stringContaining('your seat'));
  });
});

/* ── 5. currentBet — bet chip ───────────────────────────────── */

describe('currentBet', () => {
  it('renders the bet chip when currentBet > 0', () => {
    render(<PlayerPod player={basePlayer} currentBet={250000} />);
    // BetChip renders an element with aria-label "Current bet: ..."
    expect(
      screen.getByLabelText(/current bet/i)
    ).toBeInTheDocument();
  });

  it('shows the formatted bet amount inside the chip', () => {
    render(<PlayerPod player={basePlayer} currentBet={250000} />);
    expect(screen.getByText('250,000')).toBeInTheDocument();
  });

  it('does NOT render a bet chip when currentBet is 0', () => {
    render(<PlayerPod player={basePlayer} currentBet={0} />);
    expect(screen.queryByLabelText(/current bet/i)).not.toBeInTheDocument();
  });
});

/* ── 6. isActive — timer arc ────────────────────────────────── */

describe('isActive', () => {
  it('renders the timer arc container when isActive=true', () => {
    const { container } = render(
      <PlayerPod player={basePlayer} isActive timerFraction={0.7} />
    );
    expect(container.querySelector('.pp-timer-arc')).not.toBeNull();
  });

  it('does NOT render the timer arc when not active', () => {
    const { container } = render(
      <PlayerPod player={basePlayer} isActive={false} />
    );
    expect(container.querySelector('.pp-timer-arc')).toBeNull();
  });

  it('applies the pp--active CSS class', () => {
    const { container } = render(
      <PlayerPod player={basePlayer} isActive />
    );
    expect(container.querySelector('.pp')).toHaveClass('pp--active');
  });

  it('encodes "active" in the aria-label', () => {
    render(<PlayerPod player={basePlayer} isActive />);
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-label', expect.stringContaining('active'));
  });
});

/* ── 7. Hole cards ──────────────────────────────────────────── */

describe('holeCards', () => {
  it('renders the hole cards container when holeCards are provided', () => {
    const { container } = render(
      <PlayerPod
        player={basePlayer}
        holeCards={['Ah', 'Kd']}
      />
    );
    expect(container.querySelector('.pp-cards')).not.toBeNull();
  });

  it('does NOT render the cards container when no holeCards', () => {
    const { container } = render(
      <PlayerPod player={basePlayer} />
    );
    expect(container.querySelector('.pp-cards')).toBeNull();
  });

  it('renders cards face-down by default (revealCards=false)', () => {
    render(
      <PlayerPod
        player={basePlayer}
        holeCards={['Ah', 'Kd']}
        revealCards={false}
      />
    );
    // Face-down cards have aria-label="Face-down card"
    const faceDownCards = screen.getAllByLabelText(/face-down card/i);
    expect(faceDownCards).toHaveLength(2);
  });

  it('renders cards face-up when revealCards=true', () => {
    render(
      <PlayerPod
        player={basePlayer}
        holeCards={['Ah', 'Kd']}
        revealCards
      />
    );
    // Card.jsx produces aria-label like "A of hearts" / "K of diamonds"
    expect(screen.getByLabelText(/^A of hearts$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^K of diamonds$/i)).toBeInTheDocument();
  });
});
