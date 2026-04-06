#!/usr/bin/env node

/**
 * progress.mjs
 *
 * Deterministic utility for rendering and updating the 13-step progress bar.
 *
 * Usage:
 *   node progress.mjs <state-json>
 *
 * <state-json> is a JSON string representing an array of 13 status values.
 * Each value is one of: "OK", "WARNING", "ERROR", "SKIP", "ACTIVE", or null (not yet attempted).
 *
 * Example:
 *   node progress.mjs '["OK",null,null,null,null,null,null,null,null,null,null,null,null]'
 *
 * Output (JSON):
 * {
 *   "bar": "🟩⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛",
 *   "state": ["OK",null,null,null,null,null,null,null,null,null,null,null,null]
 * }
 *
 * Can also be used to compute the worst status from multiple results:
 *   node progress.mjs --worst '["OK","WARNING","OK"]'
 *
 * Output:
 * {
 *   "status": "WARNING"
 * }
 */

const EMOJI = {
  OK: "🟩",
  WARNING: "🟨",
  ERROR: "🟥",
  SKIP: "⬜",
  ACTIVE: "🟣",
  null: "⬛",
};

const SEVERITY = { OK: 0, WARNING: 1, ERROR: 2 };

function renderBar(state) {
  return state.map((s) => EMOJI[s] ?? EMOJI["null"]).join("");
}

function worstOf(statuses) {
  let worst = "OK";
  for (const s of statuses) {
    if (s && (SEVERITY[s] ?? 0) > (SEVERITY[worst] ?? 0)) {
      worst = s;
    }
  }
  return worst;
}

const args = process.argv.slice(2);

if (args[0] === "--worst") {
  const statuses = JSON.parse(args[1]);
  process.stdout.write(JSON.stringify({ status: worstOf(statuses) }));
} else {
  const state = JSON.parse(args[0]);
  process.stdout.write(
    JSON.stringify({ bar: renderBar(state), state }, null, 2)
  );
}
