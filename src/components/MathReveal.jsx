/**
 * MathReveal Component
 * ====================
 * Post-decision math breakdown with staggered progressive reveal.
 *
 * V1 sequence (curated scenarios — no proAction prop):
 *   1. Verdict (green ✓ or red ✗)
 *   2. Insight text
 *   3. Math steps (staggered)
 *   4. Takeaway card
 *
 * V2 sequence (real-hand scenarios — proAction prop present):
 *   1. Verdict
 *   2. You / The Pro / GTO verdict — three labeled rows (the "beat" card)
 *   3. Insight text
 *   4. Math steps (staggered)
 *   5. Takeaway card
 *
 * @param {Object}   props
 * @param {boolean}  props.isCorrect      - Whether user's decision matched the correct action
 * @param {string}   props.userAction     - What the user chose: "call","fold","raise"
 * @param {string}   props.correctAction  - The mathematically correct action
 * @param {string}   props.insight        - 1-2 sentence framing of the hand
 * @param {Array}    props.mathSteps      - Array of { label, value, formula?, status? }
 * @param {string}   props.takeaway       - Generalizable lesson
 * @param {Object}   [props.equity]       - EquityBar props (v1+v2)
 * @param {string}   [props.proAction]    - What the pro actually did (v2 only; triggers the beat card)
 * @param {string}   [props.proReasoning] - Optional short explanation of the pro's reasoning (v2 only)
 */
import { useState, useEffect } from 'react';
import './MathReveal.css';
import EquityBar from './EquityBar.jsx';

const STEP_REVEAL_DELAY = 300; // ms between each step (snappy)

/**
 * Compute a simple comparison label for the You/Pro/GTO beat card.
 * Returns one of:
 *   "outplayed"  — you matched GTO, pro didn't
 *   "both-wrong" — neither matched GTO
 *   "both-right" — both matched GTO
 *   "pro-right"  — pro matched GTO, you didn't
 */
/**
 * Normalize an action to a canonical token so a descriptive proAction
 * ("raised to 800,000 (semi-bluff)") compares correctly to a token correctAction ("raise").
 */
function canonicalAction(s) {
  const t = String(s || '').toLowerCase();
  if (/fold/.test(t)) return 'fold';
  if (/check/.test(t)) return 'check';
  if (/call/.test(t)) return 'call';
  if (/rais|bet|shov|jam|ship|all[\s-]?in|moved/.test(t)) return 'raise';
  return t.trim();
}

function compareActions(userAction, proAction, correctAction) {
  const youCorrect = canonicalAction(userAction) === canonicalAction(correctAction);
  const proCorrect = canonicalAction(proAction) === canonicalAction(correctAction);
  if (youCorrect && !proCorrect) return 'outplayed';
  if (!youCorrect && !proCorrect) return 'both-wrong';
  if (youCorrect && proCorrect) return 'both-right';
  return 'pro-right';
}

