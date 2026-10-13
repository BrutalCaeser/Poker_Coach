/**
 * Lesson script — Moneymaker vs Farha, 2003. The turn.
 * =====================================================
 * One idea: "Am I paying more than my share?"
 *
 * Writing rules for this file (they are the pedagogy, not style):
 *  - Before you commit, you know only what Moneymaker knew. The narration never
 *    reveals Farha's cards. (The old script did, which judged you against the
 *    pro while you held information he didn't have.)
 *  - Numbers on screen come from lessonMath.js, never from this file. Copy that
 *    needs a number takes it as an argument.
 *  - Plain words. One idea per screen. Task-first feedback, never "wrong".
 *  - Real players are described in the third person, factually. Cal Brennan
 *    is an invented commentator; never imitate a real person's voice.
 */

export const LESSON = {
  id: 'lesson-moneymaker-turn',
  chapter: 'The Moneymaker hand',
  year: '2003',
  event: 'World Series of Poker · Main Event final table',
  venue: "Binion's Horseshoe, Las Vegas",
  idea: 'Am I paying more than my share?',

  commentator: { name: 'Cal Brennan', voice: 'am_michael', fictional: true },

  hero: { name: 'Chris Moneymaker', short: 'Moneymaker', cards: ['Ks', '7h'], startStack: 4_620_000 },
  villain: { name: 'Sam Farha', short: 'Farha', cards: ['Qs', '9h'], startStack: 3_770_000 },

  // The read used for the hero-view count. Stated to the user, not hidden.
  read: { pairRank: 9, words: 'a pair of nines, the top card on the board' },

  turn: { board: ['9s', '2d', '6s', '8s'], potBeforeBet: 210_000, bet: 300_000, raiseTo: 800_000 },

  /**
   * The replay before the decision. System-paced: with commentary on, each
   * step waits for its line to finish; muted, it dwells and shows the line as
   * a subtitle. `vo` lines are baked by scripts/extract-vo.mjs + synth-vo.py.
   */
  replay: [
    {
      id: 'open',
      board: [],
      pot: 70_000,
      paid: { hero: 25_000, villain: 45_000 },
      label: 'Blinds 20K / 40K · ante 5K',
      vo: "Two thousand three. The final table of the World Series of Poker. Sammy Farha is a professional. Chris Moneymaker is an accountant who won his seat online for forty dollars. Tonight, you're in his chair.",
    },
    {
      id: 'preflop',
      board: [],
      pot: 210_000,
      paid: { hero: 105_000, villain: 105_000 },
      label: 'You raise to 100K · Farha calls',
      vo: 'You look down at king, seven. Nothing special. You raise anyway, and Farha calls.',
    },
    {
      id: 'flop',
      board: ['9s', '2d', '6s'],
      pot: 210_000,
      paid: { hero: 105_000, villain: 105_000 },
      label: 'Farha checks · you check',
      vo: "Nine, deuce, six, with two spades. You've got king high and one spade of your own. Farha checks. You check behind.",
    },
    {
      id: 'turn',
      board: ['9s', '2d', '6s', '8s'],
      pot: 210_000,
      paid: { hero: 105_000, villain: 105_000 },
      label: 'Turn · 8♠',
      vo: 'The eight of spades. Three spades on the board now, so one more gives you a flush. And any five or any ten makes you a straight.',
    },
    {
      id: 'bet',
      board: ['9s', '2d', '6s', '8s'],
      pot: 510_000,
      paid: { hero: 105_000, villain: 405_000 },
      label: 'Farha bets 300K',
      vo: 'Farha bets three hundred thousand. More than the pot. Your move.',
    },
  ],

  /** What you can do at the decision. */
  options: [
    { action: 'fold', label: 'Fold' },
    { action: 'call', label: 'Call', amount: 300_000 },
    { action: 'raise', label: 'Raise', amount: 800_000, prefix: 'to' },
  ],

  proAction: 'raise',
};

/* ── copy that depends on the user's choice ─────────────────── */

export function choiceReflection(choice) {
  switch (choice) {
    case 'call':
      return 'You called. The numbers lean your way here, only just.';
    case 'raise':
      return 'You raised, like Moneymaker did. Calling already makes a little. We’ll come to why he raised.';
    case 'fold':
      return 'You folded. That gives up a small edge: here the numbers lean toward calling.';
    default:
      return '';
  }
}

/** Feedback on the tap-to-count, one sentence per kind of slip. */
export const KIND_EXPLAIN = {
  missed: {
    flush: (n) => `${n === 1 ? 'A spade' : `${n} spades`} you missed. Any spade gives you a flush.`,
    straight: () => 'The straight cards: any 5 or 10 finishes 5-6-7-8-9 or 6-7-8-9-10.',
    'better-pair': () => 'The kings: a king gives you a pair of kings, and kings beat nines.',
  },
  wrong: {
    'small-pair': () => 'A 7 gives you a pair of sevens. Sevens lose to nines.',
    'board-pair': () => 'A card that pairs the board helps him as much as you.',
    nothing: () => 'Some cards you picked don’t improve your hand at all.',
  },
};
