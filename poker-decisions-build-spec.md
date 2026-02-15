# Poker Decisions: Complete Build Specification for Claude Code

## What You Are Building

A full-stack interactive poker training application that transforms a beginner into a mathematically literate poker player. The user plays through realistic poker hands — dealt cards, community cards revealed street by street, opponents betting, pot growing — and at critical moments the app asks: **"What do you do?"** After the user decides, the app reveals whether the math supports their decision, teaching equity calculation, pot odds, implied odds, outs counting, and draw visibility through real gameplay, not lectures.

An **AI Poker Coach** powered by Claude is embedded in the experience — available at every step to answer questions, explain concepts deeper, challenge the user's thinking, and guide them through the math like a patient mentor sitting next to them at the table.

This is not a calculator. This is not a textbook. This is a poker table where every hand teaches you something, and a world-class coach is always at your side.

---

## The Three Goals (in priority order)

### Goal 1: The Play Must Feel Real
The user must feel like they're sitting at a poker table. Cards are dealt, opponents act, chips move, the pot grows. The experience is sequential and immersive — not a dashboard with inputs. Think of it like a visual novel crossed with a poker game: events unfold one at a time, the user absorbs the situation, then makes their decision.

### Goal 2: Learning Through Doing
Every concept is taught at the exact moment it becomes relevant. The user doesn't read about pot odds and then apply them — they face a bet, make a gut decision, and THEN the app shows them the pot odds math and whether their gut was right. Concepts are introduced progressively: early scenarios teach basic equity and outs, later ones introduce implied odds, draw visibility, stack-to-pot ratio, and blocker effects. The math is always shown step-by-step with the actual numbers from the hand. The AI Coach reinforces and deepens every lesson.

### Goal 3: Real-World Depth
The scenario library starts curated, but scales to **millions of real poker hands** from top-level tournaments and televised events. The user should feel like they can sit at the same tables as the world's best players, face the exact decisions Phil Ivey or Daniel Negreanu faced, and learn from the same pressure points. A Scenario Director system ingests, normalizes, and serves real-world hand histories at scale.

---

## The AI Poker Coach

### What It Is
An always-available AI coaching assistant powered by Claude, deeply integrated into the poker training experience. The coach is not a generic chatbot — it is a poker expert that understands the current hand state, the math engine's output, the user's decision history, and the pedagogical goal of each scenario.

### Where It Appears

**1. During the Action Sequence (Before the Decision)**
- A subtle "Ask Coach" button is always visible but never intrusive
- The user can tap it to ask things like: "What should I be thinking about here?", "What's a 3-bet?", "Is this player's range wide or tight?"
- The Coach answers contextually — it knows the current scenario, the cards, the stacks, the action so far
- **CRITICAL: The Coach NEVER reveals the mathematically correct decision before the user commits.** It can explain concepts, define terms, discuss general strategy, and prompt the user to think — but it does NOT say "you should call" or show any numbers that would spoil the decision point.

**2. After the Decision (The Teaching Moment)**
- Once the user has decided and the math reveal is shown, the Coach becomes fully available
- The user can ask: "Why is the corrected rule better than Rule of 4?", "What if the stacks were deeper?", "Would this change in a tournament vs cash game?"
- The Coach can walk through any math step in more detail, give analogies, run "what-if" variations, and connect this hand's lesson to broader poker strategy
- It can also challenge the user: "You got this one right — but what if the bet was 2x pot instead of half pot? Would you still call?"

**3. In Free Play Mode**
- The Coach acts as a real-time analysis partner
- As the user sets up hands and runs equity calculations, the Coach can explain the results, suggest interesting variations, and teach concepts organically
- "You set up AK vs QQ — did you know that AK actually performs better against a range of hands than against a specific pocket pair?"

**4. From the Home Screen**
- Users can open the Coach in a standalone chat to ask general poker questions
- "Explain implied odds to me", "What's ICM?", "How do I calculate pot odds at the table without a calculator?"
- The Coach draws from the same mathematical framework the app uses, so its explanations are always consistent with what the scenarios teach

### Coach Behavior Rules
- **Socratic first:** The Coach prefers to ask guiding questions rather than just give answers. "What do you think your equity is here? How many outs can you count?" — then confirms or corrects.
- **Never condescending:** The Coach assumes the user is smart but learning. No "as a beginner, you should know..." — instead, "This is one of the trickiest spots in poker because..."
- **Contextually aware:** The Coach always knows the current hand state, the user's decision, the math results, and what concept the scenario is designed to teach.
- **Builds on history:** Over time, the Coach references past scenarios the user has played. "Remember when you folded that flush draw in Scenario 2? This is the same math, but with a twist..."
- **Mathematically rigorous:** The Coach uses the exact same formulas and frameworks the app teaches. No hand-wavy advice — every recommendation is backed by the math engine.

