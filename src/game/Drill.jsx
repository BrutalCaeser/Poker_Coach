/**
 * Drill — one generated hand for one step, played on the fixed table.
 * ===================================================================
 * Every screen has the same three parts in the same places:
 *
 *   the question     one line
 *   the table        <Stage>: his seat, the board + river slot, the pot, you
 *   the tray         the step's input: the deck, a slider, or the decision
 *
 * A step only changes which place on the table is lit and what it shows:
 *   count outs  → the river      chance → the river
 *   your price  → the pot        decide → your seat (his, from the bettor seat)
 *
 * Feedback slides up as a sheet where the action button was: a verdict word,
 * the true value, a cue or two, and "Why?" for the full explanation.
 *
 * A Drill instance is ONE hand; the parent remounts it (new key, new seed) for
 * the next. That is also what makes the hint fade: it opens on mount only after
 * two misses in a row, and a correct answer resets the count.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { generate } from './variation.js';
import {
  STEPS, rankPlural, outsFeedback, outsHint, outsCues, chanceFeedback, chanceHint, chanceCue,
  priceFeedback, priceHint, priceCue, priceSlip, decideFeedback, decideHint, decideCue,
} from './copy.js';
import { gradeSelection, money, pct } from '../lesson/lessonMath.js';
import { DeckGrid } from '../lesson/parts.jsx';
import EstimateSlider from './EstimateSlider.jsx';
import Stage from './Stage.jsx';
import { MASTERY } from './progress.js';
import { TOL, gradeEstimate } from './grading.js';

export default function Drill(props) {
  return props.stepId === 'chain' ? <LineDrill {...props} /> : <StepDrill {...props} />;
}

/* ── the table, per step ───────────────────────────────────── */

/**
 * Build the Stage for one step. Everything the table shows is derived here,
 * so a step can never move or resize anything, only light it and label it.
 *
 * @param known  values already established on this hand (the full line fills
 *               the table in as you go: chance lands on the river, price on
 *               the pot, then you decide with both in view)
 */
function tableFor(v, { step, seat = 'caller', asking, result, guess, known = {} }) {
  const caller = seat !== 'bettor';
  const potNow = v.potBeforeBet + v.bet;
  const c = pct(v.chance);
  const p = pct(v.price);

  const him = caller
    ? { read: `pair of ${rankPlural(v.pairRank)}`, chip: `bets ${money(v.bet)}` }
    : { read: `a draw · ${v.outs} outs` };
  const you = caller ? { cards: v.drawer } : { cards: v.made, chip: `bet ${money(v.bet)}` };

  const chanceOnRiver = { value: c, sub: 'in 100', tone: 'win', aria: `${c} in 100` };
  const priceOnPot = { base: potNow, mine: v.bet, center: `${p}`, sub: 'in 100', tone: caller ? 'you' : 'his' };
  const plainPot = { base: 1, mine: 0, center: money(potNow), sub: 'pot' };

  let river = known.chance ? chanceOnRiver : null;
  let pot = known.price ? priceOnPot : plainPot;
  let lit = 'river';
  let dim = [];

  // lit = where this step's answer lands; dim = what this step doesn't need.
  if (step === 'outs') {
    dim = ['pot']; // you need his read AND your hand to count outs
    river = asking ? null : { value: v.outs, sub: 'win', tone: 'win', aria: `${v.outs} of ${v.unseen} cards win` };
  } else if (step === 'chance') {
    dim = ['him', 'pot'];
    river = asking
      ? { value: `${v.outs}/${v.unseen}`, sub: 'win', aria: `${v.outs} of ${v.unseen} cards win` }
      : { value: result.exact, sub: 'in 100', tone: 'win', aria: `${result.exact} in 100` };
  } else if (step === 'price') {
    lit = 'pot';
    dim = ['river'];
    pot = asking
      ? { base: 100 - (guess ?? 0), mine: guess ?? 0, live: true, tone: 'guess', center: guess == null ? '?' : `${guess}`, sub: caller ? 'your slice' : 'his slice' }
      : { ...priceOnPot, center: `${result.exact}` };
  } else if (step === 'decide') {
    lit = caller ? 'you' : 'him';
    dim = caller ? ['him'] : ['you']; // decide with chance (river) and price (pot) in view
    // the two numbers being compared, named where they sit
    river = { ...chanceOnRiver, sub: 'chance' };
    pot = { ...priceOnPot, sub: 'price' };
  }

  return { him, you, board: v.board, readRank: caller ? v.pairRank : null, river, pot, lit, dim };
}

