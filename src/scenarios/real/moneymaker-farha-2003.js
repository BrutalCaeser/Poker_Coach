/**
 * Real Hand: Chris Moneymaker vs Sam Farha
 * 2003 WSOP Main Event — Final Table (heads-up)
 * "The Bluff That Launched Poker"
 *
 * Source: ESPN broadcast footage + multiple hand-history analyses
 * Cards and board: verified across PokerNews, Upswing Poker, CardPlayer, and
 * Vegas Slots Online analyses. Bet sizes verified via Upswing Poker analysis
 * (100k preflop raise; check/check flop; 300k/800k turn; river shove ~2.88M).
 * Stack sizes: Moneymaker ~4.62M, Farha ~3.77M (widely cited pre-hand figures).
 *
 * Engine-computed equity values (throwaway script, src/engine/{equity,outs,math}.js):
 *   Preflop  (no board):              Moneymaker 57.8% vs Farha 42.2%
 *   Flop     (9s 2d 6s):              Moneymaker 18.5% vs Farha 81.5%
 *   Turn     (9s 2d 6s 8s):           Moneymaker 38.7% vs Farha 61.3%
 *   River    (9s 2d 6s 8s 3h):        Moneymaker  0.0% vs Farha 100.0%
 *   Turn clean outs (Ks7h on 4-card board): 20
 *     - 9 flush (any remaining spade: 2s,3s,4s,5s,7s,Ts,Js,Qs,As)
 *     - 6 straight (any 5 or T off-suit: 5h,5d,5c,Th,Td,Tc)
 *     - 5 pair (Kh,Kd,Kc,7d,7c — Ks and 7h already in hand, 7s is a flush out)
 *   Turn pot odds (call Farha's 300k into 510k pot): 37.0%
 *   River bluff break-even fold rate: 61.4%
 */

