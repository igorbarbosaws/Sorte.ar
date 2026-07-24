// Feature: user-profiles-and-social, Property 6: Validação de perfil é consistente
//
// Validates: Requirements 3.2, 3.3
//
// For any value of `displayName` submitted for profile editing, the system SHALL
// reject the value if and only if it is empty (length 0 after trim) or exceeds
// 50 characters; valid values SHALL always be persisted successfully.

import { describe, it } from "vitest";
import * as fc from "fast-check";
import { displayNameSchema } from "../../src/lib/validation.js";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Empty string — always invalid (trim → length 0). */
const emptyString = fc.constant("");

/** Whitespace-only strings — invalid after trim (trimmed length === 0). */
const whitespaceOnly = fc.stringOf(
  fc.constantFrom(" ", "\t", "\n", "\r"),
  { minLength: 1, maxLength: 20 },
);

/**
 * Valid display names: 1–50 characters after trim, with at least one
 * non-whitespace character so the trimmed result is non-empty.
 */
const validDisplayName = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length >= 1);

/**
 * Too-long display names: raw length > 50 characters.
 * Even if the value contains leading/trailing whitespace, the raw length
 * exceeds 50 so the schema rejects it before trimming matters.
 */
const tooLongDisplayName = fc.string({ minLength: 51, maxLength: 150 });

/**
 * Full arbitrary: mix of all categories above plus fully arbitrary strings
 * to cover unexpected edge cases.
 */
const displayNameArbitrary = fc.oneof(
  emptyString,
  whitespaceOnly,
  validDisplayName,
  tooLongDisplayName,
  fc.string({ minLength: 0, maxLength: 100 }),
);

// ---------------------------------------------------------------------------
// Helper: expected outcome according to Property 6
// ---------------------------------------------------------------------------

/**
 * Returns true when `displayNameSchema` should accept the value.
 *
 * The schema trims the input before validating length, so:
 *   - reject if trimmed length === 0  (empty or whitespace-only)
 *   - reject if raw length > 50       (max constraint applied before trim)
 *   - accept otherwise
 */
function shouldAccept(value: string): boolean {
  const trimmedLength = value.trim().length;
  return trimmedLength >= 1 && value.length <= 50;
}

// ---------------------------------------------------------------------------
// Property test
// ---------------------------------------------------------------------------

describe("Property 6: Validação de perfil é consistente", () => {
  it(
    "displayNameSchema.safeParse rejeita se e somente se o valor for inválido (500 runs)",
    () => {
      fc.assert(
        fc.property(displayNameArbitrary, (displayName) => {
          const result = displayNameSchema.safeParse(displayName);
          const expected = shouldAccept(displayName);
          return result.success === expected;
        }),
        { numRuns: 500 },
      );
    },
  );
});
