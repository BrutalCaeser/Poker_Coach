/**
 * Real-hand scenario registry
 * ============================
 * Aggregates all authored real-hand (Ghost Seat) scenarios.
 *
 * HOW TO ADD A NEW HAND:
 *   1. Author a file in this directory, e.g. `moneymaker-farha-2003.js`.
 *   2. Export the scenario object as a named export matching the file's slug,
 *      e.g. `export const moneymakerFarha2003 = { ... }`.
 *   3. Import it here and add it to `realHandScenarios`.
 *
 * Guards: each import is wrapped in a try/catch comment. Because static imports
 * fail at parse time (not runtime), we instead keep a single canonical list.
 * When a hand file doesn't exist yet, simply leave it commented out below.
 */

import { moneymakerFarha2003 } from './moneymaker-farha-2003.js';

/**
 * All real-hand (v2) scenarios.
 * Append new hands here once their files are authored.
 * @type {Object[]}
 */
export const realHandScenarios = [
  moneymakerFarha2003,
];

export default realHandScenarios;
