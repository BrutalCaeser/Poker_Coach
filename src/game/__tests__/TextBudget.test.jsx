/**
 * Text budget — "less is more", enforced.
 *
 * The founder's rule for this product: more text never helps; visual cues do.
 * These budgets hold every screen at its current word count, so a future
 * change can't quietly put the sentences back: adding a word means changing a
 * number here, on purpose. Counted before answering: the moment a learner is
 * thinking.
 *
 * Re-baselined 2026-10-13 with a reader-accurate counter. The first version
 * read textContent, which glues adjacent spans into one token ("Our read" +
 * "pair of aces" → "readpair"), so it under-counted every screen.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import GameApp from '../GameApp.jsx';

const mem = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) };
};
/*
 * Words as a reader meets them. Every text node counts on its own, so adjacent
 * spans ("Our read" + "pair of aces") can't merge into one token the way
 * textContent glues them. Cards and the deck grid are skipped: they are the
 * pictures, not reading.
 */
const VISUAL = '.lx-card, .lx-grid, [aria-hidden="true"]';
const wordList = () => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest(VISUAL) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const parts = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) parts.push(n.nodeValue);
  return parts.join(' ').split(/\s+/).filter((w) => /[a-z]/i.test(w));
};
const words = () => wordList().length;

// outs includes the one-time grid tip (11 words) shown on a learner's first hand.
const BUDGET = { path: 42, outs: 31, chance: 26, price: 29, decide: 24, line: 19 };

describe('text budget per screen (words, before answering)', () => {
  it('stays within budget across several generated spots', () => {
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ lines: {} }) }));
    for (const salt of [1, 2, 3]) {
      render(<GameApp salt={salt} now={() => 0} storage={mem()} demo />);
      expect(words(), 'path').toBeLessThanOrEqual(BUDGET.path);
      for (const [key, name] of [
        ['outs', /count your outs\. cleared/i],
        ['chance', /outs into a chance\. cleared/i],
        ['price', /your price\. cleared/i],
        ['decide', /call or fold\. cleared/i],
        ['line', /the full line\. cleared/i],
      ]) {
        fireEvent.click(screen.getByRole('button', { name }));
        expect(words(), key).toBeLessThanOrEqual(BUDGET[key]);
        fireEvent.click(screen.getByRole('button', { name: /back to the path/i }));
      }
      cleanup();
    }
  });
});
