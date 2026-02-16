/**
 * Poker Decisions — Complete Scenario Library
 * ============================================
 * 15 hand-crafted training scenarios organized by difficulty tier.
 * Each scenario is a self-contained, data-driven poker hand with:
 *   - Full table setup (players, stacks, blinds, cards)
 *   - Sequential action array driving the UI
 *   - A decision point with the mathematically correct answer
 *   - Step-by-step math breakdown for the teaching reveal
 *   - Coaching content (insight, takeaway, coachNotes)
 *
 * See types.js for the full schema documentation.
 */

// ---------------------------------------------------------------------------
// BEGINNER TIER (difficulty: 1)
// ---------------------------------------------------------------------------

const scenario1 = {
  id: "first-pot-odds",
  title: "Your First Pot Odds Decision",
  source: {
    type: "curated",
    name: "Poker Decisions Curriculum",
    description: "Introductory scenario teaching basic pot odds calculation with overcards on a dry board.",
  },

  concepts: ["pot-odds", "outs-counting", "rule-of-2", "overcard-outs"],
  difficulty: 1,
  category: "cash",

  players: [
    { name: "Hero", position: "CO", stack: 10000, cards: ["As", "Kd"] },
    { name: "Villain", position: "BB", stack: 10000, cards: ["Qd", "Jh"] },
  ],
  blinds: { small: 50, big: 100, ante: 0 },
  heroIndex: 0,
  board: [],

  actions: [
    { type: "info", text: "Cash game — $50/$100 blinds. You're in the Cutoff with A\u2660K\u2666." },
    { type: "info", text: "Blinds posted: $50/$100" },
    { type: "bet", player: 0, name: "Hero", action: "raises to", amount: 300 },
    { type: "bet", player: 1, name: "Villain", action: "calls", amount: 300 },
    { type: "info", text: "Pot: $650" },
    { type: "board", cards: ["Qh", "7s", "2d"] },
    { type: "info", text: "Flop: Q\u26657\u26602\u2666 \u2014 You missed, but have two overcards." },
    { type: "bet", player: 1, name: "Villain", action: "bets", amount: 325 },
    { type: "info", text: "Villain bets $325 (half pot) into $650. Pot is now $975." },
    { type: "decision", options: ["call", "fold"], callAmount: 325 },
  ],

  decision: {
    options: ["call", "fold"],
    callAmount: 325,
    correctAction: "fold",
    pot: 975,
    heroStack: 9700,
  },

  mathSteps: [
    { label: "Your outs", value: "6 overcard outs (3 Aces + 3 Kings)", formula: null, status: "key" },
    { label: "Equity (Rule of 2)", value: "~12%", formula: "6 \u00d7 2 = 12%" },
    { label: "Exact equity (1 card)", value: "13.0%", formula: "6 / 46 = 0.130" },
    { label: "Pot odds threshold", value: "25.0%", formula: "$325 / ($975 + $325) = 25.0%" },
    { label: "Direct odds check", value: "FAIL \u2014 13.0% < 25.0%", status: "fail" },
    { label: "Implied odds (F)", value: "$875", formula: "$325 / 0.130 \u2212 ($975 + $650) = $875" },
    { label: "F as % of pot after call", value: "67% \u2014 very difficult to collect", status: "fail" },
    { label: "Draw visibility", value: "HIGH \u2014 Ace or King on turn is a universal scare card", status: "warning" },
    { label: "Verdict", value: "FOLD \u2014 Not enough equity, poor implied odds", status: "key" },
  ],

  insight: "This is the most common situation in poker: you have overcards that missed the flop. The math shows you're a significant underdog and the gap is too wide for implied odds to bridge.",

  takeaway: "When you miss the flop with overcards, count your outs (usually 6), apply the Rule of 2, and compare to pot odds. If the gap is large and your outs are highly visible (Ace or King on the turn scares everyone), fold and wait for a better spot.",

  coachNotes: "This is the foundational pot odds scenario. Walk the student through: (1) identifying outs \u2014 any Ace or King gives top pair, (2) the Rule of 2 shortcut, (3) the pot odds formula, (4) why 13% vs 25% is too wide a gap. Emphasize that overcard outs are the worst kind of outs because they are so visible \u2014 if an Ace hits, villain likely checks or folds, killing implied odds. Ask: 'What if you had a flush draw instead of just overcards?'",
};

const scenario2 = {
  id: "nut-flush-draw",
  title: "The Nut Flush Draw",
  source: {
    type: "curated",
    name: "Poker Decisions Curriculum",
    description: "Classic flush draw scenario teaching implied odds bridging a small pot odds gap.",
  },

  concepts: ["implied-odds", "flush-draw", "outs-counting", "draw-visibility"],
  difficulty: 1,
  category: "cash",

  players: [
    { name: "Hero", position: "BTN", stack: 15000, cards: ["As", "9s"] },
    { name: "Villain", position: "BB", stack: 15000, cards: ["Kh", "Qd"] },
  ],
  blinds: { small: 50, big: 100, ante: 0 },
  heroIndex: 0,
  board: [],

  actions: [
    { type: "info", text: "Cash game \u2014 $50/$100 blinds. You're on the Button with A\u26609\u2660." },
    { type: "info", text: "Blinds posted: $50/$100" },
    { type: "bet", player: 0, name: "Hero", action: "raises to", amount: 250 },
    { type: "bet", player: 1, name: "Villain", action: "calls", amount: 250 },
    { type: "info", text: "Pot: $550" },
    { type: "board", cards: ["Ts", "6s", "3d"] },
    { type: "info", text: "Flop: T\u26606\u26603\u2666 \u2014 Two spades on the board! You have the nut flush draw." },
    { type: "bet", player: 1, name: "Villain", action: "bets", amount: 275 },
    { type: "info", text: "Villain bets $275 (half pot) into $550. Pot is now $825." },
    { type: "decision", options: ["call", "fold"], callAmount: 275 },
  ],

  decision: {
    options: ["call", "fold"],
    callAmount: 275,
    correctAction: "call",
    pot: 825,
    heroStack: 14750,
  },

  mathSteps: [
    { label: "Your outs", value: "9 flush outs (13 spades \u2212 4 seen)", formula: null, status: "key" },
    { label: "Equity (Rule of 2)", value: "~18%", formula: "9 \u00d7 2 = 18%" },
    { label: "Exact equity (1 card)", value: "19.6%", formula: "9 / 46 = 0.196" },
    { label: "Pot odds threshold", value: "25.0%", formula: "$275 / ($825 + $275) = 25.0%" },
    { label: "Direct odds check", value: "FAIL \u2014 19.6% < 25.0%", status: "fail" },
    { label: "Implied odds (F)", value: "$\u2248$28", formula: "$275 / 0.196 \u2212 ($825 + $550) \u2248 $28" },
    { label: "F as % of pot after call", value: "~2% \u2014 trivially easy to collect", status: "pass" },
    { label: "Draw visibility", value: "Flush = HIGH visibility, but F is so small it doesn't matter", status: "warning" },
    { label: "Verdict", value: "CALL \u2014 Tiny implied odds gap, easily bridged", status: "key" },
  ],

  insight: "You're just short of the pot odds you need, but the gap is tiny. With deep stacks, you only need to win an extra ~$28 when you hit your flush \u2014 a near-certainty with the nut flush.",

  takeaway: "When the pot odds gap is small (just a few percentage points), implied odds almost always bridge it \u2014 especially with deep stacks and the nut draw. The key question is not 'Am I getting the right price now?' but 'Can I win enough extra when I hit?'",

  coachNotes: "This is the introduction to implied odds. Walk the student through: (1) counting flush outs (9), (2) the direct odds fail at 19.6% vs 25%, (3) the F formula showing only ~$28 needed, (4) why such a tiny F value makes this an easy call. Contrast with Scenario 1 where the F was huge. Ask: 'What if you didn't have the Ace of spades \u2014 just the 9-high flush draw? Would this change your decision?' (Answer: the math is the same, but reverse implied odds emerge.)",
};

