/**
 * grading — how an answer is judged.
 * Outs and decisions are exact. Estimates get a band, because the rule of 2 is
 * an approximation and grading it as exact would teach the wrong thing
 * (rule of 2 vs exact outs/46 differs by ≤ 3.7 points for ≤ 21 outs).
 */
import { pct } from '../lesson/lessonMath.js';

export const TOL = { chance: 4, price: 3 };

export function gradeEstimate(guess, share, tol) {
  const exact = pct(share);
  return { guess, exact, correct: guess != null && Math.abs(guess - exact) <= tol };
}
