/**
 * User Stats Persistence
 * ======================
 * Manages user progress in localStorage:
 * - Which scenarios completed and what the user chose
 * - Accuracy percentage
 * - Concepts mastered (a concept is "mastered" when the user gets it right)
 *
 * Storage key: 'poker-decisions-stats'
 * Schema: { completed: { [scenarioId]: { action, correct } } }
 */

const STORAGE_KEY = 'poker-decisions-stats';

/**
 * Load stats from localStorage.
 * @returns {{ completed: Object<string, { action: string, correct: boolean }> }}
 */
export function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        completed: parsed.completed || {},
      };
    }
  } catch {
    // Corrupted data — start fresh
  }
  return { completed: {} };
}

/**
 * Save stats to localStorage.
 * @param {{ completed: Object }} stats
 */
export function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

/**
 * Record a scenario result.
 * @param {Object} stats - Current stats
 * @param {string} scenarioId
 * @param {string} userAction - What the user chose
 * @param {boolean} isCorrect
 * @returns {Object} Updated stats
 */
export function recordResult(stats, scenarioId, userAction, isCorrect) {
  const next = {
    ...stats,
    completed: {
      ...stats.completed,
      [scenarioId]: { action: userAction, correct: isCorrect },
    },
  };
  saveStats(next);
  return next;
}

/**
 * Calculate accuracy percentage.
 * @param {Object} stats
 * @returns {number} 0-100
 */
export function getAccuracy(stats) {
  const results = Object.values(stats.completed || {});
  if (results.length === 0) return 0;
  const correct = results.filter((r) => r.correct).length;
  return Math.round((correct / results.length) * 100);
}

/**
 * Get concepts the user has mastered (answered correctly in a scenario teaching that concept).
 * @param {Object} stats
 * @param {Object[]} scenarios - Full scenario array
 * @returns {Set<string>} Set of mastered concept strings
 */
export function getMasteredConcepts(stats, scenarios) {
  const mastered = new Set();
  for (const scenario of scenarios) {
    const result = stats.completed?.[scenario.id];
    if (result?.correct && scenario.concepts) {
      scenario.concepts.forEach((c) => mastered.add(c));
    }
  }
  return mastered;
}

/**
 * Get the number of completed and correct scenarios.
 * @param {Object} stats
 * @returns {{ total: number, correct: number, accuracy: number }}
 */
export function getSummary(stats) {
  const results = Object.values(stats.completed || {});
  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  return {
    total,
    correct,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
  };
}

/**
 * Clear all stats (reset progress).
 */
export function clearStats() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
