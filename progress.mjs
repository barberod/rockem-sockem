#!/usr/bin/env node

/**
 * progress.mjs
 *
 * Deterministic utility for rendering and updating the 13-step progress bar.
 *
 * Usage (compact format — preferred):
 *   node progress.mjs ###~_________
 *
 * Each character maps to a status:
 *   # = OK, * = WARNING, ! = ERROR, - = SKIP, ~ = ACTIVE, _ = not yet attempted
 *
 * Usage (legacy JSON format — still supported):
 *   node progress.mjs '["OK","OK","OK","ACTIVE",null,null,null,null,null,null,null,null,null]'
 *
 * Output (JSON):
 * {
 *   "state": ["OK","OK","OK","ACTIVE",null,null,null,null,null,null,null,null,null],
 *   "bar": "🟩🟩🟩🟣⬛⬛⬛⬛⬛⬛⬛⬛⬛"
 * }
 *
 * Worst-status mode:
 *   node progress.mjs --worst #*#
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

const COMPACT_TO_STATUS = {
  "#": "OK",
  "*": "WARNING",
  "!": "ERROR",
  "-": "SKIP",
  "~": "ACTIVE",
  _: null,
};

const SEVERITY = { OK: 0, WARNING: 1, ERROR: 2 };

function parseInput(raw) {
  if (raw.startsWith("[")) {
    return JSON.parse(raw);
  }
  return [...raw].map((ch) =>
    ch in COMPACT_TO_STATUS ? COMPACT_TO_STATUS[ch] : null
  );
}

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
  const statuses = parseInput(args[1]);
  process.stdout.write(JSON.stringify({ status: worstOf(statuses) }));
} else {
  const state = parseInput(args[0]);
  process.stdout.write(
    JSON.stringify({ state, bar: renderBar(state) }, null, 2)
  );
}
