/**
 * LessonApp — Poker Decisions v3 prototype.
 * =========================================
 * One hand, one idea: "Am I paying more than my share?"
 *
 *   cold open → the hand (narrated, system-paced) → your decision →
 *   price → you count → compare → the long run → the twist →
 *   change his bet → what the pro did → the tool you keep
 *
 * Phone-first, one primary action per screen, and the primary action always
 * sits BELOW the thing it moves you past.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LESSON, choiceReflection, KIND_EXPLAIN } from './script.js';
import {
  heroGrid, heroCounts, truthCounts, priceForBet, breakEvenBet,
  gradeSelection, longRunSequence, money, pct,
} from './lessonMath.js';
import { Card, PotRing, ShareBars, DeckGrid, LongRun } from './parts.jsx';
import { useBooth } from './useBooth.js';
import './lesson.css';

const BEATS = ['price', 'count', 'compare', 'longrun', 'twist', 'breakit', 'pro', 'tool'];
const BEAT_NAMES = {
  price: 'The price', count: 'Your chance', compare: 'Price vs chance', longrun: 'The long run',
  twist: 'The twist', breakit: 'Change his bet', pro: 'The pro', tool: 'Keep this',
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const SUIT_SYM = { s: '♠', h: '♥', d: '♦', c: '♣' };
const glyph = (id) => `${id[0] === 'T' ? '10' : id[0]}${SUIT_SYM[id[1]]}`;
const words = (s) => s.split(/\s+/).filter(Boolean).length;

function readFlag(k, d) {
  try {
    const v = localStorage.getItem(k);
    return v == null ? d : v === '1';
  } catch {
    return d;
  }
}
function writeFlag(k, v) {
  try {
    localStorage.setItem(k, v ? '1' : '0');
  } catch {
    /* storage unavailable */
  }
}

function useFonts() {
  useEffect(() => {
    if (document.getElementById('lx-fonts')) return;
    const pre = document.createElement('link');
    pre.rel = 'preconnect';
    pre.href = 'https://fonts.gstatic.com';
    pre.crossOrigin = '';
    const l = document.createElement('link');
    l.id = 'lx-fonts';
    l.rel = 'stylesheet';
    l.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap';
    document.head.append(pre, l);
  }, []);
}

