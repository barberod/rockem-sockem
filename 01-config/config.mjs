#!/usr/bin/env node

/**
 * 01-config/config.mjs
 *
 * Deterministic script for Step 1 (Load Configuration).
 *
 * Usage:
 *   node 01-config/config.mjs <skill-dir> [-- raw args string]
 *
 * Outputs a single JSON object to stdout:
 * {
 *   "status": "OK" | "WARNING" | "ERROR",
 *   "message": "Human-readable summary",
 *   "config": { ... },                // parsed config.json contents
 *   "sanityText": "...",              // content of SANITYCHECK-RULES.md (or .example)
 *   "sanitySource": "...",            // which file was used
 *   "guidanceText": "...",            // content of GUIDANCE.md (or .example)
 *   "guidanceSource": "...",          // which file was used
 *   "params": { ... },               // fully resolved parameters (or "needs-prompt")
 *   "helpRequested": false,           // true if --help was found
 *   "errors": [],                     // list of error messages
 *   "warnings": []                    // list of warning messages
 * }
 */

import { readFileSync, existsSync, statSync } from "fs";
import { join, resolve } from "path";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  const stat = statSync(filePath);
  if (!stat.isFile()) return null;
  const content = readFileSync(filePath, "utf-8").trim();
  return content.length > 0 ? content : null;
}

/**
 * Tokenize the argument string, respecting quoted groups.
 * Strips outermost matching quotes from each token.
 */
