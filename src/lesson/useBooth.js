/**
 * useBooth — the commentator's voice for a lesson.
 *
 * One <audio> element for the whole lesson, because iOS Safari unlocks audio
 * per element. The first line is played directly inside the "Take his seat"
 * tap, which unlocks that element; every later line reuses it. (An earlier
 * draft "unlocked" with a muted play-then-pause, which could race the real
 * first line and pause it. Playing the real line in the gesture avoids that.)
 *
 * play(id) returns a promise that ALWAYS settles: on end, error, autoplay block,
 * a missing line, or a safety timeout of (duration + 2s). The replay waits on
 * that promise, so a failure can cost the voice but can never freeze the hand.
 * (The previous player had to be retro-fitted with this after narration was
 * found being cut off; here it is the design from the start.)
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const MANIFEST_URL = '/vo/manifest.json';
let manifestPromise = null;
function loadManifest() {
  manifestPromise ??= fetch(MANIFEST_URL)
    .then((r) => (r.ok ? r.json() : { lines: {} }))
    .catch(() => ({ lines: {} }));
  return manifestPromise;
}

export function useBooth(namespace) {
  const audioRef = useRef(null);
  const tokenRef = useRef(0);
  const settleRef = useRef(null);
  const [lines, setLines] = useState(null);

  useEffect(() => {
    let alive = true;
    loadManifest().then((m) => alive && setLines(m?.lines ?? {}));
    return () => {
      alive = false;
    };
  }, []);

  const lineFor = useCallback((id) => lines?.[`${namespace}/${id}`] ?? null, [lines, namespace]);

  const element = useCallback(() => {
    if (!audioRef.current && typeof Audio !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
    }
    return audioRef.current;
  }, []);

  const srcFor = useCallback(
    (line) => {
      const opusOk = element()?.canPlayType?.('audio/ogg; codecs=opus');
      return opusOk ? line.opus : line.mp3; // bare Opus is unreliable on older iOS Safari
    },
    [element]
  );

  const play = useCallback(
    (id) =>
      new Promise((resolve) => {
        const line = lineFor(id);
        const a = element();
        if (!line || !a) return resolve('missing');

        const token = ++tokenRef.current;
        let done = false;
        const finish = (why) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          // Only detach handlers that are still ours — a newer line may own them.
          if (tokenRef.current === token) {
            a.onended = null;
            a.onerror = null;
            settleRef.current = null;
          }
          resolve(why);
        };
        const timer = setTimeout(() => finish('timeout'), (line.dur + 2) * 1000);
        settleRef.current = finish;
        a.onended = () => finish('ended');
        a.onerror = () => finish('failed');
        try {
          a.muted = false;
          a.src = srcFor(line);
          a.currentTime = 0;
          const p = a.play();
          if (p?.catch) p.catch(() => finish('blocked'));
        } catch {
          finish('failed');
        }
      }),
    [lineFor, element, srcFor]
  );

  /** Pause without settling: used for mute, so muting never skips a beat. */
  const silence = useCallback(() => {
    try {
      audioRef.current?.pause();
    } catch {
      /* nothing to pause */
    }
  }, []);

  /** Stop speaking now and settle any pending line. */
  const stop = useCallback(() => {
    const a = audioRef.current;
    try {
      a?.pause();
    } catch {
      /* nothing to pause */
    }
    settleRef.current?.('stopped');
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { ready: lines != null, hasLine: (id) => !!lineFor(id), play, stop, silence };
}
