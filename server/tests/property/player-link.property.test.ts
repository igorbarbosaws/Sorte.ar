// Feature: user-profiles-and-social, Property 8: Player_Link é exclusivo por jogador e por usuário no campeonato
//
// Validates: Requirements 6.2, 6.4
//
// For any championship, there cannot be more than one Player_Link with the same
// `player_name`, and there cannot be more than one Player_Link with the same
// `linked_user_id`. Any attempt to create a second link violating one of these
// constraints SHALL return a conflict error.

import { describe, it, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import { PlayerLinkService } from "../../src/modules/player-link/player-link.service.js";
import { AppError } from "../../src/modules/auth/auth.service.js";

// ---------------------------------------------------------------------------
// Mock DB factory helpers
// ---------------------------------------------------------------------------

/**
 * Builds a chainable select mock:
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
 * Builds a chainable insert mock:
 *   db.insert(...).values({ ... }).returning()
 * resolving to `returnValue`.
 */
function buildInsertChain(returnValue: unknown[]) {
  return {
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue(returnValue),
    }),
  };
}

// ---------------------------------------------------------------------------
// createLink select call order (from player-link.service.ts):
//   select[0] → championship lookup
//   select[1] → user lookup by email
//   select[2] → friendship check
//   select[3] → existing player link by player_name (CONFLICT check)
//   select[4] → existing user link by linked_user_id (CONFLICT check)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Property 8 — Test 1: Player name exclusivity
//
// For any player name, a second createLink attempt with the same player_name
// in the same championship MUST throw AppError with code CONFLICT.
// ---------------------------------------------------------------------------

