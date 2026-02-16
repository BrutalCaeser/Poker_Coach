/**
 * DecisionPrompt Component
 * ========================
 * The critical decision UI. Shows pot amount, call amount, hero stack.
 * Renders CALL (green), FOLD (red), and optionally RAISE (gold) buttons.
 * Buttons feel large, weighty, tactile. On click, emits the user's decision.
 *
 * @param {Object}   props
 * @param {number}   props.pot        - Total pot size
 * @param {number}   props.callAmount - Amount required to call
 * @param {number}   props.heroStack  - Hero's remaining stack
 * @param {string[]} props.options    - Available actions: ["call","fold"] or ["call","fold","raise"]
 * @param {number}   [props.raiseAmount] - Amount to raise to (if raise is an option)
 * @param {Function} props.onDecision - Callback: (action) => void
 */
import './DecisionPrompt.css';

function formatAmount(amount) {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${amount.toLocaleString()}`;
  return `$${amount}`;
}

export default function DecisionPrompt({
  pot,
  callAmount,
  heroStack,
  options,
  raiseAmount,
  onDecision,
}) {
  const hasRaise = options.includes('raise');

  return (
    <div className="decision-prompt decision-prompt--active">
      <div className="decision-prompt__header">
        Action is on you.
      </div>

      <div className="decision-prompt__state">
        <div className="decision-prompt__stat">
          <span className="decision-prompt__stat-label">Pot</span>
          <span className="decision-prompt__stat-value decision-prompt__stat-value--pot">
            {formatAmount(pot)}
          </span>
        </div>
        <div className="decision-prompt__stat">
          <span className="decision-prompt__stat-label">Facing</span>
          <span className="decision-prompt__stat-value decision-prompt__stat-value--call">
            {formatAmount(callAmount)}
          </span>
        </div>
        <div className="decision-prompt__stat">
          <span className="decision-prompt__stat-label">Your Stack</span>
          <span className="decision-prompt__stat-value">
            {formatAmount(heroStack)}
          </span>
        </div>
      </div>

      <div className="decision-prompt__actions">
        <button
          className="decision-btn decision-btn--call"
          onClick={() => onDecision('call')}
        >
          Call
          <span className="decision-btn__amount">{formatAmount(callAmount)}</span>
        </button>

        <button
          className="decision-btn decision-btn--fold"
          onClick={() => onDecision('fold')}
        >
          Fold
        </button>

        {hasRaise && raiseAmount && (
          <button
            className="decision-btn decision-btn--raise"
            onClick={() => onDecision('raise')}
          >
            Raise
            <span className="decision-btn__amount">to {formatAmount(raiseAmount)}</span>
          </button>
        )}
      </div>
    </div>
  );
}
