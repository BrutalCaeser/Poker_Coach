/**
 * The game, played as a learner would, on the real generated spots.
 * Seeds are reproducible (salt + step + mode + attempt), so the test can work
 * out the right answer for exactly the spot on screen, using the same engine.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import GameApp from '../GameApp.jsx';
import { genDrawSpot, genPrice, genDecide, genChain, seedFor } from '../variation.js';
import { STORAGE_KEY } from '../progress.js';

const SALT = 777;
const NOW = Date.UTC(2026, 9, 12, 12);
const seed = (step, n, mode = 'learn') => seedFor(SALT, step, mode, n);

const LABEL = { A: 'A', K: 'K', Q: 'Q', J: 'J', T: '10' };
const SUIT = { s: '♠', h: '♥', d: '♦', c: '♣' };
const cardName = (id) => `${LABEL[id[0]] ?? id[0]}${SUIT[id[1]]}`;

function memStorage() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) };
}

let storage;
beforeEach(() => {
  storage = memStorage();
  globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ lines: {} }) }));
});

const renderGame = (props = {}) => render(<GameApp salt={SALT} now={() => NOW} storage={storage} demo={false} {...props} />);
const click = (name) => fireEvent.click(screen.getByRole('button', { name }));

function solveOuts(n) {
  const spot = genDrawSpot(seed('outs', n));
  for (const c of spot.grid.flat()) if (c.wins) fireEvent.click(screen.getByRole('button', { name: cardName(c.id) }));
  click(new RegExp(`^check ${spot.outs}$`, 'i'));
  return spot;
}

describe('the table', () => {
  it('shows his cards face down and our read as a separate tag, never as his cards', () => {
    renderGame();
    click('Count your outs');
    const spot = genDrawSpot(seed('outs', 0));
    expect(screen.getAllByRole('img', { name: 'His card, face down' })).toHaveLength(2);
    const plural = { 14: 'aces', 13: 'kings', 12: 'queens', 11: 'jacks', 10: 'tens', 9: 'nines', 8: 'eights', 7: 'sevens', 6: 'sixes', 5: 'fives', 4: 'fours', 3: 'threes', 2: 'twos' }[spot.pairRank];
    expect(screen.getByLabelText(`Our read: pair of ${plural}`)).toBeInTheDocument();
    // exactly one board card is ringed: the one his read pairs with
    expect(document.querySelectorAll('.gx-bcard.is-read')).toHaveLength(1);
  });

  it('keeps the same four places on every step', () => {
    renderGame({ demo: true });
    for (const name of [/count your outs\. cleared/i, /outs into a chance\. cleared/i, /your price\. cleared/i, /call or fold\. cleared/i, /the full line\. cleared/i]) {
      fireEvent.click(screen.getByRole('button', { name }));
      for (const z of ['him', 'river', 'pot', 'you']) expect(document.querySelectorAll(`.gx-stage [data-zone="${z}"]`)).toHaveLength(1);
      click(/back to the path/i);
    }
  });
});

describe('the path', () => {
  it('opens on step 1 only; everything else, and the boss, is locked', () => {
    renderGame();
    expect(screen.getByRole('heading', { name: /can i afford to chase/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /count your outs\. start/i })).toBeEnabled();
    for (const t of [/outs into a chance\. locked/i, /your price\. locked/i, /call or fold\. locked/i, /the full line\. locked/i, /moneymaker vs farha\. locked/i]) {
      expect(screen.getByRole('button', { name: t })).toBeDisabled();
    }
  });
});

describe('mastery gate: three in a row on three different spots', () => {
  it('clears step 1 only after 3 consecutive perfect counts, then unlocks step 2', () => {
    renderGame();
    click('Count your outs');

    const spots = [];
    for (let n = 0; n < 3; n++) {
      spots.push(solveOuts(n));
      expect(screen.getByText('Right')).toBeInTheDocument();
      expect(screen.getByText(/^all \d+ found$/i)).toBeInTheDocument();
      expect(screen.getAllByRole('img', { name: `${n + 1} of 3 in a row` }).length).toBeGreaterThan(0);
      click(n < 2 ? /next hand/i : /step cleared/i);
    }
    expect(new Set(spots.map((s) => s.hero.join() + s.board.join())).size).toBe(3);

    expect(screen.getByRole('heading', { name: /you can count outs/i })).toBeInTheDocument();
    const unlock = screen.getByText('Unlocked').closest('p');
    expect(within(unlock).getByText('Outs into a chance')).toBeInTheDocument();
    expect(JSON.parse(storage.getItem(STORAGE_KEY)).steps.outs.mastered).toBe(true);
  });

  it('a miss resets the run; feedback leads with a cue; the hint opens after two misses', () => {
    renderGame();
    click('Count your outs');

    const miss = (n) => {
      const spot = genDrawSpot(seed('outs', n));
      const dud = spot.grid.flat().find((c) => !c.seen && !c.wins);
      fireEvent.click(screen.getByRole('button', { name: cardName(dud.id) }));
      click(/^check 1$/i);
      expect(screen.getByText('Not quite')).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`^0 of ${spot.outs} found$`))).toBeInTheDocument();
      expect(screen.getAllByRole('img', { name: '0 of 3 in a row' }).length).toBeGreaterThan(0);
      click(/next hand/i);
    };
    miss(0);
    expect(screen.queryByText(/look for three kinds of card/i)).toBeNull();
    miss(1);
    expect(screen.getByText(/look for three kinds of card/i)).toBeInTheDocument();

    // Hints cost something: right with the hint open resets the misses but
    // does not advance the run ("3 in a row" means three unaided).
    solveOuts(2);
    expect(screen.getByText('Right')).toBeInTheDocument();
    expect(screen.getByText('not counted')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: '0 of 3 in a row' }).length).toBeGreaterThan(0);
    click(/next hand/i);
    expect(screen.queryByText(/look for three kinds of card/i)).toBeNull(); // misses reset, so the hint has faded
  });

  it('"Why?" reveals the full explanation only on request', () => {
    renderGame();
    click('Count your outs');
    const spot = genDrawSpot(seed('outs', 0));
    const dud = spot.grid.flat().find((c) => !c.seen && !c.wins);
    fireEvent.click(screen.getByRole('button', { name: cardName(dud.id) }));
    click(/^check 1$/i);
    const why = screen.getByRole('button', { name: 'Why?' });
    expect(why).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(why);
    expect(screen.getByRole('button', { name: 'Less' })).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('estimates are graded with a tolerance, not exactly', () => {
  it('accepts the rule-of-2 answer for the chance step', () => {
    renderGame({ demo: true });
    fireEvent.click(screen.getByRole('button', { name: /outs into a chance\. cleared/i }));
    const spot = genDrawSpot(seed('chance', 0));
    expect(screen.getByRole('img', { name: `${spot.outs} of ${spot.unseen} cards win` })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/you win, in 100/i), { target: { value: String(spot.outs * 2) } });
    click(/^check$/i);
    expect(screen.getByText('Right')).toBeInTheDocument();
  });
});

describe('both seats', () => {
  it('the price step alternates between your seat and his', () => {
    renderGame({ demo: true });
    fireEvent.click(screen.getByRole('button', { name: /your price\. cleared/i }));
    const first = screen.getByRole('heading', { level: 1 }).textContent;
    const v = genPrice(seed('price', 0), first.includes('his') ? 'bettor' : 'caller');
    fireEvent.change(screen.getByLabelText(/slice, in 100/i), { target: { value: String(Math.round(v.price * 100)) } });
    click(/^check$/i);
    click(/next hand/i);
    const second = screen.getByRole('heading', { level: 1 }).textContent;
    expect(new Set([first, second])).toEqual(new Set(['What’s your price?', 'What’s his price?']));
  });

  it('the decide step labels the bettor seat from his side', () => {
    renderGame({ demo: true });
    fireEvent.click(screen.getByRole('button', { name: /call or fold\. cleared/i }));
    const h = screen.getByRole('heading', { level: 1 }).textContent;
    const seat = h === 'Should he call?' ? 'bettor' : 'caller';
    const v = genDecide(seed('decide', 0), seat);
    fireEvent.click(screen.getByRole('button', { name: seat === 'bettor' ? `He should ${v.answer}` : v.answer === 'call' ? 'Call' : 'Fold' }));
    expect(screen.getByText('Right')).toBeInTheDocument();
    expect(screen.getByText(/→ (call|fold)$/)).toBeInTheDocument(); // the cue: "20 < 33 → fold"
  });
});

function playLine(v, { slipOuts = false } = {}) {
  if (slipOuts) {
    const dud = v.grid.flat().find((c) => !c.seen && !c.wins);
    fireEvent.click(screen.getByRole('button', { name: cardName(dud.id) }));
  } else {
    for (const c of v.grid.flat()) if (c.wins) fireEvent.click(screen.getByRole('button', { name: cardName(c.id) }));
  }
  click(/^check/i);
  click(/next: chance/i);
  expect(screen.getByRole('img', { name: `${v.outs} of ${v.unseen} cards win` })).toBeInTheDocument(); // the TRUE count carries forward
  fireEvent.change(screen.getByLabelText(/you win, in 100/i), { target: { value: String(Math.round(v.chance * 100)) } });
  click(/^check$/i);
  click(/next: price/i);
  fireEvent.change(screen.getByLabelText(/slice, in 100/i), { target: { value: String(Math.round(v.price * 100)) } });
  click(/^check$/i);
  click(/next: decision/i);
  click(v.answer === 'call' ? /^call$/i : /^fold$/i);
}

describe('the full line', () => {
  it('clears only when all four steps are right, and reports each one', () => {
    renderGame({ demo: true });
    fireEvent.click(screen.getByRole('button', { name: /the full line\. cleared/i }));
    playLine(genChain(seed('chain', 0)));
    expect(screen.getByText('Line cleared')).toBeInTheDocument();
    const rows = within(screen.getByRole('list', { name: 'Your line' })).getAllByRole('listitem');
    expect(rows).toHaveLength(4);
    rows.forEach((r) => expect(r).toHaveClass('is-right'));
  });

  it('one slip fails the line, and the line shows where', () => {
    renderGame({ demo: true });
    fireEvent.click(screen.getByRole('button', { name: /the full line\. cleared/i }));
    playLine(genChain(seed('chain', 0)), { slipOuts: true });
    expect(screen.getByText('Not this time')).toBeInTheDocument();
    expect(screen.getByText(/^3 of 4 right/)).toBeInTheDocument();
    const rows = within(screen.getByRole('list', { name: 'Your line' })).getAllByRole('listitem');
    expect(rows[0]).toHaveClass('is-off');
  });

  it('drops the "+ your call" scaffold: the full line tests recall', () => {
    renderGame({ demo: true });
    fireEvent.click(screen.getByRole('button', { name: /the full line\. cleared/i }));
    const v = genChain(seed('chain', 0));
    for (const c of v.grid.flat()) if (c.wins) fireEvent.click(screen.getByRole('button', { name: cardName(c.id) }));
    click(/^check/i);
    click(/next: chance/i);
    fireEvent.change(screen.getByLabelText(/you win, in 100/i), { target: { value: '20' } });
    click(/^check$/i);
    click(/next: price/i);
    expect(screen.queryByText('your call')).toBeNull();
    expect(screen.getByText('his bet')).toBeInTheDocument();
  });
});

describe('the boss and the stop screen', () => {
  it('the boss opens only after the full line, and "Done" ends the session', () => {
    renderGame({ demo: true });
    expect(screen.getByRole('button', { name: /moneymaker vs farha, 2003\. play the hand/i })).toBeEnabled();
    click(/^done$/i);
    expect(screen.getByText(/a little each day/i)).toBeInTheDocument();
    click(/back to the path/i);
    click(/moneymaker vs farha, 2003/i);
    expect(screen.getByRole('button', { name: /take his seat/i })).toBeInTheDocument();
  });
});
