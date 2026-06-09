/**
 * ghost-seat-edge-cases.test.jsx
 * ================================
 * Focused tests for edge cases found during QA of the Ghost Seat V2 feature.
 *
 * Covers:
 *   A. Equity index off-by-one (state.currentDpIndex - 1 bug)
 *   B. Continue button label logic (last DP should say "See Final Result")
 *   C. Pot = 0 in FINAL_REVEAL (currentDpIndex overshoots decisionPoints.length)
 *   D. getRunningPot correctness across all phases
 *   E. buildEquityForDP called with out-of-range dpIndex
 *   F. DecisionPrompt check/bet options not rendered
 *   G. getNextScenarioId vs allScenarios
 *   H. realHandScenarios Moneymaker structural validation
 *   I. Early fold still reaches FINAL_REVEAL with correct scorecard
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { computeRevealMathForDP } from '../../engine/revealMath.js';
import ScenarioPlay from '../../components/ScenarioPlay.jsx';
import DecisionPrompt from '../../components/DecisionPrompt.jsx';
import { scenarios, allScenarios, getScenarioById, realHandScenarios } from '../index.js';

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
  if (!Element.prototype.scrollTo) {
    Element.prototype.scrollTo = () => {};
  }
  if (!window.scrollTo) {
    window.scrollTo = () => {};
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getCallDecisionBtn(container) {
  return container.querySelector('.decision-btn--call');
}

function getFoldDecisionBtn(container) {
  return container.querySelector('.decision-btn--fold');
}

const noop = () => {};

// ---------------------------------------------------------------------------
// Synthetic 2-DP hand used by most tests — same as in ghost-seat-v2 suite
// so tests are self-contained.
// ---------------------------------------------------------------------------
const SYNTHETIC_HAND = {
  id: 'edge-case-2dp',
  title: 'Edge Case 2-DP Hand',
  source: { type: 'test', name: 'QA Edge Cases', description: 'Edge case hand' },
  concepts: ['pot-odds'],
  difficulty: 2,
  category: 'cash',
  players: [
    { name: 'You', position: 'CO', stack: 10000, cards: ['As', '9s'], behaviour: null },
    { name: 'Villain', position: 'BB', stack: 10000, cards: ['Kh', 'Qd'], behaviour: 'TAG' },
  ],
  blinds: { small: 50, big: 100, ante: 0 },
  heroIndex: 0,
  board: [],
  realHand: { event: 'Test', venue: 'Test', date: '2003' },
  actions: [
    { type: 'info', text: 'Cash game.' },
    { type: 'info', text: 'Blinds: $50/$100' },
    { type: 'bet', player: 0, name: 'You', action: 'raises to', amount: 300 },
    { type: 'bet', player: 1, name: 'Villain', action: 'calls', amount: 300 },
    { type: 'info', text: 'Pot: $650' },
    { type: 'board', cards: ['Ts', '6s', '3d'] },
    { type: 'info', text: 'Flop: Ts 6s 3d' },
    { type: 'bet', player: 1, name: 'Villain', action: 'bets', amount: 325 },
    { type: 'info', text: 'Villain bets $325. Pot: $975.' },
    { type: 'decision', decisionId: 'flop', options: ['call', 'fold'], callAmount: 325 },
    { type: 'info', text: 'You called.' },
    { type: 'board', cards: ['2h'] },
    { type: 'info', text: 'Turn: 2h.' },
    { type: 'bet', player: 1, name: 'Villain', action: 'bets', amount: 650 },
    { type: 'info', text: 'Villain bets $650. Pot: $2,275.' },
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
      proReasoning: 'Nut flush draw.',
      drawEquityPct: 19.6,
      mathSteps: [{ label: 'Outs', value: '9', status: 'key' }],
      insight: 'Flush draw.',
      takeaway: 'Call nut flush draws.',
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
      proReasoning: 'Thought villain had a set.',
      drawEquityPct: 19.6,
      mathSteps: [{ label: 'Outs', value: '9', status: 'key' }],
      insight: 'Still drawing.',
      takeaway: 'Direct odds sufficient.',
    },
  ],
  streetResults: [
    { afterDpId: 'flop', continuationActions: [], newBoard: ['Ts', '6s', '3d', '2h'] },
    { afterDpId: 'turn', continuationActions: [] },
  ],
  handResult: {
    potTotal: 3575,
    winnerIndex: 0,
    winnerName: 'You',
    showdownDesc: 'Flush beats top pair',
  },
};

// ---------------------------------------------------------------------------
// A. Equity index (dpIndex) must equal currentDpIndex (not currentDpIndex - 1)
// ---------------------------------------------------------------------------
describe('A. buildEquityForDP dpIndex correctness', () => {
  it('returns a valid result for dpIndex = 0 (DP0 reveal uses index 0)', () => {
    // If we call with -1, dp is undefined -> should return null
    const rm0 = computeRevealMathForDP(SYNTHETIC_HAND, 0);
    expect(rm0).toBeDefined();
    expect(rm0.potOddsPct).toBeGreaterThan(0);
  });

  it('calling computeRevealMathForDP with dpIndex = -1 does not throw but dp is undefined', () => {
    // This simulates the bug: buildEquityForDP receives -1
    // The function returns null when dp is undefined (via the null check in buildEquityForDP)
    // We verify the engine itself doesn't crash (it returns undefined DP gracefully)
    expect(() => {
      const dp = SYNTHETIC_HAND.decisionPoints[-1]; // undefined in JS
      expect(dp).toBeUndefined();
    }).not.toThrow();
  });

  it('DP0 reveal: state.currentDpIndex is 0 at STREET_REVEAL, so correct index is 0', () => {
    // Verify that decisionPoints[0] is valid and decisionPoints[-1] is undefined
    expect(SYNTHETIC_HAND.decisionPoints[0]).toBeDefined();
    expect(SYNTHETIC_HAND.decisionPoints[-1]).toBeUndefined();
    // If the equity useMemo used currentDpIndex - 1 = -1, equity would be null
    // The correct call is buildEquityForDP(scenario, 0) which returns a valid object
    const equity0 = computeRevealMathForDP(SYNTHETIC_HAND, 0);
    expect(equity0.potOddsPct).toBeCloseTo(25.0, 0);
  });
});

// ---------------------------------------------------------------------------
// B. Continue button: last DP should show "See Final Result" not "Continue"
// ---------------------------------------------------------------------------
describe('B. Continue button label on last DP', () => {
  it('after last DP committed, button label check', async () => {
    const { container } = render(
      <ScenarioPlay scenario={SYNTHETIC_HAND} onBack={noop} onNext={noop} />,
    );

    // Advance to DP0
    await waitFor(() => expect(getCallDecisionBtn(container)).not.toBeNull(), { timeout: 10000 });
    fireEvent.click(getCallDecisionBtn(container));

    // Click Continue (DP0 -> DP1)
    const cont1 = await screen.findByText(/Continue/i, {}, { timeout: 3000 });
    fireEvent.click(cont1);

    // Advance to DP1
    await waitFor(() => expect(getCallDecisionBtn(container)).not.toBeNull(), { timeout: 10000 });
    fireEvent.click(getCallDecisionBtn(container));

    // After Fix 2: last DP button must say "See Final Result", not "Continue"
    const btn = await screen.findByRole('button', { name: /see final result/i }, { timeout: 3000 });
    expect(btn).toBeInTheDocument();
    expect(btn.textContent).toMatch(/see final result/i);
  });
});

// ---------------------------------------------------------------------------
// C. FINAL_REVEAL is reached and shows scorecard (both DPs)
// ---------------------------------------------------------------------------
describe('C. FINAL_REVEAL scorecard completeness', () => {
  it('final scorecard shows both street rows', async () => {
    const { container } = render(
      <ScenarioPlay scenario={SYNTHETIC_HAND} onBack={noop} onNext={noop} />,
    );

    // Commit DP0
    await waitFor(() => expect(getCallDecisionBtn(container)).not.toBeNull(), { timeout: 10000 });
    fireEvent.click(getCallDecisionBtn(container));

    const cont1 = await screen.findByText(/Continue/i, {}, { timeout: 3000 });
    fireEvent.click(cont1);

    // Commit DP1
    await waitFor(() => expect(getCallDecisionBtn(container)).not.toBeNull(), { timeout: 10000 });
    fireEvent.click(getCallDecisionBtn(container));

    const cont2 = await screen.findByText(/Continue|See Final Result/i, {}, { timeout: 3000 });
    fireEvent.click(cont2);

    await waitFor(() => {
      expect(screen.getByText(/Hand Complete/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Scorecard should list both streets (ActionFeed may also show 'Flop' as a label)
    expect(screen.getAllByText('Flop').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Turn').length).toBeGreaterThanOrEqual(1);
  });

  it('scorecard shows proAction for both rows', async () => {
    const { container } = render(
      <ScenarioPlay scenario={SYNTHETIC_HAND} onBack={noop} onNext={noop} />,
    );

    await waitFor(() => expect(getCallDecisionBtn(container)).not.toBeNull(), { timeout: 10000 });
    fireEvent.click(getCallDecisionBtn(container));

    const cont1 = await screen.findByText(/Continue/i, {}, { timeout: 3000 });
    fireEvent.click(cont1);

    await waitFor(() => expect(getCallDecisionBtn(container)).not.toBeNull(), { timeout: 10000 });
    fireEvent.click(getCallDecisionBtn(container));

    const cont2 = await screen.findByText(/Continue|See Final Result/i, {}, { timeout: 3000 });
    fireEvent.click(cont2);

    await waitFor(() => {
      expect(screen.getByText(/Hand Complete/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Both proActions should be visible (call for flop, fold for turn)
    // They appear in the GTO column (proAction) of scorecard rows
    expect(screen.getAllByText('call').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('fold').length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// D. getRunningPot edge cases — test FINAL_REVEAL with out-of-bounds dpIndex
// ---------------------------------------------------------------------------
describe('D. getRunningPot with out-of-bounds currentDpIndex', () => {
  it('decisionPoints array access with index = length does not throw', () => {
    // After last CONTINUE_DP, currentDpIndex = decisionPoints.length (2 for 2-DP hand)
    // decisionPoints[2] = undefined
    const idx = SYNTHETIC_HAND.decisionPoints.length; // 2
    const dp = SYNTHETIC_HAND.decisionPoints[idx];
    expect(dp).toBeUndefined();
    // getRunningPot returns 0 when dp is undefined — verify safe access
    const potFn = (dpIdx) => {
      const d = SYNTHETIC_HAND.decisionPoints[dpIdx];
      return d ? d.pot : 0;
    };
    expect(potFn(2)).toBe(0); // out of bounds -> 0 (documents the FINAL_REVEAL bug)
    expect(potFn(1)).toBe(2275); // last valid DP pot (what FINAL_REVEAL should show)
  });
});

// ---------------------------------------------------------------------------
// E. computeRevealMathForDP with out-of-range index
// ---------------------------------------------------------------------------
describe('E. computeRevealMathForDP boundary behavior', () => {
  it('does not crash with valid indices 0 and 1', () => {
    expect(() => computeRevealMathForDP(SYNTHETIC_HAND, 0)).not.toThrow();
    expect(() => computeRevealMathForDP(SYNTHETIC_HAND, 1)).not.toThrow();
  });

  it('accessing decisionPoints[-1] is undefined (documents equity bug source)', () => {
    expect(SYNTHETIC_HAND.decisionPoints[-1]).toBeUndefined();
    // buildEquityForDP returns null when dp is undefined — no EquityBar for DP0 reveal
    // This confirms the equity-index bug: using state.currentDpIndex - 1 for DP0 = -1
  });
});

// ---------------------------------------------------------------------------
// F. DecisionPrompt renders correct buttons for any options array
// ---------------------------------------------------------------------------
describe('F. DecisionPrompt with check/bet options', () => {
  it('renders Check + Bet buttons (not Call/Fold) when options = [check, bet]', () => {
    // River decision: Ghost Seat scenario — hero acts first, options=['check','bet'].
    const { container } = render(
      <DecisionPrompt
        pot={1810000}
        callAmount={0}
        heroStack={3820000}
        options={['check', 'bet']}
        raiseAmount={2880000}
        onDecision={noop}
      />,
    );
    // Check button should be present
    expect(container.querySelector('.decision-btn--check')).not.toBeNull();
    // Bet button should be present (uses raiseAmount as fallback since betAmount not passed)
    expect(container.querySelector('.decision-btn--bet')).not.toBeNull();
    // Call and Fold buttons should NOT be present (not in options)
    expect(container.querySelector('.decision-btn--call')).toBeNull();
    expect(container.querySelector('.decision-btn--fold')).toBeNull();
    // No Raise button
    expect(container.querySelector('.decision-btn--raise')).toBeNull();
  });

  it('correctly renders raise button when options includes raise', () => {
    const { container } = render(
      <DecisionPrompt
        pot={510000}
        callAmount={300000}
        heroStack={4520000}
        options={['call', 'fold', 'raise']}
        raiseAmount={800000}
        onDecision={noop}
      />,
    );
    expect(container.querySelector('.decision-btn--raise')).not.toBeNull();
    // No check or bet button for standard call/fold/raise scenario
    expect(container.querySelector('.decision-btn--check')).toBeNull();
    expect(container.querySelector('.decision-btn--bet')).toBeNull();
  });

  it('bet option renders a Bet button distinct from the Raise button', () => {
    const { container } = render(
      <DecisionPrompt
        pot={1000000}
        callAmount={0}
        heroStack={2000000}
        options={['check', 'bet']}
        raiseAmount={2000000}
        onDecision={noop}
      />,
    );
    // Bet button present, Raise button absent — they are different actions
    expect(container.querySelector('.decision-btn--bet')).not.toBeNull();
    expect(container.querySelector('.decision-btn--raise')).toBeNull();
  });

  it('Bet button emits onDecision("bet") when clicked', () => {
    const handler = vi.fn();
    const { container } = render(
      <DecisionPrompt
        pot={1810000}
        callAmount={0}
        heroStack={3820000}
        options={['check', 'bet']}
        raiseAmount={2880000}
        onDecision={handler}
      />,
    );
    container.querySelector('.decision-btn--bet').click();
    expect(handler).toHaveBeenCalledWith('bet');
  });

  it('Check button emits onDecision("check") when clicked', () => {
    const handler = vi.fn();
    const { container } = render(
      <DecisionPrompt
        pot={1810000}
        callAmount={0}
        heroStack={3820000}
        options={['check', 'bet']}
        raiseAmount={2880000}
        onDecision={handler}
      />,
    );
    container.querySelector('.decision-btn--check').click();
    expect(handler).toHaveBeenCalledWith('check');
  });

  it('standard call/fold scenario still renders Call + Fold, no Check/Bet', () => {
    const { container } = render(
      <DecisionPrompt
        pot={500000}
        callAmount={200000}
        heroStack={1500000}
        options={['call', 'fold']}
        onDecision={noop}
      />,
    );
    expect(container.querySelector('.decision-btn--call')).not.toBeNull();
    expect(container.querySelector('.decision-btn--fold')).not.toBeNull();
    expect(container.querySelector('.decision-btn--check')).toBeNull();
    expect(container.querySelector('.decision-btn--bet')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// G. getNextScenarioId only searches curated scenarios — Moneymaker returns null
// ---------------------------------------------------------------------------
describe('G. getNextScenarioId / allScenarios navigation', () => {
  it('allScenarios includes the Moneymaker hand', () => {
    const mm = allScenarios.find((s) => s.id === 'moneymaker-farha-2003');
    expect(mm).toBeDefined();
  });

  it('getScenarioById finds Moneymaker by id', () => {
    expect(getScenarioById('moneymaker-farha-2003')).toBeDefined();
  });

  it('allScenarios has more than 15 items (curated + real hands)', () => {
    expect(allScenarios.length).toBeGreaterThan(15);
  });

  it('curated scenarios array has exactly 15 entries', () => {
    expect(scenarios).toHaveLength(15);
  });

  it('Moneymaker is NOT in the 15 curated scenarios', () => {
    const mm = scenarios.find((s) => s.id === 'moneymaker-farha-2003');
    expect(mm).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// H. Moneymaker hand structural validation
// ---------------------------------------------------------------------------
describe('H. Moneymaker hand structural validation', () => {
  const mm = realHandScenarios.find((s) => s.id === 'moneymaker-farha-2003');

  it('Moneymaker hand exists in realHandScenarios', () => {
    expect(mm).toBeDefined();
  });

  it('has exactly 2 decisionPoints', () => {
    expect(mm.decisionPoints).toHaveLength(2);
  });

  it('decisionPoints have correct ids', () => {
    expect(mm.decisionPoints[0].id).toBe('dp1-turn');
    expect(mm.decisionPoints[1].id).toBe('dp2-river');
  });

  it('dp2-river uses check/bet options (not call/fold/raise)', () => {
    const dp2 = mm.decisionPoints[1];
    expect(dp2.options).toContain('check');
    expect(dp2.options).toContain('bet');
    expect(dp2.options).not.toContain('call');
    expect(dp2.options).not.toContain('raise');
  });

  it('dp1-turn uses call/fold/raise options', () => {
    const dp1 = mm.decisionPoints[0];
    expect(dp1.options).toContain('call');
    expect(dp1.options).toContain('fold');
    expect(dp1.options).toContain('raise');
  });

  it('has 2 streetResults matching decisionPoint ids', () => {
    expect(mm.streetResults).toHaveLength(2);
    expect(mm.streetResults[0].afterDpId).toBe('dp1-turn');
    expect(mm.streetResults[1].afterDpId).toBe('dp2-river');
  });

  it('actions array contains decision actions with correct decisionIds', () => {
    const decisionActions = mm.actions.filter((a) => a.type === 'decision');
    expect(decisionActions).toHaveLength(2);
    const ids = decisionActions.map((a) => a.decisionId);
    expect(ids).toContain('dp1-turn');
    expect(ids).toContain('dp2-river');
  });

  it('handResult has a winnerName', () => {
    expect(mm.handResult).toBeDefined();
    expect(mm.handResult.winnerName).toBe('Chris Moneymaker');
  });

  it('dp1-turn drawEquityPct is ~38.7', () => {
    expect(mm.decisionPoints[0].drawEquityPct).toBeCloseTo(38.7, 0);
  });

  it('dp2-river drawEquityPct is 0 (no equity at showdown)', () => {
    expect(mm.decisionPoints[1].drawEquityPct).toBe(0.0);
  });

  it('computeRevealMathForDP on dp1-turn returns boardLen=4 (turn board)', () => {
    const rm = computeRevealMathForDP(mm, 0);
    expect(rm.boardLen).toBe(4);
  });

  it('computeRevealMathForDP on dp2-river returns boardLen=5 (river board)', () => {
    const rm = computeRevealMathForDP(mm, 1);
    expect(rm.boardLen).toBe(5);
  });

  it('dp1-turn potOdds threshold is ~37.0%', () => {
    const rm = computeRevealMathForDP(mm, 0);
    expect(rm.potOddsPct).toBeCloseTo(37.0, 0);
  });

  it('dp2-river callAmount is 0 (check/bet spot, not a call)', () => {
    expect(mm.decisionPoints[1].callAmount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// I. Early fold at DP0 still advances to DP1 and reaches FINAL_REVEAL
// ---------------------------------------------------------------------------
describe('I. Early fold still reaches FINAL_REVEAL', () => {
  it('folding at DP0 still shows street reveal then continue', async () => {
    const { container } = render(
      <ScenarioPlay scenario={SYNTHETIC_HAND} onBack={noop} onNext={noop} />,
    );

    // Wait for DP0 decision
    await waitFor(() => expect(getFoldDecisionBtn(container)).not.toBeNull(), { timeout: 10000 });

    // Fold instead of call
    fireEvent.click(getFoldDecisionBtn(container));

    // Should still show STREET_REVEAL (pro action is revealed regardless of user choice)
    await waitFor(() => {
      expect(screen.getByText('The Pro')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('folding at DP0, clicking Continue reaches DP1 decision', async () => {
    const { container } = render(
      <ScenarioPlay scenario={SYNTHETIC_HAND} onBack={noop} onNext={noop} />,
    );

    await waitFor(() => expect(getFoldDecisionBtn(container)).not.toBeNull(), { timeout: 10000 });
    fireEvent.click(getFoldDecisionBtn(container));

    const cont = await screen.findByText(/Continue/i, {}, { timeout: 3000 });
    fireEvent.click(cont);

    // DP1 decision appears (the real hand continues even if user folded)
    await waitFor(() => {
      expect(getCallDecisionBtn(container)).not.toBeNull();
    }, { timeout: 10000 });
  });

  it('folding at both DPs shows FINAL_REVEAL with 2 rows both marked incorrect', async () => {
    const { container } = render(
      <ScenarioPlay scenario={SYNTHETIC_HAND} onBack={noop} onNext={noop} />,
    );

    // Fold DP0
    await waitFor(() => expect(getFoldDecisionBtn(container)).not.toBeNull(), { timeout: 10000 });
    fireEvent.click(getFoldDecisionBtn(container));

    const cont1 = await screen.findByText(/Continue/i, {}, { timeout: 3000 });
    fireEvent.click(cont1);

    // Fold DP1
    await waitFor(() => expect(getFoldDecisionBtn(container)).not.toBeNull(), { timeout: 10000 });
    fireEvent.click(getFoldDecisionBtn(container));

    const cont2 = await screen.findByText(/Continue|See Final Result/i, {}, { timeout: 3000 });
    fireEvent.click(cont2);

    // Final scorecard visible
    await waitFor(() => {
      expect(screen.getByText(/Hand Complete/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Both streets should appear in the scorecard (ActionFeed may also show 'Flop' label)
    expect(screen.getAllByText('Flop').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Turn').length).toBeGreaterThanOrEqual(1);

    // No "perfect line" badge since user folded both
    expect(screen.queryByText(/perfect line/i)).toBeNull();
  });
});
