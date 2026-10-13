/**
 * EstimateSlider — "about how many times in 100?"
 *
 * Estimation is the skill being trained, so the control is built for it: a big
 * readout, a thumb-sized slider, and ±1 nudges for the last bit of precision.
 * It starts EMPTY (no default value) so it can't anchor the guess, and Check
 * stays disabled until the learner has actually chosen a number.
 *
 * The label and the readout read as one phrase: "You win [18] in 100".
 */
export default function EstimateSlider({ id, value, onChange, max = 60, label, disabled = false }) {
  const shown = value == null ? '—' : value;
  const set = (v) => onChange(Math.max(0, Math.min(max, v)));
  return (
    <div className="gx-est">
      <label htmlFor={id} className="gx-est__label">{label}</label>
      <div className="gx-est__readout" aria-live="polite">
        <span className="gx-est__n">{shown}</span>
        <span className="gx-est__unit">in 100</span>
      </div>
      <div className="gx-est__row">
        <button type="button" className="gx-est__nudge" onClick={() => set((value ?? 0) - 1)} disabled={disabled || value == null} aria-label="One less">−</button>
        <input
          id={id}
          aria-label={`${label}, in 100`}
          type="range"
          min={0}
          max={max}
          step={1}
          value={value ?? 0}
          disabled={disabled}
          onChange={(e) => set(Number(e.target.value))}
          className={value == null ? 'is-untouched' : ''}
        />
        <button type="button" className="gx-est__nudge" onClick={() => set((value ?? 0) + 1)} disabled={disabled} aria-label="One more">+</button>
      </div>
      <div className="gx-est__ends" aria-hidden="true"><span>0</span><span>{max}</span></div>
    </div>
  );
}