const scenario3 = {
  id: "all-in-coin-flip",
  title: "The All-In Coin Flip",
  source: {
    type: "curated",
    name: "Poker Decisions Curriculum",
    description: "Pre-flop all-in showcasing pure equity vs price with no implied odds.",
  },

  concepts: ["equity-vs-price", "preflop-all-in", "pot-odds", "coin-flip"],
  difficulty: 1,
  category: "cash",

  players: [
    { name: "Hero", position: "BTN", stack: 10000, cards: ["As", "Ks"] },
    { name: "Villain", position: "BB", stack: 10000, cards: ["Qh", "Qd"] },
  ],
  blinds: { small: 50, big: 100, ante: 0 },
  heroIndex: 0,
  board: [],

  actions: [
    { type: "info", text: "Cash game \u2014 $50/$100 blinds. You're on the Button with A\u2660K\u2660." },
    { type: "info", text: "Blinds posted: $50/$100" },
    { type: "bet", player: 0, name: "Hero", action: "raises to", amount: 300 },
    { type: "bet", player: 1, name: "Villain", action: "3-bets to", amount: 1000 },
    { type: "bet", player: 0, name: "Hero", action: "4-bets to", amount: 2500 },
    { type: "bet", player: 1, name: "Villain", action: "shoves all-in for", amount: 10000 },
    { type: "info", text: "Villain shoves all-in for $10,000. Pot is $12,550 ($50 SB + $2,500 your 4-bet + $10,000 shove)." },
    { type: "info", text: "You put Villain on QQ. This is a classic coin flip \u2014 your AKs vs their QQ." },
    { type: "decision", options: ["call", "fold"], callAmount: 7500 },
  ],

  decision: {
    options: ["call", "fold"],
    callAmount: 7500,
    correctAction: "call",
    pot: 12550,
    heroStack: 7500,
  },

  mathSteps: [
    { label: "Matchup", value: "AKs vs QQ \u2014 a classic coin flip", status: "key" },
    { label: "Your equity", value: "~46%", formula: "AKs vs QQ = ~46% (exact via simulation)" },
    { label: "Pot odds threshold", value: "37.4%", formula: "$7,500 / ($12,550 + $7,500) = 37.4%" },
    { label: "Direct odds check", value: "PASS \u2014 46% > 37.4%", status: "pass" },
    { label: "Implied odds", value: "N/A \u2014 All money is going in, no future streets to extract", status: "key" },
    { label: "EV of calling", value: "+$1,723", formula: "0.46 \u00d7 $20,050 \u2212 $7,500 = +$1,723" },
    { label: "Verdict", value: "CALL \u2014 Pot odds are favorable, +EV despite being an underdog", status: "key" },
  ],

  insight: "When all the money goes in preflop, implied odds don't exist. The decision is purely mathematical: is your equity greater than the pot odds threshold? Here, 46% easily clears 37.4%.",

  takeaway: "In all-in situations, only two numbers matter: your equity and the pot odds. There are no implied odds, no draw visibility concerns, no future betting. If equity > pot odds percentage, call. It's that simple.",

  coachNotes: "This scenario strips poker to its mathematical core. Emphasize: (1) When all-in, the decision is purely equity vs price, (2) You don't need to be a favorite to call profitably \u2014 you just need enough equity vs the price, (3) AKs vs QQ is approximately 46/54, not 50/50, (4) The dead money in the pot (blinds + earlier bets) is what makes this profitable. Ask: 'Would you still call if you only had 35% equity? What about 30%?' (Answer: 37.4% is the break-even.)",
};

const scenario4 = {
  id: "short-stack-shove",
  title: "Short Stack Tournament Shove",
  source: {
    type: "curated",
    name: "Poker Decisions Curriculum",
    description: "Tournament scenario with a short-stacked hero facing a button shove.",
  },

  concepts: ["pot-odds", "wide-ranges", "tournament-short-stack", "preflop-all-in"],
  difficulty: 1,
  category: "tournament",

  players: [
    { name: "Villain (BTN)", position: "BTN", stack: 45000, cards: ["8h", "7h"] },
    { name: "SB", position: "SB", stack: 32000, cards: [] },
    { name: "Hero", position: "BB", stack: 14000, cards: ["Ah", "Th"] },
  ],
  blinds: { small: 1000, big: 2000, ante: 200 },
  heroIndex: 2,
  board: [],

  actions: [
    { type: "info", text: "Tournament \u2014 Blinds $1,000/$2,000 with $200 ante. You're in the BB with A\u2665T\u2665." },
    { type: "info", text: "Antes posted: $600 total. Blinds posted: $1,000/$2,000." },
    { type: "info", text: "You have 7 big blinds \u2014 a short stack. Time is running out." },
    { type: "bet", player: 1, name: "SB", action: "folds", amount: 0 },
    { type: "bet", player: 0, name: "Villain (BTN)", action: "shoves all-in for", amount: 45000 },
    { type: "info", text: "Button shoves all-in. He's been aggressive and is likely shoving a very wide range." },
    { type: "info", text: "You need to call $12,000 more (your remaining stack behind the BB). Pot is $15,600 ($600 antes + $1,000 SB + $2,000 BB + $12,000 effective shove)." },
    { type: "decision", options: ["call", "fold"], callAmount: 12000 },
  ],

  decision: {
    options: ["call", "fold"],
    callAmount: 12000,
    correctAction: "call",
    pot: 15600,
    heroStack: 12000,
  },

  mathSteps: [
    { label: "Your hand", value: "ATs \u2014 strong short-stack calling hand", status: "key" },
    { label: "Villain's estimated range", value: "Top ~40% of hands (wide button shove)", formula: null },
    { label: "Your equity vs wide range", value: "~60%", formula: "ATs vs top 40% \u2248 60%" },
    { label: "Pot odds threshold", value: "43.5%", formula: "$12,000 / ($15,600 + $12,000) = 43.5%" },
    { label: "Direct odds check", value: "PASS \u2014 60% >> 43.5%", status: "pass" },
    { label: "Stack situation", value: "7 BB \u2014 folding means blinding out soon", status: "warning" },
    { label: "EV of calling", value: "Hugely +EV \u2014 you crush this range", status: "pass" },
    { label: "Verdict", value: "CALL \u2014 Snap call. Your equity dominates the price.", status: "key" },
  ],

  insight: "When you're short-stacked, the pot already contains a significant portion of your stack from the blinds and antes. You need very little equity to call profitably. A\u2665T\u2665 crushes a wide button shoving range.",

  takeaway: "When the pot is large relative to your remaining stack, the pot odds threshold drops dramatically. With antes and blinds already committed, short-stacked players often need as little as 30-40% equity to call. Strong Aces like AT are snap calls against wide ranges.",

  coachNotes: "Key teaching points: (1) The antes and blinds already in the pot dramatically lower the required equity, (2) Button shoving ranges are extremely wide at 40%+ of hands, (3) ATs has ~60% equity vs this range, making it a slam-dunk call, (4) With 7 BB, folding means you'll be blinded down with worse hands. Ask: 'What's the weakest hand you'd call with here?' Guide toward understanding that even hands like K9s or QTs can be +EV calls at this stack depth.",
};

