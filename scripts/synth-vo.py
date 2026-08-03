#!/usr/bin/env python3
"""
synth-vo.py — stage 2 of the voice-over bake.
=============================================
Reads the job list from `extract-vo.mjs`, synthesizes each narration line with
Kokoro (Apache-2.0, commercial-safe, runs locally, $0), encodes web-ready audio,
and writes a manifest the player reads at runtime.

DESIGN NOTES
------------
* BUILD-TIME ONLY. Never call TTS at runtime. (Lesson carried over from
  ReadMyLips v2: don't generate per-frame/per-request, bake once and play back.)
* Two encodings per line:
    - Opus @ 32kbps mono  → the primary. ~30-50% smaller than MP3 at equal
      perceived quality for speech.
    - MP3  @ 64kbps mono  → fallback. Bare .opus is unreliable on iOS Safari
      before 18.4, so the player ships both in a <source> list.
* Content-hashed filenames (see extract-vo.mjs) make stale audio impossible to
  serve silently.
* Only re-renders what changed: if the hashed output already exists, skip it.
* THE VOICE IS AN ORIGINAL FICTIONAL CHARACTER. Never point this script at a
  reference clip of a real person. Cloning or imitating a real individual's voice
  is a right-of-publicity tort (Midler v. Ford; Waits v. Frito-Lay; TN ELVIS Act;
  CA SB 683) and no disclaimer cures it.

Requires the Kokoro env + models:
    KOKORO_DIR (default ~/.oue-kokoro) containing kokoro-v1.0.onnx + voices-v1.0.bin
    python with: kokoro_onnx, soundfile, numpy      (~/.oue-kokoro/venv)
    ffmpeg on PATH

Usage:
    ~/.oue-kokoro/venv/bin/python scripts/synth-vo.py [--force]
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
JOBS = ROOT / "scripts" / ".vo-jobs.json"
OUT_DIR = ROOT / "public" / "vo"
MANIFEST = OUT_DIR / "manifest.json"

MODEL_DIR = Path(os.environ.get("KOKORO_DIR", str(Path.home() / ".oue-kokoro")))
SR = 24_000
TAIL_PAD = 0.25  # seconds of silence so playback doesn't clip the last word

FORCE = "--force" in sys.argv


def die(msg: str) -> "None":
    print(f"synth-vo: ERROR — {msg}", file=sys.stderr)
    sys.exit(1)


def preflight() -> tuple[Path, Path]:
    if not JOBS.exists():
        die(f"{JOBS} missing — run `node scripts/extract-vo.mjs` first")
    model = MODEL_DIR / "kokoro-v1.0.onnx"
    voices = MODEL_DIR / "voices-v1.0.bin"
    for p in (model, voices):
        if not p.exists():
            die(f"{p} missing — set KOKORO_DIR to the folder holding the Kokoro model")
    if shutil.which("ffmpeg") is None:
        die("ffmpeg not on PATH")
    return model, voices


def encode(wav: Path, opus: Path, mp3: Path) -> None:
    """Encode one WAV to Opus (primary) + MP3 (iOS Safari fallback).

    NB: takes explicit destination paths. Do NOT use Path.with_suffix() to derive
    these — the content hash in the stem (`turn-bet.020eaede`) looks like a file
    extension to pathlib, so with_suffix() would silently strip the hash.
    """
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav),
         "-c:a", "libopus", "-b:a", "32k", "-ac", "1",
         "-application", "voip", str(opus)],
        check=True,
    )
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav),
         "-c:a", "libmp3lame", "-b:a", "64k", "-ac", "1",
         str(mp3)],
        check=True,
    )


def main() -> None:
    model, voices = preflight()

    jobs = json.loads(JOBS.read_text())["jobs"]
    if not jobs:
        die("job list is empty")

    from kokoro_onnx import Kokoro  # imported after preflight for a clearer error

    kokoro = Kokoro(str(model), str(voices))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    tmp_wav = OUT_DIR / ".tmp.wav"

    lines: dict[str, dict] = {}
    rendered = skipped = 0

    for job in jobs:
        scenario_dir = OUT_DIR / job["scenarioId"]
        scenario_dir.mkdir(parents=True, exist_ok=True)

        stem = f"{job['voId']}.{job['hash']}"
        opus = scenario_dir / f"{stem}.opus"
        mp3 = scenario_dir / f"{stem}.mp3"

        if opus.exists() and mp3.exists() and not FORCE:
            dur = round(float(sf.info(str(opus)).duration), 3)
            skipped += 1
        else:
            samples, sr = kokoro.create(
                job["text"], voice=job["voice"], speed=job["speed"], lang=job["lang"]
            )
            samples = np.concatenate([samples, np.zeros(int(SR * TAIL_PAD), dtype=samples.dtype)])
            sf.write(str(tmp_wav), samples, sr or SR)
            encode(tmp_wav, opus, mp3)
            dur = round(len(samples) / float(sr or SR), 3)
            rendered += 1
            print(f"  rendered {job['key']} ({dur}s)")

        lines[job["key"]] = {
            "opus": f"/vo/{job['scenarioId']}/{stem}.opus",
            "mp3": f"/vo/{job['scenarioId']}/{stem}.mp3",
            "dur": dur,
            "hash": job["hash"],
            "voice": job["voice"],
            "text": job["text"],
        }

    tmp_wav.unlink(missing_ok=True)

    # Prune orphans: any audio not referenced by the current manifest is stale.
    keep = {Path(v["opus"]).name for v in lines.values()} | {
        Path(v["mp3"]).name for v in lines.values()
    }
    pruned = 0
    for f in OUT_DIR.rglob("*"):
        if f.is_file() and f.suffix in {".opus", ".mp3"} and f.name not in keep:
            f.unlink()
            pruned += 1

    MANIFEST.write_text(
        json.dumps({"version": 1, "lines": dict(sorted(lines.items()))}, indent=2) + "\n"
    )

    total_bytes = sum(f.stat().st_size for f in OUT_DIR.rglob("*.opus") if f.is_file())
    total_secs = sum(v["dur"] for v in lines.values())
    print(
        f"synth-vo: {len(lines)} line(s) — {rendered} rendered, {skipped} cached, "
        f"{pruned} stale pruned"
    )
    print(
        f"synth-vo: {total_secs:.1f}s audio, {total_bytes / 1024:.0f} KB opus → {MANIFEST}"
    )


if __name__ == "__main__":
    main()
