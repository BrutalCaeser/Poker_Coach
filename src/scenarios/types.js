/**
 * Scenario Schema Type Definitions
 * =================================
 * JSDoc-style type documentation for the Poker Decisions scenario system.
 * These are shape definitions for reference — not TypeScript, just plain JS docs.
 *
 * Card strings use the format: RankSuit
 *   Rank: 2-9, T (10), J, Q, K, A
 *   Suit: h (hearts), d (diamonds), c (clubs), s (spades)
 *   Examples: "Ah" (Ace of hearts), "Td" (Ten of diamonds), "9c" (Nine of clubs)
 */

/**
 * @typedef {string} CardString
 * A two-character string representing a playing card.
 * First character is rank: "2"-"9", "T", "J", "Q", "K", "A"
 * Second character is suit: "h", "d", "c", "s"
 * Examples: "Ah", "Ks", "Td", "9c", "2h"
 */

/**
 * @typedef {"UTG"|"UTG+1"|"MP"|"MP+1"|"HJ"|"CO"|"BTN"|"SB"|"BB"} Position
 * Standard poker table positions.
 *   UTG    - Under the Gun (first to act preflop)
 *   UTG+1  - One seat after UTG
 *   MP     - Middle Position
 *   MP+1   - Middle Position +1
 *   HJ     - Hijack
 *   CO     - Cutoff
 *   BTN    - Button (dealer)
 *   SB     - Small Blind
 *   BB     - Big Blind
 */

/**
 * @typedef {Object} Player
 * @property {string}       name     - Display name (e.g., "You", "Marcus", "Nadia")
 * @property {Position}     position - Table position
 * @property {number}       stack    - Starting stack size in chips/dollars
 * @property {CardString[]} cards    - Array of 2 hole cards (e.g., ["Ah", "Kd"])
 *                                     Empty array if cards are unknown/face-down.
 * @property {string|null}  [behaviour] - Short descriptor of opponent play-style
 *                                        (e.g., "Tight-Aggressive"). Null for the hero.
 */

/**
 * @typedef {Object} Blinds
 * @property {number} small - Small blind amount
 * @property {number} big   - Big blind amount
 * @property {number} ante  - Ante amount (0 if no ante)
 */

/**
 * @typedef {Object} InfoAction
 * @property {"info"} type - Action type identifier
 * @property {string} text - Informational message displayed in the action feed.
 *                           Used for blinds posting, situation descriptions, etc.
 *                           Example: "Blinds posted: $500/$1,000"
 */

/**
 * @typedef {Object} BetAction
 * @property {"bet"}  type   - Action type identifier
 * @property {number} player - Index into the scenario's players array
 * @property {string} name   - Player display name (for rendering)
 * @property {string} action - Description of the action: "raises to", "bets", "calls",
 *                             "3-bets to", "shoves all-in for", "folds", "checks", "limps"
 * @property {number} amount - Chip/dollar amount of the action
 */

/**
 * @typedef {Object} BoardAction
 * @property {"board"}      type  - Action type identifier
 * @property {CardString[]} cards - Array of community cards being dealt.
 *                                  Flop: 3 cards. Turn: 1 card. River: 1 card.
 */

/**
 * @typedef {Object} DecisionAction
 * @property {"decision"}  type        - Action type identifier
 * @property {string[]}    options     - Available actions: ["call","fold"] or ["call","fold","raise"]
 * @property {number}      callAmount  - Amount required to call
 * @property {number}      [raiseAmount] - Amount to raise to (only if "raise" is in options)
 */

/**
 * @typedef {InfoAction|BetAction|BoardAction|DecisionAction} Action
 * A single action in the scenario's event sequence. The action sequence is walked
 * through one at a time. When the engine hits a "decision" type, it pauses and
 * presents the decision prompt to the user.
 */

/**
 * @typedef {Object} Decision
 * @property {string[]} options       - Available actions matching the DecisionAction
 * @property {number}   callAmount    - Amount required to call
 * @property {number}   [raiseAmount] - Amount for a raise (if raise is an option)
 * @property {string}   correctAction - The mathematically correct action: "call", "fold", or "raise"
 * @property {number}   pot           - Total pot size facing the hero at decision point
 * @property {number}   heroStack     - Hero's remaining stack at decision point
 */

/**
 * @typedef {"pass"|"fail"|"warning"|"key"} MathStepStatus
 * Visual indicator for a math step:
 *   "pass"    - Green  - This check passes (favorable for calling)
 *   "fail"    - Red    - This check fails (unfavorable)
 *   "warning" - Yellow - Cautionary note, borderline, or mixed signal
 *   "key"     - Gold   - Key number or headline result
 */

/**
 * @typedef {Object} MathStep
 * @property {string}          label   - Description of this step (e.g., "Your outs", "Pot odds threshold")
 * @property {string}          value   - The computed result as a display string (e.g., "19.6%", "$2,350")
 * @property {string|null}     [formula] - The formula or calculation shown (e.g., "9 / 46", "9 x 2")
 *                                         Null or omitted if the step is purely descriptive.
 * @property {MathStepStatus}  [status]  - Visual status indicator. Omitted for neutral/informational steps.
 */

/**
 * @typedef {"beginner"|"intermediate"|"advanced"} DifficultyCategory
 */

/**
 * @typedef {"cash"|"tournament"|"multiway"|"bluffing"|"preflop"|"drawing"|"postflop"} ScenarioCategory
 */