const scenario5 = {
  id: "overcards-no-draw",
  title: "Two Overcards, No Draw",
  source: {
    type: "curated",
    name: "Poker Decisions Curriculum",
    description: "Demonstrates why overcard outs have terrible implied odds due to high visibility.",
  },

  concepts: ["overcard-outs", "draw-visibility", "implied-odds", "pot-odds"],
  difficulty: 1,
  category: "cash",

  players: [
    { name: "Hero", position: "MP", stack: 10000, cards: ["Ac", "Kd"] },
    { name: "Villain", position: "BB", stack: 10000, cards: ["8d", "8s"] },
  ],
  blinds: { small: 50, big: 100, ante: 0 },
  heroIndex: 0,
  board: [],

  actions: [
    { type: "info", text: "Cash game \u2014 $50/$100 blinds. You're in Middle Position with A\u2663K\u2666." },
    { type: "info", text: "Blinds posted: $50/$100" },
    { type: "bet", player: 0, name: "Hero", action: "raises to", amount: 300 },
    { type: "bet", player: 1, name: "Villain", action: "calls", amount: 300 },
    { type: "info", text: "Pot: $650" },
    { type: "board", cards: ["8h", "5c", "2d"] },
    { type: "info", text: "Flop: 8\u26655\u26632\u2666 \u2014 Dry board. You completely missed." },
    { type: "bet", player: 1, name: "Villain", action: "bets", amount: 650 },
    { type: "info", text: "Villain bets $650 (full pot) into $650. Pot is now $1,300." },
    { type: "decision", options: ["call", "fold"], callAmount: 650 },
  ],

  decision: {
    options: ["call", "fold"],
    callAmount: 650,
    correctAction: "fold",
    pot: 1300,
    heroStack: 9700,
  },

  mathSteps: [
    { label: "Your outs", value: "6 overcard outs (3 Aces + 3 Kings)", formula: null, status: "key" },
    { label: "Equity (Rule of 2)", value: "~12%", formula: "6 \u00d7 2 = 12%" },
    { label: "Exact equity (1 card)", value: "13.0%", formula: "6 / 46 = 0.130" },
    { label: "Pot odds threshold", value: "33.3%", formula: "$650 / ($1,300 + $650) = 33.3%" },
    { label: "Direct odds check", value: "FAIL \u2014 13.0% << 33.3%", status: "fail" },
    { label: "Implied odds (F)", value: "$2,400", formula: "$650 / 0.130 \u2212 ($1,300 + $1,300) = $2,400" },
    { label: "F as % of pot after call", value: "123% \u2014 exceeds the pot, nearly impossible to collect", status: "fail" },
    { label: "Draw visibility", value: "TERRIBLE \u2014 A or K on turn is the most obvious scare card possible", status: "fail" },
    { label: "Verdict", value: "FOLD \u2014 Huge gap, terrible implied odds from visible outs", status: "key" },
  ],

  insight: "AK looks like a strong hand, but on a low, dry board you've got nothing. Your 6 overcard outs have the worst implied odds in poker \u2014 when an Ace or King hits, your opponent knows they might be beaten and stops paying you.",

  takeaway: "Not all outs are equal. Overcard outs (Ace, King hitting the board) are the most visible improvement cards in poker. When you hit, opponents slow down or fold. When you miss, you lose more. This is why AK on a low board with a pot-sized bet is an easy fold.",

  coachNotes: "This is a crucial concept: draw visibility. Emphasize: (1) The math gap is huge (13% vs 33%), (2) Even if the gap were smaller, overcard outs have terrible implied odds, (3) If an Ace hits the turn, villain will check/fold \u2014 you win a small pot. If a blank hits, villain bets again \u2014 you lose more. Compare to Scenario 2 where the flush draw has the same visibility issue but a much smaller F value. Ask: 'What would make this hand playable?' (Answer: a flush draw, a gutshot, or a much smaller bet from villain.)",
};

// ---------------------------------------------------------------------------
// INTERMEDIATE TIER (difficulty: 2)
// ---------------------------------------------------------------------------

const scenario6 = {
  id: "stack-depth-kills-implied",
  title: "Stack Depth Kills Implied Odds",
  source: {
    type: "curated",
    name: "Poker Decisions Curriculum",
    description: "Three-way pot showing when F exceeds remaining stack, making implied odds physically impossible.",
  },

  concepts: ["implied-odds", "stack-depth", "3-bet-pot", "multiway"],
  difficulty: 2,
  category: "tournament",

  players: [
    { name: "Player A", position: "CO", stack: 800000, cards: ["Ac", "Qc"] },
    { name: "Player B", position: "BTN", stack: 900000, cards: ["Kh", "Ks"] },
    { name: "Hero", position: "BB", stack: 400000, cards: ["Jd", "Jc"] },
  ],
  blinds: { small: 20000, big: 40000, ante: 0 },
  heroIndex: 2,
  board: [],

  actions: [
    { type: "info", text: "Tournament \u2014 Blinds $20K/$40K. You're in the BB with J\u2666J\u2663." },
    { type: "info", text: "Blinds posted: $20K/$40K" },
    { type: "bet", player: 0, name: "Player A", action: "raises to", amount: 80000 },
    { type: "bet", player: 1, name: "Player B", action: "3-bets to", amount: 200000 },
    { type: "info", text: "A solid player raises, then gets 3-bet by a tight player. You're in the BB with JJ." },
    { type: "info", text: "Pot is $340,000 ($20K SB + $40K BB + $80K raise + $200K 3-bet). You need $160,000 to call." },
    { type: "decision", options: ["call", "fold"], callAmount: 160000 },
  ],

  decision: {
    options: ["call", "fold"],
    callAmount: 160000,
    correctAction: "fold",
    pot: 340000,
    heroStack: 360000,
  },

  mathSteps: [
    { label: "Situation", value: "JJ in BB vs raise + 3-bet (3-way pot)", status: "key" },
    { label: "Your equity (3-way vs likely ranges)", value: "~17%", formula: "JJ vs {AQ+, TT+} vs {QQ+, AK} \u2248 17%" },
    { label: "Pot odds threshold", value: "32.0%", formula: "$160K / ($340K + $160K) = 32.0%" },
    { label: "Direct odds check", value: "FAIL \u2014 17% << 32.0%", status: "fail" },
    { label: "Implied odds (F)", value: "\u2248$281K", formula: "$160K / 0.17 \u2212 ($340K + $320K) = $281K" },
    { label: "Your remaining stack after calling", value: "$200K", formula: "$360K \u2212 $160K = $200K" },
    { label: "F vs remaining stack", value: "IMPOSSIBLE \u2014 $281K > $200K", status: "fail" },
    { label: "Even if you set up...", value: "You can't physically collect $281K with $200K behind", status: "fail" },
    { label: "Verdict", value: "FOLD \u2014 F exceeds stack. Implied odds are physically impossible.", status: "key" },
  ],

  insight: "Pocket Jacks looks strong, but in a 3-bet pot against two opponents with strong ranges, your equity plummets. When the implied odds you need ($281K) exceed your remaining stack ($200K), no amount of skill can make calling profitable.",

  takeaway: "When F (the implied odds you need) exceeds your remaining stack, fold instantly. This is a mathematical certainty \u2014 you physically cannot collect enough chips to make the call profitable. Stack depth is the ceiling on implied odds.",

  coachNotes: "This scenario teaches the hard limit on implied odds. Key points: (1) JJ is a strong hand in isolation but weak in a 3-bet pot, (2) Against two strong ranges, equity drops to ~17%, (3) The F value ($281K) literally cannot be collected because you only have $200K behind, (4) This is different from 'difficult' implied odds \u2014 it's IMPOSSIBLE implied odds. Ask: 'What if your stack were $1.5M instead of $400K? Would that change the decision?' (Answer: possibly \u2014 deeper stacks make implied odds feasible.)",
};