/* ── shared pieces ─────────────────────────────────────────── */

export function Pips({ streak }) {
  const n = Math.min(streak, MASTERY);
  return (
    <span className="gx-pips" role="img" aria-label={`${n} of ${MASTERY} in a row`}>
      {Array.from({ length: MASTERY }, (_, i) => <i key={i} className={i < n ? 'is-on' : ''} />)}
    </span>
  );
}

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * The pot as an equation of chips: the method, made visible. In the full line
 * the "+ your call" term is left out so the learner has to remember it.
 */
function PotEquation({ pot, bet, seat = 'caller', withCall = true }) {
  const betLabel = seat === 'bettor' ? 'your bet' : 'his bet';
  const callLabel = seat === 'bettor' ? 'his call' : 'your call';
  return (
    <div className="gx-eq" role="img" aria-label={`Pot ${money(pot)}, ${betLabel} ${money(bet)}${withCall ? `, ${callLabel} ${money(bet)}` : ''}`}>
      <span className="gx-eq__term"><b>{money(pot)}</b><small>pot</small></span>
      <span className="gx-eq__op" aria-hidden="true">+</span>
      <span className="gx-eq__term"><b>{money(bet)}</b><small>{betLabel}</small></span>
      {withCall && (
        <>
          <span className="gx-eq__op" aria-hidden="true">+</span>
          <span className={`gx-eq__term is-measured${seat === 'bettor' ? ' is-his' : ''}`}><b>{money(bet)}</b><small>{callLabel}</small></span>
        </>
      )}
    </div>
  );
}

function Hint({ open, onToggle, text }) {
  return (
    <div className={`gx-hint${open ? ' is-open' : ''}`}>
      <button type="button" className="gx-hint__toggle" onClick={onToggle} aria-expanded={open}>
        {open ? 'Hide hint' : 'Hint'}
      </button>
      {open && <p className="gx-hint__text">{text}</p>}
    </div>
  );
}

/**
 * Keep the result in view. When the sheet slides up, scroll just enough for
 * the tray (the marked grid, the slider) to clear it, but never so far that
 * the table leaves the screen: the most it gives up is the question line.
 * A no-op when everything already fits.
 */
function useRevealAbove(ref) {
  useEffect(() => {
    const foot = ref.current?.parentElement; // the sheet itself animates in; its footer doesn't
    const root = foot?.closest('.lx');
    if (!root || typeof window.scrollBy !== 'function') return;
    const tray = root.querySelector('.gx-tray')?.getBoundingClientRect();
    const stage = root.querySelector('.gx-stage')?.getBoundingClientRect();
    const bar = root.querySelector('.lx-top')?.getBoundingClientRect();
    if (!tray || !stage) return;
    const need = tray.bottom + 8 - foot.getBoundingClientRect().top;
    const room = stage.top - (bar?.bottom ?? 0) - 8;
    const by = Math.min(need, room);
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (by > 0) window.scrollBy({ top: by, behavior: still ? 'auto' : 'smooth' });
  }, [ref]);
}

function Sheet({ correct, verdict, value, cues = [], why, actionLabel, onAction, cleared }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useRevealAbove(ref);
  return (
    <div ref={ref} className={`gx-sheet ${correct ? 'is-right' : 'is-off'}`} role="status" aria-live="polite">
      <div className="gx-sheet__head">
        <span className="gx-sheet__icon">{correct ? <Check /> : <Arrow />}</span>
        <span className="gx-sheet__verdict">{verdict ?? (correct ? 'Right' : 'Not quite')}</span>
        {why && (
          <button type="button" className="gx-sheet__why" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? 'Less' : 'Why?'}
          </button>
        )}
      </div>
      {value && <p className="gx-sheet__value">{value}</p>}
      {cues.length > 0 && (
        <ul className="gx-cues">
          {cues.map((c) => (
            <li key={c.cue + c.text} className={`is-${c.tone}`}>
              <span className="gx-cue">{c.cue}</span>
              {c.text && <span className="gx-cues__text">{c.text}</span>}
            </li>
          ))}
        </ul>
      )}
      {open && <p className="gx-sheet__more">{why}</p>}
      <button type="button" className={`lx-btn lx-btn--primary lx-btn--wide${cleared ? ' gx-btn--cleared' : ''}`} onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}

