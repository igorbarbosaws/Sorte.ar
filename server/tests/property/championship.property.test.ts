// Feature: user-profiles-and-social, Property 10: Autorização de campeonato rejeita não-criadores
//
// Validates: Requirements 9.1, 9.2
//
// For any pair (creatorId, requestingUserId):
//   - When creatorId !== requestingUserId → updateScore and delete MUST throw
//     AppError with code AUTHORIZATION_FAILED, and the DB mutation mock MUST
//     NOT have been called.
//   - When creatorId === requestingUserId → operations should NOT throw
//     AUTHORIZATION_FAILED (they may throw other errors if the mock returns
//     unexpected shapes, but the authorization gate itself must pass).

import { describe, it, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { ChampionshipService } from "../../src/modules/championship/championship.service.js";
import { AppError } from "../../src/modules/auth/auth.service.js";

// ---------------------------------------------------------------------------
// Mock DB factory
// ---------------------------------------------------------------------------

/**
 * Creates a Drizzle-compatible mock DB whose chain resolves as follows:
 *
 *   select().from().where().limit()  → [{ id: 'champ-id', creatorId, status: 'ongoing', ... }]
 *   update().set().where().returning() → [{ id: 'champ-id' }]
 *   delete().where()                 → undefined
 *
 * The update and delete mocks are exposed so tests can assert they were/were
 * not called.
 */
function createMockDb(creatorId: string) {
  const championship = {
    id: "champ-id",
    creatorId,
    title: "Test Championship",
    format: "knockout",
    status: "ongoing",
    champion: null,
    localId: null,
    data: { players: [], teams: [], draw: [], format: {} },
    createdAt: new Date(),
    updatedAt: new Date(),
    finishedAt: null,
  };

  // Mocks for mutation operations — exposed for assertion
  const returningMock = vi.fn().mockResolvedValue([{ id: "champ-id" }]);
  const updateSetMock = vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      returning: returningMock,
    }),
  });
  const updateMock = vi.fn().mockReturnValue({
    set: updateSetMock,
  });

  const deleteWhereMock = vi.fn().mockResolvedValue(undefined);
  const deleteMock = vi.fn().mockReturnValue({
    where: deleteWhereMock,
  });

  const db = {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([championship]),
        }),
      }),
    }),
    update: updateMock,
    delete: deleteMock,
  };

  return { db, updateMock, deleteWhereMock };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

// Pair of UUIDs: (creatorId, requestingUserId) — always different
const differentUsersPair = fc
  .tuple(fc.uuid(), fc.uuid())
  .filter(([a, b]) => a !== b);

// A single UUID used for both IDs (creatorId === requestingUserId)
const sameUserUuid = fc.uuid();

// Minimal valid UpdateChampionshipInput
const validUpdateInput = {
  data: { players: [], teams: [], draw: [], format: {} },
};

// ---------------------------------------------------------------------------
// Property 10 — non-creator receives AUTHORIZATION_FAILED
// ---------------------------------------------------------------------------

describe("Property 10: Autorização de campeonato rejeita não-criadores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // updateScore: non-creator path
  // -------------------------------------------------------------------------
  it(
    "updateScore lança AUTHORIZATION_FAILED e NÃO chama DB update quando requestingUserId !== creatorId (100 runs)",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          differentUsersPair,
          async ([creatorId, requestingUserId]) => {
            const { db, updateMock } = createMockDb(creatorId);
            const service = new ChampionshipService(db as never);

            let threwAuthError = false;
            try {
              await service.updateScore("champ-id", validUpdateInput, requestingUserId);
            } catch (err) {
              if (err instanceof AppError && err.code === "AUTHORIZATION_FAILED") {
                threwAuthError = true;
              } else {
                // Unexpected error — property violated
                return false;
              }
            }

            // Must have thrown AUTHORIZATION_FAILED
            if (!threwAuthError) return false;

            // DB update must NOT have been called
            if (updateMock.mock.calls.length > 0) return false;

            return true;
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  // -------------------------------------------------------------------------
  // delete: non-creator path
  // -------------------------------------------------------------------------
  it(
    "delete lança AUTHORIZATION_FAILED e NÃO chama DB delete quando requestingUserId !== creatorId (100 runs)",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          differentUsersPair,
          async ([creatorId, requestingUserId]) => {
            const { db, deleteWhereMock } = createMockDb(creatorId);
            const service = new ChampionshipService(db as never);

            let threwAuthError = false;
            try {
              await service.delete("champ-id", requestingUserId);
            } catch (err) {
              if (err instanceof AppError && err.code === "AUTHORIZATION_FAILED") {
                threwAuthError = true;
              } else {
                // Unexpected error — property violated
                return false;
              }
            }

            // Must have thrown AUTHORIZATION_FAILED
            if (!threwAuthError) return false;

            // DB delete.where() must NOT have been called
            if (deleteWhereMock.mock.calls.length > 0) return false;

            return true;
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  // -------------------------------------------------------------------------
  // updateScore: creator path (must NOT throw AUTHORIZATION_FAILED)
  // -------------------------------------------------------------------------
  it(
    "updateScore NÃO lança AUTHORIZATION_FAILED quando requestingUserId === creatorId (100 runs)",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          sameUserUuid,
          async (userId) => {
            const { db } = createMockDb(userId);
            const service = new ChampionshipService(db as never);

            try {
              await service.updateScore("champ-id", validUpdateInput, userId);
              // No error thrown — authorization passed
              return true;
            } catch (err) {
              if (err instanceof AppError && err.code === "AUTHORIZATION_FAILED") {
                // Authorization gate blocked the creator — property violated
                return false;
              }
              // Other errors (e.g. DB mock returning unexpected shape) are
              // acceptable — the authorization gate itself passed
              return true;
            }
          },
        ),
        { numRuns: 100 },
      );
    },
  );

  // -------------------------------------------------------------------------
  // delete: creator path (must NOT throw AUTHORIZATION_FAILED)
  // -------------------------------------------------------------------------
  it(
    "delete NÃO lança AUTHORIZATION_FAILED quando requestingUserId === creatorId (100 runs)",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          sameUserUuid,
          async (userId) => {
            const { db } = createMockDb(userId);
            const service = new ChampionshipService(db as never);

            try {
              await service.delete("champ-id", userId);
              // No error thrown — authorization passed
              return true;
            } catch (err) {
              if (err instanceof AppError && err.code === "AUTHORIZATION_FAILED") {
                // Authorization gate blocked the creator — property violated
                return false;
              }
              // Other errors are acceptable
              return true;
            }
          },
        ),
        { numRuns: 100 },
      );
    },
  );
});
