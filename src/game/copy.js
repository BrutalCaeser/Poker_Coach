/**
 * copy — every word the game says, generated from the spot itself.
 * ================================================================
 * Rules (they are the pedagogy):
 *  - Task-first, never ego-first. Say what the cards do, not "wrong!".
 *    (Kluger & DeNisi: over a third of feedback interventions HURT performance,
 *    and the driver is feedback aimed at the person instead of the task.)
 *  - Feedback names the actual cards ("a jack gives you jacks, which lose to
 *    his kings"), so it teaches the rule through this hand.
 *  - Hints teach the METHOD and never contain this spot's answer. That is why a
 *    correct answer given with a hint open still counts toward mastery.
 */
import { money } from '../lesson/lessonMath.js';

/* ── steps ─────────────────────────────────────────────────── */

export const CHAPTER = {
  n: 1,
  title: 'Can I afford to chase?',
};

/* Titles carry the meaning; `learn` is a 2-4 word cue shown only on the step
   you're about to play. Less text, on purpose. */
export const STEPS = {
  outs: { n: 1, title: 'Count your outs', learn: 'Cards that win', cleared: 'You can count outs.' },
  chance: { n: 2, title: 'Outs into a chance', learn: 'Cards → times in 100', cleared: 'You can turn outs into a chance.' },
  price: { n: 3, title: 'Your price', learn: 'Your slice of the pot', cleared: 'You can find the price.', seats: true },
  decide: { n: 4, title: 'Call or fold', learn: 'Chance vs price', cleared: 'You can make the call.', seats: true },
  chain: { n: 5, title: 'The full line', learn: 'All four, no help', cleared: 'You can play the whole line.' },
  boss: { title: 'Moneymaker vs Farha', year: '2003' },
};

/* ── ranks and suits in words ──────────────────────────────── */

const RANK_WORDS = {
  2: ['two', 'twos'], 3: ['three', 'threes'], 4: ['four', 'fours'], 5: ['five', 'fives'],
  6: ['six', 'sixes'], 7: ['seven', 'sevens'], 8: ['eight', 'eights'], 9: ['nine', 'nines'],
  10: ['ten', 'tens'], 11: ['jack', 'jacks'], 12: ['queen', 'queens'], 13: ['king', 'kings'],
  14: ['ace', 'aces'],
};
const SUIT_WORDS = { s: ['spade', 'spades'], h: ['heart', 'hearts'], d: ['diamond', 'diamonds'], c: ['club', 'clubs'] };
const RANK_FROM = { A: 14, K: 13, Q: 12, J: 11, T: 10 };

export const rankOf = (id) => RANK_FROM[id[0]] ?? Number(id[0]);
export const rankName = (r) => RANK_WORDS[r][0];
export const rankPlural = (r) => RANK_WORDS[r][1];
export const withArticle = (r) => `${/^[aeiou]/.test(RANK_WORDS[r][0]) ? 'an' : 'a'} ${RANK_WORDS[r][0]}`;
const cap = (s) => s[0].toUpperCase() + s.slice(1);

