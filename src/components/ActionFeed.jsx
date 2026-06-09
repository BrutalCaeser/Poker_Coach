/**
 * ActionFeed Component
 * ====================
 * Sequential action display. Takes the scenario's action array and reveals
 * one action at a time (auto-advance with delay OR click to advance).
 *
 * Styles: info=gray (understated), bets=red accent with monospace amounts,
 * board dealings=gold accent. When it hits a 'decision' type,
 * it emits onDecision callback so the parent can show the decision prompt.
 *
 * Accessibility: aria-live="polite" region so screen readers announce
 * each new action as it appears.
 *
 * @param {Object} props
 * @param {Array}  props.actions       - The scenario's action array
 * @param {number} props.visibleCount  - How many actions to show (driven by parent)
 * @param {Function} props.onAdvance   - Called when user clicks to advance
 * @param {boolean}  props.isComplete  - Whether all non-decision actions have been shown
 */
import { useEffect, useRef } from 'react';
import Card from './Card.jsx';
import './ActionFeed.css';

/**
 * Format a dollar amount for display.
 */
function formatAmount(amount) {
  if (amount === 0) return '';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${amount.toLocaleString()}`;
  return `$${amount}`;
}

/**
 * Render a single action item based on its type.
 * animationDelay is staggered by index for a cascading entrance effect.
 */
function ActionItem({ action, index }) {
  // Don't render 'decision' type in the feed
  if (action.type === 'decision') return null;

  // Stagger: each item slightly after the previous; board reveals get a
  // longer base delay for dramatic effect
  const baseDelay = action.type === 'board' ? 60 : 45;
  const delay = `${index * baseDelay}ms`;

  if (action.type === 'info') {
    return (
      <div
        className="action-item action-item--info"
        style={{ animationDelay: delay }}
      >
        {action.text}
      </div>
    );
  }

  if (action.type === 'bet') {
    const isFold = action.action === 'folds' || action.action === 'checks';
    const itemClass = isFold
      ? 'action-item action-item--fold'
      : 'action-item action-item--bet';

    return (
      <div
        className={itemClass}
        style={{ animationDelay: delay }}
      >
        <span className="action-item__name">{action.name}</span>{' '}
        <span className="action-item__action">{action.action}</span>
        {action.amount > 0 && (
          <>
            {' '}
            <span className="action-item__amount">
              {formatAmount(action.amount)}
            </span>
          </>
        )}
      </div>
    );
  }

  if (action.type === 'board') {
    const label =
      action.cards.length === 3
        ? 'Flop'
        : action.cards.length === 1
        ? 'Turn/River'
        : 'Board';

    return (
      <div
        className="action-item action-item--board"
        style={{ animationDelay: delay }}
      >
        <span className="action-item__label">{label}</span>
        {action.cards.map((cardStr, i) => (
          <Card key={i} card={cardStr} faceUp={true} size="xs" />
        ))}
      </div>
    );
  }

  return null;
}

export default function ActionFeed({
  actions,
  visibleCount,
  onAdvance,
  isComplete,
}) {
  const feedRef = useRef(null);

  // Smooth auto-scroll to bottom when new actions appear
  useEffect(() => {
    const el = feedRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [visibleCount]);

  const visibleActions = actions
    .slice(0, visibleCount)
    .filter((a) => a.type !== 'decision');

  return (
    /*
     * aria-live="polite": new items appended here are announced to screen
     * readers without interrupting the user's current focus.
     * aria-label gives the region a meaningful name.
     */
    <div
      className="action-feed"
      ref={feedRef}
      aria-live="polite"
      aria-label="Hand action sequence"
    >
      {visibleActions.map((action, i) => (
        <ActionItem key={i} action={action} index={i} />
      ))}

      {!isComplete && (
        <div className="action-feed__advance">
          <button
            className="action-feed__advance-btn"
            onClick={onAdvance}
            aria-label="Advance to next action"
          >
            Continue ▸
          </button>
        </div>
      )}
    </div>
  );
}