const scenario7 = {
  id: "set-mining-math",
  title: "Set Mining Math",
  source: {
    type: "curated",
    name: "Poker Decisions Curriculum",
    description: "The classic 15x rule for calling preflop with pocket pairs hoping to flop a set.",
  },

  concepts: ["set-mining", "15x-rule", "implied-odds", "pocket-pairs"],
  difficulty: 2,
  category: "cash",

  players: [
    { name: "Villain", position: "UTG", stack: 25000, cards: ["Ah", "Kh"] },
    { name: "Hero", position: "BB", stack: 25000, cards: ["5s", "5h"] },
  ],
  blinds: { small: 100, big: 200, ante: 0 },
  heroIndex: 1,
  board: [],

  actions: [
    { type: "info", text: "Cash game \u2014 $100/$200 blinds. Effective stacks $25,000. You're in the BB with 5\u26605\u2665." },
    { type: "info", text: "Blinds posted: $100/$200" },
    { type: "bet", player: 0, name: "Villain", action: "raises to", amount: 1500 },
    { type: "info", text: "A solid player raises from UTG to $1,500. Action is on you." },
    { type: "info", text: "You'll flop a set ~12% of the time. Is calling $1,300 profitable?" },
    { type: "decision", options: ["call", "fold"], callAmount: 1300 },
  ],

  decision: {
    options: ["call", "fold"],
    callAmount: 1300,
    correctAction: "call",
    pot: 1700,
    heroStack: 23700,
  },

  mathSteps: [
    { label: "Set mining probability", value: "~12% to flop a set", formula: "1 \u2212 (48/50 \u00d7 47/49 \u00d7 46/48) \u2248 11.8%", status: "key" },
    { label: "Pot odds threshold", value: "43.3%", formula: "$1,300 / ($1,700 + $1,300) = 43.3%" },
    { label: "Direct odds check", value: "FAIL \u2014 12% << 43.3%", status: "fail" },
    { label: "But sets have the BEST implied odds", value: "Nearly invisible \u2014 opponents pay off big", status: "pass" },
    { label: "The 15\u00d7 Rule", value: "Need stacks \u2265 15 \u00d7 call amount", formula: "15 \u00d7 $1,500 = $22,500" },
    { label: "Effective stacks", value: "$25,000 > $22,500 \u2014 SET MINING IS ON", status: "pass" },
    { label: "Stack-to-call ratio", value: "16.7\u00d7", formula: "$25,000 / $1,500 = 16.7\u00d7" },
    { label: "Why sets are special", value: "Hidden \u2014 opponents can't see your improvement", status: "pass" },
    { label: "Verdict", value: "CALL \u2014 Stacks are deep enough for profitable set mining", status: "key" },
  ],

  insight: "You'll miss the set 88% of the time and fold the flop. But the 12% of the time you hit, sets are so hidden and so strong that you win massive pots \u2014 easily recovering all those small preflop investments.",

  takeaway: "The 15\u00d7 rule: With pocket pairs, you need at least 15\u00d7 the call amount in effective stacks to profitably set-mine. Sets have the best implied odds in poker because they're nearly invisible to opponents. Deep stacks are the key ingredient.",

  coachNotes: "Focus on why sets are the gold standard for implied odds: (1) Only ~12% to flop one, so you need big payoffs, (2) Sets are invisible \u2014 the board doesn't scream 'danger' like a flush card does, (3) The 15\u00d7 rule is the shortcut: $25K / $1,500 = 16.7\u00d7, clearing the threshold, (4) When you do flop a set on a board like T-7-3, opponents with overpairs and top pairs pay you off. Ask: 'What if stacks were only $10K? Would you still call?' (Answer: No \u2014 10K / 1.5K = 6.7\u00d7, way below 15\u00d7.)",
};

const scenario8 = {
  id: "monster-draw",
  title: "The Monster Draw",
  source: {
    type: "curated",
    name: "Poker Decisions Curriculum",
    description: "A combo flush + straight draw with more equity than a typical made hand.",
  },

  concepts: ["combo-draw", "corrected-rule", "semi-bluff", "outs-counting"],
  difficulty: 2,
  category: "cash",

  players: [
    { name: "Villain", position: "UTG", stack: 20000, cards: ["Ad", "Jd"] },
    { name: "Hero", position: "BTN", stack: 20000, cards: ["Ts", "9s"] },
  ],
  blinds: { small: 100, big: 200, ante: 0 },
  heroIndex: 1,
  board: [],

  actions: [
    { type: "info", text: "Cash game \u2014 $100/$200 blinds. You're on the Button with T\u26609\u2660." },
    { type: "info", text: "Blinds posted: $100/$200" },
    { type: "bet", player: 0, name: "Villain", action: "raises to", amount: 600 },
    { type: "bet", player: 1, name: "Hero", action: "calls", amount: 600 },
    { type: "info", text: "Pot: $1,300" },
    { type: "board", cards: ["Js", "8s", "2c"] },
    { type: "info", text: "Flop: J\u26608\u26602\u2663 \u2014 Monster draw! Flush draw + open-ended straight draw (any 7 or Q for the straight)." },
    { type: "bet", player: 0, name: "Villain", action: "bets", amount: 900 },
    { type: "info", text: "Villain bets $900 into $1,300. Pot is now $2,200." },
    { type: "decision", options: ["call", "fold", "raise"], callAmount: 900, raiseAmount: 3000 },
  ],

  decision: {
    options: ["call", "fold", "raise"],
    callAmount: 900,
    raiseAmount: 3000,
    correctAction: "call",
    pot: 2200,
    heroStack: 19400,
  },

  mathSteps: [
    { label: "Your outs", value: "~15 outs (9 flush + 6 straight)", formula: "9 flush + 8 OESD \u2212 2 overlap = 15", status: "key" },
    { label: "Rule of 4 (WRONG)", value: "60%", formula: "15 \u00d7 4 = 60% \u2014 TOO HIGH!", status: "warning" },
    { label: "Corrected Rule (RIGHT)", value: "53%", formula: "3 \u00d7 15 + 8 = 53%", status: "key" },
    { label: "Exact equity (2 cards to come)", value: "54.1%", formula: "1 \u2212 (32 \u00d7 31)/(47 \u00d7 46) = 54.1%" },
    { label: "But wait \u2014 are we all-in?", value: "NO \u2014 use 1-card equity since more betting to come", status: "warning" },
    { label: "Equity (1 card to come)", value: "32.6%", formula: "15 / 46 = 32.6%" },
    { label: "Pot odds threshold", value: "29.0%", formula: "$900 / ($2,200 + $900) = 29.0%" },
    { label: "Direct odds check (1 card)", value: "PASS \u2014 32.6% > 29.0%", status: "pass" },
    { label: "Verdict", value: "CALL \u2014 Direct odds are sufficient. You're actually a slight favorite!", status: "key" },
  ],

  insight: "With 15 outs, you have a monster draw that's actually favored to improve by the river. The critical lesson: Rule of 4 says 60% but the real number is 54%. And since you're not all-in, use 1-card equity (33%) to make the call decision.",

  takeaway: "When you have 9+ outs with 2 cards to come, use the Corrected Rule (3\u00d7outs + 8) instead of Rule of 4. Rule of 4 overestimates dramatically at high out counts. Also, only use 2-card equity when ALL money is in on the flop. If there's more betting, use 1-card equity.",

  coachNotes: "This is the key scenario for teaching the corrected formula. Walk through: (1) Counting combination outs: 9 flush + 8 OESD - 2 cards that complete both = 15 outs, (2) Rule of 4 says 60% but truth is 54% \u2014 a 6% error that can cost real money, (3) The Corrected Rule (3\u00d7 15 + 8 = 53%) is accurate, (4) Since there's still betting, use 1-card equity (33%) not 2-card (54%). The call is correct either way, but the reasoning matters. Ask: 'If villain bet pot instead of 2/3 pot, would you still have direct odds?' The raise option is interesting \u2014 discuss semi-bluffing in the coach follow-up.",
};