function orList(words) {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} or ${words.at(-1)}`;
}
function andList(words) {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;
}
const uniqueRanks = (ids) => [...new Set(ids.map(rankOf))].sort((a, b) => b - a);

export function readWords(pairRank) {
  return `a pair of ${rankPlural(pairRank)}, the top card on the board`;
}

/* ── step 1: outs ──────────────────────────────────────────── */

export function outsFeedback(grade, pairRank) {
  const his = rankPlural(pairRank);
  const lines = [];
  const m = grade.missedByKind;
  const w = grade.wrongByKind;

  if (m.flush) {
    const suit = SUIT_WORDS[m.flush[0][1]];
    lines.push({
      tone: 'missed',
      text: `${m.flush.length === 1 ? `A ${suit[0]}` : `${m.flush.length} ${suit[1]}`} missed: any ${suit[0]} gives you a flush.`,
    });
  }
  if (m.straight) {
    lines.push({ tone: 'missed', text: `Any ${orList(uniqueRanks(m.straight).map(rankName))} completes a straight.` });
  }
  if (m['better-pair']) {
    const rs = uniqueRanks(m['better-pair']);
    lines.push({
      tone: 'missed',
      text:
        rs.length === 1
          ? `${cap(rankPlural(rs[0]))} count: ${withArticle(rs[0])} gives you a pair of ${rankPlural(rs[0])}, which beats his ${his}.`
          : `${cap(andList(rs.map(rankPlural)))} count: any of them gives you a pair bigger than his ${his}.`,
    });
  }
  if (w['small-pair']) {
    for (const r of uniqueRanks(w['small-pair'])) {
      lines.push({ tone: 'wrong', text: `${cap(withArticle(r))} gives you ${rankPlural(r)}, which lose to his ${his}.` });
    }
  }
  if (w['board-pair']) {
    const rs = uniqueRanks(w['board-pair']);
    lines.push({
      tone: 'wrong',
      text:
        rs.length === 1
          ? `${cap(withArticle(rs[0]))} pairs the board. That helps him as much as you.`
          : 'Cards that pair the board help him as much as you.',
    });
  }
  if (w.nothing) {
    lines.push({ tone: 'wrong', text: `${w.nothing.length === 1 ? 'One card' : `${w.nothing.length} cards`} you picked don’t improve your hand.` });
  }
  return lines;
}

export function outsHint(pairRank) {
  return `Look for three kinds of card: one of your suit that makes a flush, one that completes a straight, and one that pairs a card of yours higher than his ${rankPlural(pairRank)}.`;
}

/* ── step 2: chance ────────────────────────────────────────── */

export function chanceFeedback({ correct, guess, exact, outs, unseen }) {
  if (correct) return `Yes. ${outs} of ${unseen} cards is about ${exact} in 100.`;
  return `It’s about ${exact} in 100: ${outs} of the ${unseen} cards win. You said ${guess}. With one card to come, each out is worth about 2.`;
}

export function chanceHint(unseen) {
  return `One card to come, so each out is worth about 2 in 100 (exactly: outs ÷ ${unseen}). Outs × 2, then add a little.`;
}

/* ── step 3: price ─────────────────────────────────────────── */

/**
 * Diagnose the two classic slips, because naming the mistake teaches more
 * than restating the answer:
 *   - measuring the bet against the pot (forgets both bets join the pot)
 *   - measuring against pot + bet (forgets your own call joins it too)
 */
export function priceFeedback({ correct, guess, exact, v }) {
  const { potBeforeBet: pot, bet, finalPot, seat } = v;
  const who = seat === 'bettor' ? 'He pays' : 'You pay';
  if (correct) {
    return `Yes. ${who} ${money(bet)} of a ${money(finalPot)} pot: ${exact} in 100.${seat === 'bettor' ? ' Your bet sets his price.' : ''}`;
  }
  const lines = [`It’s ${exact} in 100. The pot ends at ${money(finalPot)}: ${money(pot)} already in, ${money(bet)} bet, ${money(bet)} to call. ${who} ${money(bet)} of it.`];
  const vsPot = Math.round((bet / pot) * 100);
  const vsPotPlusBet = Math.round((bet / (pot + bet)) * 100);
  if (Math.abs(guess - vsPot) <= 2 && vsPot !== exact) {
    lines.push('Common slip: that measures the bet against the pot. Measure the call against the final pot.');
  } else if (Math.abs(guess - vsPotPlusBet) <= 2 && vsPotPlusBet !== exact) {
    lines.push('Close: you counted his bet but not the call itself. The call joins the pot too.');
  }
  return lines.join(' ');
}

export function priceHint(seat) {
  const whose = seat === 'bettor' ? 'his call' : 'your call';
  return `Add up the final pot: what’s in, plus the bet, plus the call. Then ask what share of that total ${whose} is. A half-pot bet is 25 in 100; a pot-sized bet is 33.`;
}

/* ── step 4: decide ────────────────────────────────────────── */

export function decideFeedback({ correct, v }) {
  const c = Math.round(v.chance * 100);
  const p = Math.round(v.price * 100);
  const calling = v.answer === 'call';
  if (v.seat === 'bettor') {
    const verdict = calling ? 'calling is right for him: your bet is too small to stop him' : 'calling is wrong for him: your bet makes his draw too expensive';
    return `${correct ? 'Yes. ' : ''}He wins ${c} in 100 and pays ${p}, so ${verdict}.`;
  }
  const verdict = calling ? `${c} beats ${p}: calling pays` : `${c} is less than ${p}: folding saves money`;
  return `${correct ? 'Yes. ' : ''}${cap(verdict)}.${correct ? '' : ' Call only when your chance is bigger than your price.'}`;
}

export function decideHint(seat) {
  return seat === 'bettor'
    ? 'Put yourself in his seat: calling is right for him when his chance is bigger than the price your bet gives him.'
    : 'Call when your chance is bigger than your price. Fold when it’s smaller.';
}

/* ── visual cues: the short form shown first ───────────────── */
/*
 * Feedback leads with a CUE, not a sentence: a card chip and 2-4 words
 * ("♠ → makes your flush"). The full sentences above stay available behind
 * "Why?" for anyone who wants them. Visual first, words on demand.
 */
const SHORT = { 14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: '10', 9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2' };
export const SUIT_GLYPH = { s: '♠', h: '♥', d: '♦', c: '♣' };
const rankCue = (ids) => uniqueRanks(ids).map((r) => SHORT[r]).join(' · ');

/**
 * At most TWO rows: the most important miss and the most important wrong
 * pick. The deck grid already marks every card (dashed = missed, red = wrong),
 * so the sheet only names the rule behind them; the rest is under "Why?".
 * Order is importance: the flush is the biggest miss, and the two pair traps
 * (a pair below his, a pair on the board) teach more than "no help".
 */
export function outsCues(grade, pairRank) {
  const his = rankPlural(pairRank);
  const m = grade.missedByKind;
  const w = grade.wrongByKind;
  const missed = [
    m.flush && { tone: 'missed', cue: SUIT_GLYPH[m.flush[0][1]], text: 'makes your flush' },
    m.straight && { tone: 'missed', cue: rankCue(m.straight), text: 'makes your straight' },
    m['better-pair'] && { tone: 'missed', cue: rankCue(m['better-pair']), text: `pairs you above his ${his}` },
  ].find(Boolean);
  const wrong = [
    w['small-pair'] && { tone: 'wrong', cue: rankCue(w['small-pair']), text: `pairs you below his ${his}` },
    w['board-pair'] && { tone: 'wrong', cue: rankCue(w['board-pair']), text: 'pairs the board: helps both' },
    w.nothing && { tone: 'wrong', cue: rankCue(w.nothing), text: 'no help' },
  ].find(Boolean);
  return [missed, wrong].filter(Boolean);
}

export function chanceCue(outs) {
  return `${outs} outs × 2 ≈ ${outs * 2}`;
}

export function priceCue(v) {
  return `${money(v.bet)} ÷ ${money(v.finalPot)}`;
}

/** The two classic price slips, named in a few words. */
export function priceSlip(guess, v) {
  const exact = Math.round(v.price * 100);
  const vsPot = Math.round((v.bet / v.potBeforeBet) * 100);
  const vsPotPlusBet = Math.round((v.bet / (v.potBeforeBet + v.bet)) * 100);
  if (Math.abs(guess - vsPot) <= 2 && vsPot !== exact) return 'Both bets join the pot';
  if (Math.abs(guess - vsPotPlusBet) <= 2 && vsPotPlusBet !== exact) return 'Count the call too';
  return null;
}

export function decideCue(v) {
  const c = Math.round(v.chance * 100);
  const p = Math.round(v.price * 100);
  return `${c} ${c > p ? '>' : '<'} ${p} → ${v.answer}`;
}
