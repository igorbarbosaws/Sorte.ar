// Feature: user-profiles-and-social, Property 1: Validação de registro é consistente
//
// Validates: Requirements 1.1, 1.3, 1.4, 1.5
//
// For any combination of (email, password, displayName), registerSchema SHALL
// reject the input if and only if at least one of the following is true:
//   (a) the email does not pass z.string().email() validation;
//   (b) the password has fewer than 8 characters;
//   (c) the displayName, after trimming, is empty OR the raw displayName
//       exceeds 50 characters.
// Otherwise, it SHALL succeed.

// Feature: user-profiles-and-social, Property 2: Unicidade de e-mail é preservada
//
// Validates: Requirements 1.2
//
// For any valid email and N >= 2 registration attempts with that same email,
// the Auth_Service SHALL accept only the first attempt (no error thrown) and
// reject every subsequent attempt with an AppError whose code is
// EMAIL_ALREADY_EXISTS.

// JWT_SECRET must be set before any module that reads it is imported
process.env["JWT_SECRET"] = "test-secret";

import { describe, it, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { registerSchema } from "../../src/lib/validation.js";
import { AuthService, AppError } from "../../src/modules/auth/auth.service.js";

// Mock bcrypt globally so property tests don't pay the real cost-12 hash price.
// The unit tests use a real DB mock that already isolates bcrypt from the DB,
// but the async property test calls register() 100+ times — mocking bcrypt
// keeps the test suite fast without affecting correctness assertions.
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2b$12$mockedhash"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// ===========================================================================
// Property 1 — Validação de registro é consistente
// ===========================================================================

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generates plausible email strings — a mix of valid and clearly invalid. */
const emailArbitrary = fc.oneof(
  // Valid-looking emails
  fc.emailAddress(),
  // Strings without "@" — always invalid
  fc.string({ minLength: 0, maxLength: 40 }).filter((s) => !s.includes("@")),
  // Strings with "@" but malformed (e.g. no domain, leading/trailing @)
  fc.string({ minLength: 1, maxLength: 40 }).map((s) => `@${s}`),
  fc.string({ minLength: 1, maxLength: 40 }).map((s) => `${s}@`),
  // Completely arbitrary strings
  fc.string({ minLength: 0, maxLength: 80 }),
);

/** Generates passwords of varying lengths around the 8-char boundary. */
const passwordArbitrary = fc.oneof(
  // Short passwords (0–7 chars) — always invalid
  fc.string({ minLength: 0, maxLength: 7 }),
  // Valid passwords (8–64 chars)
  fc.string({ minLength: 8, maxLength: 64 }),
  // Arbitrary strings
  fc.string({ minLength: 0, maxLength: 80 }),
);

/** Generates displayNames around the 1–50 char boundary, including whitespace-only. */
const displayNameArbitrary = fc.oneof(
  // Empty string — invalid
  fc.constant(""),
  // Whitespace-only strings — invalid after trim
  fc.stringOf(fc.constantFrom(" ", "\t", "\n", "\r"), { minLength: 1, maxLength: 10 }),
  // Valid range (1–50 chars, non-whitespace-only)
  fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  // Too long (51–100 chars) — invalid
  fc.string({ minLength: 51, maxLength: 100 }),
  // Arbitrary strings
  fc.string({ minLength: 0, maxLength: 80 }),
);

// ---------------------------------------------------------------------------
// Helper: determine expected outcome according to Property 1
// ---------------------------------------------------------------------------

function isEmailValid(email: string): boolean {
  // Mirror z.string().email() — the simplest reliable check is to use the
  // same Zod schema in isolation so the test and implementation stay in sync.
  const { z } = require("zod") as typeof import("zod");
  return z.string().email().safeParse(email).success;
}

function expectedSuccess(
  email: string,
  password: string,
  displayName: string,
): boolean {
  const emailOk = isEmailValid(email);
  const passwordOk = password.length >= 8;
  // displayName is trimmed by the schema before validation
  const trimmed = displayName.trim();
  const displayNameOk = trimmed.length >= 1 && displayName.length <= 50;
  return emailOk && passwordOk && displayNameOk;
}

// ---------------------------------------------------------------------------
// Property 1 test
// ---------------------------------------------------------------------------

describe("Property 1: Validação de registro é consistente", () => {
  it(
    "registerSchema.safeParse rejeita se e somente se algum campo for inválido (500 runs)",
    () => {
      fc.assert(
        fc.property(
          emailArbitrary,
          passwordArbitrary,
          displayNameArbitrary,
          (email, password, displayName) => {
            const result = registerSchema.safeParse({ email, password, displayName });
            const expected = expectedSuccess(email, password, displayName);
            return result.success === expected;
          },
        ),
        { numRuns: 500 },
      );
    },
  );
});

// ===========================================================================
// Property 2 — Unicidade de e-mail é preservada
// ===========================================================================

// ---------------------------------------------------------------------------
// Mock DB factory
// ---------------------------------------------------------------------------

/**
 * Creates a minimal Drizzle-compatible mock DB whose `select` chain simulates
 * uniqueness enforcement:
 *   - The first `select` call returns [] (no existing user).
 *   - Every subsequent `select` call returns [{ id: 'existing-id' }].
 *
 * All write operations (insert) are no-ops that return a plausible row.
 */
function createMockDb() {
  let selectCallCount = 0;

  // A chainable builder used by select().from().where().limit()
  const buildSelectChain = (resolveWith: () => unknown[]) => ({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation(() => Promise.resolve(resolveWith())),
  });

  // A chainable builder used by insert().values().returning()
  const buildInsertChain = (returnValue: unknown[]) => ({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue(returnValue),
    }),
  });

  return {
    select: vi.fn().mockImplementation(() => {
      const callIndex = selectCallCount++;
      // First select → uniqueness check: no existing user
      // Subsequent selects → uniqueness check: user already exists
      if (callIndex === 0) {
        return buildSelectChain(() => []);
      }
      return buildSelectChain(() => [{ id: "existing-user-id" }]);
    }),
    insert: vi.fn().mockImplementation(() =>
      buildInsertChain([{ id: "new-user-id" }])
    ),
  };
}

