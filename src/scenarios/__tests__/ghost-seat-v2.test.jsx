/**
 * ghost-seat-v2.test.jsx
 * ======================
 * Tests for the multi-DP Ghost Seat state machine and related helpers.
 *
 * Uses a synthetic 2-DP inline hand (NOT in index.js) so these tests are
 * fully self-contained and don't depend on any real hand file being present.
 *
 * Coverage:
 *   1. computeRevealMathForDP — returns engine numbers for a specific DP
 *   2. MathReveal v2 — renders beat card with proAction prop
 *   3. MathReveal v1 — proAction absent → no beat card (backward-compat)
 *   4. ScenarioPlay v2 reducer flow:
 *        SETUP → ACTIONS → DECISION (DP0) → STREET_REVEAL
 *        → ACTIONS → DECISION (DP1) → STREET_REVEAL → FINAL_REVEAL
 *   5. realHandScenarios export — is an array (empty until hand file lands)
 *   6. getScenarioById — still finds all 15 curated scenarios
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { computeRevealMathForDP } from '../../engine/revealMath.js';
import MathReveal from '../../components/MathReveal.jsx';
import ScenarioPlay from '../../components/ScenarioPlay.jsx';
import { scenarios, getScenarioById, realHandScenarios } from '../index.js';

// ---------------------------------------------------------------------------
// jsdom stubs
// ---------------------------------------------------------------------------
beforeAll(() => {
  if (!window.matchMedia) {
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
  }

  // jsdom does not implement Element.scrollTo — stub it globally so ScenarioPlay
  // and ActionFeed auto-scroll effects don't throw.
  if (!Element.prototype.scrollTo) {
    Element.prototype.scrollTo = () => {};
  }
  // Also stub window.scrollTo for completeness.
  if (!window.scrollTo) {
    window.scrollTo = () => {};
  }
});

// ---------------------------------------------------------------------------
// Synthetic 2-DP scenario (inline, never registered in index.js)
// ---------------------------------------------------------------------------
// Models a simplified flop + turn spot so the engine has real cards to work with.

const SYNTHETIC_HAND = {
  id: 'synthetic-2dp-test',
  title: 'Synthetic 2-DP Test Hand',
  source: { type: 'test', name: 'Ghost Seat Test Suite', description: 'Synthetic hand for unit tests' },
  concepts: ['pot-odds', 'draw-equity'],
  difficulty: 2,
  category: 'cash',

  players: [
    { name: 'You', position: 'CO', stack: 10000, cards: ['As', '9s'], behaviour: null, isPro: false },
    { name: 'The Villain', position: 'BB', stack: 10000, cards: ['Kh', 'Qd'], behaviour: 'Tight-Aggressive', isPro: false },
  ],
  blinds: { small: 50, big: 100, ante: 0 },
  heroIndex: 0,
  board: [],

  realHand: {
    event: 'Test Event',
    venue: 'Test Venue',
    date: '2003',
  },

  actions: [
    { type: 'info', text: 'Cash game — $50/$100 blinds.' },
    { type: 'info', text: 'Blinds posted: $50/$100' },
    { type: 'bet', player: 0, name: 'You', action: 'raises to', amount: 300 },
    { type: 'bet', player: 1, name: 'The Villain', action: 'calls', amount: 300 },
    { type: 'info', text: 'Pot: $650' },
    { type: 'board', cards: ['Ts', '6s', '3d'] },
    { type: 'info', text: 'Flop: Ts 6s 3d — nut flush draw!' },
    { type: 'bet', player: 1, name: 'The Villain', action: 'bets', amount: 325 },
    { type: 'info', text: 'Villain bets $325. Pot: $975.' },
    // DP0 — flop decision
    { type: 'decision', decisionId: 'flop', options: ['call', 'fold'], callAmount: 325 },
    { type: 'info', text: 'You called the flop.' },
    { type: 'board', cards: ['2h'] },
    { type: 'info', text: 'Turn: 2h — blank.' },
    { type: 'bet', player: 1, name: 'The Villain', action: 'bets', amount: 650 },
    { type: 'info', text: 'Villain bets $650. Pot: $2,275.' },
    // DP1 — turn decision
    { type: 'decision', decisionId: 'turn', options: ['call', 'fold'], callAmount: 650 },
  ],

  decisionPoints: [
    {
      id: 'flop',
      street: 'Flop',
      options: ['call', 'fold'],
      callAmount: 325,
      correctAction: 'call',
      pot: 975,
      heroStack: 9700,
      proAction: 'call',
      proReasoning: 'Nut flush draw with direct odds.',
      drawEquityPct: 19.6,
      mathSteps: [
        { label: 'Your outs', value: '9 flush outs', status: 'key' },
        { label: 'Pot odds threshold', value: '25.0%', formula: '$325 / ($975+$325) = 25.0%' },
        { label: 'Verdict', value: 'CALL — implied odds bridge the gap', status: 'key' },
      ],
      insight: 'With the nut flush draw, you have strong equity and the stack depth makes this a clear call.',
      takeaway: 'Nut flush draws with small implied-odds gaps are easy calls.',
    },
    {
      id: 'turn',
      street: 'Turn',
      options: ['call', 'fold'],
      callAmount: 650,
      correctAction: 'call',
      pot: 2275,
      heroStack: 9375,
      proAction: 'fold',
      proReasoning: 'Pro thought the villain had a set.',
      drawEquityPct: 19.6,
      mathSteps: [
        { label: 'Your outs', value: '9 flush outs', status: 'key' },
        { label: 'Pot odds threshold', value: '22.2%', formula: '$650 / ($2275+$650) = 22.2%' },
        { label: 'Verdict', value: 'CALL — direct odds are sufficient', status: 'key' },
      ],
      insight: 'The nut flush draw still has direct odds on the turn.',
      takeaway: 'When direct odds are sufficient, you do not need implied odds.',
    },
  ],

  streetResults: [
    {
      afterDpId: 'flop',
      continuationActions: [],
      newBoard: ['2h'],
    },
    {
      afterDpId: 'turn',
      continuationActions: [],
    },
  ],

  handResult: {
    potTotal: 3575,
    winnerIndex: 0,
    winnerName: 'You',
    showdownDesc: 'Flush beats top pair',
  },
};

// ---------------------------------------------------------------------------
// 1. computeRevealMathForDP
// ---------------------------------------------------------------------------

describe('computeRevealMathForDP', () => {
  it('returns valid pot odds for DP0 (flop)', () => {
    const result = computeRevealMathForDP(SYNTHETIC_HAND, 0);
    expect(result).toBeDefined();
    // potOdds: 325 / (975 + 325) = 25.0%
    expect(result.potOddsPct).toBeCloseTo(25.0, 0);
    expect(typeof result.isAllIn).toBe('boolean');
  });

  it('returns valid pot odds for DP1 (turn)', () => {
    const result = computeRevealMathForDP(SYNTHETIC_HAND, 1);
    // potOdds: 650 / (2275 + 650) ≈ 22.2%
    expect(result.potOddsPct).toBeCloseTo(22.2, 0);
  });

  it('DP0 boardLen is 3 (flop cards visible)', () => {
    const result = computeRevealMathForDP(SYNTHETIC_HAND, 0);
    expect(result.boardLen).toBe(3);
  });

  it('DP1 boardLen is 4 (flop + turn)', () => {
    const result = computeRevealMathForDP(SYNTHETIC_HAND, 1);
    expect(result.boardLen).toBe(4);
  });

  it('does not throw when called on either DP', () => {
    expect(() => computeRevealMathForDP(SYNTHETIC_HAND, 0)).not.toThrow();
    expect(() => computeRevealMathForDP(SYNTHETIC_HAND, 1)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 2. MathReveal — V2 (proAction present) renders the beat card
// ---------------------------------------------------------------------------

const V2_MATH_REVEAL_PROPS = {
  isCorrect: true,
  userAction: 'call',
  correctAction: 'call',
  proAction: 'fold',
  proReasoning: 'Pro thought the villain had a set.',
  insight: 'Nut flush draw on the turn.',
  mathSteps: [
    { label: 'Your outs', value: '9', status: 'key' },
    { label: 'Verdict', value: 'CALL', status: 'key' },
  ],
  takeaway: 'Direct odds are sufficient.',
};

describe('MathReveal v2 (proAction present)', () => {
  it('renders beat-card rows: The Pro and GTO Verdict (waits for phase 1)', () => {
    render(<MathReveal {...V2_MATH_REVEAL_PROPS} />);
    // The beat card appears at phase 1 (after a 600ms delay following the verdict).
    return waitFor(() => {
      expect(screen.getByText('The Pro')).toBeInTheDocument();
      expect(screen.getByText('GTO Verdict')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('shows "You out-played the pro" badge when user is correct and pro is not', () => {
    render(<MathReveal {...V2_MATH_REVEAL_PROPS} />);
    return waitFor(() => {
      expect(screen.getByText(/you out-played the pro/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('shows "pro-reasoning" when provided', () => {
    render(<MathReveal {...V2_MATH_REVEAL_PROPS} />);
    return waitFor(() => {
      expect(screen.getByText(/villain had a set/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});

// ---------------------------------------------------------------------------
// 3. MathReveal v1 (no proAction) — beat card must NOT appear
// ---------------------------------------------------------------------------

describe('MathReveal v1 (no proAction — backward compat)', () => {
  it('does NOT render beat-card rows when proAction is absent', () => {
    render(
      <MathReveal
        isCorrect={true}
        userAction="call"
        correctAction="call"
        insight="Test insight."
        mathSteps={[{ label: 'Step', value: '99%', status: 'key' }]}
        takeaway="Test takeaway."
      />,
    );
    expect(screen.queryByText('The Pro')).not.toBeInTheDocument();
    expect(screen.queryByText('GTO Verdict')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 4. ScenarioPlay v2 — reducer flow via UI interactions
// ---------------------------------------------------------------------------

// Minimal stubs so ScenarioPlay renders in jsdom without crashing on Table/etc.
// We render with a real scenario but skip testing Table internals.

// Helper: find the "Call" decision button.
// DecisionPrompt renders: <button class="decision-btn--call">Call<span>$325</span></button>
// The accessible name includes the amount text; query by className instead.
function getCallDecisionBtn(container) {
  return container.querySelector('.decision-btn--call');
}

describe('ScenarioPlay v2 — state machine flow', () => {
  const noop = () => {};

  it('renders the scenario title', () => {
    const { container } = render(
      <ScenarioPlay
        scenario={SYNTHETIC_HAND}
        onBack={noop}
        onNext={noop}
      />,
    );
    expect(screen.getByText('Synthetic 2-DP Test Hand')).toBeInTheDocument();
  });

  it('shows real-hand event/date meta in header', () => {
    render(
      <ScenarioPlay
        scenario={SYNTHETIC_HAND}
        onBack={noop}
        onNext={noop}
      />,
    );
    expect(screen.getByText(/Test Event/)).toBeInTheDocument();
  });

  it('eventually shows a DecisionPrompt (Call button) after auto-advance', async () => {
    const { container } = render(
      <ScenarioPlay
        scenario={SYNTHETIC_HAND}
        onBack={noop}
        onNext={noop}
      />,
    );
    await waitFor(() => {
      expect(getCallDecisionBtn(container)).not.toBeNull();
    }, { timeout: 10000 });
  });

  it('after committing DP0, shows STREET_REVEAL with "The Pro" beat card', async () => {
    const { container } = render(
      <ScenarioPlay
        scenario={SYNTHETIC_HAND}
        onBack={noop}
        onNext={noop}
      />,
    );

    // Wait for DecisionPrompt
    await waitFor(() => {
      expect(getCallDecisionBtn(container)).not.toBeNull();
    }, { timeout: 10000 });

    fireEvent.click(getCallDecisionBtn(container));

    // After committing, STREET_REVEAL → beat card animates in
    await waitFor(() => {
      expect(screen.getByText('The Pro')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('after Continue, advances to DP1 and shows another Call button', async () => {
    const { container } = render(
      <ScenarioPlay
        scenario={SYNTHETIC_HAND}
        onBack={noop}
        onNext={noop}
      />,
    );

    // Commit DP0
    await waitFor(() => expect(getCallDecisionBtn(container)).not.toBeNull(), { timeout: 10000 });
    fireEvent.click(getCallDecisionBtn(container));

    // Click Continue
    const continueBtn = await screen.findByText(/Continue/i, {}, { timeout: 3000 });
    fireEvent.click(continueBtn);

    // DP1 decision prompt
    await waitFor(() => {
      expect(getCallDecisionBtn(container)).not.toBeNull();
    }, { timeout: 10000 });
  });

  it('after committing both DPs and continuing, shows the final scorecard', async () => {
    const { container } = render(
      <ScenarioPlay
        scenario={SYNTHETIC_HAND}
        onBack={noop}
        onNext={noop}
      />,
    );

    // Commit DP0
    await waitFor(() => expect(getCallDecisionBtn(container)).not.toBeNull(), { timeout: 10000 });
    fireEvent.click(getCallDecisionBtn(container));

    // Continue to DP1
    const continueBtn1 = await screen.findByText(/Continue/i, {}, { timeout: 3000 });
    fireEvent.click(continueBtn1);

    // Commit DP1
    await waitFor(() => expect(getCallDecisionBtn(container)).not.toBeNull(), { timeout: 10000 });
    fireEvent.click(getCallDecisionBtn(container));

    // After Fix 2, the last DP's button says "See Final Result" not "Continue"
    const continueBtn2 = await screen.findByText(/See Final Result/i, {}, { timeout: 3000 });
    fireEvent.click(continueBtn2);

    // Final scorecard
    await waitFor(() => {
      expect(screen.getByText(/Hand Complete/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

// ---------------------------------------------------------------------------
// 5. realHandScenarios export
// ---------------------------------------------------------------------------

describe('realHandScenarios export', () => {
  it('is an array', () => {
    expect(Array.isArray(realHandScenarios)).toBe(true);
  });

  it('contains no nulls or undefined', () => {
    for (const s of realHandScenarios) {
      expect(s).not.toBeNull();
      expect(s).not.toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// 6. getScenarioById still finds all 15 curated scenarios
// ---------------------------------------------------------------------------

describe('getScenarioById — backward compat', () => {
  it('finds all 15 curated scenarios by id', () => {
    expect(scenarios).toHaveLength(15);
    for (const s of scenarios) {
      expect(getScenarioById(s.id)).toBe(s);
    }
  });

  it('returns undefined for nonexistent id', () => {
    expect(getScenarioById('nonexistent-id-xyz')).toBeUndefined();
  });

  it('returns undefined for the synthetic test hand (not registered)', () => {
    expect(getScenarioById('synthetic-2dp-test')).toBeUndefined();
  });
});