const scenario9 = {
  id: "gutshot-short-stack",
  title: "Gutshot With Short Stack",
  source: {
    type: "curated",
    name: "Poker Decisions Curriculum",
    description: "Disguised gutshot straight draw that can't overcome short-stack implied odds constraints.",
  },

  concepts: ["gutshot", "implied-odds", "short-stack", "draw-visibility"],
  difficulty: 2,
  category: "cash",

  players: [
    { name: "Hero", position: "BTN", stack: 15000, cards: ["9s", "8d"] },
    { name: "Villain", position: "BB", stack: 50000, cards: ["Jc", "Td"] },
  ],
  blinds: { small: 200, big: 400, ante: 0 },
  heroIndex: 0,
  board: [],

  actions: [
    { type: "info", text: "Cash game \u2014 $200/$400 blinds. You're on the Button with 9\u26608\u2666." },
    { type: "info", text: "Blinds posted: $200/$400" },
    { type: "bet", player: 0, name: "Hero", action: "raises to", amount: 1000 },
    { type: "bet", player: 1, name: "Villain", action: "calls", amount: 1000 },
    { type: "info", text: "Pot: $2,200" },
    { type: "board", cards: ["Jh", "5c", "3s"] },
    { type: "info", text: "Flop: J\u26655\u26633\u2660 \u2014 You missed. Just a backdoor straight draw." },
    { type: "bet", player: 1, name: "Villain", action: "bets", amount: 1100 },
    { type: "bet", player: 0, name: "Hero", action: "calls", amount: 1100 },
    { type: "info", text: "You float the flop hoping to improve. Pot: $4,400." },
    { type: "board", cards: ["6d"] },
    { type: "info", text: "Turn: 6\u2666 \u2014 Now you have a gutshot! Any 7 makes a straight." },
    { type: "bet", player: 1, name: "Villain", action: "bets", amount: 4400 },
    { type: "info", text: "Villain bets $4,400 (full pot). Pot is now $8,800. You have $12,900 left." },
    { type: "decision", options: ["call", "fold"], callAmount: 4400 },
  ],

  decision: {
    options: ["call", "fold"],
    callAmount: 4400,
    correctAction: "fold",
    pot: 8800,
    heroStack: 12900,
  },

  mathSteps: [
    { label: "Your outs", value: "4 gutshot outs (four 7s)", formula: null, status: "key" },
    { label: "Equity (Rule of 2)", value: "~8%", formula: "4 \u00d7 2 = 8%" },
    { label: "Exact equity (1 card)", value: "8.7%", formula: "4 / 46 = 0.087" },
    { label: "Pot odds threshold", value: "33.3%", formula: "$4,400 / ($8,800 + $4,400) = 33.3%" },
    { label: "Direct odds check", value: "FAIL \u2014 8.7% << 33.3%", status: "fail" },
    { label: "Implied odds (F)", value: "$33,200", formula: "$4,400 / 0.087 \u2212 ($8,800 + $8,800) = $33,200" },
    { label: "Your remaining stack after calling", value: "$8,500", formula: "$12,900 \u2212 $4,400 = $8,500" },
    { label: "F vs remaining stack", value: "IMPOSSIBLE \u2014 $33,200 >> $8,500", status: "fail" },
    { label: "Draw visibility note", value: "Gutshots are well-hidden, BUT stack depth is the binding constraint", status: "warning" },
    { label: "Verdict", value: "FOLD \u2014 Even a perfectly disguised draw can't overcome stack limitations", status: "key" },
  ],

  insight: "Gutshot straight draws are the most disguised draws in poker \u2014 opponents rarely see them coming. But being disguised doesn't matter when you simply don't have enough chips behind to collect the implied odds you need.",

  takeaway: "Even the best-hidden draws (gutshots on disconnected boards) can't overcome stack depth constraints. When F exceeds your remaining stack, the math doesn't care how invisible your draw is. Always check: 'Can I physically collect what I need?'",

  coachNotes: "This scenario teaches that implied odds have a hard ceiling: your stack. Walk through: (1) 4 gutshot outs give only 8.7% equity, (2) Need 33% from pot odds \u2014 huge gap, (3) F is $33,200 but only $8,500 behind after calling, (4) Gutshots normally have great implied odds because they're invisible, but that advantage is worthless when stacks are too shallow. Ask: 'What if stacks were $100K deep? Would the same hand be a call?' (Answer: F would still be huge relative to pot, but at least it would be physically possible.)",
};

const scenario10 = {
  id: "overpair-vs-flush",
  title: "The Overpair vs Flush Board",
  source: {
    type: "curated",
    name: "Poker Decisions Curriculum",
    description: "Discipline scenario — folding a strong-looking overpair when the flush completes.",
  },

  concepts: ["reverse-implied-odds", "hand-strength-relativity", "discipline", "board-reading"],
  difficulty: 2,
  category: "cash",

  players: [
    { name: "Hero", position: "CO", stack: 15000, cards: ["Ks", "Kc"] },
    { name: "Villain", position: "BB", stack: 15000, cards: ["9h", "7h"] },
  ],
  blinds: { small: 50, big: 100, ante: 0 },
  heroIndex: 0,
  board: [],

  actions: [
    { type: "info", text: "Cash game \u2014 $50/$100 blinds. You're in the Cutoff with K\u2660K\u2663." },
    { type: "info", text: "Blinds posted: $50/$100" },
    { type: "bet", player: 0, name: "Hero", action: "raises to", amount: 300 },
    { type: "bet", player: 1, name: "Villain", action: "calls", amount: 300 },
    { type: "info", text: "Pot: $650" },
    { type: "board", cards: ["Th", "6h", "3d"] },
    { type: "info", text: "Flop: T\u26656\u26653\u2666 \u2014 You have an overpair. Two hearts on board." },
    { type: "bet", player: 0, name: "Hero", action: "bets", amount: 450 },
    { type: "bet", player: 1, name: "Villain", action: "calls", amount: 450 },
    { type: "info", text: "Villain calls. Pot: $1,550." },
    { type: "board", cards: ["2h"] },
    { type: "info", text: "Turn: 2\u2665 \u2014 The third heart arrives. Flush is now possible." },
    { type: "bet", player: 1, name: "Villain", action: "bets", amount: 1200 },
    { type: "info", text: "Villain leads out for $1,200 into $1,550. This is a big bet on the flush-completing card." },
    { type: "decision", options: ["call", "fold"], callAmount: 1200 },
  ],

  decision: {
    options: ["call", "fold"],
    callAmount: 1200,
    correctAction: "fold",
    pot: 2750,
    heroStack: 14250,
  },

  mathSteps: [
    { label: "Your hand", value: "KK \u2014 overpair to the board", status: "key" },
    { label: "Board texture", value: "T\u26656\u26653\u26662\u2665 \u2014 three hearts, flush is possible", status: "warning" },
    { label: "Do you have a heart?", value: "NO \u2014 K\u2660K\u2663, no heart blocker", status: "fail" },
    { label: "Villain's line", value: "Called flop (drawing), then leads turn when heart hits", status: "warning" },
    { label: "Villain's likely holdings", value: "Flush very likely (suited connectors, suited Ax), or slow-played set", status: "fail" },
    { label: "Your outs if behind", value: "~2 outs (remaining Kings) = 4.3% equity", status: "fail" },
    { label: "Pot odds threshold", value: "30.4%", formula: "$1,200 / ($2,750 + $1,200) = 30.4%" },
    { label: "Reverse implied odds", value: "If you call and are behind, you'll face another big river bet", status: "fail" },
    { label: "Verdict", value: "FOLD \u2014 Your overpair is likely crushed. No blocker, strong villain line.", status: "key" },
  ],

  insight: "Kings look powerful, but hand strength is always relative to the board. When three hearts appear and villain suddenly bets big, an overpair without a heart blocker is in deep trouble. The hardest folds are with strong-looking hands.",

  takeaway: "Hand strength is relative to the board, not absolute. An overpair is not a strong hand when the flush completes and you don't block it. The most expensive mistakes in poker come from clinging to hands that were strong but are now beaten.",

  coachNotes: "This teaches the hardest skill in poker: laying down strong hands. Key points: (1) KK was the best hand on the flop, but the 2\u2665 changed everything, (2) Villain's line tells a story: called a two-heart flop, then leads when the third heart arrives, (3) Hero has NO heart \u2014 can't block the flush, (4) Even with the best non-flush hand, you're only drawing to 2 outs (4.3%). Mention reverse implied odds: if you call the turn and a blank river comes, villain bets again and you face the same decision. Ask: 'What if you held K\u2665K\u2663 instead? Would that change things?'",
};

// ---------------------------------------------------------------------------
// ADVANCED TIER (difficulty: 3)
// ---------------------------------------------------------------------------

