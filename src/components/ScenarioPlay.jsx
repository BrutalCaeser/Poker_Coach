/**
 * ScenarioPlay Component
 * ======================
 * The main scenario play page assembling Table, ActionFeed, DecisionPrompt,
 * and MathReveal into the complete playthrough flow.
 *
 * Two-column layout on desktop (≥1024px):
 *   Left:  Table + DecisionPrompt + Opponent Reveal + Next Hand
 *   Right: ActionFeed + MathReveal (scrollable)
 *
 * State machine: SETUP → ACTIONS → DECISION → REVEAL
 *
 * Uses useReducer for state management as specified in the build spec.
 *
 * @param {Object}   props
 * @param {Object}   props.scenario  - The scenario data object
 * @param {Function} props.onBack    - Called when user wants to go back to menu
 * @param {Function} props.onNext    - Called when user wants the next scenario
 * @param {Function} [props.onComplete] - Called with { scenarioId, userAction, isCorrect }
 */
import { useReducer, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Table from './Table.jsx';
import ActionFeed from './ActionFeed.jsx';
import DecisionPrompt from './DecisionPrompt.jsx';
import MathReveal from './MathReveal.jsx';
import Card from './Card.jsx';
import './ScenarioPlay.css';
import ReferencePanel from './ReferencePanel.jsx';
import NarrationPlayer from './narration/NarrationPlayer.jsx';
import { computeRevealMath, computeRevealMathForDP } from '../engine/revealMath.js';

// --- Game phases ---
// V1 (single-decision): SETUP → ACTIONS → DECISION → REVEAL
// V2 (multi-decision):  SETUP → ACTIONS → DECISION → STREET_REVEAL
//                         → [loop back to ACTIONS for next street] → FINAL_REVEAL
const PHASE = {
  SETUP: 'SETUP',
  ACTIONS: 'ACTIONS',
  DECISION: 'DECISION',
  REVEAL: 'REVEAL',
  // V2 phases
  STREET_REVEAL: 'STREET_REVEAL',  // per-DP reveal between streets
  FINAL_REVEAL: 'FINAL_REVEAL',    // summary scorecard after all DPs
};

// --- Reducer ---
const initialState = {
  phase: PHASE.SETUP,
  actionIndex: 0,        // How many actions are visible
  currentPot: 0,         // Running pot amount
  userAction: null,       // User's decision (v1)
  revealOpponents: false, // Whether to show opponent cards
  // V2 fields
  currentDpIndex: 0,     // Which DecisionPoint we're on
  decisions: [],         // [{dpId, userAction}] — committed decisions so far
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'START':
      return {
        ...initialState,
        phase: PHASE.ACTIONS,
        actionIndex: 1,  // Show first action
      };

    case 'ADVANCE': {
      const nextIndex = state.actionIndex + 1;
      const { actions } = action.payload;

      // Check if the next action to process is a decision
      if (nextIndex <= actions.length) {
        const nextAction = actions[nextIndex - 1];

        // Check if the NEXT action after this one is a decision (or this one is)
        if (nextAction && nextAction.type === 'decision') {
          return {
            ...state,
            actionIndex: nextIndex,
            phase: PHASE.DECISION,
          };
        }

        // Check if we've shown all actions up to the decision
        const remaining = actions.slice(nextIndex);
        const nextDecision = remaining.findIndex((a) => a.type === 'decision');

        return {
          ...state,
          actionIndex: nextIndex,
          phase: nextDecision === 0 ? PHASE.DECISION : PHASE.ACTIONS,
        };
      }

      return state;
    }

    case 'DECIDE':
      // V1: go straight to REVEAL
      return {
        ...state,
        phase: PHASE.REVEAL,
        userAction: action.payload.action,
      };

    // V2: commit a decision at a specific DP → go to STREET_REVEAL
    case 'DECIDE_DP': {
      const { dpId, userAction } = action.payload;
      return {
        ...state,
        phase: PHASE.STREET_REVEAL,
        decisions: [...state.decisions, { dpId, userAction }],
      };
    }

    // V2: continue from STREET_REVEAL → replay continuation actions + advance
    case 'CONTINUE_DP': {
      const { newBoard, nextActionIndex, isLast } = action.payload;
      return {
        ...state,
        phase: isLast ? PHASE.FINAL_REVEAL : PHASE.ACTIONS,
        currentDpIndex: state.currentDpIndex + 1,
        actionIndex: nextActionIndex,
      };
    }

    case 'REVEAL_OPPONENTS':
      return {
        ...state,
        revealOpponents: true,
      };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

/**
 * Extract board cards from the action sequence up to a given index.
 */
function getBoardCards(actions, upToIndex) {
  const cards = [];
  for (let i = 0; i < upToIndex && i < actions.length; i++) {
    if (actions[i].type === 'board') {
      cards.push(...actions[i].cards);
    }
  }
  return cards;
}

/**
 * Compute the running pot based on the visible actions.
 * During ACTIONS phase we accumulate from blinds + bet actions.
 * At DECISION and REVEAL we use the scenario's exact pot.
 * For V2 at STREET_REVEAL or FINAL_REVEAL we use the current DP's pot.
 */
function getRunningPot(scenario, actionIndex, phase, currentDpIndex) {
  const isV2 = Boolean(scenario.decisionPoints);

  if (phase === PHASE.DECISION) {
    if (isV2) {
      const dp = scenario.decisionPoints[currentDpIndex];
      return dp ? dp.pot : 0;
    }
    return scenario.decision.pot;
  }
  if (phase === PHASE.REVEAL) {
    return scenario.decision.pot;
  }
  if (phase === PHASE.STREET_REVEAL || phase === PHASE.FINAL_REVEAL) {
    // Show the pot at the DP that was just decided.
    // Clamp: after the last CONTINUE_DP, currentDpIndex === decisionPoints.length (out of bounds).
    const dpIdx = isV2
      ? Math.min(currentDpIndex, scenario.decisionPoints.length - 1)
      : 0;
    const dp = isV2 && scenario.decisionPoints[dpIdx];
    return dp ? dp.pot : 0;
  }

  const { blinds, players } = scenario;
  let pot = blinds.small + blinds.big + (blinds.ante * players.length);

  for (let i = 0; i < actionIndex && i < scenario.actions.length; i++) {
    const action = scenario.actions[i];
    if (action.type === 'bet' && action.amount > 0) {
      pot += action.amount;
    }
  }
  return pot;
}

const round1 = (x) => Math.round(x * 10) / 10;

/**
 * The single-street "draw equity" the lesson teaches — parsed from the
 * scenario's own curated math steps (the source of truth). Prefers the precise
 * 1-card equity, falls back to the Rule-of-2 estimate, and returns 0 when there
 * is no improving draw (e.g. an overpair drawing dead to a completed flush).
 */
function parseDrawEquity(scenario) {
  const pct = (s) => {
    const m = s && String(s.value).match(/([\d.]+)\s*%/);
    return m ? parseFloat(m[1]) : null;
  };
  const oneCard = scenario.mathSteps.find((s) => /equity \(1 card/i.test(s.label));
  if (oneCard) { const v = pct(oneCard); if (v != null) return v; }
  const ruleOf2 = scenario.mathSteps.find((s) => /equity \(rule of 2\)/i.test(s.label));
  if (ruleOf2) { const v = pct(ruleOf2); if (v != null) return v; }
  return 0;
}

/**
 * Build EquityBar props for the v1 reveal, or null when the bar doesn't fit
 * (pre-flop, non-all-in spots, where "draw equity this street" has no meaning).
 * Pot odds, showdown equity and all-in detection are engine-computed; the draw
 * value is the lesson's own curated single-street equity.
 */
function buildEquity(scenario) {
  const rm = computeRevealMath(scenario);
  const breakEvenPct = round1(rm.potOddsPct);
  const verdict = scenario.decision.correctAction;
  if (rm.isAllIn) {
    return { mode: 'allin', showdownEquityPct: round1(rm.showdownEquityPct ?? 0), breakEvenPct, verdict };
  }
  if (rm.boardLen >= 3) {
    return {
      mode: 'draw',
      drawEquityPct: parseDrawEquity(scenario),
      showdownEquityPct: round1(rm.showdownEquityPct ?? 0),
      breakEvenPct,
      verdict,
    };
  }
  return null;
}

/**
 * Build EquityBar props for a specific DecisionPoint in a V2 scenario.
 * Sources drawEquityPct from dp.drawEquityPct (curated per-DP) rather than
 * parsing it from mathSteps.
 *
 * @param {Object} scenario
 * @param {number} dpIndex
 * @returns {Object|null}
 */
function buildEquityForDP(scenario, dpIndex) {
  const dp = scenario.decisionPoints[dpIndex];
  if (!dp) return null;

  const rm = computeRevealMathForDP(scenario, dpIndex);
  const breakEvenPct = round1(rm.potOddsPct);
  const verdict = dp.correctAction;

  if (rm.isAllIn) {
    return { mode: 'allin', showdownEquityPct: round1(rm.showdownEquityPct ?? 0), breakEvenPct, verdict };
  }
  if (rm.boardLen >= 3) {
    return {
      mode: 'draw',
      drawEquityPct: dp.drawEquityPct ?? 0,
      showdownEquityPct: round1(rm.showdownEquityPct ?? 0),
      breakEvenPct,
      verdict,
    };
  }
  return null;
}

export default function ScenarioPlay({
  scenario,
  onBack,
  onNext,
  onComplete,
}) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [activeTab, setActiveTab] = useState('hand');

  // Is this a V2 (multi-DP) scenario?
  const isV2 = Boolean(scenario.decisionPoints);

  // Auto-start the scenario
  useEffect(() => {
    if (state.phase === PHASE.SETUP) {
      const timer = setTimeout(() => dispatch({ type: 'START' }), 300);
      return () => clearTimeout(timer);
    }
  }, [state.phase]);

  // Auto-switch to "hand" tab when phase changes
  useEffect(() => {
    setActiveTab('hand');
  }, [state.phase]);

  // ---------------------------------------------------------------------------
  // V2 derived state
  // ---------------------------------------------------------------------------
  const currentDp = isV2 ? scenario.decisionPoints[state.currentDpIndex] : null;

  // The action index of the NEXT decision we need to stop at (or end of actions)
  const nextDecisionIndex = useMemo(() => {
    if (!isV2) return scenario.actions.findIndex((a) => a.type === 'decision');
    // Find the decision action whose decisionId matches the current DP
    if (!currentDp) return scenario.actions.length;
    const idx = scenario.actions.findIndex(
      (a) => a.type === 'decision' && a.decisionId === currentDp.id,
    );
    return idx >= 0 ? idx : scenario.actions.length;
  }, [isV2, scenario.actions, currentDp]);

  // ---------------------------------------------------------------------------
  // Derive board + pot
  // ---------------------------------------------------------------------------
  const boardCards = getBoardCards(scenario.actions, state.actionIndex);
  const pot = getRunningPot(scenario, state.actionIndex, state.phase, state.currentDpIndex);

  // ---------------------------------------------------------------------------
  // Current narration line — the most recent VISIBLE action carrying a `vo`.
  // Walking backwards (rather than requiring every action to have a line) means
  // narration is sparse by design: the booth speaks on the beats that matter and
  // stays quiet through the mechanical bets.
  // ---------------------------------------------------------------------------
  // True while the commentator is mid-sentence. Gates the feed auto-advance so
  // narration is never truncated by the next beat.
  const [narrationBusy, setNarrationBusy] = useState(false);

  const currentVo = useMemo(() => {
    const upto = Math.min(state.actionIndex, scenario.actions?.length ?? 0);
    for (let i = upto - 1; i >= 0; i--) {
      if (scenario.actions[i]?.vo) return scenario.actions[i].vo;
    }
    return null;
  }, [scenario.actions, state.actionIndex]);

  // ---------------------------------------------------------------------------
  // EquityBar data
  // ---------------------------------------------------------------------------
  const equity = useMemo(() => {
    if (state.phase === PHASE.REVEAL) return buildEquity(scenario);
    if (isV2 && state.phase === PHASE.STREET_REVEAL) {
      // At STREET_REVEAL, currentDpIndex is the just-decided DP (DECIDE_DP does NOT
      // increment it; only CONTINUE_DP does). So the correct index is currentDpIndex.
      return buildEquityForDP(scenario, state.currentDpIndex);
    }
    return null;
  }, [scenario, state.phase, isV2, state.currentDpIndex]);

  // ---------------------------------------------------------------------------
  // V1: legacy decision index + feedComplete
  // ---------------------------------------------------------------------------
  const decisionIndex = isV2 ? nextDecisionIndex : scenario.actions.findIndex((a) => a.type === 'decision');
  const feedComplete = state.actionIndex >= decisionIndex;

  // ---------------------------------------------------------------------------
  // Handle advancing actions
  // ---------------------------------------------------------------------------
  const handleAdvance = useCallback(() => {
    dispatch({ type: 'ADVANCE', payload: { actions: scenario.actions } });
  }, [scenario.actions]);

  // Auto-advance actions with delay.
  //
  // When the commentator is speaking, the AUDIO is the clock. The fixed 1-1.8s
  // timers below are far shorter than a narration line (7-19s), so without this
  // gate every line was cut off by the next beat rendering. `narrationBusy` is
  // reported false on end/pause/error/disable, so silence falls straight back to
  // the original timer behaviour and the hand can never stall.
  useEffect(() => {
    if (narrationBusy) return;
    if (state.phase === PHASE.ACTIONS && state.actionIndex < decisionIndex) {
      const currentAction = scenario.actions[state.actionIndex];
      const delay = currentAction?.type === 'board' ? 1800 :
                    currentAction?.type === 'bet' ? 1200 : 1000;
      const timer = setTimeout(handleAdvance, delay);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.actionIndex, decisionIndex, handleAdvance, scenario.actions, narrationBusy]);

  // Auto-advance to decision when feed is complete
  useEffect(() => {
    if (state.phase === PHASE.ACTIONS && state.actionIndex >= decisionIndex) {
      dispatch({ type: 'ADVANCE', payload: { actions: scenario.actions } });
    }
  }, [state.phase, state.actionIndex, decisionIndex, scenario.actions]);

  // ---------------------------------------------------------------------------
  // Handle decision
  // ---------------------------------------------------------------------------
  const handleDecision = useCallback((userAction) => {
    if (isV2 && currentDp) {
      // V2: commit to this DP → STREET_REVEAL
      dispatch({ type: 'DECIDE_DP', payload: { dpId: currentDp.id, userAction } });
    } else {
      // V1: go to REVEAL
      dispatch({ type: 'DECIDE', payload: { action: userAction } });
      if (onComplete) {
        onComplete({
          scenarioId: scenario.id,
          userAction,
          isCorrect: userAction === scenario.decision.correctAction,
        });
      }
    }
  }, [isV2, currentDp, scenario, onComplete]);

  // V2: continue from STREET_REVEAL to the next street
  const handleContinueDp = useCallback(() => {
    if (!isV2) return;
    const justDecidedDpIndex = state.currentDpIndex;

    // Find the action index to resume from: right after the current decision action
    const currentDecisionActionIdx = scenario.actions.findIndex(
      (a) => a.type === 'decision' && a.decisionId === scenario.decisionPoints[justDecidedDpIndex]?.id,
    );
    const nextActionIndex = currentDecisionActionIdx >= 0
      ? currentDecisionActionIdx + 1
      : state.actionIndex + 1;

    const isLast = justDecidedDpIndex >= scenario.decisionPoints.length - 1;

    // Fix 4: call onComplete when the hand finishes (entering FINAL_REVEAL).
    // isCorrect = every decision matched its DP's correctAction.
    if (isLast && onComplete) {
      const allCorrect = state.decisions.every(({ dpId, userAction: ua }) => {
        const dp = scenario.decisionPoints.find((d) => d.id === dpId);
        return dp && ua === dp.correctAction;
      });
      onComplete({
        scenarioId: scenario.id,
        userAction: state.decisions[state.decisions.length - 1]?.userAction ?? null,
        isCorrect: allCorrect,
      });
    }

    dispatch({
      type: 'CONTINUE_DP',
      payload: {
        nextActionIndex,
        isLast,
      },
    });
  }, [isV2, scenario, state.currentDpIndex, state.actionIndex, state.decisions, onComplete]);

  // ---------------------------------------------------------------------------
  // V1 decision info
  // ---------------------------------------------------------------------------
  const decisionAction = scenario.actions.find((a) => a.type === 'decision');
  const isCorrect = isV2
    ? false // V2 doesn't use the single isCorrect; each DP has its own
    : state.userAction === scenario.decision?.correctAction;

  // ---------------------------------------------------------------------------
  // V2 current DP decision action (for options/amounts)
  // ---------------------------------------------------------------------------
  const currentDpAction = isV2 && currentDp
    ? scenario.actions.find((a) => a.type === 'decision' && a.decisionId === currentDp.id)
    : null;

  // Last committed decision (for STREET_REVEAL)
  const lastDecision = state.decisions.length > 0
    ? state.decisions[state.decisions.length - 1]
    : null;
  const revealDp = isV2 && lastDecision
    ? scenario.decisionPoints.find((dp) => dp.id === lastDecision.dpId)
    : null;
  const streetRevealIsCorrect = revealDp && lastDecision
    ? lastDecision.userAction === revealDp.correctAction
    : false;

  // ---------------------------------------------------------------------------
  // V2 final scorecard rows
  // ---------------------------------------------------------------------------
  const scorecardRows = useMemo(() => {
    if (!isV2 || state.phase !== PHASE.FINAL_REVEAL) return [];
    return state.decisions.map(({ dpId, userAction: ua }) => {
      const dp = scenario.decisionPoints.find((d) => d.id === dpId);
      return {
        street: dp?.street ?? dpId,
        userAction: ua,
        proAction: dp?.proAction,
        correctAction: dp?.correctAction,
        isCorrect: ua === dp?.correctAction,
      };
    });
  }, [isV2, state.phase, state.decisions, scenario]);

  // Difficulty stars
  const stars = '★'.repeat(scenario.difficulty) + '☆'.repeat(3 - scenario.difficulty);

  // Ref for auto-scrolling the right panel as math steps reveal
  const rightPanelRef = useRef(null);

  // Auto-scroll right panel to bottom when reveal phase content changes.
  // Deps: fire only when the phase changes or new math steps arrive (decisions.length).
  useEffect(() => {
    if (
      (state.phase === PHASE.REVEAL ||
       state.phase === PHASE.STREET_REVEAL ||
       state.phase === PHASE.FINAL_REVEAL) &&
      rightPanelRef.current
    ) {
      const el = rightPanelRef.current;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [state.phase, state.decisions.length]);

  // ---------------------------------------------------------------------------
  // Determine which decision prompt data to show (V2 vs V1)
  // ---------------------------------------------------------------------------
  const activeDecisionPot = isV2 && currentDp ? currentDp.pot : scenario.decision?.pot;
  const activeDecisionCallAmount = isV2 && currentDp ? currentDp.callAmount : scenario.decision?.callAmount;
  const activeDecisionHeroStack = isV2 && currentDp ? currentDp.heroStack : scenario.decision?.heroStack;
  const activeDecisionOptions = isV2 && currentDpAction ? currentDpAction.options : decisionAction?.options;
  const activeDecisionRaise = isV2 && currentDpAction ? currentDpAction.raiseAmount : decisionAction?.raiseAmount;

  return (
    <div className="scenario-play">
      {/* Header */}
      <header className="scenario-play__header">
        <button className="scenario-play__back" onClick={onBack}>
          ← Back
        </button>
        <h1 className="scenario-play__title">{scenario.title}</h1>
        <div className="scenario-play__meta">
          <span className="scenario-play__difficulty">{stars}</span>
          <span className="scenario-play__category">{scenario.category}</span>
        </div>
      </header>

      {/* Fix 9: Event banner — prominent gold placard for real-hand context */}
      {isV2 && scenario.realHand && (
        <div className="scenario-play__event-banner">
          {scenario.realHand.event} · {scenario.realHand.date}
        </div>
      )}

      <div className="scenario-play__content">
        {/* ===== LEFT COLUMN: Table + Decision + Opponent Reveal + Next ===== */}
        <div className="scenario-play__left">
          {/* Commentary booth — opt-in narration for the current beat.
              Renders nothing when no audio is baked for this scenario, so the
              15 curated v1 hands are untouched. */}
          <NarrationPlayer
            scenarioId={scenario.id}
            commentator={scenario.commentator}
            voId={currentVo?.id}
            text={currentVo?.text}
            onBusyChange={setNarrationBusy}
          />

          {/* Poker table */}
          <div className="scenario-play__table-section">
            <Table
              players={scenario.players}
              heroIndex={scenario.heroIndex}
              board={boardCards}
              pot={pot}
              revealAll={state.revealOpponents}
            />
          </div>

          {/* V2 street indicator */}
          {isV2 && state.phase === PHASE.ACTIONS && currentDp && (
            <div className="scenario-play__street-indicator">
              Street {state.currentDpIndex + 1} of {scenario.decisionPoints.length}: {currentDp.street}
            </div>
          )}

          {/* Decision Prompt — directly under the table, always visible */}
          {state.phase === PHASE.DECISION && activeDecisionOptions && (
            <DecisionPrompt
              pot={activeDecisionPot}
              callAmount={activeDecisionCallAmount}
              heroStack={activeDecisionHeroStack}
              options={activeDecisionOptions}
              raiseAmount={activeDecisionRaise}
              onDecision={handleDecision}
            />
          )}

          {/* V2: Continue button after street reveal */}
          {isV2 && state.phase === PHASE.STREET_REVEAL && (
            <div className="scenario-play__left-reveal">
              <div className="scenario-play__next">
                {/* Fix 2: last DP (index === length - 1) should say "See Final Result" */}
                {state.currentDpIndex < scenario.decisionPoints.length - 1 ? (
                  <button className="next-hand-btn" onClick={handleContinueDp}>
                    Continue ▸
                  </button>
                ) : (
                  <button className="next-hand-btn" onClick={handleContinueDp}>
                    See Final Result ▸
                  </button>
                )}
              </div>
            </div>
          )}

          {/* V2: FINAL_REVEAL / V1: REVEAL post-decision buttons */}
          {(state.phase === PHASE.REVEAL || state.phase === PHASE.FINAL_REVEAL) && (
            <div className="scenario-play__left-reveal">
              {/* Opponent card reveal */}
              {!state.revealOpponents && (
                <div className="scenario-play__reveal-btn-wrap">
                  <button
                    className="reveal-opponents-btn"
                    onClick={() => dispatch({ type: 'REVEAL_OPPONENTS' })}
                  >
                    Reveal Opponent Cards
                  </button>
                </div>
              )}

              {/* Next hand button */}
              <div className="scenario-play__next">
                <button className="next-hand-btn" onClick={onNext}>
                  Next Hand →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== RIGHT COLUMN: Tabs + Content ===== */}
        <div className="scenario-play__right" ref={rightPanelRef}>
          {/* Tab bar */}
          <div className="scenario-play__tabs">
            <button
              className={`scenario-play__tab ${activeTab === 'hand' ? 'scenario-play__tab--active' : ''}`}
              onClick={() => setActiveTab('hand')}
            >
              Hand
            </button>
            <button
              className={`scenario-play__tab ${activeTab === 'reference' ? 'scenario-play__tab--active' : ''}`}
              onClick={() => setActiveTab('reference')}
            >
              Reference
            </button>
          </div>

          {activeTab === 'hand' ? (
            <>
              {/* Action Feed — persists through all phases after SETUP */}
              {state.phase !== PHASE.SETUP && (
                <ActionFeed
                  actions={scenario.actions}
                  visibleCount={state.actionIndex}
                  onAdvance={handleAdvance}
                  isComplete={feedComplete || state.phase === PHASE.REVEAL || state.phase === PHASE.FINAL_REVEAL}
                />
              )}

              {/* V1: Math Reveal after single decision */}
              {!isV2 && state.phase === PHASE.REVEAL && (
                <div className="scenario-play__reveal">
                  <MathReveal
                    isCorrect={isCorrect}
                    userAction={state.userAction}
                    correctAction={scenario.decision.correctAction}
                    insight={scenario.insight}
                    mathSteps={scenario.mathSteps}
                    takeaway={scenario.takeaway}
                    equity={equity}
                  />
                </div>
              )}

              {/* V2: Per-street reveal (MathReveal with proAction beat) */}
              {isV2 && state.phase === PHASE.STREET_REVEAL && revealDp && lastDecision && (
                <div className="scenario-play__reveal">
                  <MathReveal
                    isCorrect={streetRevealIsCorrect}
                    userAction={lastDecision.userAction}
                    correctAction={revealDp.correctAction}
                    proAction={revealDp.proAction}
                    proReasoning={revealDp.proReasoning}
                    insight={revealDp.insight}
                    mathSteps={revealDp.mathSteps}
                    takeaway={revealDp.takeaway}
                    equity={equity}
                  />
                </div>
              )}

              {/* V2: Final scorecard after all decision points */}
              {isV2 && state.phase === PHASE.FINAL_REVEAL && (
                <div className="scenario-play__reveal scenario-play__final-reveal">
                  <div className="final-scorecard">
                    <div className="final-scorecard__header">Hand Complete — Your Scorecard</div>
                    {scenario.handResult && (
                      <div className="final-scorecard__result">
                        Winner: <strong>{scenario.handResult.winnerName}</strong>
                        {scenario.handResult.showdownDesc && (
                          <span> — {scenario.handResult.showdownDesc}</span>
                        )}
                      </div>
                    )}
                    {/* Fix 8: semantic <table> scorecard */}
                    <table className="final-scorecard__table">
                      <thead>
                        <tr>
                          <th scope="col">Street</th>
                          <th scope="col">You</th>
                          <th scope="col">The Pro</th>
                          <th scope="col">GTO</th>
                          <th scope="col" aria-label="Result"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {scorecardRows.map((row, i) => (
                          <tr
                            key={i}
                            className={`final-scorecard__row ${row.isCorrect ? 'final-scorecard__row--correct' : 'final-scorecard__row--incorrect'}`}
                          >
                            <td>{row.street}</td>
                            <td className={row.userAction === row.correctAction ? 'scorecard-action--correct' : 'scorecard-action--incorrect'}>
                              {row.userAction}
                            </td>
                            <td className={row.proAction === row.correctAction ? 'scorecard-action--correct' : 'scorecard-action--incorrect'}>
                              {row.proAction ?? '—'}
                            </td>
                            <td className="scorecard-action--gto">{row.correctAction}</td>
                            <td className="final-scorecard__verdict-cell">
                              {row.isCorrect ? '✓' : row.userAction === row.proAction ? '≈' : '✗'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {scorecardRows.every((r) => r.isCorrect) && (
                      <div className="final-scorecard__badge final-scorecard__badge--perfect">
                        Perfect line — you out-played the pro on every street!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <ReferencePanel />
          )}
        </div>
      </div>
    </div>
  );
}
