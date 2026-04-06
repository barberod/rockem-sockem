#!/usr/bin/env node

/**
 * 03-resolve/resolve.mjs
 *
 * Deterministic script for Step 3 (Resolve Item ID).
 *
 * Usage:
 *   node 03-resolve/resolve.mjs <item-id>
 *
 * Validates the item-id against all rules. Outputs JSON:
 * {
 *   "status": "OK" | "ERROR",
 *   "message": "Human-readable summary",
 *   "itemId": "the-validated-id",
 *   "errors": []
 * }
 */

function validate(itemId) {
  const errors = [];

  if (!itemId || itemId.length === 0) {
    errors.push("item-id is empty.");
    return errors;
  }

  // No spaces
  if (/\s/.test(itemId)) {
    errors.push("item-id must not contain spaces.");
  }

  // Only letters, numbers, hyphens, underscores
  if (!/^[a-zA-Z0-9\-_]+$/.test(itemId)) {
    // Check specifically for emoji
    // eslint-disable-next-line no-control-regex
    const emojiPattern =
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/u;
    if (emojiPattern.test(itemId)) {
      errors.push("item-id must not contain emoji.");
    } else {
      errors.push(
        "item-id contains invalid characters. Only letters, numbers, hyphens, and underscores are allowed."
      );
    }
  }

  // Length
  if (itemId.length < 5) {
    errors.push(
      `item-id must be at least 5 characters (got ${itemId.length}).`
    );
  }
  if (itemId.length > 24) {
    errors.push(
      `item-id must be at most 24 characters (got ${itemId.length}).`
    );
  }

  return errors;
}

function main() {
  const itemId = process.argv[2] ?? "";

  const errors = validate(itemId);

  const result = {
    status: errors.length === 0 ? "OK" : "ERROR",
    message:
      errors.length === 0
        ? `item-id "${itemId}" is valid.`
        : errors.join(" "),
    itemId: itemId,
    errors: errors,
  };

  process.stdout.write(JSON.stringify(result, null, 2));
}

main();
