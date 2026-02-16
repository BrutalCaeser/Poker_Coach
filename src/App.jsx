/**
 * App.jsx — Root Component with State-Based Routing
 * ==================================================
 * Routes:
 *   home        → ScenarioMenu (landing page)
 *   play/:id    → ScenarioPlay (scenario playthrough)
 *   free-play   → FreePlay (sandbox mode, Phase 6)
 *   coach       → Coach (standalone chat, Phase 5)
 */
import { useState, useCallback, useMemo } from 'react';
import ScenarioMenu from './components/ScenarioMenu.jsx';
import ScenarioPlay from './components/ScenarioPlay.jsx';
import { scenarios, getScenarioById } from './scenarios/index.js';
import './App.css';

/** Simple state-based router — no library needed */
function useRouter() {
  const [route, setRoute] = useState({ page: 'home', params: {} });

  const navigate = useCallback((page, params = {}) => {
    setRoute({ page, params });
    window.scrollTo(0, 0);
  }, []);

  return { route, navigate };
}

/** User stats stored in state (persistence added in Phase 4.3) */
function useUserStats() {
  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem('poker-decisions-stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { completed: parsed.completed || {} };
      }
    } catch { /* ignore */ }
    return { completed: {} };
  });

  const recordResult = useCallback((scenarioId, userAction, isCorrect) => {
    setStats((prev) => {
      const next = {
        ...prev,
        completed: {
          ...prev.completed,
          [scenarioId]: { action: userAction, correct: isCorrect },
        },
      };
      try {
        localStorage.setItem('poker-decisions-stats', JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  return { stats, recordResult };
}

export default function App() {
  const { route, navigate } = useRouter();
  const { stats, recordResult } = useUserStats();

  // Find next scenario for "Next Hand" button
  const getNextScenarioId = useCallback((currentId) => {
    const idx = scenarios.findIndex((s) => s.id === currentId);
    if (idx === -1 || idx === scenarios.length - 1) return null;
    return scenarios[idx + 1].id;
  }, []);

  // Route: Home
  if (route.page === 'home') {
    return (
      <div className="page-transition">
        <ScenarioMenu
          scenarios={scenarios}
          userStats={stats}
          onSelectScenario={(id) => navigate('play', { id })}
          onFreePlay={() => navigate('free-play')}
          onCoach={() => navigate('coach')}
        />
      </div>
    );
  }

  // Route: Scenario Play
  if (route.page === 'play') {
    const scenario = getScenarioById(route.params.id);

    if (!scenario) {
      return (
        <div className="page-transition" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-primary)' }}>Scenario not found</h2>
          <button
            className="nav-btn"
            onClick={() => navigate('home')}
            style={{ marginTop: '1rem' }}
          >
            ← Back to Home
          </button>
        </div>
      );
    }

    return (
      <div className="page-transition">
        <ScenarioPlay
          key={scenario.id}
          scenario={scenario}
          onBack={() => navigate('home')}
          onNext={() => {
            const nextId = getNextScenarioId(scenario.id);
            if (nextId) {
              navigate('play', { id: nextId });
            } else {
              navigate('home');
            }
          }}
          onComplete={({ scenarioId, userAction, isCorrect }) => {
            recordResult(scenarioId, userAction, isCorrect);
          }}
        />
      </div>
    );
  }

  // Route: Free Play (Phase 6 placeholder)
  if (route.page === 'free-play') {
    return (
      <div className="page-transition" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        gap: '1rem',
      }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
          🃏 Free Play Mode
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Coming soon — build and analyze any hand.</p>
        <button className="nav-btn" onClick={() => navigate('home')}>
          ← Back to Home
        </button>
      </div>
    );
  }

  // Route: Coach (Phase 5 placeholder)
  if (route.page === 'coach') {
    return (
      <div className="page-transition" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        gap: '1rem',
      }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
          🎓 AI Poker Coach
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Coming soon — your personal poker mentor.</p>
        <button className="nav-btn" onClick={() => navigate('home')}>
          ← Back to Home
        </button>
      </div>
    );
  }

  // Fallback
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-primary)' }}>
      <h2>Page not found</h2>
      <button className="nav-btn" onClick={() => navigate('home')}>
        ← Back to Home
      </button>
    </div>
  );
}