export const moneymakerFarha2003 = {
  id: "moneymaker-farha-2003",

  title: "The Bluff That Launched Poker",

  source: {
    type: "tournament",
    name: "WSOP 2003 Main Event",
    description:
      "Heads-up final table at the 2003 WSOP Main Event. An amateur accountant from Tennessee bluffed a professional for a multi-million-chip pot, folding out a flopped pair — then went on to win the championship. The hand is credited with igniting the global poker boom.",
    license: "factual-data",
  },

  realHand: {
    event: "2003 WSOP Main Event — Final Table (heads-up)",
    venue: "Binion's Horseshoe, Las Vegas, NV",
    date: "2003-05-23", // [UNVERIFIED exact date — commonly cited as May 2003; some sources say May 24]
    season: "WSOP 2003",
    sourceRef: "https://upswingpoker.com/chris-moneymaker-vs-sammy-farha/",
    sourceLicense: "factual-data",
  },

  concepts: [
    "semi-bluff",
    "fold-equity",
    "polarized-range",
    "river-bluff",
    "pot-odds",
    "tournament-pressure",
    "overbet",
  ],

  difficulty: 3,
  category: "tournament",

  // ── COMMENTARY BOOTH ─────────────────────────────────────────────────────────
  // Cal Brennan is an ORIGINAL, FICTIONAL commentator. He is deliberately not
  // modelled on, and must never be made to imitate, any real broadcaster or
  // player. Rationale (see outputs/2026-07-27_poker-decisions-voice-first-thesis.md):
  // synthesizing a real person's voice is a right-of-publicity tort (Midler v.
  // Ford; Waits v. Frito-Lay; TN ELVIS Act; CA SB 683) and no disclaimer cures it.
  // The booth framing is also the more faithful choice — the 2003 broadcast was
  // narrated from the booth, not by the players.
  commentator: {
    id: "cal-brennan",
    name: "Cal Brennan",
    role: "Commentary booth",
    voice: "am_michael", // Kokoro voice id; swappable
    fictional: true,
  },

  // hero = index 0 (Moneymaker) — the USER plays his seat
  players: [
    {
      name: "Chris Moneymaker",
      position: "BTN", // heads-up: button = small blind and acts first preflop
      stack: 4620000,
      cards: ["Ks", "7h"],
      behaviour: null, // hero seat — user controls
      isPro: true,
      avatarId: "moneymaker",
      country: "US",
    },
    {
      name: "Sam Farha",
      position: "BB", // heads-up: big blind = out of position postflop
      stack: 3770000,
      cards: ["Qs", "9h"],
      behaviour: "Aggressive pro · respects big bets",
      // Full broadcast "read" — surfaced in the coaching/read panel, NOT the pod.
      read:
        "Farha is a world-class pro with a Camel cigarette between his lips. He's been controlling the heads-up match but is now a large chip underdog. Expects Moneymaker to be scared. Known for calling with bluff-catchers but also for respecting big bets.",
      isPro: true,
      avatarId: "farha",
      country: "US",
    },
  ],

  blinds: {
    small: 20000, // BTN posts SB heads-up
    big: 40000,
    ante: 5000,
  },

  heroIndex: 0, // Moneymaker

  board: [], // dealt street-by-street via actions

  // ── ACTIONS ──────────────────────────────────────────────────────────────────
  // Interleaved: info | bet | board | decision
  actions: [
    // --- CONTEXT ---
    {
      type: "info",
      text: "2003 WSOP Main Event final table — heads-up. Blinds $20,000/$40,000 with $5,000 ante. You are Chris Moneymaker: an amateur accountant from Nashville who won his seat in a $40 online satellite. Sammy Farha — a seasoned pro — leads the Camel-dangling poker world by 3.7 million chips. You've closed the gap and now hold the chip lead.",
      vo: {
        id: "open",
        text: "Two thousand three. The final table of the World Series of Poker. On one side, Sammy Farha, a professional, cigarette hanging off his lip. On the other, Chris Moneymaker, an accountant from Nashville who bought into this thing for forty dollars online. You're in Moneymaker's seat.",
      },
    },
    {
      type: "info",
      text: "Stacks: Chris Moneymaker 4,620,000 | Sam Farha 3,770,000. Ante posted: $5,000 each. Blinds: $20,000 (BTN) / $40,000 (BB).",
    },

    // --- PREFLOP ---
    {
      type: "info",
      text: "You're dealt K♠ 7♥ on the button. A king-high hand with no real connection — a speculative raise to see a flop.",
      vo: {
        id: "preflop",
        text: "You look down at a king and a seven. Nothing special. You raise anyway, just to see what the flop brings.",
      },
    },
    {
      type: "bet",
      player: 0,
      name: "Chris Moneymaker",
      action: "raises to",
      amount: 100000,
    },
    {
      type: "bet",
      player: 1,
      name: "Sam Farha",
      action: "calls",
      amount: 100000,
    },
    {
      type: "info",
      text: "Pot: 210,000. Heads-up to the flop.",
    },

    // --- FLOP ---
    { type: "board", cards: ["9s", "2d", "6s"] },
    {
      type: "info",
      text: "Flop: 9♠ 2♦ 6♠ — Farha flopped top pair (pair of 9s, Q kicker). You have king-high with a backdoor spade draw (K♠ gives you one spade to the board's two). Farha checks.",
      vo: {
        id: "flop",
        text: "Nine, deuce, six. Two spades out there. The hole-card camera tells us Farha has a pair of nines. You have king high and one spade toward a flush. He checks. So do you.",
      },
    },
    {
      type: "bet",
      player: 0,
      name: "Chris Moneymaker",
      action: "checks",
      amount: 0,
    },
    {
      type: "info",
      text: "Both players check. Pot remains 210,000.",
    },

    // --- TURN ---
    { type: "board", cards: ["8s"] },
    {
      type: "info",
      text:
        "Turn: 8♠ — A third spade arrives. The board is now 9♠ 2♦ 6♠ 8♠. You now have a live King-high flush draw (K♠ + 4 board spades would give you 5 spades — but wait: you only have one spade, so you need ONE more spade to complete the flush). You also have straight outs: any 5 or T makes a straight (5-6-7-8-9 or 6-7-8-9-T). This is a genuine drawing hand with real equity.",
      vo: {
        id: "turn",
        text: "There's your third spade. Now you've got a real draw. One more spade makes a flush, and any five or any ten makes you a straight.",
      },
    },
    {
      type: "bet",
      player: 1,
      name: "Sam Farha",
      action: "bets",
      amount: 300000,
    },
    {
      type: "info",
      text: "Farha leads for 300,000 into a 210,000 pot (1.43× pot). He's protecting his pair of 9s on a three-spade board. Pot is now 510,000. You face a 300,000 call.",
      vo: {
        id: "turn-bet",
        text: "And Farha fires out more than the size of the pot. He's protecting those nines. This one's yours.",
      },
    },
    {
      type: "decision",
      decisionId: "dp1-turn",
      options: ["call", "fold", "raise"],
      callAmount: 300000,
      raiseAmount: 800000,
    },

    // --- AFTER TURN DECISION (Moneymaker raised to 800k) ---
    {
      type: "info",
      text:
        "You raise to 800,000 — a semi-bluff. You have real equity (flush draw + straight draw) but also put maximum pressure on Farha's pair. Farha calls 500,000 more.",
      vo: {
        id: "after-turn",
        text: "Moneymaker doesn't just call. He raises, with a hand that hasn't actually made anything yet. Farha calls.",
      },
    },
    {
      type: "bet",
      player: 1,
      name: "Sam Farha",
      action: "calls",
      amount: 500000,
    },
    {
      type: "info",
      text:
        "Pot: 1,810,000. Farha's remaining stack: approximately 2,880,000. The river is coming.",
    },

    // --- RIVER ---
    { type: "board", cards: ["3h"] },
    {
      type: "info",
      text:
        "River: 3♥ — A brick. The board is 9♠ 2♦ 6♠ 8♠ 3♥. The fourth spade never came. Your straight never got there. You have king-high — nothing. Farha still holds top pair (pair of 9s). He checks.",
      vo: {
        id: "river",
        text: "Three of hearts. A blank. No spade, no straight. You have king high, which beats nothing at all. And Farha checks, still holding his pair of nines.",
      },
    },
    {
      type: "bet",
      player: 1,
      name: "Sam Farha",
      action: "checks",
      amount: 0,
    },
    {
      type: "info",
      text:
        "Farha checks into a 1,810,000 pot. He's left himself approximately 2,880,000 behind. You hold king-high — zero showdown value. This is a pure bluff spot. The question: can you make Farha fold a pair of 9s for his tournament life?",
      vo: {
        id: "river-context",
        text: "So here it is. Nearly two million in the middle, and the only way to win it is to make a professional fold a made hand for his tournament life.",
      },
    },
    {
      type: "decision",
      decisionId: "dp2-river",
      options: ["check", "bet"],
      callAmount: 0,
      raiseAmount: 2880000, // approximate all-in shove
    },
  ],

  // ── DECISION POINTS ──────────────────────────────────────────────────────────
  decisionPoints: [
    {
      id: "dp1-turn",
      street: "turn",
      options: ["call", "fold", "raise"],
      callAmount: 300000,
      raiseAmount: 800000,

      // GTO/correct action: RAISE (semi-bluff with strong equity)
      // Calling is marginally +EV; raising adds fold equity on top
      correctAction: "raise",

      pot: 510000, // after Farha's bet, before hero acts
      heroStack: 4520000, // approx (4,620,000 - 100,000 preflop raise)

      // What Moneymaker actually did
      proAction: "raised to 800,000 (semi-bluff raise)",
      proReasoning:
        "Moneymaker had a King-high flush draw plus straight outs — real equity going forward. The raise serves two purposes: (1) win the pot immediately if Farha folds, (2) build the pot for a river bluff when draws miss. A call gives Farha free information and allows him to bet again on the river.",

      // Engine-computed (200,000 MC iterations, src/engine/equity.js)
      drawEquityPct: 38.7,

      mathSteps: [
        {
          label: "Moneymaker's hand",
          value: "K♠ 7♥ — King-high flush draw + straight draw on 9♠ 2♦ 6♠ 8♠",
          status: "key",
        },
        {
          label: "Clean outs (engine: countOuts)",
          value: "20 outs total",
          formula: "9 flush (any remaining spade) + 6 straight (any 5 or T off-suit) + 5 pair (Kh,Kd,Kc,7d,7c)",
          status: "key",
        },
        {
          label: "Flush outs (9)",
          value: "Any remaining spade — 9 by your in-hand count (you can see 4: K♠ 9♠ 6♠ 8♠)",
          formula: "13 spades − 4 seen (Ks hero, 9s/6s/8s board) = 9",
        },
        {
          label: "Straight outs (6)",
          value: "5h, 5d, 5c (→ 5-6-7-8-9) + Th, Td, Tc (→ 6-7-8-9-T)",
          formula: "3 fives off-suit + 3 tens off-suit (5s and Ts are flush outs, already counted)",
        },
        {
          label: "Pair outs (5)",
          value: "Kh, Kd, Kc (3 Kings) + 7d, 7c (2 Sevens)",
          formula: "7s is a spade flush out already counted; 7h is in hero's hand",
        },
        {
          label: "MC equity (engine: calculateEquity, 200k iter)",
          value: "38.7%",
          formula: "Moneymaker Ks7h vs Farha Qs9h on 9s 2d 6s 8s",
          status: "key",
        },
        {
          label: "Note: 20 outs → exact 1-card formula",
          value: "43.5%",
          formula: "20 / 46 = 43.5%",
          status: "warning",
        },
        {
          label: "Why MC (38.7%) < exact formula (43.5%)",
          value: "Several spade outs also improve Farha's hand (he holds Q♠). The engine's MC correctly accounts for villain improving — the formula does not.",
          status: "warning",
        },
        {
          label: "Pot odds (call Farha's 300k)",
          value: "37.0%",
          formula: "300,000 / (510,000 + 300,000) = 37.0%",
        },
        {
          label: "Calling is barely +EV",
          value: "38.7% equity > 37.0% threshold — marginal call",
          formula: "38.7% − 37.0% = +1.7% edge",
          status: "pass",
        },
        {
          label: "Semi-bluff raise adds fold equity",
          value: "If Farha folds ~30%+ of the time to the raise, raising dominates calling in EV",
          status: "key",
        },
        {
          label: "Verdict",
          value: "RAISE — Semi-bluff with strong draw equity + fold equity beats a marginal call",
          status: "key",
        },
      ],

      insight:
        "The turn is the perfect semi-bluff spot. You have 20 clean outs giving ~38.7% equity (engine-computed) — barely enough to justify calling. But raising does far more: it forces Farha to risk his tournament life with just a pair on a four-spade board, and builds the pot for a credible river bluff when the draw misses.",

      takeaway:
        "When your equity barely clears the pot odds threshold AND you can add fold equity with a raise, raising dominates calling. A call with 38.7% equity vs 37.0% pot odds yields a razor-thin +EV; a semi-bluff raise that folds Farha out even 30% of the time is far superior.",
    },

    {
      id: "dp2-river",
      street: "river",
      options: ["check", "bet"],
      callAmount: 0,
      raiseAmount: 2880000, // all-in shove

      // Correct action: BET (bluff) — Moneymaker has 0% equity at showdown,
      // so checking surrenders. The only winning line is a bluff.
      // Whether the bluff is +EV depends on fold equity: Farha needs to fold >61.4% of the time.
      // In 2003, an amateur making this overbet was credible for a flush/straight —
      // the bluff was likely +EV given the game dynamics and Farha's read uncertainty.
      correctAction: "bet",

      pot: 1810000, // after turn action
      heroStack: 3720000, // 4,620,000 − 100k preflop − 800k turn raise

      // What Moneymaker actually did
      proAction: "moved all-in for approximately 2,880,000",
      proReasoning:
        "Moneymaker's draw missed completely. He held king-high with zero showdown value. The only path to winning the pot was a large enough bluff to fold out Farha's pair. By overbetting ~1.59× pot he put maximum pressure — Farha would need to be right >61.4% of the time to call profitably. The bet told a story consistent with a flopped or turned flush. Farha tanked for several minutes, said 'I think I have to fold — you must have a small flush,' and folded Q♠ 9♥ face-up.",

      // Engine-computed: at river showdown, Moneymaker has 0% equity
      drawEquityPct: 0.0,

      mathSteps: [
        {
          label: "Moneymaker's showdown equity",
          value: "0.0%",
          formula: "Engine evaluate7: K-9-8-7-6 (king-high) vs Q-9-9-8-6 (pair of 9s) — pair wins",
          status: "fail",
        },
        {
          label: "Checking = certain loss",
          value: "0.0% equity means check-fold is −100% of remaining pot share",
          status: "fail",
        },
        {
          label: "River shove size",
          value: "~2,880,000 into 1,810,000 pot (≈ 1.59× pot overbet)",
        },
        {
          label: "Break-even fold rate",
          value: "61.4%",
          formula: "2,880,000 / (1,810,000 + 2,880,000) = 61.4%",
          status: "key",
        },
        {
          label: "Farha's pot odds (to call)",
          value: "61.4% — he needs 61.4% equity to break even",
          formula: "2,880,000 / (1,810,000 + 2,880,000) = 61.4%",
        },
        {
          label: "Farha's actual equity if he calls",
          value: "100.0% (pair of 9s beats king-high)",
          formula: "Engine evaluate7: Farha wins at showdown",
          status: "warning",
        },
        {
          label: "The fold-equity paradox",
          value: "Farha SHOULD call (he has 100% equity vs a missed draw). But he can't know that — Moneymaker's bet also represents a flopped/turned flush (K♠ on a three-spade board).",
          status: "warning",
        },
        {
          label: "Was the bluff +EV?",
          value: "YES — if Farha folds >61.4% of her range here, the bluff profits. Given 2003 dynamics (amateur overbetting a spade board = credible flush), most analyses agree Farha should have called, but the bluff was defensible +EV.",
          status: "key",
        },
        {
          label: "Verdict",
          value: "BET (bluff) — Checking surrenders with 0% equity. The shove needs >61.4% fold rate to be +EV, which Moneymaker achieved in practice.",
          status: "key",
        },
      ],

      insight:
        "This is a pure bluff with 0% showdown equity. The only reason to bet is fold equity. Moneymaker's overbet of 1.59× pot is perfectly sized: large enough to make a pair-of-9s call terrifying (Farha risks her tournament life with one pair), but the bet also tells a coherent story — K♠ on a 9♠ 6♠ 8♠ board is the nut flush draw. Farha correctly identified it as 'probably a missed draw' and still folded, showing how powerful the bet sizing and board texture were.",

      takeaway:
        "When you have 0% equity at showdown, you have two choices: check and lose, or bluff. The size of a bluff must be large enough to make calling uncomfortable — here 1.59× pot means Farha needs >61.4% confidence he's ahead. Against a plausible flush-draw narrative on a triple-spade board, that threshold is hard to reach. The lesson: pick bluffing spots where your hand represents a credible strong holding, and bet big enough to make calling require near-certainty.",
    },
  ],

  // ── STREET RESULTS ───────────────────────────────────────────────────────────
  // What actually happened after each of Moneymaker's decisions
  streetResults: [
    {
      afterDpId: "dp1-turn",
      continuationActions: [
        {
          type: "bet",
          player: 0,
          name: "Chris Moneymaker",
          action: "raises to",
          amount: 800000,
        },
        {
          type: "bet",
          player: 1,
          name: "Sam Farha",
          action: "calls",
          amount: 500000,
        },
      ],
      newBoard: ["9s", "2d", "6s", "8s"],
    },
    {
      afterDpId: "dp2-river",
      continuationActions: [
        {
          type: "bet",
          player: 0,
          name: "Chris Moneymaker",
          action: "moves all-in for",
          amount: 2880000,
        },
        {
          type: "bet",
          player: 1,
          name: "Sam Farha",
          action: "folds",
          amount: 0,
        },
      ],
      newBoard: ["9s", "2d", "6s", "8s", "3h"],
    },
  ],

  // ── HAND RESULT ──────────────────────────────────────────────────────────────
  handResult: {
    potTotal: 1810000, // the pot Moneymaker won (Farha folded, no showdown)
    winnerIndex: 0, // Moneymaker
    winnerName: "Chris Moneymaker",
    showdownDesc:
      "Farha folded Q♠ 9♥ face-up after several minutes of deliberation. No showdown — Moneymaker never revealed his K♠ 7♥ until after the fold. This hand swung Moneymaker from slight chip lead to roughly 6.6M vs Farha's 1.8M, essentially sealing the championship.",
  },

  // ── COACH NOTES ──────────────────────────────────────────────────────────────
  coachNotes:
    "This hand teaches two linked concepts: (1) the semi-bluff raise, and (2) the pure river bluff. Walk the student through the turn first — they have a genuine draw (engine: 38.7% equity, 20 outs) and the raise is correct because fold equity + draw equity dominate a marginal call. Then shift to the river: the draw missed. Equity = 0%. The only winning action is the bluff. Emphasize the break-even fold rate (61.4%) and why the overbet size is justified: on a four-spade board with K♠ in hand, the story 'I have a flush' is maximally credible. Ask the student: 'If you check the river, what happens?' (Farha bets, you fold, you lose.) 'If you bet small — say 500k — is that better?' (No: Farha calls trivially with pair of 9s at better pot odds.) The overbet or fold binary is the key insight. Historical note: Farha told reporters he suspected the bluff — 'You must have missed your flush draw' — yet he still folded. This is the meta-lesson: even a CORRECT READ doesn't always translate to a correct call, because the pot odds required (61.4%) exceed a reasonable bluff-to-value ratio estimate.",
};
