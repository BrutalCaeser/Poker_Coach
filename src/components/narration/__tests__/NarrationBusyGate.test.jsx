/**
 * NarrationPlayer — the busy gate.
 *
 * REGRESSION UNDER TEST (reported 2026-08-02): the hand feed auto-advanced on
 * fixed 1-1.8s timers while narration lines run 7-19s, so every line was cut off
 * the moment the next beat (flop/turn/river) rendered.
 *
 * The contract these tests lock:
 *   1. While a line is playing, the player reports busy -> the feed holds.
 *   2. When the line ends, busy is released -> the feed continues.
 *   3. EVERY failure path releases the feed. A stuck `true` would freeze the
 *      hand permanently, which is far worse than losing the audio.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NarrationPlayer from '../NarrationPlayer.jsx';

const SCENARIO = 'test-hand';
const MANIFEST = {
  version: 1,
  lines: {
    'test-hand/open': {
      opus: '/vo/test-hand/open.aaaa1111.opus',
      mp3: '/vo/test-hand/open.aaaa1111.mp3',
      dur: 18.7,
      hash: 'aaaa1111',
      voice: 'am_michael',
      text: 'Two thousand three. The final table.',
    },
    'test-hand/turn': {
      opus: '/vo/test-hand/turn.bbbb2222.opus',
      mp3: '/vo/test-hand/turn.bbbb2222.mp3',
      dur: 8.2,
      hash: 'bbbb2222',
      voice: 'am_michael',
      text: "There's your third spade.",
    },
  },
};

/**
 * Deterministic in-memory localStorage. The component persists the commentary
 * and caption preferences, so tests must start from a known-empty store —
 * and this keeps the suite independent of jsdom storage quirks.
 */
function installLocalStorageStub() {
  const store = new Map();
  const stub = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    key: (i) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: stub,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  installLocalStorageStub();
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(MANIFEST) })
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function renderEnabled(props = {}) {
  const onBusyChange = vi.fn();
  const utils = render(
    <NarrationPlayer
      scenarioId={SCENARIO}
      commentator={{ name: 'Cal Brennan', role: 'Commentary booth' }}
      voId="open"
      text={MANIFEST.lines['test-hand/open'].text}
      onBusyChange={onBusyChange}
      {...props}
    />
  );
  // Manifest arrives async; the control only renders once audio is known to exist.
  const toggle = await waitFor(() =>
    screen.getByRole('button', { name: /listen to cal brennan/i })
  );
  fireEvent.click(toggle); // opt in — this is the gesture that unlocks audio
  return { ...utils, onBusyChange };
}

function getAudio(container) {
  return container.querySelector('audio');
}

describe('busy gate — holds the feed while speaking', () => {
  it('reports busy when playback starts', async () => {
    const { container, onBusyChange } = await renderEnabled();
    fireEvent.play(getAudio(container));
    expect(onBusyChange).toHaveBeenCalledWith(true);
  });

  it('releases when the line ends', async () => {
    const { container, onBusyChange } = await renderEnabled();
    const audio = getAudio(container);

    fireEvent.play(audio);
    expect(onBusyChange).toHaveBeenLastCalledWith(true);

    fireEvent.ended(audio);
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
  });

  it('does not report busy before anything plays', async () => {
    const onBusyChange = vi.fn();
    render(
      <NarrationPlayer
        scenarioId={SCENARIO}
        commentator={{ name: 'Cal Brennan' }}
        voId="open"
        text="x"
        onBusyChange={onBusyChange}
      />
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /listen to cal brennan/i })).toBeInTheDocument()
    );
    expect(onBusyChange).not.toHaveBeenCalledWith(true);
  });
});

describe('busy gate — every failure path releases the feed', () => {
  it('releases on a media error', async () => {
    const { container, onBusyChange } = await renderEnabled();
    const audio = getAudio(container);
    fireEvent.play(audio);
    fireEvent.error(audio);
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
  });

  it('releases on pause', async () => {
    const { container, onBusyChange } = await renderEnabled();
    const audio = getAudio(container);
    fireEvent.play(audio);
    fireEvent.pause(audio);
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
  });

  it('releases when the user turns commentary off mid-line', async () => {
    const { container, onBusyChange } = await renderEnabled();
    fireEvent.play(getAudio(container));
    expect(onBusyChange).toHaveBeenLastCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: /turn commentary off/i }));
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
  });

  it('releases on unmount mid-line', async () => {
    const { container, onBusyChange, unmount } = await renderEnabled();
    fireEvent.play(getAudio(container));
    expect(onBusyChange).toHaveBeenLastCalledWith(true);

    unmount();
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
  });

  it('releases when the line disappears (no audio for this beat)', async () => {
    const { container, onBusyChange, rerender } = await renderEnabled();
    fireEvent.play(getAudio(container));
    expect(onBusyChange).toHaveBeenLastCalledWith(true);

    // A beat with no narration — feed must not be held hostage.
    rerender(
      <NarrationPlayer
        scenarioId={SCENARIO}
        commentator={{ name: 'Cal Brennan' }}
        voId="does-not-exist"
        text={undefined}
        onBusyChange={onBusyChange}
      />
    );
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
  });
});

describe('busy gate — a scenario with no baked audio', () => {
  // NB: the manifest is deliberately module-cached (one file serves every
  // scenario), so this asserts the real guard — a scenario with no lines in the
  // manifest must render no control and never hold the feed. The 15 curated v1
  // hands depend on exactly this.
  it('renders nothing and never holds the feed', async () => {
    const onBusyChange = vi.fn();
    const { container } = render(
      <NarrationPlayer
        scenarioId="unbaked-hand"
        commentator={{ name: 'Cal Brennan' }}
        voId="open"
        text="x"
        onBusyChange={onBusyChange}
      />
    );

    // Give the manifest (cached or fetched) a chance to resolve either way.
    await waitFor(() =>
      expect(container.querySelector('[data-testid="narration-player"]')).toBeNull()
    );
    expect(onBusyChange).not.toHaveBeenCalledWith(true);
  });
});