const scenario11 = {
  id: "blockers-3bet-pot",
  title: "Blockers in a 3-Bet Pot",
  source: {
    type: "curated",
    name: "Poker Decisions Curriculum",
    description: "Advanced range analysis using blockers to narrow down opponent holdings.",
  },

  concepts: ["blockers", "combo-counting", "range-analysis", "3-bet-pot"],
  difficulty: 3,
  category: "preflop",

  players: [
    { name: "Hero", position: "CO", stack: 50000, cards: ["As", "Kc"] },
    { name: "Villain", position: "BTN", stack: 50000, cards: ["Qd", "Qh"] },
  ],
  blinds: { small: 200, big: 400, ante: 0 },
  heroIndex: 0,
  board: [],

  actions: [
    { type: "info", text: "Cash game \u2014 $200/$400 blinds. Deep stacked at 125 BB. You're in the CO with A\u2660K\u2663." },
    { type: "info", text: "Blinds posted: $200/$400" },
    { type: "bet", player: 0, name: "Hero", action: "raises to", amount: 1000 },
    { type: "bet", player: 1, name: "Villain", action: "3-bets to", amount: 3200 },
    { type: "info", text: "A competent regular 3-bets you from the Button to $3,200." },
    { type: "info", text: "You estimate villain's 3-bet range: AA, KK, QQ, AKs, AKo, and some bluffs." },
    { type: "info", text: "Pot is $4,800 ($200 SB + $400 BB + $1,000 your raise + $3,200 3-bet). You need $2,200 to call." },
    { type: "decision", options: ["call", "fold", "raise"], callAmount: 2200, raiseAmount: 9000 },
  ],

  decision: {
    options: ["call", "fold", "raise"],
    callAmount: 2200,
    raiseAmount: 9000,
    correctAction: "call",
    pot: 4800,
    heroStack: 49000,
  },

  mathSteps: [
    { label: "Villain's 3-bet range (before blockers)", value: "AA(6), KK(6), QQ(6), AKs(4), AKo(12) = 34 combos", status: "key" },
    { label: "Your A\u2660 blocks AA", value: "AA drops from 6 to 3 combos", formula: "6 \u2212 3 = 3 (must include A\u2660)", status: "warning" },
    { label: "Your K\u2663 blocks KK", value: "KK drops from 6 to 3 combos", formula: "6 \u2212 3 = 3 (must include K\u2663)", status: "warning" },
    { label: "Your AK blocks AK", value: "AKs drops from 4 to 2, AKo drops from 12 to 6", formula: "16 \u2212 8 = 8 combos remain (but we hold 1)", status: "warning" },
    { label: "QQ is unblocked", value: "QQ stays at 6 combos \u2014 now the MOST LIKELY premium hand", status: "key" },
    { label: "Adjusted range", value: "AA(3), KK(3), QQ(6), AK(7) = 19 value combos", status: "key" },
    { label: "Against this range", value: "AKo has ~40% equity (coin flip vs pairs, chop vs AK)", status: "pass" },
    { label: "Pot odds threshold", value: "31.4%", formula: "$2,200 / ($4,800 + $2,200) = 31.4%" },
    { label: "Direct odds check", value: "PASS \u2014 ~40% > 31.4%", status: "pass" },
    { label: "Verdict", value: "CALL \u2014 Blockers make this profitable. QQ is the most likely hand, and you're flipping.", status: "key" },
  ],

  insight: "Your AK does double duty: it's a strong hand AND it removes the scariest hands from villain's range. By holding an Ace and King, you cut AA and KK combos in half, making QQ the most likely hand \u2014 and you're a coin flip against QQ.",

  takeaway: "Blockers change the math. When you hold AK, you remove 3 combos of AA, 3 of KK, and 9 of AK from your opponent's range. QQ (6 combos, unblocked) becomes the most common premium hand. This is why AK plays better against 3-bets than it looks on paper.",

  coachNotes: "This is an advanced concept that bridges hand reading and combinatorics. Walk through: (1) Start with villain's full 3-bet range, (2) Apply blockers: A\u2660 removes 3 AA, K\u2663 removes 3 KK, AK together removes most AK combos, (3) QQ is untouched at 6 combos, (4) Against QQ, AKo is ~43%; against the full adjusted range, ~40%. The key insight is that holding blockers to the strongest hands makes your opponent's range weaker than it appears. Ask: 'What if you held QQ instead of AK? How would that change the blocker analysis?' (Answer: QQ blocks QQ but doesn't block AA or KK \u2014 very different math.)",
};

const scenario12 = {
  id: "semi-bluff-raise",
  title: "The Semi-Bluff Raise",
  source: {
    type: "curated",
    name: "Poker Decisions Curriculum",
    description: "Combining fold equity and draw equity to make raising better than calling.",
  },

  concepts: ["semi-bluff", "fold-equity", "draw-equity", "aggression"],
  difficulty: 3,
  category: "bluffing",

  players: [
    { name: "Villain", position: "UTG", stack: 20000, cards: ["Ad", "Jd"] },
    { name: "Hero", position: "CO", stack: 20000, cards: ["8s", "7s"] },
  ],
  blinds: { small: 100, big: 200, ante: 0 },
  heroIndex: 1,
  board: [],

  actions: [
    { type: "info", text: "Cash game \u2014 $100/$200 blinds. You're in the CO with 8\u26607\u2660." },
    { type: "info", text: "Blinds posted: $100/$200" },
    { type: "bet", player: 0, name: "Villain", action: "raises to", amount: 600 },
    { type: "bet", player: 1, name: "Hero", action: "calls", amount: 600 },
    { type: "info", text: "Pot: $1,300" },
    { type: "board", cards: ["9s", "6s", "2c"] },
    { type: "info", text: "Flop: 9\u26606\u26602\u2663 \u2014 Monster draw! Flush draw + open-ended straight draw." },
    { type: "bet", player: 0, name: "Villain", action: "bets", amount: 800 },
    { type: "info", text: "Villain bets $800 into $1,300. Pot is now $2,100." },
    { type: "info", text: "You have a monster draw. Calling is fine, but should you RAISE instead?" },
    { type: "decision", options: ["call", "fold", "raise"], callAmount: 800, raiseAmount: 2800 },
  ],

  decision: {
    options: ["call", "fold", "raise"],
    callAmount: 800,
    raiseAmount: 2800,
    correctAction: "raise",
    pot: 2100,
    heroStack: 19400,
  },

  mathSteps: [
    { label: "Your outs", value: "~15 outs (9 flush + 8 OESD \u2212 2 overlap)", status: "key" },
    { label: "Equity (1 card to come)", value: "32.6%", formula: "15 / 46 = 32.6%" },
    { label: "Equity (2 cards, if all-in)", value: "54.1%", formula: "Corrected: 3\u00d715+8 = 53%" },
    { label: "Calling EV", value: "+EV (32.6% > 27.6% pot odds)", status: "pass" },
    { label: "But raising adds fold equity...", value: "Villain folds ~40% of non-premium hands", status: "key" },
    { label: "When villain folds (40%)", value: "You win $2,100 immediately", status: "pass" },
    { label: "When villain calls (60%)", value: "You have 54.1% equity in a bigger pot \u2014 you're the FAVORITE", status: "pass" },
    { label: "Raise EV calculation", value: "0.40 \u00d7 $2,100 + 0.60 \u00d7 (0.541 \u00d7 $7,700 \u2212 $2,800) = $1,742", status: "key" },
    { label: "Call EV vs Raise EV", value: "Raise EV ($1,742) >> Call EV ($388)", status: "pass" },
    { label: "Verdict", value: "RAISE \u2014 Fold equity + draw equity makes raising far superior to calling", status: "key" },
  ],

  insight: "Calling with a monster draw is profitable. But raising is much MORE profitable because you combine two sources of profit: the times villain folds (you win immediately) and the times villain calls (you're actually the favorite with 54% equity).",

  takeaway: "When you have both strong draw equity AND fold equity, raising beats calling. This is the essence of the semi-bluff: you're not bluffing (you have real equity) and you're not value-betting (you don't have a made hand), you're applying maximum pressure with a hand that can win either way.",

  coachNotes: "This is a pivotal strategic concept. Walk through: (1) Calling is already +EV with 32.6% vs 27.6% pot odds, (2) But raising introduces fold equity \u2014 if villain folds 40% of the time, you win $2,100 risk-free, (3) When called, your 15 outs give ~54% equity with 2 cards to come (you're the favorite!), (4) The combined EV of the raise far exceeds the call. Emphasize: this only works when you have BOTH draw equity and fold equity. Ask: 'What if villain was the type to never fold? Would raising still be better?' (Answer: Still good! You have 54% equity when called. But fold equity makes it even better.)",
};