export default function LessonApp() {
  useFonts();
  const L = LESSON;
  const booth = useBooth(L.id);

  /* ── engine-derived numbers (nothing typed in) ── */
  const grid = useMemo(() => heroGrid(L.hero.cards, L.turn.board, L.read.pairRank), [L]);
  const hero = useMemo(() => heroCounts(grid), [grid]);
  const truth = useMemo(() => truthCounts(L.hero.cards, L.villain.cards, L.turn.board), [L]);
  const priceShare = priceForBet(L.turn.bet, L.turn.potBeforeBet);
  const winShare = hero.wins / hero.unseen;
  const need = pct(priceShare);
  const have = pct(winShare);
  const finalPot = L.turn.potBeforeBet + 2 * L.turn.bet;
  const potBeforeCall = L.turn.potBeforeBet + L.turn.bet;
  const flipBet = Math.round(breakEvenBet(winShare, L.turn.potBeforeBet) / 10_000) * 10_000;
  const seq = useMemo(() => longRunSequence(have, 100), [have]);
  // Cards you counted that turn out to be in his hand (engine says: just the Q♠).
  const vanished = useMemo(() => hero.winners.filter((c) => !truth.winners.includes(c)), [hero, truth]);

  /* ── flow state ── */
  const [stage, setStage] = useState('cold'); // cold | replay | decide | lesson
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState(null);
  const [beat, setBeat] = useState(0);
  const [selected, setSelected] = useState(() => new Set());
  const [checked, setChecked] = useState(false);
  const [bet, setBet] = useState(L.turn.bet);
  const [voiceOn, setVoiceOn] = useState(() => readFlag('pd.v3.voice', true));
  const [captionsOn, setCaptionsOn] = useState(() => readFlag('pd.v3.captions', false));
  const mainRef = useRef(null);
  const firstLine = useRef(null); // the opening line, started inside the tap

  const current = L.replay[Math.min(step, L.replay.length - 1)];

  /* ── the replay: narration is the clock ── */
  const skip = useRef(null);
  useEffect(() => {
    if (stage !== 'replay') return;
    let cancelled = false;
    let resolveSkip;
    const skipped = new Promise((r) => (resolveSkip = r));
    skip.current = () => {
      booth.stop();
      resolveSkip();
    };
    (async () => {
      const line = current;
      const started = step === 0 ? firstLine.current : null;
      firstLine.current = null;
      const spoken = voiceOn && (started || booth.hasLine(line.id));
      const pace = spoken
        ? (started ?? booth.play(line.id)).then(() => wait(450))
        : wait(Math.max(2400, (words(line.vo) / 3.4) * 1000 + 600));
      await Promise.race([pace, skipped]);
      if (cancelled) return;
      if (step < L.replay.length - 1) setStep((s) => s + 1);
      else setStage('decide');
    })();
    return () => {
      cancelled = true;
      skip.current = null;
    };
    // booth functions are stable per manifest; re-run only on flow changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, step, voiceOn]);

  const begin = () => {
    // Start the first line HERE, inside the tap: that is what unlocks audio.
    if (voiceOn && booth.hasLine(L.replay[0].id)) firstLine.current = booth.play(L.replay[0].id);
    setStep(0);
    setStage('replay');
  };

  const decide = (action) => {
    booth.stop();
    setChoice(action);
    setBeat(0);
    setStage('lesson');
  };

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    writeFlag('pd.v3.voice', next);
    if (!next) booth.silence(); // pause, don't skip: the beat continues muted
  };
  const toggleCaptions = () => {
    const next = !captionsOn;
    setCaptionsOn(next);
    writeFlag('pd.v3.captions', next);
  };

  const goBeat = (i) => {
    setBeat(i);
    mainRef.current?.scrollTo?.({ top: 0 });
    window.scrollTo?.({ top: 0 });
  };

  const restart = () => {
    setStage('cold');
    setStep(0);
    setChoice(null);
    setBeat(0);
    setSelected(new Set());
    setChecked(false);
    setBet(L.turn.bet);
  };

  const toggleCard = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);
  const toggleMany = useCallback((ids) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allIn = ids.every((id) => next.has(id));
      ids.forEach((id) => (allIn ? next.delete(id) : next.add(id)));
      return next;
    });
  }, []);

  const grade = useMemo(() => (checked ? gradeSelection(grid, selected) : null), [checked, grid, selected]);

  /* ── render ── */
  const beatKey = BEATS[beat];

  return (
    <div className="lx" data-stage={stage}>
      <div className="lx-frame">
        <TopBar
          stage={stage}
          beat={beat}
          voiceOn={voiceOn}
          captionsOn={captionsOn}
          onVoice={toggleVoice}
          onCaptions={toggleCaptions}
          onRestart={restart}
        />

        <main className="lx-main" ref={mainRef}>
          {stage === 'cold' && <ColdOpen onBegin={begin} />}

          {(stage === 'replay' || stage === 'decide') && (
            <section className="lx-scene" onClick={() => stage === 'replay' && skip.current?.()}>
              <Table step={current} />
              <div className={`lx-lower${stage === 'decide' ? ' is-hidden' : ''}`} aria-live="polite">
                <span className="lx-lower__label">{current.label}</span>
                {stage === 'replay' && (!voiceOn || captionsOn) && (
                  <p className="lx-lower__caption">{current.vo}</p>
                )}
              </div>
              {stage === 'replay' && (
                <button type="button" className="lx-skip" onClick={(e) => { e.stopPropagation(); skip.current?.(); }}>
                  Skip ›
                </button>
              )}
            </section>
          )}

          {stage === 'lesson' && (
            <section className="lx-beat" key={beatKey} aria-labelledby="lx-beat-title">
              {beatKey === 'price' && (
                <>
                  <Eyebrow>{BEAT_NAMES.price}</Eyebrow>
                  <h1 id="lx-beat-title" className="lx-h1">You’d pay {need}% of the pot</h1>
                  <div className="lx-visual">
                    <PotRing base={potBeforeCall} mine={L.turn.bet} center={`${need}%`} sub="of the pot" />
                    <Legend items={[
                      { tone: 'pot', text: `${money(potBeforeCall)} already in` },
                      { tone: 'you', text: `${money(L.turn.bet)} you’d add` },
                    ]} total={`${money(finalPot)} pot`} />
                  </div>
                  <p className="lx-body">
                    To stay in you add {money(L.turn.bet)}, and the pot becomes {money(finalPot)}.
                    Your {money(L.turn.bet)} is {need}% of it.
                  </p>
                  <p className="lx-key">So you need to win more than <b className="t-you">{need} times in 100</b>.</p>
                </>
              )}

              {beatKey === 'count' && (
                <>
                  <Eyebrow>{BEAT_NAMES.count}</Eyebrow>
                  <h1 id="lx-beat-title" className="lx-h1">
                    {checked ? `${hero.wins} of ${hero.unseen} cards win` : 'Which cards win?'}
                  </h1>
                  {!checked && (
                    <p className="lx-body">
                      He bet big, so give him {L.read.words}. <b>Tap every card that beats it.</b>
                    </p>
                  )}
                  <div className="lx-visual">
                    <DeckGrid
                      grid={grid}
                      mode={checked ? 'checked' : 'pick'}
                      selected={selected}
                      onToggle={toggleCard}
                      onToggleMany={toggleMany}
                    />
                    <GridKey mode={checked ? 'checked' : 'pick'} picked={selected.size} />
                  </div>
                  {checked && grade && <CountFeedback grade={grade} />}
                  {checked && (
                    <p className="lx-key">
                      {hero.wins} of the {hero.unseen} cards you can’t see win. Just under 2 in 5:
                      about <b className="t-win">{have} in 100</b>.
                    </p>
                  )}
                </>
              )}

              {beatKey === 'compare' && (
                <>
                  <Eyebrow>{BEAT_NAMES.compare}</Eyebrow>
                  <h1 id="lx-beat-title" className="lx-h1">{have} beats {need}. Call, just.</h1>
                  <div className="lx-visual">
                    <ShareBars need={need} have={have} />
                  </div>
                  <p className="lx-body">
                    Both numbers are a share of 100. You win {have} times in 100 and only need {need}.
                    Your share of the wins is a little bigger than your share of the cost.
                  </p>
                  <p className="lx-note">{choiceReflection(choice)}</p>
                </>
              )}

              {beatKey === 'longrun' && (
                <>
                  <Eyebrow>{BEAT_NAMES.longrun}</Eyebrow>
                  <h1 id="lx-beat-title" className="lx-h1">Play it 100 times</h1>
                  <div className="lx-visual">
                    <LongRun seq={seq} winAmount={potBeforeCall} lossAmount={L.turn.bet} />
                  </div>
                  <p className="lx-body">
                    You lose {100 - have} of them and still finish ahead, because each win pays {money(potBeforeCall)}
                    and each loss costs {money(L.turn.bet)}.
                  </p>
                  <p className="lx-key">So losing this hand wouldn’t make calling wrong.</p>
                </>
              )}

              {beatKey === 'twist' && (
                <>
                  <Eyebrow>{BEAT_NAMES.twist}</Eyebrow>
                  <h1 id="lx-beat-title" className="lx-h1">What you couldn’t see</h1>
                  <div className="lx-reveal">
                    <span className="lx-reveal__who">{L.villain.short} had</span>
                    <span className="lx-reveal__cards">
                      {L.villain.cards.map((c) => <Card key={c} card={c} size="lg" flip />)}
                    </span>
                  </div>
                  <div className="lx-visual">
                    <DeckGrid grid={grid} mode="truth" his={L.villain.cards} />
                  </div>
                  <p className="lx-body">
                    {vanished.length === 1
                      ? <>One of your {hero.wins} cards, the {glyph(vanished[0])}, was in his hand all along.</>
                      : <>{vanished.length} of your {hero.wins} cards were in his hand all along.</>}
                  </p>
                  <p className="lx-key">
                    Real count: <b>{truth.wins} of {truth.unseen}</b>. Still about{' '}
                    <b className="t-win">{pct(truth.equity)} in 100</b>. Still enough.
                  </p>
                  <p className="lx-note">You can only decide on what you can see. That’s the game.</p>
                </>
              )}

              {beatKey === 'breakit' && (
                <BreakIt
                  bet={bet}
                  setBet={setBet}
                  potBeforeBet={L.turn.potBeforeBet}
                  have={have}
                  winShare={winShare}
                  flipBet={flipBet}
                  villain={L.villain.short}
                />
              )}

              {beatKey === 'pro' && (
                <>
                  <Eyebrow>{BEAT_NAMES.pro}</Eyebrow>
                  <h1 id="lx-beat-title" className="lx-h1">He raised to {money(L.turn.raiseTo)}</h1>
                  <div className="lx-ways">
                    <div className="lx-way">
                      <span className="lx-way__n">1</span>
                      <span className="lx-way__t"><b>{L.villain.short} folds.</b> The {money(potBeforeCall)} pot is his right now.</span>
                    </div>
                    <div className="lx-way">
                      <span className="lx-way__n">2</span>
                      <span className="lx-way__t"><b>{L.villain.short} calls.</b> {L.hero.short} still has his draw.</span>
                    </div>
                  </div>
                  <p className="lx-body">
                    When the price is almost exactly fair, calling earns very little. A raise adds a second way to win.
                  </p>
                  <div className="lx-versus">
                    <span>You <b>{choice}</b></span>
                    <span>{L.hero.short} <b>{L.proAction}</b></span>
                  </div>
                  <p className="lx-note">
                    Farha called. The river missed the draw. What Moneymaker did next became the most famous bluff in poker.
                  </p>
                </>
              )}

              {beatKey === 'tool' && (
                <ToolBeat onRestart={restart} wins={hero.wins} unseen={hero.unseen} have={have} need={need} />
              )}
            </section>
          )}
        </main>

        {/* ── footer: one primary action, always below the content ── */}
        {stage === 'decide' && (
          <footer className="lx-foot lx-foot--decide">
            <p className="lx-foot__ask">{L.villain.short} bets {money(L.turn.bet)}. What do you do?</p>
            <div className="lx-actions" role="group" aria-label="Your decision">
              {L.options.map((o) => (
                <button key={o.action} type="button" className={`lx-act lx-act--${o.action}`} onClick={() => decide(o.action)}>
                  <span className="lx-act__label">{o.label}</span>
                  {o.amount && <span className="lx-act__amt">{o.prefix ? `${o.prefix} ` : ''}{money(o.amount)}</span>}
                </button>
              ))}
            </div>
          </footer>
        )}

        {stage === 'lesson' && beatKey !== 'tool' && (
          <footer className="lx-foot">
            {beat > 0 && (
              <button type="button" className="lx-btn lx-btn--quiet" onClick={() => goBeat(beat - 1)}>
                Back
              </button>
            )}
            {beatKey === 'count' && !checked ? (
              <button
                type="button"
                className="lx-btn lx-btn--primary"
                disabled={selected.size === 0}
                onClick={() => setChecked(true)}
              >
                {selected.size === 0 ? 'Tap the cards that win' : `Check my ${selected.size}`}
              </button>
            ) : (
              <button type="button" className="lx-btn lx-btn--primary" onClick={() => goBeat(beat + 1)}>
                {beatKey === 'breakit' ? 'What Moneymaker did' : 'Next'}
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}

/* ── pieces ─────────────────────────────────────────────────── */

function TopBar({ stage, beat, voiceOn, captionsOn, onVoice, onCaptions, onRestart }) {
  return (
    <header className="lx-top">
      <button type="button" className="lx-top__home" onClick={onRestart} aria-label="Start over">
        <span className="lx-top__mark">PD</span>
      </button>
      <div className="lx-top__mid">
        {stage === 'lesson' ? (
          <ol className="lx-progress" aria-label={`Step ${beat + 1} of ${BEATS.length}: ${BEAT_NAMES[BEATS[beat]]}`}>
            {BEATS.map((b, i) => (
              <li key={b} className={i < beat ? 'is-done' : i === beat ? 'is-now' : ''} />
            ))}
          </ol>
        ) : (
          <span className="lx-top__chapter">{LESSON.chapter} · {LESSON.year}</span>
        )}
      </div>
      <div className="lx-top__tools">
        <button type="button" className={`lx-chip${captionsOn ? ' is-on' : ''}`} onClick={onCaptions} aria-pressed={captionsOn} aria-label="Captions">
          CC
        </button>
        <button type="button" className={`lx-chip${voiceOn ? ' is-on' : ''}`} onClick={onVoice} aria-pressed={voiceOn} aria-label={voiceOn ? 'Mute commentary' : 'Turn on commentary'}>
          {voiceOn ? <SoundOn /> : <SoundOff />}
        </button>
      </div>
    </header>
  );
}

function ColdOpen({ onBegin }) {
  const L = LESSON;
  return (
    <section className="lx-cold">
      <span className="lx-cold__year">{L.year}</span>
      <h1 className="lx-cold__title">The bluff that<br />launched poker</h1>
      <p className="lx-cold__place">{L.event}<br />{L.venue}</p>
      <p className="lx-cold__stakes">
        An accountant who qualified online for $40 is heads-up with one of the best players in the world.
        You’re in his seat.
      </p>
      <button type="button" className="lx-btn lx-btn--primary lx-btn--wide" onClick={onBegin}>
        Take his seat
      </button>
      <p className="lx-cold__small">About 3 minutes · Sound on · Commentary by {L.commentator.name}</p>
    </section>
  );
}

function Table({ step }) {
  const L = LESSON;
  const heroStack = L.hero.startStack - step.paid.hero;
  const vilStack = L.villain.startStack - step.paid.villain;
  const vilBet = step.id === 'bet' ? L.turn.bet : 0;
  return (
    <div className="lx-table">
      <Seat name={L.villain.name} tag="BB" stack={vilStack}>
        <Card card={L.villain.cards[0]} size="sm" faceDown />
        <Card card={L.villain.cards[1]} size="sm" faceDown />
      </Seat>
      {vilBet > 0 && <span className="lx-bet">bets {money(vilBet)}</span>}

      <div className="lx-felt">
        <div className="lx-board" aria-label="Board">
          {[0, 1, 2, 3, 4].map((i) =>
            step.board[i] ? (
              <Card key={step.board[i]} card={step.board[i]} size="lg" />
            ) : (
              <span key={`e${i}`} className="lx-card lx-card--lg is-slot" aria-hidden="true" />
            )
          )}
        </div>
        <div className="lx-pot" aria-label={`Pot ${money(step.pot)}`}>
          <span className="lx-pot__label">Pot</span>
          <span className="lx-pot__value">{money(step.pot)}</span>
        </div>
      </div>

      <Seat name={`${L.hero.name}`} tag="BTN" stack={heroStack} you>
        <Card card={L.hero.cards[0]} size="md" />
        <Card card={L.hero.cards[1]} size="md" />
      </Seat>
    </div>
  );
}

function Seat({ name, tag, stack, you, children }) {
  return (
    <div className={`lx-seat${you ? ' is-you' : ''}`}>
      <span className="lx-seat__cards">{children}</span>
      <span className="lx-seat__who">
        <span className="lx-seat__name">{you ? 'You' : name}</span>
        <span className="lx-seat__meta">{you ? `${name} · ` : ''}{tag} · {money(stack)}</span>
      </span>
    </div>
  );
}

function Eyebrow({ children }) {
  return <p className="lx-eyebrow">{children}</p>;
}

function Legend({ items, total }) {
  return (
    <ul className="lx-legend">
      {items.map((it) => (
        <li key={it.text}><i className={`lx-dot lx-dot--${it.tone}`} />{it.text}</li>
      ))}
      <li className="lx-legend__total">= {total}</li>
    </ul>
  );
}

function GridKey({ mode, picked }) {
  if (mode === 'pick') {
    return (
      <p className="lx-gridkey">
        <span>{picked} picked</span>
        <span className="lx-gridkey__hint">Tap ♠ or a rank to pick a whole row or column</span>
      </p>
    );
  }
  return (
    <ul className="lx-gridkey lx-gridkey--legend">
      <li><i className="lx-sw lx-sw--win" />wins</li>
      <li><i className="lx-sw lx-sw--missed" />wins, missed</li>
      <li><i className="lx-sw lx-sw--wrong" />doesn’t win</li>
    </ul>
  );
}

function CountFeedback({ grade }) {
  const lines = [];
  for (const [kind, ids] of Object.entries(grade.missedByKind)) {
    const f = KIND_EXPLAIN.missed[kind];
    if (f) lines.push({ tone: 'missed', text: f(ids.length) });
  }
  for (const [kind, ids] of Object.entries(grade.wrongByKind)) {
    const f = KIND_EXPLAIN.wrong[kind];
    if (f) lines.push({ tone: 'wrong', text: f(ids.length) });
  }
  return (
    <div className="lx-feedback">
      <p className="lx-feedback__score">
        {grade.perfect ? `All ${grade.total}. Exactly right.` : `You found ${grade.found} of ${grade.total}.`}
      </p>
      {lines.length > 0 && (
        <ul className="lx-feedback__list">
          {lines.map((l) => <li key={l.text} className={`is-${l.tone}`}>{l.text}</li>)}
        </ul>
      )}
    </div>
  );
}

function BreakIt({ bet, setBet, potBeforeBet, have, winShare, flipBet, villain }) {
  const share = priceForBet(bet, potBeforeBet);
  const need = pct(share);
  const call = winShare > share;
  return (
    <>
      <p className="lx-eyebrow">{BEAT_NAMES.breakit}</p>
      <h1 id="lx-beat-title" className="lx-h1">What if {villain} bet more?</h1>
      <div className="lx-visual lx-visual--row">
        <PotRing base={potBeforeBet + bet} mine={bet} size={120} stroke={11} center={`${need}%`} sub="you pay" />
        <div className="lx-slider">
          <label htmlFor="lx-bet" className="lx-slider__label">
            {villain} bets <b>{money(bet)}</b>
          </label>
          <input
            id="lx-bet"
            type="range"
            min={50_000}
            max={1_200_000}
            step={10_000}
            value={bet}
            onChange={(e) => setBet(Number(e.target.value))}
          />
          <div className="lx-slider__ends"><span>50K</span><span>1.2M</span></div>
        </div>
      </div>
      <ShareBars need={need} have={have} />
      <p className={`lx-verdict ${call ? 'is-call' : 'is-fold'}`} aria-live="polite">
        {call ? `Call. You win ${have} in 100 and pay ${need}.` : `Fold. Now you'd pay ${need} in 100 for a ${have} in 100 chance.`}
      </p>
      <p className="lx-note">
        A bigger bet makes your slice of the pot bigger. Here, calling stops paying once he bets more than about {money(flipBet)}.
      </p>
    </>
  );
}

function ToolBeat({ onRestart, wins, unseen, have, need }) {
  useEffect(() => {
    try {
      const k = 'pd.v3.toolkit';
      const kit = new Set(JSON.parse(localStorage.getItem(k) || '[]'));
      kit.add('share-vs-price');
      localStorage.setItem(k, JSON.stringify([...kit]));
    } catch {
      /* storage unavailable */
    }
  }, []);
  return (
    <>
      <p className="lx-eyebrow">{BEAT_NAMES.tool}</p>
      <h1 id="lx-beat-title" className="lx-h1">Your first tool</h1>
      <figure className="lx-tool">
        <span className="lx-tool__n">Tool 1</span>
        <blockquote className="lx-tool__rule">
          Count the cards that win. Is that share bigger than the share of the pot you’re paying?
        </blockquote>
        <figcaption className="lx-tool__eg">
          Here: {wins} of {unseen} cards win, about {have} in 100. You pay {need} in 100. Call.
        </figcaption>
      </figure>
      <p className="lx-note">Saved to your toolkit. Every hand adds one.</p>
      <div className="lx-tool__actions">
        <button type="button" className="lx-btn lx-btn--primary lx-btn--wide" disabled>
          Next: the river · coming soon
        </button>
        <button type="button" className="lx-btn lx-btn--quiet lx-btn--wide" onClick={onRestart}>
          Play the hand again
        </button>
      </div>
    </>
  );
}

function SoundOn() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 6h2.5L8 3v10L4.5 10H2z" fill="currentColor" />
      <path d="M10.5 5.5a3.5 3.5 0 0 1 0 5M12.3 3.7a6 6 0 0 1 0 8.6" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
function SoundOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 6h2.5L8 3v10L4.5 10H2z" fill="currentColor" />
      <path d="M11 6l3.5 4M14.5 6L11 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
