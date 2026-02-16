/**
 * ScenarioMenu Component
 * ======================
 * Landing page showing all scenarios in a beautiful grid, grouped by difficulty tier.
 * Displays user stats at the top and navigation buttons for Free Play and Coach.
 *
 * @param {Object}   props
 * @param {Object[]} props.scenarios   - Array of scenario objects
 * @param {Object}   props.userStats   - { completed: Map<id, {action, correct}>, accuracy }
 * @param {Function} props.onSelectScenario - Called with scenario id
 * @param {Function} props.onFreePlay  - Navigate to Free Play
 * @param {Function} props.onCoach     - Navigate to Coach
 */
import { useMemo } from 'react';
import { getMasteredConcepts } from '../userStats.js';
import './ScenarioMenu.css';

const TIER_LABELS = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
};

function formatConcepts(concepts) {
  if (!concepts || concepts.length === 0) return '';
  return concepts
    .slice(0, 3)
    .map((c) => c.replace(/-/g, ' '))
    .join(', ');
}

export default function ScenarioMenu({
  scenarios,
  userStats = {},
  onSelectScenario,
  onFreePlay,
  onCoach,
}) {
  const completed = userStats.completed || {};
  const totalCompleted = Object.keys(completed).length;
  const totalCorrect = Object.values(completed).filter((r) => r.correct).length;
  const accuracy = totalCompleted > 0
    ? Math.round((totalCorrect / totalCompleted) * 100)
    : 0;
  const mastered = getMasteredConcepts(userStats, scenarios);
  const progressPct = Math.round((totalCompleted / Math.max(scenarios.length, 1)) * 100);

  // Group scenarios by difficulty tier
  const tiers = useMemo(() => {
    const groups = { 1: [], 2: [], 3: [] };
    scenarios.forEach((s) => {
      const d = s.difficulty || 1;
      if (!groups[d]) groups[d] = [];
      groups[d].push(s);
    });
    return Object.entries(groups)
      .filter(([, list]) => list.length > 0)
      .sort(([a], [b]) => Number(a) - Number(b));
  }, [scenarios]);

  return (
    <div className="scenario-menu">
      {/* Stats Banner */}
      <div className="stats-banner">
        <h1 className="stats-banner__title">
          Poker <span>Decisions</span>
        </h1>
        <div className="stats-banner__numbers">
          <div className="stat-item">
            <span className="stat-item__value">{totalCompleted}/{scenarios.length}</span>
            <span className="stat-item__label">Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-item__value">{totalCorrect}</span>
            <span className="stat-item__label">Correct</span>
          </div>
          <div className="stat-item">
            <span className="stat-item__value">{accuracy}%</span>
            <span className="stat-item__label">Accuracy</span>
          </div>
          <div className="stat-item">
            <span className="stat-item__value">{mastered.size}</span>
            <span className="stat-item__label">Concepts</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCompleted > 0 && (
        <div className="progress-bar" style={{ maxWidth: 900, margin: '0 auto var(--space-3)' }}>
          <div className="progress-bar__track">
            <div className="progress-bar__fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* Navigation Row */}
      <div className="nav-row">
        <button className="nav-btn" onClick={onFreePlay}>
          🃏 Free Play
        </button>
        <button className="nav-btn nav-btn--coach" onClick={onCoach}>
          🎓 Ask Coach
        </button>
      </div>

      {/* Tier Sections */}
      {tiers.map(([difficulty, tierScenarios]) => (
        <section key={difficulty} className="tier-section">
          <h2 className="tier-header">
            <span className="tier-header__stars">
              {'★'.repeat(Number(difficulty))}{'☆'.repeat(3 - Number(difficulty))}
            </span>
            {TIER_LABELS[Number(difficulty)] || `Tier ${difficulty}`}
          </h2>
          <div className="scenario-grid">
            {tierScenarios.map((scenario) => {
              const result = completed[scenario.id];
              const isCompleted = !!result;
              const isCorrect = result?.correct;

              return (
                <div
                  key={scenario.id}
                  className={`scenario-card ${isCompleted ? (isCorrect ? 'scenario-card--completed' : 'scenario-card--wrong') : ''}`}
                  onClick={() => onSelectScenario(scenario.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectScenario(scenario.id);
                    }
                  }}
                >
                  <div className="scenario-card__header">
                    <h3 className="scenario-card__title">{scenario.title}</h3>
                    <span className="scenario-card__status">
                      {isCompleted ? (isCorrect ? '✓' : '✗') : ''}
                    </span>
                  </div>
                  <p className="scenario-card__concept">
                    {formatConcepts(scenario.concepts)}
                  </p>
                  <div className="scenario-card__footer">
                    <span className="scenario-card__difficulty">
                      {'★'.repeat(scenario.difficulty)}{'☆'.repeat(3 - scenario.difficulty)}
                    </span>
                    <span className={`scenario-card__category scenario-card__category--${scenario.category}`}>
                      {scenario.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {scenarios.length === 0 && (
        <div className="scenario-menu__empty">
          No scenarios available yet.
        </div>
      )}
    </div>
  );
}