const scenario13 = {
  id: "multiway-ak-dilution",
  title: "Multiway Pot \u2014 AK Dilution",
  source: {
    type: "curated",
    name: "Poker Decisions Curriculum",
    description: "Demonstrates how unpaired AK loses equity dramatically in multiway pots.",
  },

  concepts: ["multiway-equity", "equity-dilution", "overcard-outs", "draw-visibility"],
  difficulty: 3,
  category: "multiway",

  players: [
    { name: "UTG", position: "UTG", stack: 10000, cards: ["9h", "8h"] },
    { name: "MP", position: "MP", stack: 10000, cards: ["Jc", "Tc"] },
    { name: "BTN", position: "BTN", stack: 10000, cards: ["6d", "6s"] },
    { name: "Hero", position: "BB", stack: 10000, cards: ["Ac", "Kd"] },
  ],
  blinds: { small: 50, big: 100, ante: 0 },
  heroIndex: 3,
  board: [],

  actions: [
    { type: "info", text: "Cash game \u2014 $50/$100 blinds. You're in the BB with A\u2663K\u2666." },
    { type: "info", text: "Blinds posted: $50/$100" },
    { type: "bet", player: 0, name: "UTG", action: "limps", amount: 100 },
    { type: "bet", player: 1, name: "MP", action: "limps", amount: 100 },
    { type: "bet", player: 2, name: "BTN", action: "limps", amount: 100 },
    { type: "info", text: "Three limpers. You check your option in the BB. Pot: $400 (4-way)." },
    { type: "board", cards: ["8c", "5d", "2s"] },
    { type: "info", text: "Flop: 8\u26635\u26662\u2660 \u2014 You missed completely in a 4-way pot." },
    { type: "bet", player: 0, name: "UTG", action: "bets", amount: 300 },
    { type: "bet", player: 1, name: "MP", action: "calls", amount: 300 },
    { type: "bet", player: 2, name: "BTN", action: "folds", amount: 0 },
    { type: "info", text: "UTG bets $300, MP calls. Pot is now $1,000. Action is on you." },
    { type: "decision", options: ["call", "fold"], callAmount: 300 },
  ],

  decision: {
    options: ["call", "fold"],
    callAmount: 300,
    correctAction: "fold",
    pot: 1000,
    heroStack: 9900,
  },

  mathSteps: [
    { label: "Your hand", value: "AK unpaired \u2014 ace-high, no pair, no draw", status: "key" },
    { label: "AK equity heads-up (preflop)", value: "~65% vs random", formula: null },
    { label: "AK equity 4-way (preflop)", value: "~30% vs 3 random hands", status: "warning" },
    { label: "AK equity now (missed flop, 4-way)", value: "~15-20% against two players who showed interest", status: "fail" },
    { label: "Your outs", value: "6 overcards (Aces + Kings)", formula: null },
    { label: "Equity (Rule of 2)", value: "~12%", formula: "6 \u00d7 2 = 12%" },
    { label: "Pot odds threshold", value: "23.1%", formula: "$300 / ($1,000 + $300) = 23.1%" },
    { label: "Direct odds check", value: "FAIL \u2014 12% < 23.1%", status: "fail" },
    { label: "Implied odds", value: "TERRIBLE \u2014 overcard outs + multiway = no one pays you off", status: "fail" },
    { label: "Multiway penalty", value: "Even if you hit, someone may have two pair or a set", status: "fail" },
    { label: "Verdict", value: "FOLD \u2014 AK is a calling-station trap in multiway pots", status: "key" },
  ],

  insight: "AK is a powerful hand heads-up, but its equity crumbles in multiway pots when it doesn't connect. With three opponents on a low board, your overcards are worth very little \u2014 and even hitting an Ace or King doesn't guarantee the best hand.",

  takeaway: "Unpaired AK plays best heads-up where its raw equity shines and it can win with one pair. In multiway pots, AK's equity dilutes dramatically: more opponents = more chance someone flopped a real hand. And overcard outs have terrible implied odds multiway because hitting an Ace scares everyone.",

  coachNotes: "This teaches multiway equity dilution. Key points: (1) AK goes from ~65% heads-up to ~30% 4-way preflop, and even lower on a missed flop, (2) In a multiway pot, someone likely has a pair or better, (3) Overcard outs are terrible multiway: if an Ace hits, everyone with a pair gets scared and folds \u2014 you win a small pot. If it doesn't hit, you lose, (4) The board 8-5-2 rainbow connects with suited connectors and small pairs, not AK. Ask: 'What if the flop were A-8-5? Would AK be in a better spot?' (Answer: top pair is better but STILL dangerous multiway \u2014 someone might have two pair or a set.)",
};

const scenario14 = {
  id: "reverse-implied-odds",
  title: "Reverse Implied Odds",
  source: {
    type: "curated",
    name: "Poker Decisions Curriculum",
    description: "When hitting your draw actually costs you MORE money because you don't have the nuts.",
  },

  concepts: ["reverse-implied-odds", "non-nut-draw", "second-best-hand", "discipline"],
  difficulty: 3,
  category: "cash",

  players: [
    { name: "Villain", position: "UTG", stack: 30000, cards: ["Ad", "Td"] },
    { name: "Hero", position: "BTN", stack: 30000, cards: ["Kd", "Qd"] },
  ],
  blinds: { small: 100, big: 200, ante: 0 },
  heroIndex: 1,
  board: [],

  actions: [
    { type: "info", text: "Cash game \u2014 $100/$200 blinds. Deep stacked. You're on the Button with K\u2666Q\u2666." },
    { type: "info", text: "Blinds posted: $100/$200" },
    { type: "bet", player: 0, name: "Villain", action: "raises to", amount: 600 },
    { type: "bet", player: 1, name: "Hero", action: "calls", amount: 600 },
    { type: "info", text: "Pot: $1,300" },
    { type: "board", cards: ["7d", "3d", "As"] },
    { type: "info", text: "Flop: 7\u26663\u2666A\u2660 \u2014 Two diamonds! You have the King-high flush draw." },
    { type: "bet", player: 0, name: "Villain", action: "bets", amount: 800 },
    { type: "bet", player: 1, name: "Hero", action: "calls", amount: 800 },
    { type: "info", text: "Pot: $2,900" },
    { type: "board", cards: ["9d"] },
    { type: "info", text: "Turn: 9\u2666 \u2014 You made a flush! King-high flush. But wait..." },
    { type: "info", text: "Villain raised preflop from UTG. The A\u2666 is still out there. If villain has A\u2666x\u2666, you're crushed." },
    { type: "bet", player: 0, name: "Villain", action: "bets", amount: 2200 },
    { type: "info", text: "Villain bets $2,200 into $2,900. Pot is now $5,100." },
    { type: "decision", options: ["call", "fold", "raise"], callAmount: 2200, raiseAmount: 7000 },
  ],

  decision: {
    options: ["call", "fold", "raise"],
    callAmount: 2200,
    raiseAmount: 7000,
    correctAction: "fold",
    pot: 5100,
    heroStack: 28600,
  },

  mathSteps: [
    { label: "Your hand", value: "King-high flush \u2014 looks great, but not the nuts", status: "warning" },
    { label: "The danger card", value: "A\u2666 \u2014 if villain has it, you lose everything", status: "fail" },
    { label: "Villain's line", value: "UTG raise \u2192 c-bet on A-high flop \u2192 big turn bet when flush completes", status: "warning" },
    { label: "Villain's likely range", value: "AA, AK, AQ, AJs+ \u2014 many holdings include the A\u2666", status: "fail" },
    { label: "Combos with A\u2666", value: "A\u2666K\u2663, A\u2666K\u2665, A\u2666K\u2660, A\u2666Q\u2663, A\u2666Q\u2665, A\u2666J\u2663, A\u2666T\u2663... many combos", status: "fail" },
    { label: "If villain has A\u2666x", value: "You lose ~$28K more on top of what's already in the pot", status: "fail" },
    { label: "If villain doesn't have A\u2666", value: "They may still have AA for a set, or check-fold the river", status: "warning" },
    { label: "Reverse implied odds", value: "Your 'best case' (flush) loses a HUGE pot if villain has the nut flush", status: "fail" },
    { label: "Risk-reward", value: "Win a medium pot vs non-flush, lose your stack vs nut flush", status: "fail" },
    { label: "Verdict", value: "FOLD \u2014 Second-best flush = second-best way to go broke", status: "key" },
  ],

  insight: "You made a flush \u2014 but it's not the nut flush. When villain raised from UTG, bet into the Ace-high flop, and fires again on the flush-completing turn, the A\u2666 is a very real possibility. Winning a medium pot when ahead doesn't compensate for losing your stack when behind.",

  takeaway: "Reverse implied odds mean that hitting your draw actually COSTS you money because you make the second-best hand and can't fold it. Non-nut flushes are the classic example: you feel committed because 'I made a flush!' but the nut flush is out there, and it will cost you everything.",

  coachNotes: "This is one of the most expensive leaks in poker. Walk through: (1) King-high flush looks great \u2014 most players can't fold it, (2) But villain's preflop range (UTG raise) contains many A\u2666 combos, (3) Villain's line (raising preflop, betting flop, bombing turn) is consistent with the nut flush, (4) If you call and villain has A\u2666, you'll likely lose your entire stack because it's almost impossible to fold a flush on the river. This is reverse implied odds: you WANT to miss your draw because hitting it costs you more than it earns. Ask: 'What if you had A\u2666Q\u2666 instead? How would that change everything?' (Answer: with the nut flush, you want to raise and get stacks in.)",
};

