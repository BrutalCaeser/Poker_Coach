/**
 * DecisionPrompt Component
 * ========================
 * The critical decision UI. Shows pot amount, call amount, hero stack.
 * Renders buttons driven by the options array:
 *   - 'check' → Check button (gold/neutral, passive)
 *   - 'call'  → Call button (green) showing callAmount
 *   - 'fold'  → Fold button (red, recessive)
 *   - 'bet'   → Bet button (gold-sheen, aggressive) showing betAmount ?? raiseAmount
 *   - 'raise' → Raise button (gold-sheen, aggressive) showing raiseAmount
 * Passive actions render left, aggressive actions right.
 * Buttons feel large, weighty, tactile. On click, emits the user's decision.
 *
 * @param {Object}   props
 * @param {number}   props.pot          - Total pot size
 * @param {number}   props.callAmount   - Amount required to call
 * @param {number}   props.heroStack    - Hero's remaining stack
 * @param {string[]} props.options      - Available actions (any subset of check/call/fold/bet/raise)
 * @param {number}   [props.raiseAmount] - Amount to raise to (if raise is an option)
 * @param {number}   [props.betAmount]  - Amount to bet (if bet is an option; falls back to raiseAmount)
 * @param {Function} props.onDecision   - Callback: (action) => void
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
  betAmount,
  onDecision,
}) {
  const hasCheck = options.includes('check');
  const hasCall  = options.includes('call');
  const hasFold  = options.includes('fold');
  const hasBet   = options.includes('bet');
  const hasRaise = options.includes('raise');

  // Effective bet display amount: explicit betAmount, else fall back to raiseAmount
  const effectiveBetAmount = betAmount ?? raiseAmount;

  return (
    <div className="decision-prompt decision-prompt--active">
      <div className="decision-prompt__header">
        Action is on you.
      </div>

      {/* Stats row: pot, facing, stack — tabular-nums, gold pot */}
      <div className="decision-prompt__state" aria-label="Game state">
        <div className="decision-prompt__stat">
          <span className="decision-prompt__stat-label">Pot</span>
          <span
            className="decision-prompt__stat-value decision-prompt__stat-value--pot"
            aria-label={`Pot: ${formatAmount(pot)}`}
          >
            {formatAmount(pot)}
          </span>
        </div>
        <div className="decision-prompt__stat">
          <span className="decision-prompt__stat-label">Facing</span>
          <span
            className="decision-prompt__stat-value decision-prompt__stat-value--call"
            aria-label={`Facing: ${formatAmount(callAmount)}`}
          >
            {formatAmount(callAmount)}
          </span>
        </div>
        <div className="decision-prompt__stat">
          <span className="decision-prompt__stat-label">Your Stack</span>
          <span
            className="decision-prompt__stat-value"
            aria-label={`Stack: ${formatAmount(heroStack)}`}
          >
            {formatAmount(heroStack)}
          </span>
        </div>
      </div>

      {/* Button order: passive (Check, Call, Fold) left → aggressive (Bet, Raise) right */}
      <div className="decision-prompt__actions" role="group" aria-label="Your decision">
        {hasCheck && (
          <button
            className="decision-btn decision-btn--check"
            onClick={() => onDecision('check')}
          >
            Check
          </button>
        )}

        {hasCall && (
          <button
            className="decision-btn decision-btn--call"
            onClick={() => onDecision('call')}
          >
            Call
            <span className="decision-btn__amount">{formatAmount(callAmount)}</span>
          </button>
        )}

        {hasFold && (
          <button
            className="decision-btn decision-btn--fold"
            onClick={() => onDecision('fold')}
          >
            Fold
          </button>
        )}

        {hasBet && effectiveBetAmount && (
          <button
            className="decision-btn decision-btn--bet"
            onClick={() => onDecision('bet')}
          >
            Bet
            <span className="decision-btn__amount">{formatAmount(effectiveBetAmount)}</span>
          </button>
        )}

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
