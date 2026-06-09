/**
 * math-audit.mjs — Ground-truth diagnostic (Milestone 1, Stage 1)
 *
 * For every scenario, compute the ENGINE's values and print them next to the
 * hand-authored mathSteps so we can see, with hard numbers, where the live
 * engine and the static teaching data agree or disagree.
 *
 * IMPORTANT — the authored numbers mix three DIFFERENT quantities:
 *   - "Pot odds threshold"      → potOdds(call, pot)              [always checkable]
 *   - "Exact equity (1 card)"   → outs / 46  (pay to see ONE card) [draw spots]
 *   - "Your equity" (all-in)    → full-runout equity vs villain    [all-in spots]
 * calculateEquity() computes FULL-RUNOUT showdown equity, which only matches the
 * authored number for all-in spots. We print every quantity and label it.
 *
 * Run: PATH=".../node@24/bin:$PATH" node scripts/math-audit.mjs
 */
import { scenarios } from '../src/scenarios/index.js';
import { parseCards, parseCard } from '../src/engine/cards.js';
import { countOuts } from '../src/engine/outs.js';
import { calculateEquity } from '../src/engine/equity.js';
import { potOdds, exactEquity1Card, exactEquity2Cards } from '../src/engine/math.js';

const EQUITY_ITERS = 60000;

function boardAtDecision(scn) {
  const cards = [...(scn.board || [])];
  for (const a of scn.actions) {
    if (a.type === 'decision') break;
    if (a.type === 'board') cards.push(...a.cards);
  }
  return cards;
}

// pull the first "NN%" or "NN.N%" out of a string
function pctIn(str) {
  const m = String(str).match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? parseFloat(m[1]) : null;
}
function findStep(scn, re) {
  return scn.mathSteps.find((s) => re.test(s.label));
}

let potOddsChecks = 0, potOddsOk = 0;
const outsNotes = [];

for (const scn of scenarios) {
  const hero = scn.players[scn.heroIndex];
  const boardStr = boardAtDecision(scn);
  const board = boardStr.map(parseCard);
  const d = scn.decision;
  const villainsKnown = scn.players.every((p, i) => i === scn.heroIndex || (p.cards && p.cards.length === 2));

  console.log('\n========================================================');
  console.log(`#${scenarios.indexOf(scn) + 1} ${scn.id}  (diff ${scn.difficulty}, ${scn.players.length}p)  correct=${d.correctAction}`);
  console.log(`hero ${hero.cards.join('')} | board [${boardStr.join(' ') || '—'}] | pot ${d.pot} call ${d.callAmount} | villains ${villainsKnown ? 'KNOWN' : 'some UNKNOWN'}`);

  // ---- 1. Pot odds (always checkable, the clean assertion) ----
  const po = potOdds(d.callAmount, d.pot) * 100;
  const poStep = findStep(scn, /pot odds/i);
  const poAuthored = poStep ? pctIn(poStep.value) || pctIn(poStep.formula || '') : null;
  let poTag = '';
  if (poAuthored != null) {
    potOddsChecks++;
    const ok = Math.abs(po - poAuthored) <= 0.6;
    if (ok) potOddsOk++;
    poTag = ok ? 'OK' : `*** MISMATCH (authored ${poAuthored}%) ***`;
  }
  console.log(`  potOdds(engine)      = ${po.toFixed(1)}%   ${poTag}`);

  // ---- 2. Outs (flop/turn only) — engine vs authored, expose overcount ----
  if (board.length === 3 || board.length === 4) {
    try {
      const o = countOuts(parseCards(hero.cards), board);
      const eq1 = exactEquity1Card(o.totalOuts) * 100;
      const eq2 = exactEquity2Cards(o.totalOuts) * 100;
      console.log(`  countOuts(engine)    = ${o.totalOuts} total  byType ${JSON.stringify(o.byType)}`);
      console.log(`     → 1-card eq = ${eq1.toFixed(1)}%   2-card eq = ${eq2.toFixed(1)}%  (from engine outs)`);
      const outsStep = findStep(scn, /out/i);
      if (outsStep) console.log(`     authored outs step: "${outsStep.value}"`);
      outsNotes.push(`#${scenarios.indexOf(scn) + 1} ${scn.id}: engine ${o.totalOuts} outs ${JSON.stringify(o.byType)}`);
    } catch (e) {
      console.log(`  countOuts: SKIP (${e.message})`);
    }
  } else {
    console.log(`  countOuts: n/a (board ${board.length} cards)`);
  }

  // ---- 3. Full-runout equity vs the actual villain hand(s) ----
  if (villainsKnown) {
    const players = scn.players.map((p, i) =>
      i === scn.heroIndex ? { cards: parseCards(hero.cards) }
        : { cards: parseCards(p.cards) });
    const eq = calculateEquity(players, board, EQUITY_ITERS);
    const he = eq[scn.heroIndex].equity * 100;
    console.log(`  full-runout equity   = ${he.toFixed(1)}%  (hero vs actual villain cards, ${EQUITY_ITERS} sims)`);
    const eqStep = findStep(scn, /your equity|matchup|equity/i);
    if (eqStep) console.log(`     authored equity step: "${eqStep.value}" ${eqStep.formula ? '| ' + eqStep.formula : ''}`);
  } else {
    console.log(`  full-runout equity   = n/a (villain hand(s) not all specified)`);
  }
}

console.log('\n========================================================');
console.log(`POT-ODDS CHECK: ${potOddsOk}/${potOddsChecks} authored thresholds match engine within 0.6pp`);
console.log('OUTS SUMMARY (engine):');
outsNotes.forEach((n) => console.log('  ' + n));
