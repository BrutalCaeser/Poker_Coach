/**
 * ScenarioPlay Component
 * ======================
 * The main scenario play page assembling Table, ActionFeed, DecisionPrompt,
 * and MathReveal into the complete playthrough flow.
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
import { useReducer, useCallback, useEffect } from 'react';
import Table from './Table.jsx';
import ActionFeed from './ActionFeed.jsx';
import DecisionPrompt from './DecisionPrompt.jsx';
import MathReveal from './MathReveal.jsx';
import Card from './Card.jsx';
import './ScenarioPlay.css';

// --- Game phases ---
const PHASE = {
  SETUP: 'SETUP',
  ACTIONS: 'ACTIONS',
  DECISION: 'DECISION',
  REVEAL: 'REVEAL',
};

// --- Reducer ---
const initialState = {
  phase: PHASE.SETUP,
  actionIndex: 0,       // How many actions are visible
  boardCards: [],        // Current board cards dealt
  currentPot: 0,        // Running pot amount
  userAction: null,      // User's decision
  revealOpponents: false, // Whether to show opponent cards
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'START':
      return {
        ...initialState,
        phase: PHASE.ACTIONS,
        actionIndex: 1, // Show first action
      };

    case 'ADVANCE': {
      const nextIndex = state.actionIndex + 1;
      const { actions } = action.payload;

      // Check if the next action to process is a decision
      if (nextIndex <= actions.length) {
        const nextAction = actions[nextIndex - 1];

        // Update board if this is a board action
        let newBoard = state.boardCards;
        if (nextAction && nextAction.type === 'board') {
          newBoard = [...state.boardCards, ...nextAction.cards];
        }

        // Check if the NEXT action after this one is a decision (or this one is)
        if (nextAction && nextAction.type === 'decision') {
          return {
            ...state,
            actionIndex: nextIndex,
            boardCards: newBoard,
            phase: PHASE.DECISION,
          };
        }

        // Check if we've shown all actions up to the decision
        const remaining = actions.slice(nextIndex);
        const nextDecision = remaining.findIndex((a) => a.type === 'decision');

        return {
          ...state,
          actionIndex: nextIndex,
          boardCards: newBoard,
          phase: nextDecision === 0 ? PHASE.DECISION : PHASE.ACTIONS,
        };
      }

      return state;
    }

    case 'DECIDE':
      return {
        ...state,
        phase: PHASE.REVEAL,
        userAction: action.payload.action,
      };

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
 * This is a rough estimate from bet actions; the scenario's decision.pot
 * is used for the actual decision point.
 */
function getRunningPot(scenario, actionIndex) {
  const { blinds, players } = scenario;
  let pot = blinds.small + blinds.big + (blinds.ante * players.length);

  for (let i = 0; i < actionIndex && i < scenario.actions.length; i++) {
    const action = scenario.actions[i];
    if (action.type === 'bet' && action.amount > 0) {
      // Simplification: add bet amounts. The scenario data has well-formed amounts.
      // We don't track per-player contributions precisely here.
    }
  }

  // Use the scenario's decision pot when we reach the decision
  return scenario.decision.pot;
}