// ---------------------------------------------------------------------------
// Property 2 test
// ---------------------------------------------------------------------------

// Arbitrary that produces emails guaranteed to pass z.string().email():
// alphanumeric local part (1–20 chars) + known TLD domain.
const zodValidEmailArbitrary = fc
  .tuple(
    fc.stringOf(fc.constantFrom(...("abcdefghijklmnopqrstuvwxyz0123456789").split("")), {
      minLength: 1,
      maxLength: 20,
    }),
    fc.constantFrom("example.com", "test.org", "mail.net", "foo.io"),
  )
  .map(([local, domain]) => `${local}@${domain}`);

describe("Property 2: Unicidade de e-mail é preservada", () => {
  beforeEach(() => {
    process.env["JWT_SECRET"] = "test-secret";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it(
    "somente o primeiro registro com um e-mail é aceito; todos os subsequentes lançam AppError EMAIL_ALREADY_EXISTS (100 runs)",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // A valid email that always passes z.string().email()
          zodValidEmailArbitrary,
          // N: number of registration attempts (2–5)
          fc.integer({ min: 2, max: 5 }),
          async (email, n) => {
            // Fresh mock DB for each property run — resets selectCallCount to 0
            const mockDb = createMockDb();
            const service = new AuthService(mockDb as never);

            const validPassword = "ValidPass1";
            const validDisplayName = "Test User";

            // --- First attempt: should succeed (no AppError) ---
            const firstResult = await service
              .register({ email, password: validPassword, displayName: validDisplayName })
              .then((session) => ({ ok: true as const, session }))
              .catch((err: unknown) => ({ ok: false as const, err }));

            if (!firstResult.ok) {
              // First registration must not throw — property violated
              return false;
            }

            // --- Subsequent attempts (2..N): must throw EMAIL_ALREADY_EXISTS ---
            for (let i = 1; i < n; i++) {
              const result = await service
                .register({ email, password: validPassword, displayName: validDisplayName })
                .then(() => ({ ok: true as const }))
                .catch((err: unknown) => ({ ok: false as const, err }));

              if (result.ok) {
                // Should have been rejected — property violated
                return false;
              }

              const err = (result as { ok: false; err: unknown }).err;
              if (!(err instanceof AppError) || err.code !== "EMAIL_ALREADY_EXISTS") {
                // Rejected but with the wrong error type or code
                return false;
              }
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});