describe("Property 8: Player_Link é exclusivo — Test 1: Player name exclusivity", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it(
    "segunda chamada createLink com o mesmo player_name lança AppError CONFLICT (100 runs)",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Player name: non-empty, non-whitespace-only, up to 50 chars
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          fc.uuid(), // championshipId
          fc.uuid(), // creatorId
          fc.uuid(), // linkedUserId (target user)
          async (playerName, championshipId, creatorId, linkedUserId) => {
            // ---------------------------------------------------------------
            // Build a fresh mock DB for this property run.
            //
            // First createLink call:
            //   select[0] → championship found, creatorId matches
            //   select[1] → user found
            //   select[2] → friendship found
            //   select[3] → [] (no existing player link by name)
            //   select[4] → [] (no existing user link)
            //   insert    → success
            //
            // Second createLink call:
            //   select[0] → championship found, creatorId matches
            //   select[1] → user found
            //   select[2] → friendship found
            //   select[3] → [{ id: 'existing-link' }] (player already linked!)
            //   → throws CONFLICT before reaching select[4]
            // ---------------------------------------------------------------

            const championship = {
              id: championshipId,
              creatorId,
              status: "ongoing",
            };

            const targetUser = { id: linkedUserId };
            const friendship = { userA: creatorId < linkedUserId ? creatorId : linkedUserId };

            let selectCallCount = 0;

            const mockDb = {
              select: vi.fn().mockImplementation(() => {
                const idx = selectCallCount++;
                // Calls 0–4: first createLink
                if (idx === 0) return buildSelectChain([championship]); // championship
                if (idx === 1) return buildSelectChain([targetUser]);   // user by email
                if (idx === 2) return buildSelectChain([friendship]);   // friendship
                if (idx === 3) return buildSelectChain([]);              // no player link for name (first call)
                if (idx === 4) return buildSelectChain([]);              // no user link (first call)
                // Calls 5–9: second createLink
                if (idx === 5) return buildSelectChain([championship]); // championship
                if (idx === 6) return buildSelectChain([targetUser]);   // user by email
                if (idx === 7) return buildSelectChain([friendship]);   // friendship
                if (idx === 8) return buildSelectChain([{ id: "existing-link" }]); // player already linked!
                // Should not reach idx === 9 (CONFLICT already thrown at idx 8)
                return buildSelectChain([]);
              }),

              insert: vi.fn().mockReturnValue(
                buildInsertChain([{
                  id: "new-link-id",
                  championshipId,
                  playerName,
                  linkedUserId,
                  createdAt: new Date(),
                }])
              ),
            };

            const service = new PlayerLinkService(mockDb as never);
            const email = `user-${linkedUserId}@example.com`;

            // --- First call: must succeed ---
            const firstResult = await service
              .createLink(championshipId, creatorId, playerName, email)
              .then(() => ({ ok: true as const }))
              .catch((err: unknown) => ({ ok: false as const, err }));

            if (!firstResult.ok) return false; // first call must not throw

            // --- Second call: must throw CONFLICT ---
            const secondResult = await service
              .createLink(championshipId, creatorId, playerName, email)
              .then(() => ({ ok: true as const }))
              .catch((err: unknown) => ({ ok: false as const, err }));

            if (secondResult.ok) return false; // must have been rejected

            const err = (secondResult as { ok: false; err: unknown }).err;
            if (!(err instanceof AppError) || err.code !== "CONFLICT") return false;

            return true;
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});

// ---------------------------------------------------------------------------
// Property 8 — Test 2: User exclusivity
//
// For any user, a second createLink attempt with the same linked_user_id
// in the same championship MUST throw AppError with code CONFLICT.
// ---------------------------------------------------------------------------

describe("Property 8: Player_Link é exclusivo — Test 2: User exclusivity", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it(
    "segunda chamada createLink com o mesmo linked_user_id lança AppError CONFLICT (100 runs)",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Two distinct player names (first and second attempt use different names)
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          fc.uuid(), // championshipId
          fc.uuid(), // creatorId
          fc.uuid(), // linkedUserId (same user both times)
          async (playerNameA, playerNameB, championshipId, creatorId, linkedUserId) => {
            // Use pre() to ensure the two player names are different
            // (otherwise we'd hit a player-name conflict, not a user conflict)
            fc.pre(playerNameA !== playerNameB);

            // ---------------------------------------------------------------
            // Build a fresh mock DB for this property run.
            //
            // First createLink call (playerNameA):
            //   select[0] → championship found
            //   select[1] → user found
            //   select[2] → friendship found
            //   select[3] → [] (no existing link for playerNameA)
            //   select[4] → [] (no existing user link)
            //   insert    → success
            //
            // Second createLink call (playerNameB, same user):
            //   select[5] → championship found
            //   select[6] → user found
            //   select[7] → friendship found
            //   select[8] → [] (no existing link for playerNameB)
            //   select[9] → [{ id: 'existing-link' }] (user already linked!)
            //   → throws CONFLICT
            // ---------------------------------------------------------------

            const championship = {
              id: championshipId,
              creatorId,
              status: "ongoing",
            };

            const targetUser = { id: linkedUserId };
            const friendship = { userA: creatorId < linkedUserId ? creatorId : linkedUserId };

            let selectCallCount = 0;

            const mockDb = {
              select: vi.fn().mockImplementation(() => {
                const idx = selectCallCount++;
                // First createLink (indices 0–4)
                if (idx === 0) return buildSelectChain([championship]);
                if (idx === 1) return buildSelectChain([targetUser]);
                if (idx === 2) return buildSelectChain([friendship]);
                if (idx === 3) return buildSelectChain([]); // no player link for playerNameA
                if (idx === 4) return buildSelectChain([]); // no user link yet
                // Second createLink (indices 5–9)
                if (idx === 5) return buildSelectChain([championship]);
                if (idx === 6) return buildSelectChain([targetUser]);
                if (idx === 7) return buildSelectChain([friendship]);
                if (idx === 8) return buildSelectChain([]); // no player link for playerNameB
                if (idx === 9) return buildSelectChain([{ id: "existing-link" }]); // user already linked!
                return buildSelectChain([]);
              }),

              insert: vi.fn().mockReturnValue(
                buildInsertChain([{
                  id: "new-link-id",
                  championshipId,
                  playerName: playerNameA,
                  linkedUserId,
                  createdAt: new Date(),
                }])
              ),
            };

            const service = new PlayerLinkService(mockDb as never);
            const email = `user-${linkedUserId}@example.com`;

            // --- First call (playerNameA): must succeed ---
            const firstResult = await service
              .createLink(championshipId, creatorId, playerNameA, email)
              .then(() => ({ ok: true as const }))
              .catch((err: unknown) => ({ ok: false as const, err }));

            if (!firstResult.ok) return false; // first call must not throw

            // --- Second call (playerNameB, same user): must throw CONFLICT ---
            const secondResult = await service
              .createLink(championshipId, creatorId, playerNameB, email)
              .then(() => ({ ok: true as const }))
              .catch((err: unknown) => ({ ok: false as const, err }));

            if (secondResult.ok) return false; // must have been rejected

            const err = (secondResult as { ok: false; err: unknown }).err;
            if (!(err instanceof AppError) || err.code !== "CONFLICT") return false;

            return true;
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});
