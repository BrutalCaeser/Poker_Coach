/**
 * The v3 lesson, played end to end as a user would.
 * Locks the teaching contract: the decision is made before any maths, every
 * number shown matches the engine, the count gives feedback by kind, the
 * twist reveals his hand only after commitment, and the slider flips the
 * verdict at the computed break-even bet.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import LessonApp from '../LessonApp.jsx';

function stubStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    },
  });
  return store;
}

beforeEach(() => {
  vi.useFakeTimers();
  // Voice off: the replay dwells on timers instead of waiting for audio.
  stubStorage({ 'pd.v3.voice': '0' });
  globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ lines: {} }) }));
});

async function playToDecision() {
  render(<LessonApp />);
  fireEvent.click(screen.getByRole('button', { name: /take his seat/i }));
  // 5 replay steps; each dwells at most a few seconds when muted.
  for (let i = 0; i < 6; i++) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });
  }
  return screen.getByRole('group', { name: /your decision/i });
}

const next = () => fireEvent.click(screen.getByRole('button', { name: /^next$/i }));

describe('v3 lesson — before the decision', () => {
  it('never reveals his cards or any maths before you commit', async () => {
    await playToDecision();
    // His cards are face-down; the only cards named are yours and the board.
    expect(screen.getAllByLabelText('Face-down card')).toHaveLength(2);
    expect(screen.queryByText(/37%/)).toBeNull();
    expect(screen.queryByText(/in 100/)).toBeNull();
    expect(screen.queryByText(/nines/i)).toBeNull();
  });

  it('offers exactly fold / call 300K / raise to 800K', async () => {
    const group = await playToDecision();
    const labels = [...group.querySelectorAll('button')].map((b) => b.textContent);
    expect(labels).toEqual(['Fold', 'Call300K', 'Raiseto 800K']);
  });
});

describe('v3 lesson — the explanation', () => {
  it('walks price → count → compare → long run → twist → change his bet → pro → tool', async () => {
    const group = await playToDecision();
    fireEvent.click(group.querySelector('button:nth-child(2)')); // call

    // 1. Price — your share of the final pot
    expect(screen.getByRole('heading', { name: /you’d pay 37% of the pot/i })).toBeInTheDocument();
    expect(screen.getByText(/37 times in 100/)).toBeInTheDocument();
    next();

    // 2. Count — tap the spade row and fall for the 7♦ trap
    expect(screen.getByRole('heading', { name: /which cards win/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Select every ♠' }));
    fireEvent.click(screen.getByRole('button', { name: '7♦' }));
    fireEvent.click(screen.getByRole('button', { name: /check my 10/i }));

    expect(screen.getByRole('heading', { name: /18 of 46 cards win/i })).toBeInTheDocument();
    expect(screen.getByText('You found 9 of 18.')).toBeInTheDocument();
    expect(screen.getByText(/any 5 or 10 finishes/i)).toBeInTheDocument();
    expect(screen.getByText(/kings beat nines/i)).toBeInTheDocument();
    expect(screen.getByText(/sevens lose to nines/i)).toBeInTheDocument();
    next();

    // 3. Compare — same unit, task-first reflection on the choice
    expect(screen.getByRole('heading', { name: /39 beats 37/i })).toBeInTheDocument();
    expect(screen.getByText(/you called/i)).toBeInTheDocument();
    next();

    // 4. Long run — 39 wins, 61 losses, still ahead
    expect(screen.getByRole('heading', { name: /play it 100 times/i })).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(screen.getByText('+1.59M')).toBeInTheDocument();
    expect(screen.getByText(/lose 61 of them/i)).toBeInTheDocument();
    next();

    // 5. Twist — his real cards, only now; the Q♠ was one of your outs
    expect(screen.getByRole('heading', { name: /what you couldn’t see/i })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: 'Q♠' }).length).toBeGreaterThan(0);
    expect(screen.getByText(/the Q♠, was in his hand/i)).toBeInTheDocument();
    expect(screen.getByText('17 of 44')).toBeInTheDocument();
    next();

    // 6. Change his bet — the verdict flips past the break-even bet
    const slider = screen.getByLabelText(/farha bets/i);
    expect(screen.getByText(/^Call\./)).toBeInTheDocument();
    fireEvent.change(slider, { target: { value: '370000' } });
    expect(screen.getByText(/^Call\./)).toBeInTheDocument();
    fireEvent.change(slider, { target: { value: '390000' } });
    expect(screen.getByText(/^Fold\./)).toBeInTheDocument();
    expect(screen.getByText(/more than about 380K/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /what moneymaker did/i }));

    // 7. The pro
    expect(screen.getByRole('heading', { name: /he raised to 800K/i })).toBeInTheDocument();
    next();

    // 8. Tool — numbers in the example come from the engine, and it's saved
    expect(screen.getByText(/here: 18 of 46 cards win, about 39 in 100\. you pay 37 in 100\./i)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('pd.v3.toolkit'))).toContain('share-vs-price');
  });

  it('a perfect count is recognised', async () => {
    const group = await playToDecision();
    fireEvent.click(group.querySelector('button:nth-child(2)'));
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Select every ♠' }));
    ['5♥', '5♦', '5♣', '10♥', '10♦', '10♣', 'K♥', 'K♦', 'K♣'].forEach((n) =>
      fireEvent.click(screen.getByRole('button', { name: n }))
    );
    fireEvent.click(screen.getByRole('button', { name: /check my 18/i }));
    expect(screen.getByText('All 18. Exactly right.')).toBeInTheDocument();
  });
});
