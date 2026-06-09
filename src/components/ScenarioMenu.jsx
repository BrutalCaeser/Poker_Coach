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

/** Render difficulty as individual filled/empty star spans for CSS color-splitting */
function DifficultyStars({ difficulty, max = 3 }) {
  return (
    <span className="scenario-card__difficulty" aria-label={`Difficulty ${difficulty} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < difficulty ? 'star-filled' : 'star-empty'}>
          {i < difficulty ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

/** Render up to 3 concept chips individually */
function ConceptChips({ concepts }) {
  if (!concepts || concepts.length === 0) return <div className="scenario-card__chips" />;
  return (
    <div className="scenario-card__chips">
      {concepts.slice(0, 3).map((c) => (
        <span key={c} className="scenario-card__chip">
          {c.replace(/-/g, ' ')}
        </span>
      ))}
    </div>
  );
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

      {/* ── Stats Banner ── */}
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

      {/* ── Progress Bar ── */}
      {totalCompleted > 0 && (
        <div className="progress-bar">
          <div className="progress-bar__label">{progressPct}% complete</div>
          <div className="progress-bar__track">
            <div
              className="progress-bar__fill"
              style={{ transform: `scaleX(${progressPct / 100})` }}
            />
          </div>
        </div>
      )}

      {/* ── Navigation Row ── */}
      <div className="nav-row">
        <button className="nav-btn" onClick={onFreePlay}>
          🃏 Free Play
        </button>
        <button className="nav-btn nav-btn--coach" onClick={onCoach}>
          🎓 Ask Coach
        </button>
      </div>

      {/* ── Tier Sections ── */}
      {tiers.map(([difficulty, tierScenarios]) => (
        <section key={difficulty} className="tier-section">
          <h2 className="tier-header">
            <span className="tier-header__stars">
              {'★'.repeat(Number(difficulty))}{'☆'.repeat(3 - Number(difficulty))}
            </span>
            <span className="tier-header__label">
              {TIER_LABELS[Number(difficulty)] || `Tier ${difficulty}`}
            </span>
          </h2>

          <div className="scenario-grid">
            {tierScenarios.map((scenario, idx) => {
              const result = completed[scenario.id];
              const isCompleted = !!result;
              const isCorrect = result?.correct;

              // Stagger entrance: 40ms per card, cap at 400ms
              const cardDelay = `${Math.min(idx * 40, 400)}ms`;

              let cardClass = 'scenario-card';
              if (isCompleted) {
                cardClass += isCorrect ? ' scenario-card--completed' : ' scenario-card--wrong';
              }

              return (
                <div
                  key={scenario.id}
                  className={cardClass}
                  style={{ '--card-delay': cardDelay }}
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
                    {isCompleted && (
                      <span className="scenario-card__status">
                        {isCorrect ? '✓' : '✗'}
                      </span>
                    )}
                  </div>

                  <ConceptChips concepts={scenario.concepts} />

                  <div className="scenario-card__footer">
                    <DifficultyStars difficulty={scenario.difficulty} />
                    <span
                      className={`scenario-card__category scenario-card__category--${scenario.category}`}
                    >
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
