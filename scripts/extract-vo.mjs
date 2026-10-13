#!/usr/bin/env node
/**
 * extract-vo.mjs — stage 1 of the voice-over bake.
 * =================================================
 * Walks every scenario, collects each `action.vo` narration line, and writes a
 * deterministic job list for `synth-vo.py` (stage 2) to synthesize.
 *
 * WHY A CONTENT HASH IN THE FILENAME
 * ----------------------------------
 * The single most likely silent bug in a voice-led product is *text/audio drift*:
 * someone edits a narration line, the audio is never re-rendered, and the
 * commentator now says something the script no longer claims. So the output
 * filename embeds a hash of (text + voice + speed). Change any of those and the
 * filename changes, which means:
 *   - the new file must be generated, and
 *   - a stale manifest points at a file that does not exist, so the player
 *     falls back to silence rather than lying to the user.
 * It fails safe instead of failing quietly.
 *
 * Usage:  node scripts/extract-vo.mjs [--out <path>]
 */

import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const DEFAULT_SPEED = 1.0;
const DEFAULT_VOICE = 'am_michael';
const DEFAULT_LANG = 'en-us';

/** Short, stable content hash. 8 hex chars = 4 bytes; ample for a few hundred lines. */
function contentHash({ text, voice, speed }) {
  return createHash('sha256')
    .update(`${voice}|${speed}|${text.trim()}`)
    .digest('hex')
    .slice(0, 8);
}

async function main() {
  const outArgIdx = process.argv.indexOf('--out');
  const outPath =
    outArgIdx !== -1 && process.argv[outArgIdx + 1]
      ? resolve(process.argv[outArgIdx + 1])
      : resolve(ROOT, 'scripts/.vo-jobs.json');

  const mod = await import(resolve(ROOT, 'src/scenarios/index.js'));
  const scenarios = mod.allScenarios ?? mod.scenarios ?? mod.default ?? [];

  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    console.error('extract-vo: no scenarios found — check src/scenarios/index.js exports');
    process.exit(1);
  }

  const jobs = [];
  const seen = new Set();

  for (const scenario of scenarios) {
    const voice = scenario.commentator?.voice ?? DEFAULT_VOICE;
    const speed = scenario.commentator?.speed ?? DEFAULT_SPEED;

    for (const action of scenario.actions ?? []) {
      const vo = action.vo;
      if (!vo?.text || !vo?.id) continue;

      const key = `${scenario.id}/${vo.id}`;
      if (seen.has(key)) {
        console.error(`extract-vo: DUPLICATE vo id "${key}" — ids must be unique per scenario`);
        process.exit(1);
      }
      seen.add(key);

      const text = vo.text.trim();
      jobs.push({
        key,
        scenarioId: scenario.id,
        voId: vo.id,
        text,
        voice,
        speed,
        lang: DEFAULT_LANG,
        hash: contentHash({ text, voice, speed }),
      });
    }
  }

  // v3 lessons carry their narration in `replay[].vo` (plain strings). Same
  // content-hash rules, namespaced by lesson id so they can't collide.
  const lessonMod = await import(resolve(ROOT, 'src/lesson/script.js'));
  for (const lesson of [lessonMod.LESSON].filter(Boolean)) {
    const voice = lesson.commentator?.voice ?? DEFAULT_VOICE;
    const speed = lesson.commentator?.speed ?? DEFAULT_SPEED;
    for (const step of lesson.replay ?? []) {
      if (!step.vo || !step.id) continue;
      const k = `${lesson.id}/${step.id}`;
      if (seen.has(k)) {
        console.error(`extract-vo: DUPLICATE vo id "${k}"`);
        process.exit(1);
      }
      seen.add(k);
      const text = step.vo.trim();
      jobs.push({
        key: k, scenarioId: lesson.id, voId: step.id, text, voice, speed,
        lang: DEFAULT_LANG, hash: contentHash({ text, voice, speed }),
      });
    }
  }

  // Deterministic order so the job list and manifest are git-stable.
  jobs.sort((a, b) => a.key.localeCompare(b.key));

  const words = jobs.reduce((n, j) => n + j.text.split(/\s+/).filter(Boolean).length, 0);

  writeFileSync(outPath, JSON.stringify({ jobs }, null, 2) + '\n', 'utf8');

  console.log(`extract-vo: ${jobs.length} line(s), ${words} spoken words`);
  console.log(`extract-vo: wrote ${outPath}`);
  for (const j of jobs) console.log(`  ${j.key}  [${j.voice}]  ${j.hash}`);
}

main().catch((err) => {
  console.error('extract-vo failed:', err);
  process.exit(1);
});
