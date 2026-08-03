/**
 * MathReveal — progressive disclosure of the math steps.
 *
 * The reveal's job is to answer "what happened and why" without making the user
 * read a spreadsheet. These tests lock the contract that makes that true:
 * key steps show by default, everything else stays reachable, nothing is lost.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MathReveal from '../MathReveal.jsx';

const STEPS = [
  { label: 'Pot odds', value: '37.0%', status: 'key' },
  { label: 'Clean outs', value: '20 outs', formula: '9 flush + 6 straight + 5 pair', status: 'key' },
  { label: 'Flush outs', value: 'Any spade — 9 by your in-hand count', formula: '13 − 4 = 9' },
  { label: 'Straight outs', value: '5s and Ts — six of them off-suit', formula: '3 + 3' },
];

function renderReveal(extra = {}) {
  return render(
    <MathReveal
      isCorrect
      userAction="raise"
      correctAction="raise"
      insight="Semi-bluff spot."
      mathSteps={STEPS}
      takeaway="Raise."
      {...extra}
    />
  );
}

describe('math steps — default view', () => {
  it('shows key steps and hides non-key ones', async () => {
    renderReveal();
    await waitFor(() => expect(screen.getByText('Pot odds')).toBeInTheDocument(), { timeout: 4000 });
    await waitFor(() => expect(screen.getByText('Clean outs')).toBeInTheDocument(), { timeout: 4000 });

    expect(screen.queryByText('Flush outs')).not.toBeInTheDocument();
    expect(screen.queryByText('Straight outs')).not.toBeInTheDocument();
  });

  it('hides derivations until asked', async () => {
    renderReveal();
    await waitFor(() => expect(screen.getByText('Clean outs')).toBeInTheDocument(), { timeout: 4000 });
    expect(screen.queryByText(/9 flush \+ 6 straight/)).not.toBeInTheDocument();
  });

  it('lifts a short leading segment into the value column', async () => {
    renderReveal();
    await waitFor(() => expect(screen.getByText('Pot odds')).toBeInTheDocument(), { timeout: 4000 });
    // "37.0%" has no em-dash, so it renders whole.
    expect(screen.getByText('37.0%')).toBeInTheDocument();
  });
});

describe('math steps — disclosure', () => {
  it('reveals the hidden steps and derivations on request, losing nothing', async () => {
    renderReveal();

    const btn = await waitFor(
      () => screen.getByRole('button', { name: /show the full working/i }),
      { timeout: 5000 }
    );
    expect(btn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(btn);

    expect(screen.getByText('Flush outs')).toBeInTheDocument();
    expect(screen.getByText('Straight outs')).toBeInTheDocument();
    expect(screen.getByText(/9 flush \+ 6 straight/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hide the full working/i }))
      .toHaveAttribute('aria-expanded', 'true');
  });

  it('announces how many steps are hidden', async () => {
    renderReveal();
    const btn = await waitFor(
      () => screen.getByRole('button', { name: /show the full working/i }),
      { timeout: 5000 }
    );
    expect(btn.textContent).toMatch(/2 more/);
  });
});

describe('math steps — fallback when nothing is tagged key', () => {
  it('shows every step rather than an empty breakdown', async () => {
    renderReveal({
      mathSteps: [
        { label: 'Alpha', value: '1' },
        { label: 'Beta', value: '2' },
      ],
    });
    // Steps stagger in one phase at a time, so both need waiting for.
    await waitFor(() => expect(screen.getByText('Alpha')).toBeInTheDocument(), { timeout: 4000 });
    await waitFor(() => expect(screen.getByText('Beta')).toBeInTheDocument(), { timeout: 4000 });
  });
});
