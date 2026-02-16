/**
 * ActionFeed Component
 * ====================
 * Sequential action display. Takes the scenario's action array and reveals
 * one action at a time (auto-advance with delay OR click to advance).
 *
 * Styles: info=gray, bets=red accent with monospace amounts,
 * board dealings=gold accent. When it hits a 'decision' type,
 * it emits onDecision callback so the parent can show the decision prompt.
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
 */
function ActionItem({ action, index }) {
  // Don't render 'decision' type in the feed
  if (action.type === 'decision') return null;

  if (action.type === 'info') {
    return (
      <div
        className="action-item action-item--info"
        style={{ animationDelay: `${index * 50}ms` }}
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
        style={{ animationDelay: `${index * 50}ms` }}
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
    return (
      <div
        className="action-item action-item--board"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <span className="action-item__label">
          {action.cards.length === 3 ? 'Flop' : action.cards.length === 1 ? 'Card' : 'Board'}
        </span>
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

  // Auto-scroll to bottom when new actions appear
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [visibleCount]);

  const visibleActions = actions.slice(0, visibleCount).filter(
    (a) => a.type !== 'decision'
  );

  return (
    <div className="action-feed" ref={feedRef}>
      {visibleActions.map((action, i) => (
        <ActionItem key={i} action={action} index={i} />
      ))}

      {!isComplete && (
        <div className="action-feed__advance">
          <button
            className="action-feed__advance-btn"
            onClick={onAdvance}
          >
            Continue ▸
          </button>
        </div>
      )}
    </div>
  );
}