function DrillTop({ stepId, mode, streak, onExit, sub }) {
  return (
    <header className="lx-top gx-top">
      <button type="button" className="gx-back" onClick={onExit} aria-label="Back to the path">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="gx-top__step">
        {STEPS[stepId].title}
        {sub && <span className="gx-top__sub"> · {sub}</span>}
      </span>
      {mode === 'review' ? <span className="gx-tag">Review</span> : <Pips streak={streak} />}
    </header>
  );
}

function useSelection() {
  const [selected, setSelected] = useState(() => new Set());
  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleMany = (ids) =>
    setSelected((prev) => {
      const next = new Set(prev);
      const all = ids.every((id) => next.has(id));
      ids.forEach((id) => (all ? next.delete(id) : next.add(id)));
      return next;
    });
  return { selected, toggle, toggleMany };
}

function DecideButtons({ seat, onChoose }) {
  const label = (a) => (seat === 'bettor' ? `He should ${a}` : a === 'call' ? 'Call' : 'Fold');
  return (
    <div className="gx-choices" role="group" aria-label="Your decision">
      {['fold', 'call'].map((a) => (
        <button key={a} type="button" className="lx-act" onClick={() => onChoose(a)}>
          <span className="lx-act__label">{label(a)}</span>
        </button>
      ))}
    </div>
  );
}

const GridTip = () => <p className="gx-tip">Tap ♠ or a rank to pick a whole row or column</p>;

const QUESTION = {
  outs: () => 'Which cards beat him?',
  chance: () => 'How often do you win?',
  price: (seat) => (seat === 'bettor' ? 'What’s his price?' : 'What’s your price?'),
  decide: (seat) => (seat === 'bettor' ? 'Should he call?' : 'Call or fold?'),
};

function nextLabel(cleared, mode) {
  if (cleared) return 'Step cleared';
  return mode === 'review' ? 'Back to the path' : 'Next hand';
}

/* ── single-step drills ────────────────────────────────────── */

function StepDrill({ stepId, mode, seed, seat, step, cleared, onChecked, onNext, onExit }) {
  const v = useMemo(() => generate(stepId, seed, seat), [stepId, seed, seat]);
  const [result, setResult] = useState(null);
  const { selected, toggle, toggleMany } = useSelection();
  const [guess, setGuess] = useState(null);
  const [hintOpen, setHintOpen] = useState(() => step.misses >= 2);
  const asking = result == null;

  const finish = (r) => {
    // A hinted correct answer is shown honestly: right, but not counted.
    const hinted = hintOpen && r.correct && mode !== 'review';
    const cues = hinted ? [...(r.cues ?? []), { tone: 'neutral', cue: 'Hint', text: 'not counted' }] : r.cues;
    setResult({ ...r, cues });
    onChecked(r.correct, { hinted });
  };

  const check = () => {
    if (stepId === 'outs') {
      const g = gradeSelection(v.grid, selected);
      finish({
        correct: g.perfect,
        value: g.perfect ? `All ${v.outs} found` : `${g.found} of ${v.outs} found`,
        cues: outsCues(g, v.pairRank),
        why: outsFeedback(g, v.pairRank).map((l) => l.text).join(' '),
      });
    } else if (stepId === 'chance') {
      const e = gradeEstimate(guess, v.chance, TOL.chance);
      finish({
        ...e,
        value: `≈ ${e.exact} in 100${e.correct ? '' : ` · you said ${guess}`}`,
        cues: [{ tone: 'neutral', cue: chanceCue(v.outs), text: '' }],
        why: chanceFeedback({ ...e, outs: v.outs, unseen: v.unseen }),
      });
    } else if (stepId === 'price') {
      const e = gradeEstimate(guess, v.price, TOL.price);
      const slip = e.correct ? null : priceSlip(guess, v);
      finish({
        ...e,
        value: `${e.exact} in 100${e.correct ? '' : ` · you said ${guess}`}`,
        cues: [{ tone: 'neutral', cue: priceCue(v), text: '' }, ...(slip ? [{ tone: 'wrong', cue: '!', text: slip }] : [])],
        why: priceFeedback({ ...e, v }),
      });
    }
  };

  const choose = (a) => {
    const correct = a === v.answer;
    finish({ correct, value: decideCue(v), why: decideFeedback({ correct, v }) });
  };

  const table = tableFor(v, { step: stepId, seat, asking, result, guess });

  return (
    <>
      <DrillTop stepId={stepId} mode={mode} streak={step.streak} onExit={onExit} />
      <main className="lx-main gx-main">
        <section className="gx-drill" aria-labelledby="gx-q">
          <h1 id="gx-q" className="lx-h1 gx-q">{QUESTION[stepId](seat)}</h1>
          <Stage {...table} />

          <div className="gx-tray">
            {stepId === 'outs' && (
              <>
                <DeckGrid grid={v.grid} mode={asking ? 'pick' : 'checked'} selected={selected} onToggle={toggle} onToggleMany={toggleMany} />
                {asking && step.played === 0 && <GridTip />}
              </>
            )}
            {stepId === 'chance' && (
              <EstimateSlider id={`est-${seed}`} label="You win" value={guess} onChange={setGuess} max={60} disabled={!asking} />
            )}
            {stepId === 'price' && (
              <>
                <PotEquation pot={v.potBeforeBet} bet={v.bet} seat={seat} />
                <EstimateSlider id={`est-${seed}`} label={seat === 'bettor' ? 'His slice' : 'Your slice'} value={guess} onChange={setGuess} max={50} disabled={!asking} />
              </>
            )}
          </div>

          {asking && (
            <Hint
              open={hintOpen}
              onToggle={() => setHintOpen((o) => !o)}
              text={stepId === 'outs' ? outsHint(v.pairRank) : stepId === 'chance' ? chanceHint(v.unseen) : stepId === 'price' ? priceHint(seat) : decideHint(seat)}
            />
          )}
        </section>
      </main>

      <footer className={`lx-foot${asking ? '' : ' lx-foot--sheet'}`}>
        {asking && stepId === 'decide' && <DecideButtons seat={seat} onChoose={choose} />}
        {asking && stepId !== 'decide' && (
          <button type="button" className="lx-btn lx-btn--primary" disabled={stepId === 'outs' ? selected.size === 0 : guess == null} onClick={check}>
            {stepId === 'outs' && selected.size > 0 ? `Check ${selected.size}` : 'Check'}
          </button>
        )}
        {!asking && <Sheet {...result} cleared={cleared} actionLabel={nextLabel(cleared, mode)} onAction={onNext} />}
      </footer>
    </>
  );
}

