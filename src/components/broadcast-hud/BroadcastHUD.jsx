/**
 * BroadcastHUD
 * ============
 * Broadcast TV-graphics overlay for the poker decision / reveal phase.
 * Presentational — positioning is controlled by the parent via CSS classes.
 *
 * Props:
 *   heroHand    string|null   Hand-strength label (e.g. "FLUSH DRAW", "TOP PAIR").
 *                             Shown as a gold-bordered pill when set.
 *   toCall      number        Amount to call. Strip is hidden when 0 or falsy.
 *   potOdds     string|null   Formatted ratio string, e.g. "3.2:1".
 *                             Shown next to toCall; omitted when null.
 *   equity      object|null   If provided, renders <EquityBarBroadcast> with:
 *                               { heroEquityPct, villainEquityPct?, heroLabel?, villainLabel?, breakEvenPct? }
 *   phase       string        Hint for parent — "decision" | "reveal" | etc.
 *                             BroadcastHUD adds a data-phase attr for optional CSS targeting.
 *
 * Usage:
 *   <BroadcastHUD
 *     heroHand="FLUSH DRAW"
 *     toCall={12}
 *     potOdds="3.2:1"
 *     equity={{ heroEquityPct: 38.6, heroLabel: 'You' }}
 *   />
 *
 * To position as an absolute overlay, give the parent relative positioning
 * and add class "bhud--overlay" to the rendered element via a wrapper.
 */

import EquityBarBroadcast from './EquityBarBroadcast.jsx';
import './BroadcastHUD.css';

export default function BroadcastHUD({
  heroHand = null,
  toCall = 0,
  potOdds = null,
  equity = null,
  phase,
}) {
  const hasHand = Boolean(heroHand);
  const hasCall = toCall > 0;
  const hasEquity = equity != null;

  // Nothing to render
  if (!hasHand && !hasCall && !hasEquity) return null;

  return (
    <div
      className="bhud"
      data-phase={phase || undefined}
      aria-label="Broadcast HUD"
    >
      {/* ── Hand-strength label pill ── */}
      {hasHand && (
        <div className="bhud__hand-label" role="status" aria-live="polite">
          <span className="bhud__hand-label-text">{heroHand}</span>
        </div>
      )}

      {/* ── Win-% bar ── */}
      {hasEquity && (
        <EquityBarBroadcast
          heroEquityPct={equity.heroEquityPct}
          villainEquityPct={equity.villainEquityPct}
          heroLabel={equity.heroLabel}
          villainLabel={equity.villainLabel}
          breakEvenPct={equity.breakEvenPct}
        />
      )}

      {/* ── To-call / pot-odds strip ── */}
      {hasCall && (
        <div className="bhud__call-strip" aria-label={`To call $${toCall}${potOdds ? `, pot odds ${potOdds}` : ''}`}>
          <span className="bhud__call-label">To Call</span>
          <span className="bhud__call-amount">${toCall}</span>

          {potOdds && (
            <>
              <span className="bhud__call-divider" aria-hidden="true" />
              <span className="bhud__pot-odds-label">Pot Odds</span>
              <span className="bhud__pot-odds-value">{potOdds}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
