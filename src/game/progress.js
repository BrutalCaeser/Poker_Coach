/**
 * progress — the rules of the game, as pure functions.
 * ====================================================
 * Mastery, not points. There is no score, no currency, no chips: a step is
 * either being learned, mastered, or due for review. This is deliberate. A
 * product that teaches newcomers poker must reward understanding, never luck
 * (gambling-harm research flags variable rewards and chip-based scoring).
 *
 *   MASTERY GATE   a step is cleared after MASTERY correct answers IN A ROW,
 *                  each on a different generated variation. A miss resets the
 *                  run: like an opening trainer, you have to play the whole
 *                  line right, not most of it.
 *   UNLOCKS        strictly in order. You can always replay earlier steps.
 *   SPACED REVIEW  once mastered, a step comes back after 1, 3, 7, then 21
 *                  days. A missed review shortens the gap again; it never
 *                  re-locks anything (no punishment loops).
 *
 * All functions are immutable: they return a new progress object.
 */

export const ORDER = ['outs', 'chance', 'price', 'decide', 'chain', 'boss'];
export const MASTERY = 3;
export const REVIEW_DAYS = [1, 3, 7, 21];
export const DAY = 24 * 60 * 60 * 1000;
export const STORAGE_KEY = 'pd.v3.progress';
const VERSION = 1;

export function emptyProgress() {
  return { version: VERSION, steps: {} };
}

const fresh = () => ({
  streak: 0,
  misses: 0,
  mastered: false,
  masteredAt: null,
  played: 0,
  correct: 0,
  review: null,
});

export function getStep(p, id) {
  return { ...fresh(), ...(p?.steps?.[id] ?? {}) };
}

const withStep = (p, id, s) => ({ ...p, steps: { ...p.steps, [id]: s } });

export function isUnlocked(p, id) {
  const i = ORDER.indexOf(id);
  if (i < 0) return false;
  if (i === 0) return true;
  return getStep(p, ORDER[i - 1]).mastered;
}

/**
 * A learning attempt (mastery-gated).
 *
 * Hints cost something, as in the best trainers (chess.com forfeits points
 * for a hinted solve; chesspuzzle.net rates hinted solves separately): a
 * correct answer given WITH the hint open resets your misses (you got it) but
 * does not advance the run. "3 in a row" means three unaided.
 */
export function recordAttempt(p, id, correct, now, { hinted = false } = {}) {
  const s = getStep(p, id);
  s.played += 1;
  if (correct && hinted) {
    s.correct += 1;
    s.misses = 0;
  } else if (correct) {
    s.correct += 1;
    s.streak += 1;
    s.misses = 0;
    if (!s.mastered && s.streak >= MASTERY) {
      s.mastered = true;
      s.masteredAt = now;
      s.review = { due: now + REVIEW_DAYS[0] * DAY, level: 0 };
    }
  } else {
    s.streak = 0;
    s.misses += 1;
  }
  return withStep(p, id, s);
}

/** True only for the attempt that crossed the mastery line. */
export function justMastered(before, after, id) {
  return !getStep(before, id).mastered && getStep(after, id).mastered;
}

export function isReviewDue(p, id, now) {
  const s = getStep(p, id);
  return Boolean(s.mastered && s.review && now >= s.review.due);
}

/** A spaced-review attempt: one spot, widens or resets the interval. */
export function recordReview(p, id, correct, now) {
  const s = getStep(p, id);
  s.played += 1;
  if (correct) s.correct += 1;
  const level = correct ? Math.min((s.review?.level ?? 0) + 1, REVIEW_DAYS.length - 1) : 0;
  s.review = { due: now + REVIEW_DAYS[level] * DAY, level };
  return withStep(p, id, s);
}

export function markBossDone(p, now) {
  const s = getStep(p, 'boss');
  return withStep(p, 'boss', { ...s, mastered: true, masteredAt: s.masteredAt ?? now });
}

/** The single next thing to do: the first unlocked step not yet mastered. */
export function frontier(p) {
  return ORDER.find((id) => isUnlocked(p, id) && !getStep(p, id).mastered) ?? null;
}

export function dueReviews(p, now) {
  return ORDER.filter((id) => id !== 'boss' && isReviewDue(p, id, now));
}

export function nextReviewAt(p) {
  const dues = ORDER.map((id) => getStep(p, id).review?.due).filter(Boolean);
  return dues.length ? Math.min(...dues) : null;
}

export function masteredCount(p) {
  return ORDER.filter((id) => getStep(p, id).mastered).length;
}

/** Dev/demo: everything before the boss mastered, reviews not yet due. */
export function unlockAll(p, now) {
  let q = p;
  for (const id of ORDER) {
    if (id === 'boss' || getStep(q, id).mastered) continue;
    q = withStep(q, id, {
      ...getStep(q, id),
      mastered: true,
      masteredAt: now,
      streak: MASTERY,
      review: { due: now + REVIEW_DAYS[0] * DAY, level: 0 },
    });
  }
  return q;
}

/* ── persistence: tolerant of missing, blocked, or corrupted storage ── */

export function load(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const p = JSON.parse(raw);
    if (!p || p.version !== VERSION || typeof p.steps !== 'object' || p.steps === null) {
      return emptyProgress();
    }
    return p;
  } catch {
    return emptyProgress();
  }
}

export function save(storage, p) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}
