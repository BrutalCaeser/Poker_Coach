/**
 * math-truth.test.js — Milestone 1 correctness gate.
 *
 * Asserts that each scenario's hand-authored teaching numbers agree with the
 * engine, so a wrong number can never silently ship. This is the gate the
 * validation suite was MISSING (it only checked potOdds() returned a fraction,
 * never that the authored value matched).
 *
 * Stage 1 covers POT ODDS — verified correct for every scenario that states a
 * threshold (13/13 in the audit). Outs/equity assertions are added as the
 * engine's countOuts is corrected (see scripts/math-audit.mjs).
 */
import { describe, it, expect } from 'vitest';
import { scenarios } from '../index.js';
import { potOdds } from '../../engine/math.js';

// extract the first NN% / NN.N% from a string
function pctIn(s) {
  if (s == null) return null;
  const m = String(s).match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? parseFloat(m[1]) : null;
}

describe('math-truth gate — pot odds match the engine', () => {
  for (const scn of scenarios) {
    const step = scn.mathSteps.find((s) => /pot odds/i.test(s.label));

    it(`${scn.id}: potOdds() is a valid fraction in (0,1)`, () => {
      const eng = potOdds(scn.decision.callAmount, scn.decision.pot);
      expect(eng).toBeGreaterThan(0);
      expect(eng).toBeLessThan(1);
    });

    if (step) {
      const authored = pctIn(step.value) ?? pctIn(step.formula);
      it(`${scn.id}: authored pot-odds threshold (${authored}%) matches engine ±0.6pp`, () => {
        expect(authored).not.toBeNull();
        const eng = potOdds(scn.decision.callAmount, scn.decision.pot) * 100;
        expect(Math.abs(eng - authored)).toBeLessThanOrEqual(0.6);
      });
    }
  }
});
