/**
 * The rules of the game: mastery gate, unlock order, spaced review, storage.
 */
import { describe, it, expect } from 'vitest';
import {
  emptyProgress, recordAttempt, isUnlocked, getStep, justMastered, isReviewDue, recordReview,
  frontier, dueReviews, unlockAll, markBossDone, load, save, MASTERY, REVIEW_DAYS, DAY, ORDER, STORAGE_KEY,
} from '../progress.js';

const T0 = Date.UTC(2026, 9, 12);
const run = (p, id, results) => results.reduce((q, ok) => recordAttempt(q, id, ok, T0), p);

describe('mastery gate', () => {
  it(`needs ${MASTERY} correct in a row`, () => {
    let p = run(emptyProgress(), 'outs', [true, true]);
    expect(getStep(p, 'outs').mastered).toBe(false);
    p = recordAttempt(p, 'outs', true, T0);
    expect(getStep(p, 'outs').mastered).toBe(true);
  });

  it('a miss resets the run: most of the line is not the line', () => {
    const p = run(emptyProgress(), 'outs', [true, true, false, true, true]);
    expect(getStep(p, 'outs').mastered).toBe(false);
    expect(getStep(p, 'outs').streak).toBe(2);
  });

  it('counts consecutive misses (drives the hint) and clears them on a correct answer', () => {
    let p = run(emptyProgress(), 'outs', [false, false]);
    expect(getStep(p, 'outs').misses).toBe(2);
    p = recordAttempt(p, 'outs', true, T0);
    expect(getStep(p, 'outs').misses).toBe(0);
  });

  it('a hinted correct answer resets misses but does not advance the run', () => {
    let p = run(emptyProgress(), 'outs', [true, false, false]);
    p = recordAttempt(p, 'outs', true, T0, { hinted: true });
    expect(getStep(p, 'outs').streak).toBe(0);
    expect(getStep(p, 'outs').misses).toBe(0);
    expect(getStep(p, 'outs').correct).toBe(2);
    p = run(p, 'outs', [true, true, true]);
    expect(getStep(p, 'outs').mastered).toBe(true); // three unaided
  });

  it('justMastered fires exactly once, on the crossing attempt', () => {
    const before = run(emptyProgress(), 'outs', [true, true]);
    const after = recordAttempt(before, 'outs', true, T0);
    expect(justMastered(before, after, 'outs')).toBe(true);
    expect(justMastered(after, recordAttempt(after, 'outs', true, T0), 'outs')).toBe(false);
  });

  it('never mutates its input', () => {
    const p = emptyProgress();
    recordAttempt(p, 'outs', true, T0);
    expect(p.steps).toEqual({});
  });
});

describe('unlocks', () => {
  it('only the first step is open at the start', () => {
    const p = emptyProgress();
    expect(ORDER.map((id) => isUnlocked(p, id))).toEqual([true, false, false, false, false, false]);
    expect(frontier(p)).toBe('outs');
  });

  it('mastering a step opens the next, in order, up to the boss', () => {
    let p = emptyProgress();
    for (const id of ORDER.slice(0, -1)) {
      expect(frontier(p)).toBe(id);
      p = run(p, id, [true, true, true]);
    }
    expect(isUnlocked(p, 'boss')).toBe(true);
    expect(frontier(p)).toBe('boss');
    p = markBossDone(p, T0);
    expect(frontier(p)).toBe(null);
  });

  it('unlockAll (demo) opens the boss without marking it done', () => {
    const p = unlockAll(emptyProgress(), T0);
    expect(isUnlocked(p, 'boss')).toBe(true);
    expect(getStep(p, 'boss').mastered).toBe(false);
  });
});

describe('spaced review', () => {
  const mastered = run(emptyProgress(), 'outs', [true, true, true]);

  it(`first review is due ${REVIEW_DAYS[0]} day after mastery`, () => {
    expect(isReviewDue(mastered, 'outs', T0)).toBe(false);
    expect(isReviewDue(mastered, 'outs', T0 + DAY)).toBe(true);
    expect(dueReviews(mastered, T0 + DAY)).toEqual(['outs']);
  });

  it('a passed review widens the gap: 1 → 3 → 7 → 21 days, then holds', () => {
    let p = mastered;
    let now = T0 + DAY;
    for (const days of [3, 7, 21, 21]) {
      p = recordReview(p, 'outs', true, now);
      expect(getStep(p, 'outs').review.due - now).toBe(days * DAY);
      now = getStep(p, 'outs').review.due;
    }
  });

  it('a missed review shortens the gap again but never re-locks anything', () => {
    let p = run(mastered, 'chance', [true, true, true]);
    p = recordReview(p, 'outs', false, T0 + DAY);
    expect(getStep(p, 'outs').review.due - (T0 + DAY)).toBe(REVIEW_DAYS[0] * DAY);
    expect(getStep(p, 'outs').mastered).toBe(true);
    expect(isUnlocked(p, 'price')).toBe(true);
  });
});

describe('storage', () => {
  const mem = () => {
    const m = new Map();
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), _m: m };
  };

  it('round-trips', () => {
    const s = mem();
    const p = run(emptyProgress(), 'outs', [true]);
    expect(save(s, p)).toBe(true);
    expect(load(s)).toEqual(p);
  });

  it('survives corrupted, foreign-version, missing and throwing storage', () => {
    const s = mem();
    s.setItem(STORAGE_KEY, '{not json');
    expect(load(s)).toEqual(emptyProgress());
    s.setItem(STORAGE_KEY, JSON.stringify({ version: 99, steps: {} }));
    expect(load(s)).toEqual(emptyProgress());
    expect(load(null)).toEqual(emptyProgress());
    const boom = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(load(boom)).toEqual(emptyProgress());
    expect(save(boom, emptyProgress())).toBe(false);
  });
});