export default function MathReveal({
  isCorrect,
  userAction,
  correctAction,
  insight,
  mathSteps,
  takeaway,
  equity,
  proAction,
  proReasoning,
}) {
  const isV2 = proAction != null;
  const [revealPhase, setRevealPhase] = useState(0);

  // Phase layout:
  //   V1: 0=verdict, 1=insight, 2..N+1=steps, N+2=takeaway
  //   V2: 0=verdict, 1=beat-card, 2=insight, 3..N+2=steps, N+3=takeaway
  const phasesBeforeSteps = isV2 ? 3 : 2; // verdict + [beat-card] + insight
  const totalPhases = phasesBeforeSteps + mathSteps.length + 1;

  useEffect(() => {
    if (revealPhase >= totalPhases) return;

    const delay =
      revealPhase === 0 ? 500 :        // pause after verdict
      revealPhase === 1 ? 600 :        // pause after first card (beat or insight)
      revealPhase === 2 && isV2 ? 500 : // pause after insight in v2
      STEP_REVEAL_DELAY;

    const timer = setTimeout(() => setRevealPhase((p) => p + 1), delay);
    return () => clearTimeout(timer);
  }, [revealPhase, totalPhases, isV2]);

  const showVerdict = revealPhase >= 0;
  const showBeatCard = isV2 && revealPhase >= 1;
  const showInsight = isV2 ? revealPhase >= 2 : revealPhase >= 1;
  const visibleSteps = Math.max(0, revealPhase - phasesBeforeSteps);
  const showTakeaway = revealPhase >= totalPhases - 1;

  // V2 beat-card derived values
  const comparison = isV2 ? compareActions(userAction, proAction, correctAction) : null;
  const outplayedPro = comparison === 'outplayed';
  const matchedProMistake = comparison === 'both-wrong';

  return (
    <div className="math-reveal" aria-live="polite" aria-label="Decision analysis">
      {/*
        1. Verdict — TASK-FIRST, never ego-first.
        Kluger & DeNisi's meta-analysis (607 effect sizes) found feedback helps on
        average (d≈0.41) but that over a THIRD of feedback interventions actively
        make performance worse — and the driver is feedback aimed at the self
        rather than the task. "✗ Not quite." is precisely that failure mode: it
        grades the person before saying anything about the hand.
        So: no ✗, no "Correct!/Not quite." Lead with what the maths says, and
        report the user's choice as information rather than as a mark.
      */}
      {showVerdict && (
        <div className="math-reveal__verdict">
          <div
            className={`verdict__icon ${isCorrect ? 'verdict__icon--correct' : 'verdict__icon--incorrect'}`}
            aria-hidden="true"
          >
            {isCorrect ? '✓' : '→'}
          </div>
          <div className={`verdict__text ${isCorrect ? 'verdict__text--correct' : 'verdict__text--incorrect'}`}>
            {isCorrect
              ? `The maths backs your ${userAction}.`
              : `The maths favours ${correctAction} here.`}
          </div>
          <div className="verdict__detail">
            {isCorrect ? (
              <>Here&apos;s why <strong>{userAction}</strong> is the play.</>
            ) : (
              <>You played <strong>{userAction}</strong>. Here&apos;s what the numbers say.</>
            )}
          </div>
        </div>
      )}

      {/* 2. Beat card (V2 only) — You / The Pro / GTO verdict */}
      {showBeatCard && (
        <div className={`math-reveal__beat-card ${outplayedPro ? 'math-reveal__beat-card--outplayed' : ''}`}>
          <div className="beat-card__header">
            {outplayedPro && (
              <span className="beat-card__badge beat-card__badge--gold" role="status">You out-played the pro</span>
            )}
            {matchedProMistake && (
              <span className="beat-card__badge beat-card__badge--amber">Same mistake as the pro</span>
            )}
            {comparison === 'both-right' && (
              <span className="beat-card__badge beat-card__badge--green">You and the pro agreed</span>
            )}
            {comparison === 'pro-right' && (
              <span className="beat-card__badge beat-card__badge--neutral">Pro got it right</span>
            )}
          </div>
          <div className="beat-card__rows">
            <div className="beat-card__row">
              <span className="beat-card__label">You</span>
              <span className={`beat-card__action beat-card__action--${canonicalAction(userAction) === canonicalAction(correctAction) ? 'correct' : 'incorrect'}`}>
                {userAction}
              </span>
            </div>
            <div className="beat-card__row">
              <span className="beat-card__label">The Pro</span>
              <span className={`beat-card__action beat-card__action--${canonicalAction(proAction) === canonicalAction(correctAction) ? 'correct' : 'incorrect'}`}>
                {proAction}
              </span>
              {proReasoning && (
                <span className="beat-card__pro-reasoning">{proReasoning}</span>
              )}
            </div>
            <div className="beat-card__row">
              <span className="beat-card__label">GTO Verdict</span>
              <span className="beat-card__action beat-card__action--gto">
                {correctAction}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Insight (was 2 in V1) */}
      {showInsight && insight && (
        <div className="math-reveal__insight">
          {insight}
        </div>
      )}

      {/* Equity bars — the visual centerpiece (engine-computed) */}
      {showInsight && equity && (
        <div className="math-reveal__equity" style={{ margin: 'var(--space-4, 16px) 0 var(--space-2, 8px)' }}>
          <EquityBar {...equity} />
        </div>
      )}

      {/* Math Steps */}
      {visibleSteps > 0 && (
        <div className="math-reveal__steps">
          <div className="math-reveal__steps-header">Step-by-Step Breakdown</div>
          {mathSteps.slice(0, visibleSteps).map((step, i) => {
            const statusClass = step.status
              ? `math-step--${step.status}`
              : 'math-step--default';

            return (
              <div
                key={i}
                className={`math-step ${statusClass}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="math-step__left">
                  <div className="math-step__label">{step.label}</div>
                  {step.formula && (
                    <div className="math-step__formula">{step.formula}</div>
                  )}
                </div>
                <div className="math-step__value">{step.value}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Takeaway */}
      {showTakeaway && takeaway && (
        <div className="math-reveal__takeaway">
          <div className="takeaway__header">Takeaway</div>
          <div className="takeaway__text">{takeaway}</div>
        </div>
      )}
    </div>
  );
}