function tokenize(raw) {
  if (!raw || !raw.trim()) return [];
  const tokens = [];
  let i = 0;
  const s = raw.trim();
  while (i < s.length) {
    // skip whitespace
    while (i < s.length && s[i] === " ") i++;
    if (i >= s.length) break;

    const quoteChars = ["'", '"', "`"];
    let token = "";
    if (quoteChars.includes(s[i])) {
      // Whole-token quote: find matching close
      const q = s[i];
      i++; // skip opening quote
      const start = i;
      while (i < s.length && s[i] !== q) {
        token += s[i];
        i++;
      }
      if (i < s.length) {
        i++; // skip closing quote
      } else {
        // Unmatched quote — include the opening quote character
        token = q + token;
      }
    } else {
      // Non-quoted token: read until space
      // But handle value-level quoting: --key:'value with spaces'
      while (i < s.length && s[i] !== " ") {
        if (quoteChars.includes(s[i])) {
          const q = s[i];
          i++; // skip opening quote
          while (i < s.length && s[i] !== q) {
            token += s[i];
            i++;
          }
          if (i < s.length) i++; // skip closing quote
        } else {
          token += s[i];
          i++;
        }
      }
    }
    tokens.push(token);
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Severity ranking for aggregation
// ---------------------------------------------------------------------------

const SEVERITY = { OK: 0, WARNING: 1, ERROR: 2 };

function worstStatus(a, b) {
  return (SEVERITY[a] ?? 0) >= (SEVERITY[b] ?? 0) ? a : b;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const doubleDashIdx = args.indexOf("--");
  const skillDir = resolve(args[0] || ".");
  const rawArgs =
    doubleDashIdx >= 0 ? args.slice(doubleDashIdx + 1).join(" ") : "";

  const result = {
    status: "OK",
    message: "",
    config: null,
    sanityText: null,
    sanitySource: null,
    guidanceText: null,
    guidanceSource: null,
    params: {},
    helpRequested: false,
    errors: [],
    warnings: [],
  };

  // -----------------------------------------------------------------------
  // 1. Load config.json
  // -----------------------------------------------------------------------
  const configPath = join(skillDir, "config.json");
  let config;
  try {
    const raw = readFileSync(configPath, "utf-8");
    // Strip trailing commas before closing braces/brackets (lenient JSON)
    const cleaned = raw.replace(/,\s*([\]}])/g, "$1");
    config = JSON.parse(cleaned);
  } catch (err) {
    result.status = "ERROR";
    result.errors.push(
      `Failed to load config.json at ${configPath}: ${err.message}`
    );
    result.message = result.errors.join(" ");
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }
  result.config = config;

  // Validate required keys
  const requiredKeys = [
    "project-repo-location",
    "personal-dir-location",
    "product-text",
  ];
  for (const key of requiredKeys) {
    if (!config[key] || typeof config[key] !== "string" || !config[key].trim()) {
      result.status = "ERROR";
      result.errors.push(`config.json: required key "${key}" is missing or empty.`);
    }
  }

  if (result.status === "ERROR") {
    result.message = result.errors.join(" ");
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  // -----------------------------------------------------------------------
  // 2. Load sanity check rules
  // -----------------------------------------------------------------------
  const sanityPrimary = join(skillDir, "SANITYCHECK-RULES.md");
  const sanityFallback = join(skillDir, "SANITYCHECK-RULES.md.example");

  let sanityText = readIfExists(sanityPrimary);
  let sanitySource = sanityText ? "SANITYCHECK-RULES.md" : null;
  if (!sanityText) {
    sanityText = readIfExists(sanityFallback);
    sanitySource = sanityText ? "SANITYCHECK-RULES.md.example" : null;
  }
  if (!sanityText) {
    result.status = "ERROR";
    result.errors.push(
      "Neither SANITYCHECK-RULES.md nor SANITYCHECK-RULES.md.example exists or has content."
    );
  }
  result.sanityText = sanityText;
  result.sanitySource = sanitySource;

  // -----------------------------------------------------------------------
  // 3. Load guidance
  // -----------------------------------------------------------------------
  const guidancePrimary = join(skillDir, "GUIDANCE.md");
  const guidanceFallback = join(skillDir, "GUIDANCE.md.example");

  let guidanceText = readIfExists(guidancePrimary);
  let guidanceSource = guidanceText ? "GUIDANCE.md" : null;
  if (!guidanceText) {
    guidanceText = readIfExists(guidanceFallback);
    guidanceSource = guidanceText ? "GUIDANCE.md.example" : null;
  }
  if (!guidanceText) {
    result.status = "ERROR";
    result.errors.push(
      "Neither GUIDANCE.md nor GUIDANCE.md.example exists or has content."
    );
  }
  result.guidanceText = guidanceText;
  result.guidanceSource = guidanceSource;

  if (result.status === "ERROR") {
    result.message = result.errors.join(" ");
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  // -----------------------------------------------------------------------
  // 4. Parse and resolve named parameters
  // -----------------------------------------------------------------------
  const tokens = tokenize(rawArgs);

  // Help check
  if (tokens.includes("--help")) {
    result.helpRequested = true;
    result.message = "Help requested.";
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  const VALID_PARAMS = [
    "item-id",
    "handle",
    "quiet",
    "private",
    "unanswered",
    "user-mail",
    "user-name",
  ];
  const BOOLEAN_PARAMS = ["private", "unanswered"];

  const parsed = {};

  for (const token of tokens) {
    if (!token.startsWith("--")) {
      result.status = "ERROR";
      result.errors.push(
        `Bare positional argument "${token}" is not allowed. Use --name:value syntax.`
      );
      result.message = result.errors.join(" ");
      process.stdout.write(JSON.stringify(result, null, 2));
      return;
    }

    const stripped = token.slice(2); // remove --
    const colonIdx = stripped.indexOf(":");
    let name, value;
    if (colonIdx === -1) {
      name = stripped;
      value = undefined; // bare flag
    } else {
      name = stripped.slice(0, colonIdx);
      value = stripped.slice(colonIdx + 1);
    }

    if (!VALID_PARAMS.includes(name)) {
      result.status = "ERROR";
      result.errors.push(
        `Unknown parameter "--${name}". Valid parameters: ${VALID_PARAMS.map((p) => "--" + p).join(", ")}`
      );
      result.message = result.errors.join(" ");
      process.stdout.write(JSON.stringify(result, null, 2));
      return;
    }

    if (name in parsed) {
      result.status = "ERROR";
      result.errors.push(`Duplicate parameter "--${name}".`);
      result.message = result.errors.join(" ");
      process.stdout.write(JSON.stringify(result, null, 2));
      return;
    }

    // Validate boolean params
    if (BOOLEAN_PARAMS.includes(name)) {
      if (value === undefined) {
        value = "true"; // bare flag
      } else if (value !== "true" && value !== "false") {
        result.status = "ERROR";
        result.errors.push(
          `Parameter "--${name}" must be true or false, got "${value}".`
        );
        result.message = result.errors.join(" ");
        process.stdout.write(JSON.stringify(result, null, 2));
        return;
      }
    }

    // Validate quiet param
    if (name === "quiet") {
      if (value === undefined) {
        value = "true"; // bare --quiet
      } else if (!["true", "false", "force"].includes(value)) {
        result.status = "ERROR";
        result.errors.push(
          `Parameter "--quiet" must be true, false, or force, got "${value}".`
        );
        result.message = result.errors.join(" ");
        process.stdout.write(JSON.stringify(result, null, 2));
        return;
      }
    }

    // Validate string params require a value
    if (
      ["handle", "user-mail", "user-name", "item-id"].includes(name) &&
      (value === undefined || value === "")
    ) {
      result.status = "ERROR";
      result.errors.push(`Parameter "--${name}" requires a value.`);
      result.message = result.errors.join(" ");
      process.stdout.write(JSON.stringify(result, null, 2));
      return;
    }

    parsed[name] = value;
  }

  // -----------------------------------------------------------------------
  // 5. Resolve parameters
  // -----------------------------------------------------------------------
  const defaults = config.defaults || {};

  // item-id: command-line only, else needs-prompt
  result.params["item-id"] = parsed["item-id"] ?? "needs-prompt";

  // Identity parameters: command-line > config top-level key (never prompted)
  result.params["handle"] =
    parsed["handle"] ?? (config["handle"] || "");
  result.params["user-mail"] =
    parsed["user-mail"] ?? (config["user-mail"] || null);
  result.params["user-name"] =
    parsed["user-name"] ?? (config["user-name"] || null);

  // Boolean/quiet defaults: command-line > config defaults > needs-prompt
  for (const key of ["quiet", "private", "unanswered"]) {
    if (parsed[key] !== undefined) {
      result.params[key] = parsed[key];
    } else if (defaults[key] !== undefined) {
      result.params[key] = String(defaults[key]);
    } else {
      result.params[key] = "needs-prompt";
    }
  }

  // -----------------------------------------------------------------------
  // 6. Warnings
  // -----------------------------------------------------------------------
  if (sanitySource === "SANITYCHECK-RULES.md.example") {
    result.status = worstStatus(result.status, "WARNING");
    result.warnings.push(
      "Using SANITYCHECK-RULES.md.example (no custom SANITYCHECK-RULES.md found)."
    );
  }
  if (guidanceSource === "GUIDANCE.md.example") {
    result.status = worstStatus(result.status, "WARNING");
    result.warnings.push(
      "Using GUIDANCE.md.example (no custom GUIDANCE.md found)."
    );
  }

  // -----------------------------------------------------------------------
  // Build message
  // -----------------------------------------------------------------------
  const parts = [];
  if (result.errors.length > 0) parts.push(...result.errors);
  if (result.warnings.length > 0) parts.push(...result.warnings);
  if (parts.length === 0) parts.push("Configuration loaded successfully.");
  result.message = parts.join(" ");

  process.stdout.write(JSON.stringify(result, null, 2));
}

main();
