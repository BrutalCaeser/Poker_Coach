/**
 * MathReveal Component
 * ====================
 * Post-decision math breakdown with staggered progressive reveal.
 *
 * Sequence:
 * 1. Verdict (green ✓ or red ✗) — big animation
 * 2. Insight text
 * 3. Math steps — each appears with staggered 500ms delay
 *    Each step: left = label + formula (serif), right = value (mono, colored)
 *    Status: pass=green, fail=red, warning=gold, key=gold accent
 * 4. Takeaway card
 *
 * @param {Object}   props
 * @param {boolean}  props.isCorrect     - Whether user's decision matched the correct action
 * @param {string}   props.userAction    - What the user chose: "call","fold","raise"
 * @param {string}   props.correctAction - The mathematically correct action
 * @param {string}   props.insight       - 1-2 sentence framing of the hand
 * @param {Array}    props.mathSteps     - Array of { label, value, formula?, status? }
 * @param {string}   props.takeaway      - Generalizable lesson
 */
import { useState, useEffect } from 'react';
import './MathReveal.css';

const STEP_REVEAL_DELAY = 300; // ms between each step (snappy)

export default function MathReveal({
  isCorrect,
  userAction,
  correctAction,
  insight,
  mathSteps,
  takeaway,
}) {
  const [revealPhase, setRevealPhase] = useState(0);
  // Phase 0: verdict, 1: insight, 2+: math steps (one per phase), final: takeaway

  const totalPhases = 2 + mathSteps.length + 1; // verdict + insight + steps + takeaway

  useEffect(() => {
    if (revealPhase >= totalPhases) return;

    const delay = revealPhase === 0 ? 500 : // Pause after verdict
      revealPhase === 1 ? 600 :              // Pause after insight
        STEP_REVEAL_DELAY;                     // Each step

    const timer = setTimeout(() => {
      setRevealPhase((p) => p + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [revealPhase, totalPhases]);

  const showVerdict = revealPhase >= 0;
  const showInsight = revealPhase >= 1;
  const visibleSteps = Math.max(0, revealPhase - 2);
  const showTakeaway = revealPhase >= totalPhases - 1;

  return (
    <div className="math-reveal">
      {/* 1. Verdict */}
      {showVerdict && (
        <div className="math-reveal__verdict">
          <div className={`verdict__icon ${isCorrect ? 'verdict__icon--correct' : 'verdict__icon--incorrect'}`}>
            {isCorrect ? '✓' : '✗'}
          </div>
          <div className={`verdict__text ${isCorrect ? 'verdict__text--correct' : 'verdict__text--incorrect'}`}>
            {isCorrect ? 'Correct!' : 'Not quite.'}
          </div>
          <div className="verdict__detail">
            You chose to <strong>{userAction}</strong>.
            {!isCorrect && (
              <> The mathematically correct play was to <strong>{correctAction}</strong>.</>
            )}
          </div>
        </div>
      )}

      {/* 2. Insight */}
      {showInsight && insight && (
        <div className="math-reveal__insight">
          {insight}
        </div>
      )}

      {/* 3. Math Steps */}
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

      {/* 4. Takeaway */}
      {showTakeaway && takeaway && (
        <div className="math-reveal__takeaway">
          <div className="takeaway__header">Takeaway</div>
          <div className="takeaway__text">{takeaway}</div>
        </div>
      )}
    </div>
  );
}
