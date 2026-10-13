/**
 * GameApp — Poker Decisions v3: learn the maths one step at a time.
 * =================================================================
 * Screens:  path → drill (one generated spot at a time) → cleared → … → boss
 *           plus a "done for now" stop screen.
 *
 * The parent owns progress and the attempt counter; each spot is a fresh
 * <Drill> keyed by (step, mode, attempt), so a new seed means a new variation.
 * The seat (caller / bettor) is fixed when an attempt is created: streak 0 and
 * 2 are the caller's seat, streak 1 the bettor's, so a cleared run of 3 always
 * includes both sides.
 */
import { useEffect, useRef, useState } from 'react';
import Path from './Path.jsx';
import Drill from './Drill.jsx';
import { STEPS } from './copy.js';
import { seedFor } from './variation.js';
import {
  ORDER, load, save, getStep, recordAttempt, recordReview, justMastered, markBossDone,
  unlockAll, masteredCount, nextReviewAt, DAY,
} from './progress.js';
import LessonApp from '../lesson/LessonApp.jsx';
import { useFonts } from '../lesson/fonts.js';
import { useScrollFlag } from '../lesson/useScrollFlag.js';
import '../lesson/lesson.css';
import './game.css';

function browserStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function seatFor(stepId, streak, mode, seed) {
  if (!STEPS[stepId]?.seats) return 'caller';
  if (mode === 'review') return seed % 2 ? 'bettor' : 'caller';
  return streak % 2 === 1 ? 'bettor' : 'caller';
}

export default function GameApp({
  salt: saltProp,
  now = () => Date.now(),
  storage = browserStorage(),
  demo = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('dev'),
}) {
  useFonts();
  useScrollFlag();
  const salt = useRef(saltProp ?? Date.now()).current;
  const [progress, setProgress] = useState(() => {
    const p = load(storage);
    return demo ? unlockAll(p, now()) : p;
  });
  const [screen, setScreen] = useState({ name: 'path' });
  const [session, setSession] = useState({ played: 0, cleared: [] });
  const attempts = useRef({});

  useEffect(() => {
    save(storage, progress);
  }, [progress, storage]);

  useEffect(() => {
    window.scrollTo?.({ top: 0 });
  }, [screen.name, screen.stepId, screen.attempt]);

  const openStep = (stepId, mode = 'learn', p = progress) => {
    const n = (attempts.current[stepId] = (attempts.current[stepId] ?? -1) + 1);
    const seed = seedFor(salt, stepId, mode, n);
    setScreen({
      name: 'drill',
      stepId,
      mode,
      attempt: n,
      seed,
      seat: seatFor(stepId, getStep(p, stepId).streak, mode, seed),
      cleared: false,
    });
  };

  const onChecked = (correct, { hinted = false } = {}) => {
    const t = now();
    const { stepId, mode } = screen;
    const next = mode === 'review' ? recordReview(progress, stepId, correct, t) : recordAttempt(progress, stepId, correct, t, { hinted });
    const cleared = mode === 'learn' && justMastered(progress, next, stepId);
    setProgress(next);
    setSession((s) => ({ played: s.played + 1, cleared: cleared ? [...s.cleared, stepId] : s.cleared }));
    if (cleared) setScreen((sc) => ({ ...sc, cleared: true }));
  };

  const onNext = () => {
    if (screen.cleared) return setScreen({ name: 'cleared', stepId: screen.stepId });
    if (screen.mode === 'review') return setScreen({ name: 'path' });
    openStep(screen.stepId, 'learn');
  };

  const toPath = () => setScreen({ name: 'path' });
  const toBoss = () => setScreen({ name: 'boss' });

  if (screen.name === 'boss') {
    return (
      <LessonApp
        onExit={toPath}
        onComplete={() => setProgress((p) => markBossDone(p, now()))}
      />
    );
  }

  return (
    <div className="lx gx" data-screen={screen.name}>
      <div className="lx-frame">
        {screen.name === 'path' && (
          <Path progress={progress} now={now()} onOpen={openStep} onBoss={toBoss} onDone={() => setScreen({ name: 'summary' })} />
        )}

        {screen.name === 'drill' && (
          <Drill
            key={`${screen.stepId}-${screen.mode}-${screen.attempt}`}
            stepId={screen.stepId}
            mode={screen.mode}
            seed={screen.seed}
            seat={screen.seat}
            step={getStep(progress, screen.stepId)}
            cleared={screen.cleared}
            onChecked={onChecked}
            onNext={onNext}
            onExit={toPath}
          />
        )}

        {screen.name === 'cleared' && (
          <Cleared stepId={screen.stepId} onNext={(id) => (id === 'boss' ? toBoss() : openStep(id, 'learn'))} onPath={toPath} />
        )}

        {screen.name === 'summary' && <Summary progress={progress} session={session} now={now()} onPath={toPath} />}
      </div>
    </div>
  );
}

function Cleared({ stepId, onNext, onPath }) {
  const meta = STEPS[stepId];
  const nextId = ORDER[ORDER.indexOf(stepId) + 1];
  const next = nextId ? STEPS[nextId] : null;
  return (
    <>
      <main className="lx-main gx-main">
        <section className="gx-cleared" aria-labelledby="gx-cleared">
          <span className="gx-cleared__mark" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 28 28"><path d="M7 14.5l4.6 4.5L21 9.5" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <p className="lx-eyebrow">Step {meta.n} cleared</p>
          <h1 id="gx-cleared" className="lx-h1">{meta.cleared}</h1>
          {next && (
            <p className="gx-unlock">
              <span className="gx-unlock__label">Unlocked</span>
              <b>{nextId === 'boss' ? `${next.title} · ${next.year}` : next.title}</b>
            </p>
          )}
        </section>
      </main>
      <footer className="lx-foot">
        <button type="button" className="lx-btn lx-btn--quiet" onClick={onPath}>Path</button>
        {next && (
          <button type="button" className="lx-btn lx-btn--primary" onClick={() => onNext(nextId)}>
            {nextId === 'boss' ? 'Play the hand' : next.title}
          </button>
        )}
      </footer>
    </>
  );
}

function whenLabel(ts, now) {
  if (!ts) return null;
  const days = Math.round((ts - now) / DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

function Summary({ progress, session, now, onPath }) {
  const nextReview = whenLabel(nextReviewAt(progress), now);
  return (
    <>
      <main className="lx-main gx-main">
        <section className="gx-summary" aria-labelledby="gx-sum">
          <p className="lx-eyebrow">Done for today</p>
          <h1 id="gx-sum" className="lx-h1">
            {session.played === 0 ? 'See you soon' : `${session.played} ${session.played === 1 ? 'spot' : 'spots'} played`}
          </h1>
          <dl className="gx-sumlist">
            <div><dt>Cleared</dt><dd>{session.cleared.length ? session.cleared.map((id) => STEPS[id].title).join(', ') : '—'}</dd></div>
            <div><dt>Chapter 1</dt><dd>{masteredCount(progress)}/{ORDER.length}</dd></div>
            {nextReview && <div><dt>Next review</dt><dd>{nextReview}</dd></div>}
          </dl>
          <p className="lx-note">A little each day beats a lot at once.</p>
        </section>
      </main>
      <footer className="lx-foot">
        <button type="button" className="lx-btn lx-btn--primary" onClick={onPath}>Back to the path</button>
      </footer>
    </>
  );
}