const scenario15 = {
  id: "tournament-bubble",
  title: "The Tournament Bubble",
  source: {
    type: "curated",
    name: "Poker Decisions Curriculum",
    description: "ICM scenario where chip equity says call but survival value says fold.",
  },

  concepts: ["icm", "tournament-pressure", "bubble-play", "survival-value"],
  difficulty: 3,
  category: "tournament",

  players: [
    { name: "Big Stack (CO)", position: "CO", stack: 180000, cards: ["9d", "8c"] },
    { name: "Short Stack (BTN)", position: "BTN", stack: 25000, cards: [] },
    { name: "Medium Stack (SB)", position: "SB", stack: 40000, cards: [] },
    { name: "Hero", position: "BB", stack: 75000, cards: ["As", "Jc"] },
  ],
  blinds: { small: 2000, big: 4000, ante: 500 },
  heroIndex: 3,
  board: [],

  actions: [
    { type: "info", text: "Tournament \u2014 Blinds $2,000/$4,000 with $500 ante. 20 players left, 18 get paid." },
    { type: "info", text: "You're on the BUBBLE. Two more eliminations and everyone's in the money." },
    { type: "info", text: "Antes posted: $2,000. Blinds posted: $2,000/$4,000." },
    { type: "info", text: "You have A\u2660J\u2663 in the BB with a medium stack (18.75 BB)." },
    { type: "bet", player: 1, name: "Short Stack (BTN)", action: "folds", amount: 0 },
    { type: "bet", player: 2, name: "Medium Stack (SB)", action: "folds", amount: 0 },
    { type: "bet", player: 0, name: "Big Stack (CO)", action: "raises to", amount: 10000 },
    { type: "info", text: "The big stack raises to $10,000. He's been bullying the table, exploiting bubble pressure." },
    { type: "info", text: "Pot is $18,000 ($2,000 antes + $2,000 SB + $4,000 BB + $10,000 raise). You need $6,000 to call." },
    { type: "info", text: "The short stack at the table has 6 BB \u2014 they could bust any hand now." },
    { type: "decision", options: ["call", "fold", "raise"], callAmount: 6000, raiseAmount: 25000 },
  ],

  decision: {
    options: ["call", "fold", "raise"],
    callAmount: 6000,
    raiseAmount: 25000,
    correctAction: "fold",
    pot: 18000,
    heroStack: 71000,
  },

  mathSteps: [
    { label: "Your hand", value: "AJ offsuit \u2014 strong hand in isolation", status: "key" },
    { label: "Chip equity (standard pot odds)", value: "25.0%", formula: "$6,000 / ($18,000 + $6,000) = 25.0%" },
    { label: "Your equity vs big stack's wide range", value: "~55-60%", formula: "AJo vs top 35% \u2248 57%", status: "pass" },
    { label: "Chip EV says...", value: "CALL \u2014 57% equity >> 25% pot odds", status: "pass" },
    { label: "BUT this is a tournament on the bubble", value: "ICM changes everything", status: "warning" },
    { label: "ICM factor: busting = $0", value: "If you lose, you bust 20th \u2014 no prize money at all", status: "fail" },
    { label: "ICM factor: short stack exists", value: "If you fold and the short stack busts, you're in the money", status: "key" },
    { label: "ICM factor: chip value is non-linear", value: "Going from 75K\u219275K+$18K is worth less than 75K\u21920 costs", status: "fail" },
    { label: "Risk premium on the bubble", value: "Need ~70%+ equity to justify risking elimination this close to the money", status: "warning" },
    { label: "Verdict", value: "FOLD \u2014 Survival > chip accumulation on the bubble", status: "key" },
  ],

  insight: "This is the tension at the heart of tournament poker. Your hand is strong enough to call in a cash game. But on the bubble, the value of surviving exceeds the value of accumulating chips. With a short stack about to bust, patience is worth more than pot odds.",

  takeaway: "In tournaments, chips lost are worth MORE than chips won. This is the core of ICM (Independent Chip Model). On the bubble, folding mathematically +EV spots is correct because the cost of busting (losing all prize equity) outweighs the benefit of winning a pot. Wait for the short stack to bust, then play aggressively.",

  coachNotes: "This is the most important tournament concept. Key points: (1) In a cash game, AJo with 57% equity vs 25% pot odds is a trivial call, (2) But tournaments have a non-linear chip value: your first chip is worth more than your last, (3) On the bubble, busting = $0 while surviving = guaranteed min cash, (4) The short stack with 6 BB creates a powerful dynamic: if they bust before you, you're in the money without risking a chip, (5) The big stack KNOWS this and is exploiting bubble pressure with wide raises. Ask: 'What if the short stack had already busted and you were safely in the money? Would you call then?' (Answer: absolutely \u2014 the ICM pressure disappears once you're past the bubble.)",
};

// ---------------------------------------------------------------------------
// EXPORT
// ---------------------------------------------------------------------------

/**
 * All 15 scenarios in order of difficulty and sequence.
 */
export const scenarios = [
  // Beginner (difficulty: 1)
  scenario1,
  scenario2,
  scenario3,
  scenario4,
  scenario5,
  // Intermediate (difficulty: 2)
  scenario6,
  scenario7,
  scenario8,
  scenario9,
  scenario10,
  // Advanced (difficulty: 3)
  scenario11,
  scenario12,
  scenario13,
  scenario14,
  scenario15,
];

/**
 * Look up a scenario by its unique id string.
 * @param {string} id - The scenario id (e.g., "first-pot-odds")
 * @returns {Object|undefined} The matching scenario, or undefined if not found.
 */
export function getScenarioById(id) {
  return scenarios.find((s) => s.id === id);
}

export default scenarios;
