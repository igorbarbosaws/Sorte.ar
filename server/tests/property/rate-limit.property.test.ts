// Feature: user-profiles-and-social, Property 3: Rate limiting por e-mail bloqueia após 10 tentativas
//
// Validates: Requirements 2.3
//
// For any email address, after exactly 10 consecutive failed login attempts
// within a 60-second window, every additional attempt SHALL be blocked for
// 15 minutes, regardless of the password provided.
//
// Test strategy:
// `supertest` is not available in this project. This file tests the rate-limit
// logic by directly using `MemoryStore` from `express-rate-limit` — the same
// store used by `loginEmailRateLimit` when REDIS_URL is absent.
//
// The store semantics that express-rate-limit uses to decide whether to block:
//   - totalHits is incremented on every call to store.increment(key)
//   - When totalHits > limit (10), the middleware invokes the 429 handler
//   - skipSuccessfulRequests means only non-2xx responses count;
//     each store.increment() call here represents one failed attempt
//
// The `keyGenerator` for `loginEmailRateLimit` transforms an email into the
// key `email:<email-trimmed-lowercased>`. The property uses the same
// transformation so tested keys are realistic.

import { describe, it } from "vitest";
import * as fc from "fast-check";
import { MemoryStore } from "express-rate-limit";

// ---------------------------------------------------------------------------
// Constants — mirrored from src/middleware/rate-limit.ts
// ---------------------------------------------------------------------------

/** How long a blocked account remains blocked (15 minutes in ms). */
const BLOCK_MS = 15 * 60 * 1_000;

/** Maximum allowed failed attempts before the middleware returns 429. */
const RATE_LIMIT = 10;

// ---------------------------------------------------------------------------
// Helper: build the same rate-limit key the middleware generates
// ---------------------------------------------------------------------------

function emailKey(email: string): string {
  return `email:${email.trim().toLowerCase()}`;
}

// ---------------------------------------------------------------------------
// Helper: create a fresh, initialised MemoryStore for each property run
// ---------------------------------------------------------------------------

function createStore(): MemoryStore {
  const store = new MemoryStore();
  // init() configures the window and starts an unref'd clearExpired interval.
  store.init({ windowMs: BLOCK_MS } as Parameters<typeof store.init>[0]);
  return store;
}

// ---------------------------------------------------------------------------
// Property 3 — Rate limiting por e-mail bloqueia após 10 tentativas
// ---------------------------------------------------------------------------

describe("Property 3: Rate limiting por e-mail bloqueia após 10 tentativas", () => {
  it(
    // Validates: Requirements 2.3
    "após exatamente 10 incrementos o totalHits é 10; o 11º ultrapassa o limite (100 runs)",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Use fc.emailAddress() as specified in the task
          fc.emailAddress(),
          async (email) => {
            const store = createStore();
            const key = emailKey(email);

            // Simulate 10 failed login attempts — each increment represents
            // one failed attempt reaching the store (skipSuccessfulRequests: true).
            let infoAfterTen: { totalHits: number; resetTime: Date } | undefined;
            for (let attempt = 1; attempt <= RATE_LIMIT; attempt++) {
              infoAfterTen = await store.increment(key);
            }

            // After exactly 10 increments, totalHits must equal 10.
            // At this point the middleware would still call next() because
            // the check is (totalHits > limit), i.e. 10 > 10 is false.
            if (infoAfterTen!.totalHits !== RATE_LIMIT) {
              return false;
            }

            // The 11th increment: totalHits must be > 10 (blocks the request).
            const eleventhInfo = await store.increment(key);
            if (eleventhInfo.totalHits <= RATE_LIMIT) {
              return false;
            }

            // The resetTime must be within the BLOCK_MS window from now.
            const now = Date.now();
            const resetTime = eleventhInfo.resetTime.getTime();
            if (resetTime <= now || resetTime > now + BLOCK_MS + 2_000 /* 2s tolerance */) {
              return false;
            }

            // Clean up so tests don't leak state between runs
            await store.resetKey(key);
            store.shutdown();

            return true;
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it(
    // Validates: Requirements 2.3
    "as primeiras 10 tentativas não são bloqueadas — apenas a partir da 11ª (100 runs)",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.integer({ min: 1, max: 10 }),
          async (email, attempts) => {
            const store = createStore();
            const key = emailKey(email);

            // Make `attempts` increments (1–10); none should exceed the limit.
            for (let i = 0; i < attempts; i++) {
              const info = await store.increment(key);
              // Middleware blocks when totalHits > limit, so ≤ 10 is still fine.
              if (info.totalHits > RATE_LIMIT) {
                store.shutdown();
                return false;
              }
            }

            store.shutdown();
            return true;
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  it(
    // Validates: Requirements 2.3
    "e-mails distintos têm contadores independentes — bloqueio de um não afeta o outro (100 runs)",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.emailAddress(),
          async (emailA, emailB) => {
            // Skip runs where both emails produce the same key
            const keyA = emailKey(emailA);
            const keyB = emailKey(emailB);
            if (keyA === keyB) {
              return true; // discard: identical keys, not the invariant being tested
            }

            const store = createStore();

            // Exhaust the limit for emailA (11 increments → blocked)
            for (let i = 0; i < RATE_LIMIT + 1; i++) {
              await store.increment(keyA);
            }
            const infoAAfterBlock = await store.increment(keyA);
            // emailA must be past the limit
            if (infoAAfterBlock.totalHits <= RATE_LIMIT) {
              store.shutdown();
              return false;
            }

            // emailB has had zero attempts — its first increment must return totalHits === 1
            const infoBFirst = await store.increment(keyB);
            store.shutdown();

            return infoBFirst.totalHits === 1;
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});