/**
 * @typedef {Object} Scenario
 * @property {string}            id          - Unique identifier slug (e.g., "first-pot-odds")
 * @property {string}            title       - Display title (e.g., "Your First Pot Odds Decision")
 * @property {Object}            source      - Source information
 * @property {string}            source.type - Source type: "curated", "tournament", "cash", "user"
 * @property {string}            source.name - Source name: "Poker Decisions Curriculum", etc.
 * @property {string}            source.description - Brief description of origin/context
 *
 * @property {string[]}          concepts    - Teaching concepts (e.g., ["pot-odds", "outs-counting"])
 * @property {number}            difficulty  - Difficulty rating: 1 (beginner), 2 (intermediate), 3 (advanced)
 * @property {string}            category    - Scenario category tag
 *
 * @property {Player[]}          players     - Array of all players at the table
 * @property {Blinds}            blinds      - Blind and ante structure
 * @property {number}            heroIndex   - Index into the players array for the hero (user-controlled player)
 * @property {CardString[]}      board       - Community cards visible at the start of the scenario.
 *                                             Empty array for preflop scenarios. Cards may also be
 *                                             dealt progressively via BoardAction in the actions array.
 *
 * @property {Action[]}          actions     - Data-driven sequence of events. Must end with a DecisionAction.
 * @property {Decision}          decision    - The decision point data (mirrors the final DecisionAction
 *                                             plus correct answer and game state).
 *
 * @property {MathStep[]}        mathSteps   - Step-by-step math breakdown shown after the decision.
 *                                             Hand-crafted for each scenario with contextual explanations.
 *
 * @property {string}            insight     - 1-2 sentence framing of what this hand is really about.
 *                                             Shown at the top of the math reveal.
 *
 * @property {string}            takeaway    - Generalizable principle the user should internalize.
 *                                             Shown as a "takeaway card" after the math breakdown.
 *
 * @property {string}            coachNotes  - Coaching talking points for the AI Coach to reference.
 *                                             Used to construct contextual Coach responses.
 */

// ---------------------------------------------------------------------------
// SCHEMA V2 — additive types for real-hand ("Ghost Seat") scenarios
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} DecisionPoint
 * A single street where the hero must act in a multi-decision real-hand scenario.
 *
 * @property {string}      id            - Street identifier: "preflop"|"flop"|"turn"|"river"
 * @property {string}      street        - Human-readable label (e.g. "Flop")
 * @property {string[]}    options       - Available actions: e.g. ["call","fold","raise"]
 * @property {number}      callAmount    - Amount required to call
 * @property {number}      [raiseAmount] - Amount to raise to (only if "raise" is in options)
 * @property {string}      correctAction - The GTO/mathematically correct action
 * @property {number}      pot           - Total pot size facing the hero at this decision
 * @property {number}      heroStack     - Hero's remaining stack at this decision
 * @property {string}      proAction     - What the pro ACTUALLY did (withheld until after commit)
 * @property {string}      [proReasoning] - Optional brief explanation of the pro's reasoning
 * @property {number}      [drawEquityPct] - 0-100, the lesson's single-street draw equity for the
 *                                           EquityBar. Omit for all-in/preflop situations.
 * @property {MathStep[]}  mathSteps     - Step-by-step math breakdown for this decision point
 * @property {string}      insight       - 1-2 sentence framing of what this street is really about
 * @property {string}      takeaway      - Generalizable principle for this decision point
 */

/**
 * @typedef {Object} PlayerV2
 * Extended player shape for real-hand scenarios. Additive — all v1 Player
 * fields are still present; these are optional additions.
 *
 * @property {string}  [avatarId]  - Identifier for a stylized illustrated portrait asset
 * @property {boolean} [isPro]     - True if this player is the featured pro
 * @property {string}  [country]   - ISO 3166-1 alpha-2 country code (e.g. "US", "DE")
 */

/**
 * @typedef {Object} RealHandMeta
 * Attribution and provenance for a real-hand scenario.
 *
 * @property {string} event         - Tournament or game name (e.g. "WSOP Main Event")
 * @property {string} venue         - Physical venue (e.g. "Rio All-Suite Hotel, Las Vegas")
 * @property {string} date          - ISO date string or year (e.g. "2003-05-29" or "2003")
 * @property {string} [season]      - Season or series identifier (e.g. "2003")
 * @property {string} [sourceRef]   - URL or citation for the hand record
 * @property {string} [sourceLicense] - License under which the hand data is used (e.g. "CC-BY-4.0")
 */

/**
 * @typedef {Object} Action
 * @see {InfoAction|BetAction|BoardAction|DecisionAction} — existing v1 definition above.
 *
 * V2 extension: a `{type:"decision"}` action in a real-hand scenario's actions[]
 * array may additionally carry `decisionId` to link to the corresponding
 * DecisionPoint in `decisionPoints[]`.
 *
 * @property {string} [decisionId] - Links to the `id` of the matching DecisionPoint.
 *                                    Only present on decision-type actions in v2 scenarios.
 */

/**
 * @typedef {Object} StreetResult
 * The real continuation of play on a street AFTER the hero has made their
 * decision at that decision point.
 *
 * @property {string}   afterDpId            - The DecisionPoint.id this result follows
 * @property {Action[]} continuationActions  - The actual actions that happened after the
 *                                             hero's decision (bet/call/fold by other players)
 * @property {string[]} [newBoard]           - Cards dealt after this street (e.g. the turn card)
 */

/**
 * @typedef {Object} HandResult
 * The final outcome of the real hand.
 *
 * @property {number} potTotal        - Total pot won at showdown/end
 * @property {number} winnerIndex     - Index into the scenario's players[] array
 * @property {string} winnerName      - Display name of the winner
 * @property {string} [showdownDesc]  - Optional description of the showdown
 *                                      (e.g. "Full house beats flush")
 */

export default {};

