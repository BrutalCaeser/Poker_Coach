/**
 * NarrationPlayer — the commentary booth.
 * =======================================
 * Plays the pre-baked commentator line for the current hand beat.
 *
 * DESIGN CONSTRAINTS (each one is load-bearing, not preference):
 *
 * 1. AUDIO CANNOT AUTOPLAY. Every browser in 2026 requires a user gesture before
 *    audio with sound will play. So commentary is opt-in via one explicit tap,
 *    which doubles as the gesture that unlocks the audio element for the session.
 *    Until then the product works exactly as before, silently.
 *
 * 2. CAPTIONS ARE OFF BY DEFAULT. Narrating text while displaying the same text
 *    verbatim is the redundancy effect (Kalyuga, Chandler & Sweller 2004) and
 *    measurably hurts comprehension. But captions must be *available*: WCAG 1.2.2
 *    requires them for prerecorded audio, and non-native listeners benefit. So:
 *    available, discoverable, off by default.
 *
 * 3. NUMBERS ARE NEVER CARRIED BY AUDIO ALONE. Spoken numbers vanish (the
 *    transient information effect) and a misheard figure breaks the lesson. The
 *    script speaks numbers loosely ("more than the size of the pot") while the
 *    precise values stay on screen in the table and the reveal.
 *
 * 4. IT MUST DEGRADE TO SILENCE. If the manifest is missing, a line is missing,
 *    or playback fails, the component renders nothing and the hand plays as text.
 *    Content-hashed filenames mean a stale manifest 404s rather than serving
 *    audio that contradicts the script.
 *
 * The commentator is an ORIGINAL FICTIONAL CHARACTER (see the scenario's
 * `commentator` block). Never wire this to an imitation of a real person's voice.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import './NarrationPlayer.css';

const MANIFEST_URL = '/vo/manifest.json';
const LS_ENABLED = 'pd.vo.enabled';
const LS_CAPTIONS = 'pd.vo.captions';

/* ── manifest (fetched once, module-scoped cache) ─────────────── */

let manifestCache = null;
let manifestPromise = null;

function loadManifest() {
  if (manifestCache) return Promise.resolve(manifestCache);
  if (manifestPromise) return manifestPromise;
  manifestPromise = fetch(MANIFEST_URL)
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      manifestCache = json ?? { lines: {} };
      return manifestCache;
    })
    .catch(() => {
      manifestCache = { lines: {} };
      return manifestCache;
    });
  return manifestPromise;
}

function readFlag(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === '1';
  } catch {
    return fallback;
  }
}

function writeFlag(key, value) {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    /* storage unavailable — fall through, state is still session-local */
  }
}

/* ── component ────────────────────────────────────────────────── */

/**
 * @param {Object}  props
 * @param {string}  props.scenarioId   – scenario id (manifest namespace)
 * @param {Object}  [props.commentator] – { name, role } for the booth label
 * @param {string}  [props.voId]       – narration line id for the current beat
 * @param {string}  [props.text]       – that line's text, for captions
 */
export default function NarrationPlayer({ scenarioId, commentator, voId, text }) {
  const audioRef = useRef(null);
  const [manifest, setManifest] = useState(manifestCache);
  const [enabled, setEnabled] = useState(() => readFlag(LS_ENABLED, false));
  const [captions, setCaptions] = useState(() => readFlag(LS_CAPTIONS, false));
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let alive = true;
    loadManifest().then((m) => alive && setManifest(m));
    return () => {
      alive = false;
    };
  }, []);

  const line = manifest?.lines?.[`${scenarioId}/${voId}`] ?? null;

  /* Play the current line whenever it changes and commentary is on.
     NB: an <audio> element does NOT pick up a changed <source src> on its own —
     load() is required, or every beat would replay the first line's audio. */
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !enabled || !line) return;

    el.load(); // also resets currentTime to 0
    const p = el.play();
    if (p?.catch) p.catch(() => setPlaying(false)); // blocked or unsupported → stay silent
  }, [line, enabled]);

  const toggleEnabled = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      writeFlag(LS_ENABLED, next);
      const el = audioRef.current;
      if (!next && el) {
        el.pause();
        setPlaying(false);
      } else if (next && el && line) {
        // This click IS the user gesture that unlocks audio for the session.
        el.load();
        const p = el.play();
        if (p?.catch) p.catch(() => setPlaying(false));
      }
      return next;
    });
  }, [line]);

  const toggleCaptions = useCallback(() => {
    setCaptions((prev) => {
      const next = !prev;
      writeFlag(LS_CAPTIONS, next);
      return next;
    });
  }, []);

  const replay = useCallback(() => {
    const el = audioRef.current;
    if (!el || !line) return;
    el.currentTime = 0;
    const p = el.play();
    if (p?.catch) p.catch(() => setPlaying(false));
  }, [line]);

  // Nothing baked for this scenario at all → render nothing, hand plays as text.
  const hasAnyAudio =
    manifest?.lines &&
    Object.keys(manifest.lines).some((k) => k.startsWith(`${scenarioId}/`));
  if (!hasAnyAudio) return null;

  const boothName = commentator?.name ?? 'Commentary';

  return (
    <div className="np" data-testid="narration-player">
      <div className="np__bar">
        <button
          type="button"
          className={`np__toggle${enabled ? ' np__toggle--on' : ''}`}
          onClick={toggleEnabled}
          aria-pressed={enabled}
          aria-label={
            enabled ? 'Turn commentary off' : `Listen to ${boothName}'s commentary`
          }
        >
          <span className="np__icon" aria-hidden="true">
            {enabled ? (playing ? '❙❙' : '▶') : '▶'}
          </span>
          <span className="np__label">
            {enabled ? 'Commentary on' : `Listen with ${boothName}`}
          </span>
        </button>

        {enabled && (
          <div className="np__controls">
            <button
              type="button"
              className="np__mini"
              onClick={replay}
              disabled={!line}
              aria-label="Replay this line"
            >
              ↻
            </button>
            <button
              type="button"
              className={`np__mini${captions ? ' np__mini--on' : ''}`}
              onClick={toggleCaptions}
              aria-pressed={captions}
              aria-label={captions ? 'Hide captions' : 'Show captions'}
            >
              CC
            </button>
          </div>
        )}

        {enabled && commentator?.role && (
          <span className="np__booth">{commentator.role}</span>
        )}
      </div>

      {/* Captions: opt-in only (redundancy effect). aria-live so screen readers
          still get the line when captions are on. */}
      {enabled && captions && text && (
        <p className="np__caption" aria-live="polite">
          {text}
        </p>
      )}

      {/*
        Opus first (smaller for speech), MP3 fallback — bare .opus is unreliable
        on iOS Safari before 18.4. preload="auto" is safe: lines are 27-75 KB.
      */}
      {line && (
        <audio
          ref={audioRef}
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => setPlaying(false)}
        >
          <source src={line.opus} type="audio/ogg; codecs=opus" />
          <source src={line.mp3} type="audio/mpeg" />
        </audio>
      )}
    </div>
  );
}
