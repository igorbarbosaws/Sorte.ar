// Feature: user-profiles-and-social, Property 7: Amizade é simétrica e sem duplicatas
//
// Validates: Requirements 5.5, 5.8, 5.9
//
// For any pair of users (A, B), if A sends a request to B and B accepts,
// then both A.friends SHALL contain B and B.friends SHALL contain A.
// Furthermore, no more than one friendship can exist between the same pair,
// regardless of creation order.

import { describe, it, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import { FriendService } from "../../src/modules/friend/friend.service.js";
import { AppError } from "../../src/modules/auth/auth.service.js";

// ---------------------------------------------------------------------------
// Mock DB factory helpers
// ---------------------------------------------------------------------------

/**
 * Builds a chainable mock for:
 *   db.select({ ... }).from(...).where(...).limit(1)
 * resolving to `rows`.
 */
function buildSelectChain(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
}

/**
 * Builds a chainable mock for:
 *   db.update(...).set(...).where(...)
 * resolving to undefined (no return value needed).
 */
function buildUpdateChain() {
  return {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };
}

/**
 * Builds a chainable mock for:
 *   db.insert(friendships).values({ userA, userB })
 * capturing the values passed and resolving to undefined.
 */
function buildInsertCapture(captured: { userA?: string; userB?: string }) {
  return {
    values: vi.fn().mockImplementation((vals: { userA: string; userB: string }) => {
      captured.userA = vals.userA;
      captured.userB = vals.userB;
      return Promise.resolve(undefined);
    }),
  };
}

// ---------------------------------------------------------------------------
// Property 7 — Test 1: Canonical ordering (symmetry)
//
// For any pair (A, B) where A ≠ B, after acceptRequest the friendships insert
// SHALL receive userA = min(A, B) and userB = max(A, B), i.e. userA < userB.
// The insert MUST be called exactly once.
// ---------------------------------------------------------------------------

describe("Property 7: Amizade é simétrica e sem duplicatas — Test 1: Canonical ordering", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it(
    "insert(friendships).values() sempre recebe userA < userB (canonical order) e é chamado exatamente uma vez (100 runs)",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Two distinct UUIDs for sender (fromUser) and recipient (toUser)
          fc.uuid(),
          fc.uuid(),
          fc.uuid(), // requestId
          async (fromUserId, toUserId, requestId) => {
            // Ensure the two user IDs are distinct (skip equal UUIDs)
            fc.pre(fromUserId !== toUserId);

            // Track what values were passed to the friendships insert
            const captured: { userA?: string; userB?: string } = {};
            let friendshipsInsertCallCount = 0;

            // friendRequests.select → returns a PENDING request row
            const pendingRequest = {
              id: requestId,
              fromUser: fromUserId,
              toUser: toUserId,
              status: "PENDING",
            };

            const mockDb = {
              // acceptRequest calls select once to find the PENDING request
              select: vi.fn().mockReturnValue(buildSelectChain([pendingRequest])),

              // update(friendRequests).set(...).where(...)
              update: vi.fn().mockReturnValue(buildUpdateChain()),

              // insert(friendships).values({ userA, userB })
              insert: vi.fn().mockImplementation(() => {
                friendshipsInsertCallCount++;
                return buildInsertCapture(captured);
              }),
            };

            const service = new FriendService(mockDb as never);

            // Accept the request — toUserId is the recipient
            await service.acceptRequest(requestId, toUserId);

            // Invariant 1: insert was called exactly once
            if (friendshipsInsertCallCount !== 1) return false;

            // Invariant 2: canonical ordering — userA < userB (lexicographic UUID comparison)
            if (captured.userA === undefined || captured.userB === undefined) return false;
            if (captured.userA >= captured.userB) return false;

            // Invariant 3: the two values are exactly the original user IDs (just re-ordered)
            const expected = new Set([fromUserId, toUserId]);
            const actual = new Set([captured.userA, captured.userB]);
            if (
              !expected.has(captured.userA) ||
              !expected.has(captured.userB) ||
              actual.size !== 2
            ) {
              return false;
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Property 7 — Test 2: Uniqueness (no duplicate friendships)
//
// For any pair (A, B) and N ≥ 2 accept attempts, only the first call to
// acceptRequest succeeds; subsequent calls with the same requestId SHALL
// throw an AppError with code NOT_FOUND (because the mock will no longer
// find a PENDING request), preventing duplicate insertions.
// ---------------------------------------------------------------------------

describe("Property 7: Amizade é simétrica e sem duplicatas — Test 2: Uniqueness", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it(
    "chamadas repetidas de acceptRequest com o mesmo requestId lançam NOT_FOUND após a primeira aceitação (100 runs)",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // fromUserId
          fc.uuid(), // toUserId
          fc.uuid(), // requestId
          fc.integer({ min: 2, max: 5 }), // N: number of accept attempts
          async (fromUserId, toUserId, requestId, n) => {
            fc.pre(fromUserId !== toUserId);

            const pendingRequest = {
              id: requestId,
              fromUser: fromUserId,
              toUser: toUserId,
              status: "PENDING",
            };

            let selectCallCount = 0;
            let friendshipsInsertCallCount = 0;
            const captured: { userA?: string; userB?: string } = {};

            const mockDb = {
              select: vi.fn().mockImplementation(() => {
                const callIndex = selectCallCount++;
                // First call: request is PENDING → success
                // Subsequent calls: request not found → simulate NOT_FOUND path
                if (callIndex === 0) {
                  return buildSelectChain([pendingRequest]);
                }
                return buildSelectChain([]); // no PENDING row found
              }),

              update: vi.fn().mockReturnValue(buildUpdateChain()),

              insert: vi.fn().mockImplementation(() => {
                friendshipsInsertCallCount++;
                return buildInsertCapture(captured);
              }),
            };

            const service = new FriendService(mockDb as never);

            // --- First accept: must succeed ---
            const firstResult = await service
              .acceptRequest(requestId, toUserId)
              .then(() => ({ ok: true as const }))
              .catch((err: unknown) => ({ ok: false as const, err }));

            if (!firstResult.ok) return false; // first accept must not throw

            // --- Subsequent accepts (2..N): must throw NOT_FOUND ---
            for (let i = 1; i < n; i++) {
              const result = await service
                .acceptRequest(requestId, toUserId)
                .then(() => ({ ok: true as const }))
                .catch((err: unknown) => ({ ok: false as const, err }));

              if (result.ok) return false; // should have been rejected

              const err = (result as { ok: false; err: unknown }).err;
              if (!(err instanceof AppError) || err.code !== "NOT_FOUND") {
                return false; // wrong error
              }
            }

            // The friendships table was inserted exactly once (on the first accept)
            if (friendshipsInsertCallCount !== 1) return false;

            return true;
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});