export default function ScenarioPlay({
  scenario,
  onBack,
  onNext,
  onComplete,
}) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Auto-start the scenario
  useEffect(() => {
    if (state.phase === PHASE.SETUP) {
      const timer = setTimeout(() => dispatch({ type: 'START' }), 300);
      return () => clearTimeout(timer);
    }
  }, [state.phase]);

  // Calculate derived state
  const boardCards = getBoardCards(scenario.actions, state.actionIndex);
  const pot = state.phase === PHASE.DECISION || state.phase === PHASE.REVEAL
    ? scenario.decision.pot
    : 0;

  // Is the action feed complete (reached the decision point)?
  const decisionIndex = scenario.actions.findIndex((a) => a.type === 'decision');
  const feedComplete = state.actionIndex >= decisionIndex;

  // Handle advancing actions
  const handleAdvance = useCallback(() => {
    dispatch({ type: 'ADVANCE', payload: { actions: scenario.actions } });
  }, [scenario.actions]);

  // Auto-advance actions with delay
  useEffect(() => {
    if (state.phase === PHASE.ACTIONS && state.actionIndex < decisionIndex) {
      const currentAction = scenario.actions[state.actionIndex];
      // Longer delay for board cards (dramatic effect), shorter for info
      const delay = currentAction?.type === 'board' ? 1800 :
                    currentAction?.type === 'bet' ? 1200 : 1000;

      const timer = setTimeout(handleAdvance, delay);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.actionIndex, decisionIndex, handleAdvance, scenario.actions]);

  // Auto-advance to decision when feed is complete
  useEffect(() => {
    if (state.phase === PHASE.ACTIONS && state.actionIndex >= decisionIndex) {
      dispatch({
        type: 'ADVANCE',
        payload: { actions: scenario.actions },
      });
    }
  }, [state.phase, state.actionIndex, decisionIndex, scenario.actions]);

  // Handle decision
  const handleDecision = useCallback((action) => {
    dispatch({ type: 'DECIDE', payload: { action } });

    // Notify parent of completion
    if (onComplete) {
      onComplete({
        scenarioId: scenario.id,
        userAction: action,
        isCorrect: action === scenario.decision.correctAction,
      });
    }
  }, [scenario, onComplete]);

  // Decision info
  const decisionAction = scenario.actions.find((a) => a.type === 'decision');
  const isCorrect = state.userAction === scenario.decision.correctAction;

  // Difficulty stars
  const stars = '★'.repeat(scenario.difficulty) + '☆'.repeat(3 - scenario.difficulty);

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

      <div className="scenario-play__content">
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

        {/* Interaction area */}
        <div className="scenario-play__interaction">
          {/* Action Feed */}
          {(state.phase === PHASE.ACTIONS || state.phase === PHASE.DECISION) && (
            <ActionFeed
              actions={scenario.actions}
              visibleCount={state.actionIndex}
              onAdvance={handleAdvance}
              isComplete={feedComplete}
            />
          )}

          {/* Decision Prompt */}
          {state.phase === PHASE.DECISION && decisionAction && (
            <DecisionPrompt
              pot={scenario.decision.pot}
              callAmount={scenario.decision.callAmount}
              heroStack={scenario.decision.heroStack}
              options={decisionAction.options}
              raiseAmount={decisionAction.raiseAmount}
              onDecision={handleDecision}
            />
          )}

          {/* Math Reveal */}
          {state.phase === PHASE.REVEAL && (
            <div className="scenario-play__reveal">
              <MathReveal
                isCorrect={isCorrect}
                userAction={state.userAction}
                correctAction={scenario.decision.correctAction}
                insight={scenario.insight}
                mathSteps={scenario.mathSteps}
                takeaway={scenario.takeaway}
              />

              {/* Opponent card reveal */}
              {!state.revealOpponents && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3)' }}>
                  <button
                    className="scenario-play__back"
                    onClick={() => dispatch({ type: 'REVEAL_OPPONENTS' })}
                    style={{ borderColor: 'var(--gold-border)', color: 'var(--gold)' }}
                  >
                    Reveal Opponent Cards
                  </button>
                </div>
              )}

              {state.revealOpponents && (
                <div className="opponent-reveal">
                  {scenario.players
                    .filter((_, i) => i !== scenario.heroIndex)
                    .filter((p) => p.cards && p.cards.length > 0)
                    .map((player, i) => (
                      <div key={i} className="opponent-reveal" style={{ animationDelay: `${i * 200}ms` }}>
                        <span className="opponent-reveal__label">{player.name}:</span>
                        <div className="opponent-reveal__cards">
                          {player.cards.map((cardStr, j) => (
                            <Card key={j} card={cardStr} faceUp={true} size="sm" dealing={true} />
                          ))}
                        </div>
                      </div>
                    ))
                  }
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
      </div>
    </div>
  );
}
