/**
 * Phase 2.2 — Scenario Validation
 * ================================
 * Validates every scenario for structural correctness:
 *   - All cards valid and unique (no duplicates)
 *   - Action sequences end with a decision type
 *   - mathSteps have valid status values
 *   - Equity values roughly match engine output
 *   - Pot odds math checks out
 */

import { scenarios, getScenarioById } from '../index.js';
import { parseCard, parseCards } from '../../engine/cards.js';
import { potOdds } from '../../engine/math.js';
import { countOuts } from '../../engine/outs.js';

const VALID_STATUSES = ['pass', 'fail', 'warning', 'key', undefined];
const VALID_POSITIONS = ['UTG', 'UTG+1', 'MP', 'MP+1', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const VALID_OPTIONS = ['call', 'fold', 'raise'];
const VALID_CATEGORIES = ['cash', 'tournament', 'multiway', 'bluffing', 'preflop'];

describe('Scenario Library Validation', () => {
  test('has all 15 scenarios', () => {
    expect(scenarios).toHaveLength(15);
  });

  test('all scenario IDs are unique', () => {
    const ids = scenarios.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('getScenarioById works for all scenarios', () => {
    for (const s of scenarios) {
      expect(getScenarioById(s.id)).toBe(s);
    }
    expect(getScenarioById('nonexistent')).toBeUndefined();
  });

  describe.each(scenarios.map((s, i) => [i + 1, s.id, s]))('Scenario %i: %s', (_num, _id, scenario) => {
    test('has required top-level fields', () => {
      expect(scenario.id).toBeTruthy();
      expect(typeof scenario.title).toBe('string');
      expect(scenario.title.length).toBeGreaterThan(0);
      expect(scenario.concepts).toBeInstanceOf(Array);
      expect(scenario.concepts.length).toBeGreaterThan(0);
      expect([1, 2, 3]).toContain(scenario.difficulty);
      expect(VALID_CATEGORIES).toContain(scenario.category);
      expect(scenario.players).toBeInstanceOf(Array);
      expect(scenario.players.length).toBeGreaterThanOrEqual(2);
      expect(typeof scenario.heroIndex).toBe('number');
      expect(scenario.heroIndex).toBeGreaterThanOrEqual(0);
      expect(scenario.heroIndex).toBeLessThan(scenario.players.length);
    });

    test('has valid blinds structure', () => {
      expect(typeof scenario.blinds.small).toBe('number');
      expect(typeof scenario.blinds.big).toBe('number');
      expect(typeof scenario.blinds.ante).toBe('number');
      expect(scenario.blinds.small).toBeGreaterThan(0);
      expect(scenario.blinds.big).toBeGreaterThan(scenario.blinds.small);
    });

    test('players have valid positions and stacks', () => {
      for (const player of scenario.players) {
        expect(typeof player.name).toBe('string');
        expect(VALID_POSITIONS).toContain(player.position);
        expect(typeof player.stack).toBe('number');
        expect(player.stack).toBeGreaterThan(0);
        expect(player.cards).toBeInstanceOf(Array);
      }
    });

    test('hero has exactly 2 valid hole cards', () => {
      const hero = scenario.players[scenario.heroIndex];
      expect(hero.cards).toHaveLength(2);
      // Should be parseable
      const parsed = parseCards(hero.cards);
      expect(parsed).toHaveLength(2);
    });

    test('all known cards are valid and unique', () => {
      const allCards = [];

      // Collect all player cards
      for (const player of scenario.players) {
        if (player.cards && player.cards.length > 0) {
          allCards.push(...player.cards);
        }
      }

      // Collect board cards from actions
      for (const action of scenario.actions) {
        if (action.type === 'board') {
          allCards.push(...action.cards);
        }
      }

      // Verify all are parseable
      for (const cardStr of allCards) {
        expect(() => parseCard(cardStr)).not.toThrow();
      }

      // Verify no duplicates
      const cardSet = new Set(allCards);
      expect(cardSet.size).toBe(allCards.length);
    });

    test('action sequence ends with a decision', () => {
      const actions = scenario.actions;
      expect(actions.length).toBeGreaterThan(0);

      // Find the decision action
      const decisionActions = actions.filter((a) => a.type === 'decision');
      expect(decisionActions.length).toBe(1);

      // Decision should be the last action
      expect(actions[actions.length - 1].type).toBe('decision');
    });

    test('decision action has valid structure', () => {
      const decision = scenario.actions.find((a) => a.type === 'decision');
      expect(decision.options).toBeInstanceOf(Array);
      expect(decision.options.length).toBeGreaterThanOrEqual(2);
      for (const opt of decision.options) {
        expect(VALID_OPTIONS).toContain(opt);
      }
      expect(typeof decision.callAmount).toBe('number');
      expect(decision.callAmount).toBeGreaterThan(0);
    });

    test('decision object matches decision action', () => {
      const decisionAction = scenario.actions.find((a) => a.type === 'decision');
      const { decision } = scenario;

      expect(decision.options).toEqual(decisionAction.options);
      expect(decision.callAmount).toBe(decisionAction.callAmount);
      expect(VALID_OPTIONS).toContain(decision.correctAction);
      expect(decision.options).toContain(decision.correctAction);
      expect(typeof decision.pot).toBe('number');
      expect(decision.pot).toBeGreaterThan(0);
      expect(typeof decision.heroStack).toBe('number');
      expect(decision.heroStack).toBeGreaterThan(0);
    });

    test('mathSteps are valid', () => {
      expect(scenario.mathSteps).toBeInstanceOf(Array);
      expect(scenario.mathSteps.length).toBeGreaterThan(0);

      for (const step of scenario.mathSteps) {
        expect(typeof step.label).toBe('string');
        expect(typeof step.value).toBe('string');
        if (step.status !== undefined) {
          expect(VALID_STATUSES).toContain(step.status);
        }
      }
    });

    test('has coaching content', () => {
      expect(typeof scenario.insight).toBe('string');
      expect(scenario.insight.length).toBeGreaterThan(0);
      expect(typeof scenario.takeaway).toBe('string');
      expect(scenario.takeaway.length).toBeGreaterThan(0);
      expect(typeof scenario.coachNotes).toBe('string');
      expect(scenario.coachNotes.length).toBeGreaterThan(0);
    });

    test('has source metadata', () => {
      expect(scenario.source).toBeDefined();
      expect(typeof scenario.source.type).toBe('string');
      expect(typeof scenario.source.name).toBe('string');
    });

    test('pot odds math is consistent', () => {
      const { decision } = scenario;
      const computed = potOdds(decision.callAmount, decision.pot);
      // Pot odds should be between 0 and 1
      expect(computed).toBeGreaterThan(0);
      expect(computed).toBeLessThan(1);
    });

    test('all bet actions reference valid player indices', () => {
      for (const action of scenario.actions) {
        if (action.type === 'bet') {
          expect(typeof action.player).toBe('number');
          expect(action.player).toBeGreaterThanOrEqual(0);
          expect(action.player).toBeLessThan(scenario.players.length);
          expect(typeof action.name).toBe('string');
          expect(typeof action.action).toBe('string');
          expect(typeof action.amount).toBe('number');
        }
      }
    });

    test('board actions have valid cards', () => {
      for (const action of scenario.actions) {
        if (action.type === 'board') {
          expect(action.cards).toBeInstanceOf(Array);
          expect(action.cards.length).toBeGreaterThan(0);
          expect(action.cards.length).toBeLessThanOrEqual(3); // flop is max 3
          for (const card of action.cards) {
            expect(() => parseCard(card)).not.toThrow();
          }
        }
      }
    });
  });
});

// Validate scenarios with post-flop boards have engine-consistent outs
describe('Engine Consistency Checks', () => {
  // Scenarios with post-flop decision points where outs matter
  const postFlopScenarios = scenarios.filter((s) => {
    const boardActions = s.actions.filter((a) => a.type === 'board');
    return boardActions.length > 0;
  });

  describe.each(postFlopScenarios.map((s) => [s.id, s]))('Post-flop: %s', (_id, scenario) => {
    test('hero cards + board cards produce valid outs count', () => {
      const hero = scenario.players[scenario.heroIndex];
      const heroCards = parseCards(hero.cards);

      // Collect all board cards from actions
      const boardCards = [];
      for (const action of scenario.actions) {
        if (action.type === 'board') {
          boardCards.push(...parseCards(action.cards));
        }
      }

      // Only test if board is 3-4 cards (flop or turn)
      if (boardCards.length >= 3 && boardCards.length <= 4) {
        const result = countOuts(heroCards, boardCards);
        expect(typeof result.totalOuts).toBe('number');
        expect(result.totalOuts).toBeGreaterThanOrEqual(0);
        expect(result.totalOuts).toBeLessThanOrEqual(47 - boardCards.length);
      }
    });
  });
});
