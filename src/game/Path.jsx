/**
 * Path — the chapter map. Minimal by design: step titles carry the meaning,
 * the rule ("3 in a row opens the next") is shown as the pips themselves, and
 * the 2-4 word cue appears only on the step you're about to play.
 */
import { CHAPTER, STEPS } from './copy.js';
import { ORDER, getStep, isUnlocked, isReviewDue, frontier, masteredCount } from './progress.js';
import { Pips } from './Drill.jsx';

const LEARN_STEPS = ORDER.filter((id) => id !== 'boss');

function stateOf(progress, id, now) {
  const s = getStep(progress, id);
  if (s.mastered) return isReviewDue(progress, id, now) ? 'due' : 'mastered';
  if (!isUnlocked(progress, id)) return 'locked';
  return 'current';
}

const Tick = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M3 7.5l2.6 2.5L11 4.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Lock = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <rect x="2.5" y="5.5" width="7" height="5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

export default function Path({ progress, now, onOpen, onBoss, onDone }) {
  const next = frontier(progress);
  const done = masteredCount(progress);

  return (
    <>
      <header className="lx-top gx-top">
        <span className="lx-top__mark" aria-hidden="true">PD</span>
        <span className="gx-top__step">Chapter {CHAPTER.n}</span>
        <span className="gx-count" aria-label={`${done} of ${ORDER.length} done`}>{done}/{ORDER.length}</span>
      </header>

      <main className="lx-main gx-main">
        <section className="gx-path" aria-labelledby="gx-chapter">
          <h1 id="gx-chapter" className="lx-h1">{CHAPTER.title}</h1>
          <p className="gx-rule"><Pips streak={3} /> 3 in a row opens the next step</p>

          <ol className="gx-nodes">
            {LEARN_STEPS.map((id, i) => {
              const meta = STEPS[id];
              const state = stateOf(progress, id, now);
              const s = getStep(progress, id);
              const locked = state === 'locked';
              const label = locked
                ? `${meta.title}. Locked: clear step ${i} first.`
                : `${meta.title}. ${state === 'due' ? 'Review due.' : state === 'mastered' ? 'Cleared. Play again.' : 'Start.'}`;
              return (
                <li key={id} className={`gx-node is-${state}`}>
                  <button
                    type="button"
                    className="gx-node__btn"
                    disabled={locked}
                    onClick={() => onOpen(id, state === 'due' ? 'review' : 'learn')}
                    aria-label={label}
                  >
                    <span className="gx-node__dot" aria-hidden="true">
                      {state === 'mastered' || state === 'due' ? <Tick /> : locked ? <Lock /> : meta.n}
                    </span>
                    <span className="gx-node__text">
                      <span className="gx-node__title">{meta.title}</span>
                      {state === 'current' && (
                        <span className="gx-node__learn">
                          {s.played > 0 ? <><Pips streak={s.streak} /> {meta.learn}</> : meta.learn}
                        </span>
                      )}
                    </span>
                    {state === 'due' && <span className="gx-tag gx-tag--due">Review</span>}
                  </button>
                </li>
              );
            })}
          </ol>

          <BossCard unlocked={isUnlocked(progress, 'boss')} done={getStep(progress, 'boss').mastered} onBoss={onBoss} />

          <p className="gx-soon">Chapter 2 · Hidden cards · soon</p>
        </section>
      </main>

      <footer className="lx-foot">
        <button type="button" className="lx-btn lx-btn--quiet" onClick={onDone}>Done</button>
        {next === 'boss' ? (
          <button type="button" className="lx-btn lx-btn--primary" onClick={onBoss}>Play the hand</button>
        ) : next ? (
          <button type="button" className="lx-btn lx-btn--primary" onClick={() => onOpen(next, 'learn')}>
            {STEPS[next].title}
          </button>
        ) : (
          <button type="button" className="lx-btn lx-btn--primary" disabled>Chapter 2 soon</button>
        )}
      </footer>
    </>
  );
}

function BossCard({ unlocked, done, onBoss }) {
  const meta = STEPS.boss;
  return (
    <button
      type="button"
      className={`gx-boss${unlocked ? '' : ' is-locked'}${done ? ' is-done' : ''}`}
      onClick={onBoss}
      disabled={!unlocked}
      aria-label={unlocked ? `${meta.title}, ${meta.year}. ${done ? 'Played. Play again.' : 'Play the hand.'}` : `${meta.title}. Locked: clear the full line first.`}
    >
      <span className="gx-boss__year">{meta.year}</span>
      <span className="gx-boss__title">{meta.title}</span>
      <span className="gx-boss__cta">
        {unlocked ? (done ? 'Play again' : 'Take his seat') : <><Lock /> The full line opens it</>}
      </span>
    </button>
  );
}
