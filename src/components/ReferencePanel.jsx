/**
 * ReferencePanel Component
 * ========================
 * Static quick-reference card with poker math formulas,
 * common outs, SPR ranges, and key rules.
 * Shown in the "Reference" tab of the right panel.
 */
import './ReferencePanel.css';

export default function ReferencePanel() {
  return (
    <div className="reference-panel">
      <section className="reference-panel__section">
        <h3 className="reference-panel__heading">Pot Odds</h3>
        <p className="reference-panel__formula">
          Pot Odds&nbsp;=&nbsp;Call&nbsp;/&nbsp;(Pot&nbsp;+&nbsp;Call)
        </p>
        <p className="reference-panel__note">
          Compare to your equity. If equity &gt; pot odds → call.
        </p>
      </section>

      <section className="reference-panel__section">
        <h3 className="reference-panel__heading">Implied Odds (F)</h3>
        <p className="reference-panel__formula">
          F&nbsp;=&nbsp;Call&nbsp;/&nbsp;Equity&nbsp;&minus;&nbsp;(Pot&nbsp;+&nbsp;Call)
        </p>
        <p className="reference-panel__note">
          F is the extra $ you must win on later streets. If F &gt; remaining stack → fold.
        </p>
      </section>

      <section className="reference-panel__section">
        <h3 className="reference-panel__heading">Equity Shortcuts</h3>
        <table className="reference-panel__table">
          <tbody>
            <tr><td>Rule of 2</td><td>Outs × 2</td><td>1 card to come</td></tr>
            <tr><td>Rule of 4</td><td>Outs × 4</td><td>2 cards (all-in only)</td></tr>
            <tr><td>Corrected</td><td>3 × Outs + 8</td><td>2 cards (≥9 outs)</td></tr>
          </tbody>
        </table>
      </section>

      <section className="reference-panel__section">
        <h3 className="reference-panel__heading">Common Outs</h3>
        <table className="reference-panel__table">
          <tbody>
            <tr><td>Flush draw</td><td className="reference-panel__mono">9</td></tr>
            <tr><td>Open-ended straight</td><td className="reference-panel__mono">8</td></tr>
            <tr><td>Overcards (2)</td><td className="reference-panel__mono">6</td></tr>
            <tr><td>Gutshot</td><td className="reference-panel__mono">4</td></tr>
            <tr><td>Set (pocket pair)</td><td className="reference-panel__mono">2</td></tr>
          </tbody>
        </table>
      </section>

      <section className="reference-panel__section">
        <h3 className="reference-panel__heading">SPR Quick Guide</h3>
        <table className="reference-panel__table">
          <tbody>
            <tr><td>SPR &lt; 4</td><td>Commit with top pair+</td></tr>
            <tr><td>SPR 4–10</td><td>Need two pair / strong draw</td></tr>
            <tr><td>SPR &gt; 10</td><td>Need sets / nut draws</td></tr>
          </tbody>
        </table>
      </section>

      <section className="reference-panel__section">
        <h3 className="reference-panel__heading">Set Mining</h3>
        <p className="reference-panel__formula">
          Need&nbsp;≥&nbsp;15&nbsp;×&nbsp;call&nbsp;in effective stacks
        </p>
      </section>

      <section className="reference-panel__section">
        <h3 className="reference-panel__heading">Draw Visibility</h3>
        <ul className="reference-panel__list">
          <li><span className="reference-panel__vis reference-panel__vis--high">HIGH</span> Overcards (A, K on board)</li>
          <li><span className="reference-panel__vis reference-panel__vis--medium">MED</span> Flush (third suit card)</li>
          <li><span className="reference-panel__vis reference-panel__vis--low">LOW</span> Straight (connected cards)</li>
          <li><span className="reference-panel__vis reference-panel__vis--hidden">HIDDEN</span> Sets / gutshots</li>
        </ul>
      </section>
    </div>
  );
}