### Implementation Approach
The AI Coach is implemented via the Anthropic API (Claude), with a carefully constructed system prompt that includes:
- The full mathematical framework (pot odds, implied odds, equity formulas, draw visibility, SPR)
- The current hand state (serialized from the app's game engine)
- The user's decision history and accuracy stats
- The pedagogical goal of the current scenario
- Strict instructions to never spoil decisions before the user commits

The Coach UI is a slide-out panel (desktop) or bottom sheet (mobile) with a chat interface. Messages are contextually tagged with the current scenario and hand state.

---

## The Scenario Director: From Curated to Millions

### Vision
The initial launch ships with 15+ hand-crafted scenarios. But the long-term vision is a **Scenario Director** — a system that can ingest millions of real poker hands played in top-level tournaments (WSOP, WPT, EPT, High Stakes Poker, Poker After Dark, etc.) and transform them into playable, teachable scenarios.

The user should be able to:
- **Play iconic hands from poker history** — "Play the hand where Chris Moneymaker won the 2003 WSOP Main Event"
- **Filter by concept** — "Show me hands that teach implied odds" and get 500 real-world examples
- **Filter by player** — "Show me Daniel Negreanu's toughest river decisions"
- **Filter by situation** — "3-bet pots on the bubble with medium stacks"
- **Experience progressive difficulty** — The Director serves easier real-world hands first, building up to elite-level spots

### How the Scenario Director Works

**Stage 1: Hand History Ingestion**
- Parse standard hand history formats (PokerStars HH, Full Tilt HH, GGPoker HH, and generic formats)
- Extract: player names, positions, stack sizes, blinds/antes, hole cards (when known), board cards, all actions (folds, calls, bets, raises, all-ins), pot sizes at each street, showdown results
- Store in a normalized schema that maps directly to the app's scenario format

**Stage 2: Decision Point Extraction**
- For each hand, identify all non-trivial decision points — moments where the hero faces a bet, raise, or all-in and must decide
- Filter out trivial decisions (e.g., folding 72o from UTG preflop)
- Score each decision point by complexity: stack depth, pot odds spread, number of outs, draw visibility, multiway dynamics, tournament pressure

**Stage 3: Concept Tagging (AI-Powered)**
- Use Claude to analyze each decision point and tag it with the relevant teaching concepts:
  - Pot odds, implied odds, reverse implied odds, draw visibility, SPR, blocker effects, ICM, fold equity, semi-bluffing, set mining, overcard traps, multiway dilution, etc.
- Assign difficulty ratings based on the number of concepts involved and the subtlety of the correct decision
- Generate the hand-crafted-quality math breakdown for each decision point using Claude + the math engine

**Stage 4: Quality Scoring and Curation**
- Not every hand is interesting. The Director scores each scenario on:
  - **Teachability:** Does it clearly illustrate a concept? Is the math breakdown illuminating?
  - **Drama:** Is the decision close? Are the stakes meaningful? Is there a surprise?
  - **Clarity:** Can the scenario be understood without extensive context about the tournament?
  - **Uniqueness:** Does it teach something different from other scenarios in the library?
- Only scenarios above a quality threshold are served to users. The rest are archived for bulk practice mode.

**Stage 5: Serving and Recommendation**
- The Director maintains a "curriculum" for each user based on:
  - Concepts they've seen vs. haven't seen
  - Concepts they've gotten right vs. wrong
  - Their accuracy trends over time
  - Their self-reported difficulty preference
- It serves the next best scenario — the one that teaches the most relevant concept at the right difficulty level
- Users can override this and browse/filter the full library manually

### Data Sources (Future)
- **Public hand histories:** Millions of hands from online poker databases, hand history archives, and poker forums where players have shared hands
- **Televised hand data:** Transcribed hand data from TV poker shows (WSOP broadcasts, High Stakes Poker, etc.) — many of these are documented in poker media and databases
- **User-submitted hands:** Users can paste a hand history from their own online play, and the Director converts it into a playable scenario
- **AI-generated scenarios:** For concept coverage gaps, Claude can generate realistic, mathematically sound scenarios that teach specific concepts not well-represented in real-world data

### Schema: Scenario Data Model
```js
{
  id: "wsop-2003-moneymaker-final-hand",
  source: "wsop",                          // tournament/source identifier
  event: "2003 WSOP Main Event - Final Table",
  title: "Moneymaker's Bluff That Changed Poker",
  
  // Metadata
  concepts: ["fold-equity", "bluffing", "tournament-pressure", "icm"],
  difficulty: 3,                           // 1-3 stars
  category: "tournament",                  // tournament | cash | multiway | bluffing
  qualityScore: 0.94,                      // 0-1, from the Director's scoring
  
  // The hand data
  players: [
    { name: "Chris Moneymaker", position: "BB", stack: 5000000, cards: ["5s","4s"] },
    { name: "Sam Farha", position: "SB", stack: 3500000, cards: ["Jh","Td"] }
  ],
  blinds: { small: 50000, big: 100000, ante: 0 },
  heroIndex: 0,                            // which player the user controls
  
  // Action sequence (same format as before)
  actions: [ ... ],
  
  // Decision point
  decision: {
    options: ["bet", "check"],
    betAmount: 500000,
    correctAction: "bet",
    pot: 800000,
    heroStack: 4200000
  },
  
  // Teaching content
  insight: "Sometimes the best play is to bet with nothing...",
  mathSteps: [ ... ],
  coachNotes: "This is a great moment to discuss fold equity...",
  takeaway: "Betting as a bluff can be mathematically correct when..."
}
```

---

## Core User Flow

### 1. Landing / Home Screen
Clean, elegant, dark theme. A curated list of scenario "hands" organized by what they teach. Each shows:
- Hand title (e.g., "Moneymaker's River Bluff", "Nut Flush Draw Decision")
- What concept it teaches (e.g., "Fold Equity & Bluffing", "Implied Odds & Draw Visibility")
- Difficulty indicator (1-3 stars)
- Category tag (Tournament / Cash Game / Multiway / Bluffing)
- Source badge (when from real tournament data: "WSOP 2003", "WPT Season 12", etc.)

Also show the user's running stats: scenarios completed, correct decisions, accuracy percentage, concepts mastered.

The user can also:
- Enter a **Free Play** mode where they set up custom hands with any cards, any number of players, any stack sizes, and run the equity/odds engine themselves
- Open the **AI Coach** for standalone poker Q&A
- Browse the **full scenario library** with filters by concept, difficulty, tournament, player, and situation

### 2. Playing a Scenario
When the user selects a scenario, the experience unfolds like this:

**Phase A — Setup (automatic, not user-configured):**
- The table renders with the correct number of players, their positions, stack sizes, and the blinds
- The user sees their own hole cards (face up, prominent)
- Opponent cards are face-down
- A brief text introduces the situation: "You're in the big blind with pocket Jacks. A tight player raises from the cutoff, then the button 3-bets."
- If the hand is from a real tournament, a small banner shows: "WSOP 2019 Main Event — Day 5"
- The "Ask Coach" button is visible

**Phase B — Action Sequence (animated, sequential):**
Each action appears one at a time with a short delay (or on user click/tap to advance):
- "Blinds posted: $20K/$40K"
- "Player A raises to $80K" (chips animate to pot)
- "Player B 3-bets to $200K" (more chips to pot)
- The pot total updates live
- If there's a flop/turn/river, the community cards deal out visually
- User can tap "Ask Coach" at any point for contextual help (without spoilers)

**Phase C — The Decision Point:**
The action sequence pauses. A prominent, unmissable prompt appears:

> **Action is on you.**
> Pot: $300,000 · Facing: $160,000 to call
> Your stack: $450,000
>
> **[CALL $160,000]**  &nbsp;&nbsp;&nbsp;  **[FOLD]**

Optionally for some scenarios, **[RAISE]** is also an option with an amount.

The user has NO math visible at this point. They must decide based on their own judgment. This is critical — showing the math before the decision removes the learning moment.

**Phase D — The Reveal:**
After the user decides, the app reveals:

1. **Whether they were correct** (big, clear, unmissable — green check or red X)

2. **The Insight** — A 1-2 sentence framing of what this hand is really about (e.g., "This is a classic case where strong raw equity doesn't overcome poor implied odds and tournament pressure")

3. **The Math, Step by Step** — This is the teaching moment. Show the complete decision waterfall with the actual numbers from THIS hand:

   - **Step 1: Equity** — What is your hand's equity against the likely opponent range? Show the Monte Carlo result AND explain what the range assumption is.

   - **Step 2: Pot Odds** — Set up the formula: Call / (Pot + Bet + Call). Plug in the numbers. Show the threshold percentage.

   - **Step 3: The Comparison** — Is equity > pot odds? If yes, stop here (call is +EV on direct odds). If no, proceed to step 4.

   - **Step 4: Implied Odds** — Calculate F = (Call / Equity) - (Pot + 2×Call). Show the dollar amount needed from future streets.

   - **Step 5: Can You Collect F?** — Check: Is F > remaining stack? If so, implied odds are physically impossible (FOLD). If not, assess draw visibility: flush draws = poor collectability, overcard outs = poor collectability, gutshots = good collectability, sets = excellent collectability.

   - **Step 6: Verdict** — State the mathematically correct decision and WHY in plain language.

4. **Opponent Hand Reveal** — If the scenario has known opponent cards, let the user click to reveal them. Show the exact equity percentages updating on the table.

5. **Concept Summary** — A 2-3 sentence "lesson" that extracts the generalizable principle (e.g., "When F exceeds your remaining stack, no amount of implied odds can save you. This applies to any situation where you're short-stacked facing a large bet with a drawing hand.")

6. **Coach Debrief** — The AI Coach offers a brief follow-up: connecting this hand to broader strategy, posing a "what-if" variation, or asking the user a question to deepen understanding. The user can continue chatting with the Coach about this hand.

7. **Next Hand** button

### 3. Free Play Mode
A separate mode where the user can:
- Choose 2-6 players
- Click to assign specific cards to any player (or leave as "random")
- Click to deal board cards (or deal randomly)
- Set stack sizes and bet amounts for each player
- See live equity calculation (Monte Carlo), outs analysis, pot odds, and implied odds
- The math panel shows all formulas with live numbers
- The AI Coach is available to discuss the setup and results in real-time

This mode uses the same equity engine but gives the user full control. It's for when they want to analyze a hand they saw on TV or at their own table.

---

## The Mathematical Engine

### Hand Evaluator
Standard 5-card poker hand evaluator. Given 7 cards (2 hole + 5 board), evaluate all C(7,5) = 21 combinations and return the best hand. Rank hands as: High Card (0) < Pair (1) < Two Pair (2) < Three of a Kind (3) < Straight (4) < Flush (5) < Full House (6) < Four of a Kind (7) < Straight Flush (8).

### Equity Calculator
Monte Carlo simulation. For N players with known/unknown hands and a partial/full board:
1. Remove all known cards from the deck
2. For each simulation (10,000-20,000 iterations):
   a. Shuffle remaining cards
   b. Deal unknown hands from the shuffled deck
   c. Deal remaining board cards
   d. Evaluate each player's best hand
   e. Tally wins, ties, losses
3. Equity = (Wins + 0.5 × Ties) / Total

### Outs Counter
Given hero's 2 cards and 3-4 board cards:
1. Evaluate current best hand
2. For each remaining card in the deck, evaluate the new best hand if that card appeared
3. If the new hand is a different (better) category, count it as an out
4. Group outs by draw type: Flush, Straight, Pair, Trips, Full House, Quads

### Equity Formulas (for display, not for the engine)
These are shown to the user in the math breakdown:
- **Two cards to come (flop):** Exact = 1 − ((47−X)(46−X)) / (47×46)
- **One card to come (turn):** Exact = X / 46
- **Rule of 2:** outs × 2 (always safe, slight underestimate)
- **Rule of 4:** outs × 4 (ONLY for ≤8 outs with 2 cards to come)
- **Corrected Rule:** 3 × outs + 8 (for ≥9 outs with 2 cards to come — this replaces Rule of 4)
- **CRITICAL:** The app must explicitly teach that Rule of 4 overestimates at high outs and show the error. At 15 outs, Rule of 4 says 60% but the truth is 54%. The corrected formula fixes this.
- **CRITICAL:** The app must teach that 2-card equity (×4 / corrected) should ONLY be used when all money is in on the flop (no more betting). If there's still betting on the turn, use 1-card equity (×2) because you might face another bet.

### Pot Odds
- Pot odds % = Call / (Pot + Bet + Call)
- EV of calling = Equity × (Pot + 2×Bet) − Bet
- Decision: If equity > pot odds %, call is +EV

### Implied Odds
- F = (Call / Equity) − (Pot + 2×Call)
- F < 0: No implied odds needed (direct odds are sufficient)
- F > 0: You need to extract this much on future streets when you hit
- F > remaining stack: FOLD — physically impossible to realize implied odds
- Assess F as a percentage of the pot after calling — below 30% is very achievable, 30-70% is borderline, above 70% is very difficult

### Draw Visibility (Implied Odds Quality)
This is a crucial concept the app must teach:
- **Worst implied odds:** Flush draws (3rd suited card is impossible to miss), Overcard outs (Ace or King on turn is a universal scare card)
- **Medium implied odds:** Open-ended straight draws on connected boards
- **Good implied odds:** Gutshot straights on disconnected boards
- **Best implied odds:** Sets from pocket pairs (nearly invisible, opponents stack off)

### Stack-to-Pot Ratio (SPR)
- SPR = Remaining Stack / Pot
- SPR < 1: Very shallow, essentially committed
- SPR 1-3: Short, limited implied odds
- SPR 3-8: Medium, reasonable implied odds
- SPR > 8: Deep, excellent implied odds for disguised hands
- Set-mining rule: Need ~15× the call amount in effective stacks

---

## Scenario Library

### Launch Scenarios (Hand-Crafted)

Build at minimum these 15+ scenarios. Each must specify: all player hands, positions, stack sizes, blinds, the action sequence, the board (if post-flop), the decision point (call amount, pot size), the correct action, the step-by-step math, and the teaching concept.

#### Beginner Tier (⭐)

**1. "Your First Pot Odds Decision"**
- Concept: Basic pot odds calculation
- You: A♠K♦ on Q♥7♠2♦ board. Villain bets half pot.
- 6 overcard outs, 13% equity, need 25%. Fold.
- Teaches: Outs counting, Rule of 2, pot odds formula

**2. "The Nut Flush Draw"**
- Concept: Implied odds bridging a small gap
- You: A♠9♠ on T♠6♠3♦. Villain bets half pot.
- 9 flush outs = 19.6% equity vs 25% needed. F is small and easily achievable. Call.
- Teaches: Flush draw outs, implied odds formula, why small F values justify calls

**3. "The All-In Coin Flip"**
- Concept: Pure equity vs price (no implied odds when all-in)
- You: A♠K♠, villain shoves pre-flop, you put them on QQ.
- ~46% equity. Pot odds are favorable. Call.
- Teaches: When all-in, only equity and pot odds matter. No implied odds exist.

**4. "Short Stack Tournament Shove"**
- Concept: Wide ranges and pot odds in tournaments
- You: A♥T♥ in BB, short-stacked. Button shoves.
- Very low pot odds threshold (~14%), AT crushes it vs wide range. Snap call.
- Teaches: When pot is large relative to your call, you need very little equity.

**5. "Two Overcards, No Draw"**
- Concept: Overcard outs have terrible implied odds
- You: A♣K♦ on 8♥5♣2♦. Villain bets pot.
- 6 outs but HIGH visibility. F is huge. Fold.
- Teaches: Not all outs are equal. Visible improvement cards reduce implied odds.

#### Intermediate Tier (⭐⭐)

**6. "Stack Depth Kills Implied Odds"**
- Concept: When F exceeds your remaining stack, implied odds are physically impossible
- You: J♦J♣ in BB. Player A raises to 80K, Player B 3-bets to 200K.
- 3 players: JJ (you) vs a wide range vs a premium range
- ~17% equity, need ~40%. F far exceeds remaining stack. Fold.
- Teaches: When F > remaining stack, implied odds cannot work regardless of draw quality.

**7. "Set Mining Math"**
- Concept: The 15× rule for calling with pocket pairs
- You: 5♠5♥ facing a $1,500 raise. Stacks are $25K effective.
- 12% to flop a set, but sets have the BEST implied odds. $25K > 15×$1.5K. Call.
- Teaches: Set-mining profitability depends on stack depth, not just equity.

**8. "The Monster Draw"**
- Concept: When your draw has MORE equity than the made hand
- You: T♠9♠ on J♠8♠2♣. You have flush draw + open-ended straight.
- ~15 outs = 54% with 2 cards to come. You're actually the FAVORITE.
- Teaches: Big draws can be semi-bluffed. Corrected formula (3×15+8=53%) vs Rule of 4 (60% — wrong!).

**9. "Gutshot With Short Stack"**
- Concept: When implied odds are impossible despite a disguised draw
- You: 9♠8♦ on J♥5♣3♠6♦. Need a 7 for a straight. Villain bets pot.
- 4 outs = 8.7% equity, need 33%. F = $51K but only $12K behind. Fold.
- Teaches: Even disguised draws (gutshots) can't overcome a short stack.

**10. "The Overpair vs Flush Board"**
- Concept: Discipline to fold strong-looking hands
- You: K♠K♣ on T♥6♥3♦2♥. Villain leads big on the 3-heart turn.
- You have an overpair but the flush completed. No heart blocker. Reverse implied odds. Fold.
- Teaches: Hand strength is relative to the board. Strong hands can be beaten.

#### Advanced Tier (⭐⭐⭐)

**11. "Blockers in a 3-Bet Pot"**
- Concept: How your cards reduce opponent's range
- You: A♠K♣ facing a 3-bet. What range does the 3-bettor have?
- Your AK removes 3 combos of AA, 3 of KK, 9 of AK from their range. QQ becomes the most likely hand.
- Teaches: Combo counting and blocker effects on range analysis.

**12. "The Semi-Bluff Raise"**
- Concept: Fold equity + draw equity > just calling
- You: 8♠7♠ on 9♠6♠2♣. Villain bets. You can call OR raise.
- Calling is +EV, but raising is even better: ~40% chance villain folds + 53% equity when called.
- Teaches: Semi-bluffing as a strategy when you have both fold equity and draw equity.

**13. "Multiway Pot — AK Dilution"**
- Concept: Unpaired hands lose equity dramatically in multiway pots
- You: A♣K♦ in a 4-way limped pot on 8♥5♣2♦.
- AK's equity drops from ~65% heads-up to ~30% 4-way. 6 outs with terrible visibility.
- Teaches: AK plays best heads-up. In multiway pots, fold equity disappears and implied odds are poor.

**14. "Reverse Implied Odds"**
- Concept: When hitting your draw actually loses you MORE money
- You: K♦Q♦ on A♦7♠3♦9♦. You made a King-high flush, but there's an Ace of diamonds out there.
- You have a flush but NOT the nut flush. If villain has A♦x, you lose a huge pot.
- Teaches: Reverse implied odds — when your "good" outcome still leads to losing a big pot.

**15. "The Tournament Bubble"**
- Concept: ICM and how tournament equity differs from chip equity
- You: A♠J♣ near the money bubble. Medium stack facing a raise from the big stack.
- Chip equity says call, but ICM says fold because busting before the money is catastrophic.
- Teaches: In tournaments, chips lost > chips won. Survival has value beyond hand equity.

### Scaling to Millions: The Real-World Scenario Pipeline

The 15 hand-crafted scenarios are the seed. The Scenario Director scales the library to millions of real-world hands through the pipeline described in "The Scenario Director" section above. Priority data sources for the initial expansion:

1. **WSOP Main Event final tables** (2000-present) — ~25 years of documented final table hands
2. **WPT televised hands** — thousands of documented key decision points
3. **High Stakes Poker / Poker After Dark** — cash game hands with known hole cards
4. **EPT/APPT/LAPT tournament hands** — international tournament variety
5. **Online poker database archives** — millions of hands from PokerStars, Full Tilt, GGPoker with known showdowns
6. **User-submitted hands** — growing the library organically from the user community

---

## Design Specification

### Aesthetic Direction
**Refined casino luxury.** Dark backgrounds (not pure black — use deep navy/charcoal like #0a0e14, #0d1218). Gold accent (#c8a03c) for emphasis — pot amounts, your equity, key numbers. Warm off-whites (#f0ece4, #e8e4dc) for text. Red (#d94f63) for opponent actions and danger. Green (#5aad5a) for positive outcomes.

### Typography
Use a serif font for body text (Georgia, Charter, Palatino) — this gives it a sophisticated, bookish feel appropriate for learning. Use monospace (Courier New) for all numbers, formulas, and amounts. Use a clean sans-serif (system-ui) for small labels and UI chrome.

### The Table
- Oval/rounded green felt with subtle texture (CSS gradient + very faint repeating pattern at low opacity)
- Cards should look like real playing cards — white/cream background, rank and suit clearly visible, slight shadow
- Face-down cards should have a classic card back pattern
- Chip amounts displayed clearly next to each player
- Pot displayed centrally
- Community cards dealt in the center, spaced apart

### Cards
- Must feel physical — slight shadow, rounded corners, cream/white face
- Suits should be colored: spades (muted blue-gray), hearts (red), diamonds (blue), clubs (green)
- Face-down cards: dark blue back with subtle pattern
- Size hierarchy: hero cards largest, board cards medium-large, opponent cards medium

### The Action Feed
Actions should appear sequentially, each in its own styled block:
- Info messages: neutral/gray
- Opponent actions (bets/raises): styled with red accent, amount prominent in monospace
- Board dealings: gold accent
- The decision prompt: larger, bordered, impossible to miss

### The Decision Buttons
- Large, tactile-feeling buttons
- CALL: green border/tint
- FOLD: red border/tint
- RAISE (when applicable): gold border/tint
- These should feel like committing real chips — weighty, not trivial

### The Math Reveal
After the decision, this section animates in smoothly. Each math step should be in its own row/card with:
- Left: the concept label and formula
- Right: the computed value, prominently displayed
- Color coding: green for passing checks, red for failing, gold for key numbers
- Progressive reveal — each step appears with a slight delay so the user reads sequentially

### The AI Coach Panel
- **Desktop:** Slide-out panel on the right side, ~350px wide. Semi-transparent dark background. Doesn't obscure the table.
- **Mobile:** Bottom sheet that slides up, covering ~60% of the screen. Swipe down to dismiss.
- Chat-style interface with clear visual distinction between user messages and Coach responses.
- Coach messages use a slightly different background color (subtle gold/amber tint) to feel distinct from the main UI.
- A small avatar/icon identifies the Coach (e.g., a simple poker chip with a brain icon).
- Context indicator at the top shows what the Coach currently "sees" (e.g., "Viewing: Scenario 7 — Set Mining Math · Post-decision")

### Animation
- Cards dealing: smooth slide-in
- Chips moving to pot: subtle animation
- Decision reveal: smooth slide-up
- Math steps: staggered fade-in
- Coach panel: smooth slide-in from right (desktop) or bottom (mobile)
- Keep it subtle and purposeful — no flashy casino animations

### Responsive
Must work well on desktop (primary) and tablet. On mobile, stack the layout vertically.

---

## Technical Notes

### Stack
- React (single-page application)
- All game logic, hand evaluation, and Monte Carlo simulation run client-side in JavaScript
- AI Coach powered by Anthropic API (Claude) — requires API key configuration
- No backend needed for core gameplay — scenarios bundled in code, Coach calls API directly from client
- State management via React hooks (useState, useReducer)

### Performance
- Monte Carlo simulations should run in a Web Worker or use setTimeout chunking to avoid blocking the UI
- 10,000-15,000 simulations is sufficient for ±1% accuracy
- Pre-compute equity for scenarios where all hands are known (can use exact enumeration for 2-player)
- Coach API calls are async and non-blocking — show typing indicator while waiting

### File Structure
Organize as a well-structured React app:
```
src/
  engine/
    cards.js         — Card creation, deck, shuffle
    evaluator.js     — 5-card and 7-card hand evaluation
    equity.js        — Monte Carlo equity calculator
    outs.js          — Outs counter and draw classifier
    math.js          — Pot odds, implied odds, EV formulas
  scenarios/
    index.js         — Scenario data (all 15+ hands)
    types.js         — TypeScript-style shape definitions
    director.js      — Scenario Director: ingestion, tagging, scoring, serving
  coach/
    CoachProvider.jsx — React context for Coach state
    CoachPanel.jsx   — The slide-out/bottom-sheet chat UI
    coachApi.js      — Anthropic API integration
    systemPrompt.js  — The Coach's system prompt builder (injects hand state, math context)
    coachMemory.js   — Tracks user history for contextual callbacks
  components/
    Card.jsx         — Single card component
    Table.jsx        — Poker table with players, board, pot
    ActionFeed.jsx   — Sequential action display
    DecisionPrompt.jsx — The call/fold/raise buttons
    MathReveal.jsx   — Step-by-step math breakdown
    EquityBar.jsx    — Visual equity distribution bar
    ScenarioMenu.jsx — Landing page with scenario list
    FreePlay.jsx     — Free play mode
    CardPicker.jsx   — Card selection grid for free play
  App.jsx            — Router between menu, play, free play
  styles.css         — Global styles, CSS variables, animations
```

### Key Implementation Details

**The scenario action sequence should be data-driven.** Each scenario has an array of actions:
```js
actions: [
  { type: "info", text: "Blinds: $500/$1,000" },
  { type: "bet", player: 1, action: "raises to", amount: 3000 },
  { type: "bet", player: 2, action: "3-bets to", amount: 9000 },
  { type: "board", cards: ["Ts","6s","3d"] },
  { type: "bet", player: 1, action: "bets", amount: 6000 },
  { type: "decision", options: ["call","fold"], callAmount: 6000 }
]
```

The app walks through these actions one by one, rendering each. When it hits a "decision" type, it pauses and shows the decision buttons.

**The math breakdown should also be data-driven.** Each scenario specifies its own math steps so the explanations are hand-crafted and contextual, not generic:
```js
mathSteps: [
  { label: "Your outs", value: "9 flush outs", formula: null },
  { label: "Equity (1 card to come)", value: "19.6%", formula: "9 / 46" },
  { label: "Mental math shortcut", value: "18%", formula: "9 × 2 (Rule of 2)" },
  { label: "Pot odds threshold", value: "25.0%", formula: "$3,500 / ($8,500 + $3,500 + $3,500)" },
  { label: "Direct odds", value: "FAIL — 19.6% < 25.0%", status: "fail" },
  { label: "Implied odds (F)", value: "$2,350", formula: "$3,500 / 0.196 − $15,500" },
  { label: "Can you collect F?", value: "YES — only 15% of the pot", status: "pass" },
  { label: "Draw visibility", value: "Flush = HIGH visibility, but F is small enough", status: "warning" },
]
```

**Equity computation runs AFTER the user decides** (so there's no spoiler). The Monte Carlo result is used to show the equity bar and confirm the hand-crafted math steps.

**The AI Coach system prompt is dynamically constructed** for each interaction:
```js
buildCoachPrompt({ scenario, phase, userDecision, mathResults, userHistory }) {
  return `You are an expert poker coach. You are currently helping a student 
  who is playing through a training scenario.
  
  Current scenario: ${scenario.title}
  Phase: ${phase} // "pre-decision" | "post-decision" | "free-play" | "standalone"
  
  ${phase === "pre-decision" ? 
    "CRITICAL: Do NOT reveal the correct decision. Guide the student's thinking 
    without spoiling the answer. You may explain concepts, define terms, and ask 
    Socratic questions." : ""}
  
  ${phase === "post-decision" ? 
    `The student chose: ${userDecision}. The correct answer was: ${scenario.correctAction}.
    Math results: ${JSON.stringify(mathResults)}
    Help them understand WHY, pose what-if variations, and connect to broader strategy.` : ""}
  
  The mathematical framework you use: [pot odds, implied odds, equity formulas, etc.]
  Student history: ${JSON.stringify(userHistory)}
  `
}
```

**The "concept taught" should appear as a takeaway card at the bottom** — a brief, memorable principle the user can internalize:

> **Takeaway:** When the pot odds gap is small (just a few percentage points), implied odds almost always bridge it — especially with deep stacks. The key question isn't "am I getting the right price now?" but "can I win enough extra when I hit?"

---

## What NOT to Build

- Do NOT build a calculator-first interface with input fields, sliders, and panels. The learning is through PLAYING, not configuring.
- Do NOT show any math or equity numbers BEFORE the user makes their decision. This is the #1 design rule.
- Do NOT make the scenarios feel like multiple-choice quizzes. They should feel like you're at a poker table.
- Do NOT clutter the screen. At any moment, the user should know exactly what to look at and what to do. One thing at a time.
- Do NOT use generic UI component library aesthetics. This should feel like a premium poker product.
- Do NOT skip the sequential action feed. Each bet, raise, and board card should appear as a distinct event, building tension before the decision.
- Do NOT make the AI Coach a separate, disconnected chatbot. It must be contextually aware of the current hand and scenario state at all times.

---

## Claude Code Build Workflow

This section defines the optimal step-by-step workflow for building Poker Decisions using Claude Code in a GitHub repository.

### Prerequisites
- GitHub repository initialized (e.g., `poker-decisions`)
- Claude Code CLI installed and authenticated
- Node.js 18+ installed locally
- Anthropic API key for the AI Coach feature

### Phase 1: Foundation (Core Engine)
**Goal:** Build the mathematical backbone — no UI yet. Everything must be testable.

**Step 1.1 — Project Scaffolding**
```
Prompt: "Initialize a React project with Vite. Set up the folder structure as defined in the spec. 
Create placeholder files for all engine modules (cards.js, evaluator.js, equity.js, outs.js, math.js). 
Add Jest for testing. No UI yet — engine only."
```

**Step 1.2 — Card System**
```
Prompt: "Build src/engine/cards.js — Card creation (rank + suit), full 52-card deck generation, 
Fisher-Yates shuffle, card string parsing ('Ah' → {rank: 14, suit: 'h'}), and display formatting. 
Write comprehensive unit tests."
```

**Step 1.3 — Hand Evaluator**
```
Prompt: "Build src/engine/evaluator.js — 5-card hand evaluator that ranks hands from High Card (0) 
through Straight Flush (8). Then build a 7-card evaluator that checks all C(7,5)=21 combinations 
and returns the best. Write tests for every hand rank, edge cases (wheel straight, ace-high flush, 
split pot scenarios)."
```

**Step 1.4 — Equity Calculator**
```
Prompt: "Build src/engine/equity.js — Monte Carlo equity simulator. Takes N players with 
known/unknown hole cards and a partial/full board. Runs 10,000+ simulations. Returns equity 
percentages for each player. Must handle: 2-player exact, multi-player Monte Carlo, 
partial boards, fully dealt boards. Write tests comparing against known equity values 
(e.g., AA vs KK preflop ≈ 82/18)."
```

**Step 1.5 — Outs Counter**
```
Prompt: "Build src/engine/outs.js — Given hero's hole cards and 3-4 board cards, count outs 
by trying each remaining card in the deck. Group outs by draw type (flush, straight, pair, trips, 
full house). Write tests for flush draws (9 outs), open-ended straights (8 outs), 
gutshots (4 outs), combo draws."
```

**Step 1.6 — Math Formulas**
```
Prompt: "Build src/engine/math.js — Pot odds calculation, EV of calling, implied odds (F formula), 
SPR calculation, Rule of 2, Rule of 4, Corrected Rule (3x+8), exact equity formulas for 
1 and 2 cards to come. All functions take the actual hand numbers as input and return 
computed values. Write tests for every formula with known scenarios."
```

**Step 1.7 — Engine Integration Test**
```
Prompt: "Write an integration test that takes a complete scenario (Scenario 2: Nut Flush Draw), 
runs the equity calculator, outs counter, pot odds, and implied odds engine, and verifies 
the results match the hand-crafted math steps. This validates the entire engine pipeline."
```

### Phase 2: Scenario System
**Goal:** Build the data layer and all 15 scenarios.

**Step 2.1 — Scenario Schema**
```
Prompt: "Define the scenario data schema in src/scenarios/types.js. Then build all 15 scenarios 
in src/scenarios/index.js following the exact specifications from the build spec. Each scenario 
must include: players, cards, stacks, blinds, action sequence array, decision point, correct action, 
hand-crafted mathSteps array, insight text, and takeaway text. Use the exact cards and numbers 
from the spec."
```

**Step 2.2 — Scenario Validation**
```
Prompt: "Write a validation script that loads every scenario and verifies: all cards are valid 
and unique (no duplicates), action sequences end with a decision type, mathSteps have valid 
status values, equity values are roughly correct (run Monte Carlo to verify), pot odds math 
checks out. Report any errors."
```

### Phase 3: Core UI
**Goal:** Build the poker table and scenario playthrough experience.

**Step 3.1 — Design System & Styles**
```
Prompt: "Create styles.css with the full design system from the spec: CSS variables for all colors 
(navy/charcoal backgrounds, gold accent, warm off-whites, red, green), typography (serif for body, 
monospace for numbers, sans-serif for labels), card styles, table felt gradient, animation keyframes 
for card dealing, chip movement, fade-ins, and slide-ups. Dark theme throughout."
```

**Step 3.2 — Card Component**
```
Prompt: "Build src/components/Card.jsx — renders a single playing card. Face-up shows rank and 
colored suit symbol (red hearts, blue diamonds, green clubs, blue-gray spades) on cream background 
with shadow and rounded corners. Face-down shows dark blue back with subtle pattern. 
Support size variants: large (hero), medium (board), small (opponent)."
```

**Step 3.3 — Poker Table**
```
Prompt: "Build src/components/Table.jsx — the oval poker table with green felt background. 
Renders player positions around the table (support 2-6 players), each showing: name, stack amount, 
and their cards (face up or down). Community cards in the center. Pot amount displayed centrally 
in gold monospace. Hero position always at the bottom, prominent."
```

**Step 3.4 — Action Feed**
```
Prompt: "Build src/components/ActionFeed.jsx — sequential action display. Takes the scenario's 
action array and reveals one action at a time (auto-advance with 1.5s delay OR click to advance). 
Style each action type differently: info=gray, bets=red accent with monospace amounts, 
board dealings=gold accent. Animate each new action sliding in. When it reaches a 'decision' type, 
emit an event/callback to show the decision prompt."
```

**Step 3.5 — Decision Prompt**
```
Prompt: "Build src/components/DecisionPrompt.jsx — the critical decision UI. Shows pot amount, 
call amount, hero stack. Renders CALL (green), FOLD (red), and optionally RAISE (gold) buttons. 
Buttons should feel large, weighty, tactile. Slight hover animation. On click, emit the 
user's decision. This component should feel like committing real chips."
```

**Step 3.6 — Math Reveal**
```
Prompt: "Build src/components/MathReveal.jsx — the post-decision math breakdown. Takes the 
scenario's mathSteps array. First shows the verdict (green check or red X) with a big animation. 
Then shows the insight text. Then reveals each math step one at a time with staggered 500ms delays. 
Each step is a card/row with: left side = label + formula (serif font), right side = computed value 
(monospace, colored by status: green=pass, red=fail, gold=key number). Then shows the takeaway card."
```

**Step 3.7 — Scenario Play Page (Assembly)**
```
Prompt: "Build the main scenario play page that assembles Table, ActionFeed, DecisionPrompt, 
and MathReveal into the complete playthrough flow. State machine: SETUP → ACTIONS → DECISION → REVEAL. 
Run the equity engine in the background after the user decides. Wire everything together with 
proper state management via useReducer."
```

### Phase 4: Navigation & Polish
**Goal:** Home screen, routing, stats, and visual polish.

**Step 4.1 — Scenario Menu / Home Screen**
```
Prompt: "Build src/components/ScenarioMenu.jsx — the landing page. Shows all 15 scenarios in a 
beautiful grid/list. Each card shows: title, concept taught, difficulty stars, category tag. 
Group by difficulty tier. Show user stats at the top (completed, correct, accuracy %). 
Dark theme, gold accents. Navigation buttons for Free Play and Coach."
```

**Step 4.2 — App Router**
```
Prompt: "Build src/App.jsx with client-side routing (React Router or simple state-based routing). 
Routes: home (ScenarioMenu), play/:id (scenario playthrough), free-play (FreePlay mode), 
coach (standalone Coach chat). Smooth transitions between pages."
```

**Step 4.3 — User Stats Persistence**
```
Prompt: "Add localStorage persistence for user stats: which scenarios completed, 
what the user chose for each, accuracy percentage, concepts mastered. 
Show progress indicators on the home screen scenario cards."
```

**Step 4.4 — Visual Polish Pass**
```
Prompt: "Do a comprehensive visual polish pass. Ensure: card shadows are consistent, 
felt texture is subtle, all animations are smooth (60fps), gold accent is used consistently 
for key numbers, typography hierarchy is clear (serif body, monospace numbers, sans-serif labels), 
mobile responsive layout stacks vertically, the overall feel is 'refined casino luxury' not 
'generic UI toolkit'."
```

### Phase 5: AI Coach Integration
**Goal:** Wire up the Claude-powered AI Coach.

**Step 5.1 — Coach API Layer**
```
Prompt: "Build src/coach/coachApi.js — Anthropic API integration. Function to send messages 
with dynamically constructed system prompts. Handle streaming responses for real-time feel. 
Error handling for rate limits, network issues. API key configuration via environment variable."
```

**Step 5.2 — Coach System Prompt Builder**
```
Prompt: "Build src/coach/systemPrompt.js — dynamically constructs the Coach's system prompt 
based on current context. Includes: the full mathematical framework, current scenario state 
(if in a scenario), user's decision and math results (if post-decision), user history and stats. 
CRITICAL: In pre-decision phase, the prompt must strictly prohibit revealing the correct answer."
```

**Step 5.3 — Coach UI Panel**
```
Prompt: "Build src/coach/CoachPanel.jsx — slide-out panel (desktop right side, 350px) or 
bottom sheet (mobile, 60% height). Chat interface with user/coach message bubbles. 
Coach messages have subtle gold tint. Typing indicator while waiting for API response. 
Context indicator at top showing what the Coach currently 'sees'. 
Integrates with CoachProvider for state management."
```

**Step 5.4 — Coach Context Integration**
```
Prompt: "Build src/coach/CoachProvider.jsx — React context that manages Coach state and 
injects hand context. The Coach automatically knows: current scenario, current phase 
(pre/post decision), user's decision, math results, user's historical accuracy. 
Wire the 'Ask Coach' button into the Action Feed and Decision Prompt components. 
Wire full Coach access into the Math Reveal phase."
```

### Phase 6: Free Play Mode
**Goal:** Build the sandbox where users can set up and analyze any hand.

**Step 6.1 — Card Picker**
```
Prompt: "Build src/components/CardPicker.jsx — a 4×13 grid of all 52 cards. Click to select/deselect. 
Already-selected cards are grayed out (can't assign same card twice). 
Used in Free Play to assign hole cards and board cards."
```

**Step 6.2 — Free Play Mode**
```
Prompt: "Build src/components/FreePlay.jsx — the sandbox mode. User can: add 2-6 players, 
assign hole cards via CardPicker (or leave random), set board cards (0-5), set stack sizes 
and bet amounts. Live equity display updates via Monte Carlo as cards are assigned. 
Shows outs analysis, pot odds, implied odds, and SPR calculations with actual formulas 
and numbers. Coach is available for discussion."
```

### Phase 7: Scenario Director Foundation
**Goal:** Build the infrastructure for scaling to millions of real-world hands.

**Step 7.1 — Hand History Parser**
```
Prompt: "Build src/scenarios/director.js — starting with a parser for standard poker hand history 
formats (PokerStars format as the first target). Parse player names, positions, stacks, blinds, 
hole cards, board cards, all actions, pot sizes, and showdown results. Output the normalized 
scenario schema."
```

**Step 7.2 — Decision Point Extractor**
```
Prompt: "Add to director.js: a function that takes a parsed hand and identifies all non-trivial 
decision points. Filter out obvious folds. Score each decision point by complexity 
(stack depth, pot odds spread, draw count, multiway dynamics). Output candidate scenarios 
with their decision points."
```

**Step 7.3 — AI Concept Tagger**
```
Prompt: "Add to director.js: a function that sends candidate scenarios to Claude for concept tagging. 
Claude analyzes each decision point and returns: applicable concepts, difficulty rating, 
quality score, and a draft of the math breakdown and teaching content. 
This enables scaling the scenario library with AI-assisted curation."
```

### Phase 8: Testing & Deployment
**Goal:** Ensure everything works and deploy.

**Step 8.1 — End-to-End Testing**
```
Prompt: "Write end-to-end tests: load a scenario, verify actions appear sequentially, 
make a decision, verify math reveal shows correctly, verify equity numbers match engine output. 
Test all 15 scenarios. Test Free Play mode. Test Coach integration (mock API)."
```

**Step 8.2 — Performance Optimization**
```
Prompt: "Move Monte Carlo equity calculation to a Web Worker. Optimize hand evaluator with 
lookup tables if needed. Ensure animations run at 60fps. Lazy-load scenarios. 
Profile and fix any jank."
```

**Step 8.3 — Deployment**
```
Prompt: "Set up deployment: Vite build configuration, environment variable handling for 
Anthropic API key, GitHub Actions for CI/CD, deploy to Vercel/Netlify/GitHub Pages."
```

### Claude Code Best Practices for This Project

1. **One module at a time.** Don't ask Claude Code to build the entire app at once. Each step above is scoped to produce a testable, reviewable unit of work.

2. **Test before moving on.** After each engine module, run the tests. After each UI component, visually verify. Don't stack untested layers.

3. **Commit after each step.** Each step above should be a clean git commit. This makes it easy to revert if something breaks and maintains a clear history.

4. **Use the spec as the prompt anchor.** When prompting Claude Code, reference this spec directly: "Following the build spec, build the hand evaluator as described in the Mathematical Engine section."

5. **Review diff, don't just accept.** Claude Code will generate code — always review the diff before committing. Check that the math formulas match the spec exactly.

6. **Iterate on visuals separately.** Get the logic right first (Phases 1-3), then do a dedicated visual polish pass (Phase 4). Trying to get pixel-perfect visuals while building logic leads to confusion.

7. **The Coach is a layer, not the core.** Build the full scenario experience WITHOUT the Coach first (Phases 1-4). Then add the Coach as an enhancement layer (Phase 5). This ensures the app is valuable even without API access.

8. **Branch for the Scenario Director.** Phases 1-6 are the MVP. Phase 7 (Scenario Director) should be on a feature branch — it's the scale play, not the launch requirement.

---

## Summary

Build an application where the user PLAYS poker hands, makes decisions under uncertainty, and then learns the math that proves whether they were right. An AI Coach guides them through every step, deepening understanding without spoiling decisions. The poker table is the classroom. Every hand is a lesson. The math reveals after the decision are the teacher. The scenario library starts curated and scales to millions of real-world tournament hands. Make it beautiful, make it real, and make every decision feel like it matters.