/* ── the full line: all four steps on one hand, no help ────── */

const LINE = ['outs', 'chance', 'price', 'decide'];
const LINE_NAMES = { outs: 'Outs', chance: 'Chance', price: 'Price', decide: 'Decision' };

/**
 * Like playing an opening line from memory: four moves on one hand, and it
 * only counts if every one is right. The table fills in as you go: the chance
 * lands on the river, the price on the pot, and you decide with both in view.
 * A slip doesn't cascade: the TRUE value is what lands on the table. No hints,
 * and the pot equation drops "+ your call", so the scaffolds fade here.
 */
function LineDrill({ mode, seed, step, cleared, onChecked, onNext, onExit }) {
  const v = useMemo(() => generate('chain', seed), [seed]);
  const [at, setAt] = useState(0); // 0..3 = steps, 4 = summary
  const [checkedHere, setCheckedHere] = useState(false);
  const { selected, toggle, toggleMany } = useSelection();
  const [chanceGuess, setChanceGuess] = useState(null);
  const [priceGuess, setPriceGuess] = useState(null);
  const [res, setRes] = useState({});

  const sub = LINE[at];

  const record = (key, r) => {
    const all = { ...res, [key]: r };
    setRes(all);
    if (key === 'decide') {
      setAt(4);
      onChecked(LINE.every((k) => all[k]?.correct));
    } else {
      setCheckedHere(true);
    }
  };

  const check = () => {
    if (sub === 'outs') {
      const g = gradeSelection(v.grid, selected);
      record('outs', {
        correct: g.perfect,
        value: g.perfect ? `All ${v.outs} found` : `${g.found} of ${v.outs} found`,
        cues: outsCues(g, v.pairRank),
        why: outsFeedback(g, v.pairRank).map((l) => l.text).join(' '),
        summary: g.perfect ? `${v.outs}` : `${g.found} of ${v.outs}`,
      });
    } else if (sub === 'chance') {
      const e = gradeEstimate(chanceGuess, v.chance, TOL.chance);
      record('chance', {
        ...e,
        value: `≈ ${e.exact} in 100${e.correct ? '' : ` · you said ${chanceGuess}`}`,
        cues: [{ tone: 'neutral', cue: chanceCue(v.outs), text: '' }],
        why: chanceFeedback({ ...e, outs: v.outs, unseen: v.unseen }),
        summary: e.correct ? `${chanceGuess}` : `${chanceGuess} → ${e.exact}`,
      });
    } else if (sub === 'price') {
      const e = gradeEstimate(priceGuess, v.price, TOL.price);
      const slip = e.correct ? null : priceSlip(priceGuess, v);
      record('price', {
        ...e,
        value: `${e.exact} in 100${e.correct ? '' : ` · you said ${priceGuess}`}`,
        cues: [{ tone: 'neutral', cue: priceCue(v), text: '' }, ...(slip ? [{ tone: 'wrong', cue: '!', text: slip }] : [])],
        why: priceFeedback({ ...e, v: { ...v, seat: 'caller' } }),
        summary: e.correct ? `${priceGuess}` : `${priceGuess} → ${e.exact}`,
      });
    }
  };

  const choose = (a) => {
    const correct = a === v.answer;
    record('decide', { correct, summary: correct ? a : `${a} → ${v.answer}` });
  };

  const advance = () => {
    setCheckedHere(false);
    setAt((i) => i + 1);
  };

  // The table, filled in by what this line has established so far.
  const table = tableFor(v, {
    step: at === 4 ? 'decide' : sub,
    asking: !checkedHere,
    result: res[sub],
    guess: sub === 'price' ? priceGuess : chanceGuess,
    known: { chance: at >= 2, price: at >= 3 },
  });

  const r = res[sub];
  const right = LINE.filter((k) => res[k]?.correct).length;
  const allRight = at === 4 && right === 4;

  return (
    <>
      <DrillTop stepId="chain" mode={mode} streak={step.streak} onExit={onExit} sub={at < 4 ? `${at + 1} / 4` : null} />
      <main className="lx-main gx-main">
        <section className="gx-drill" aria-labelledby="gx-q">
          <h1 id="gx-q" className="lx-h1 gx-q">{at < 4 ? QUESTION[sub]('caller') : 'Your line'}</h1>
          <Stage {...table} />

          <div className="gx-tray">
            {sub === 'outs' && (
              <DeckGrid grid={v.grid} mode={checkedHere ? 'checked' : 'pick'} selected={selected} onToggle={toggle} onToggleMany={toggleMany} />
            )}
            {sub === 'chance' && (
              <EstimateSlider id={`ch-${seed}`} label="You win" value={chanceGuess} onChange={setChanceGuess} max={60} disabled={checkedHere} />
            )}
            {sub === 'price' && (
              <>
                <PotEquation pot={v.potBeforeBet} bet={v.bet} withCall={false} />
                <EstimateSlider id={`pr-${seed}`} label="Your slice" value={priceGuess} onChange={setPriceGuess} max={50} disabled={checkedHere} />
              </>
            )}
            {at === 4 && (
              <ol className="gx-line__list" aria-label="Your line">
                {LINE.map((k) => (
                  <li key={k} className={res[k]?.correct ? 'is-right' : 'is-off'}>
                    <span className="gx-line__name">{LINE_NAMES[k]}</span>
                    <span className="gx-line__val">{res[k]?.summary}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </main>

      <footer className={`lx-foot${checkedHere || at === 4 ? ' lx-foot--sheet' : ''}`}>
        {at < 4 && !checkedHere && sub === 'decide' && <DecideButtons seat="caller" onChoose={choose} />}
        {at < 4 && !checkedHere && sub !== 'decide' && (
          <button
            type="button"
            className="lx-btn lx-btn--primary"
            disabled={sub === 'outs' ? selected.size === 0 : (sub === 'chance' ? chanceGuess : priceGuess) == null}
            onClick={check}
          >
            {sub === 'outs' && selected.size > 0 ? `Check ${selected.size}` : 'Check'}
          </button>
        )}
        {at < 4 && checkedHere && r && <Sheet {...r} actionLabel={`Next: ${LINE_NAMES[LINE[at + 1]].toLowerCase()}`} onAction={advance} />}
        {at === 4 && (
          <Sheet
            correct={allRight}
            verdict={allRight ? 'Line cleared' : 'Not this time'}
            value={`${right} of 4 right · ${decideCue(v)}`}
            actionLabel={cleared ? 'Step cleared' : mode === 'review' ? 'Back to the path' : 'Next hand'}
            onAction={onNext}
            cleared={cleared}
          />
        )}
      </footer>
    </>
  );
}
