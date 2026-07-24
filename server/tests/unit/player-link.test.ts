/**
 * Unit tests for PlayerLinkService
 * Requirements: 6.3, 6.4, 6.7, 6.9
 */

import { describe, it, expect, vi } from "vitest";
import { PlayerLinkService } from "../../src/modules/player-link/player-link.service.js";

// ---------------------------------------------------------------------------
// Fake data helpers
// ---------------------------------------------------------------------------

const CREATOR_ID = "00000000-0000-0000-0000-000000000001";
const TARGET_USER_ID = "00000000-0000-0000-0000-000000000002";
const CHAMPIONSHIP_ID = "00000000-0000-0000-0000-000000000010";
const LINK_ID = "00000000-0000-0000-0000-000000000020";

function makeChampionship(overrides: Record<string, unknown> = {}) {
  return {
    id: CHAMPIONSHIP_ID,
    creatorId: CREATOR_ID,
    localId: null,
    title: "Test Championship",
    format: "groups-knockout",
    status: "ongoing",
    champion: null,
    data: { players: [], teams: [], draw: [], format: {} },
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
    finishedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock DB builder helpers — same fluent chain pattern as other unit tests
// ---------------------------------------------------------------------------

/**
 * Builds a select chain that resolves to `result` after .limit()
 */
function buildSelectChain(result: unknown) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
}

/**
 * Builds an insert chain that resolves to `returning` after .returning()
 */
function buildInsertChain(returning: unknown = []) {
  const inner = {
    returning: vi.fn().mockResolvedValue(returning),
  };
  return {
    values: vi.fn().mockReturnValue(inner),
  };
}

/**
 * Builds a delete chain: .where() → resolves to undefined
 */
function buildDeleteChain() {
  return {
    where: vi.fn().mockResolvedValue(undefined),
  };
}

/**
 * Assembles a DB mock where each call to `db.select()` consumes the next
 * result from `selectResults`.
 */
function buildDbMock(options: {
  selectResults?: unknown[][];
  insertReturning?: unknown[];
} = {}) {
  let selectCallCount = 0;
  const selectResults = options.selectResults ?? [];

  return {
    select: vi.fn((_fields?: unknown) => {
      const result = selectResults[selectCallCount++] ?? [];
      return buildSelectChain(result);
    }),
    insert: vi.fn((_table: unknown) =>
      buildInsertChain(options.insertReturning ?? [])
    ),
    delete: vi.fn((_table: unknown) => buildDeleteChain()),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PlayerLinkService", () => {
  // -------------------------------------------------------------------------
  // createLink — non-friend email returns FRIEND_NOT_FOUND (Req 6.3)
  // -------------------------------------------------------------------------
  describe("createLink", () => {
    it("throws FRIEND_NOT_FOUND when target user is not a friend of the creator (Req 6.3)", async () => {
      // selectResults[0] → ongoing championship
      // selectResults[1] → target user found by email
      // selectResults[2] → no friendship row found
      const db = buildDbMock({
        selectResults: [
          [makeChampionship()],          // championship lookup
          [{ id: TARGET_USER_ID }],      // user found by email
          [],                            // friendship lookup → empty (not a friend)
        ],
      });

      const service = new PlayerLinkService(db as never);

      await expect(
        service.createLink(CHAMPIONSHIP_ID, CREATOR_ID, "Player1", "notfriend@example.com")
      ).rejects.toMatchObject({ code: "FRIEND_NOT_FOUND" });
    });

    // -----------------------------------------------------------------------
    // createLink — already-linked player returns CONFLICT (Req 6.4)
    // -----------------------------------------------------------------------
    it("throws CONFLICT when a link already exists for the player or user in the championship (Req 6.4)", async () => {
      // selectResults[0] → ongoing championship
      // selectResults[1] → target user found by email
      // selectResults[2] → friendship exists
      // selectResults[3] → existing player link found → conflict
      const db = buildDbMock({
        selectResults: [
          [makeChampionship()],                        // championship lookup
          [{ id: TARGET_USER_ID }],                    // user found by email
          [{ userA: CREATOR_ID }],                     // friendship exists
          [{ id: LINK_ID }],                           // existing player link found
        ],
      });

      const service = new PlayerLinkService(db as never);

      await expect(
        service.createLink(CHAMPIONSHIP_ID, CREATOR_ID, "Player1", "friend@example.com")
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });
  });

  // -------------------------------------------------------------------------
  // removeLink — finished championship returns CHAMPIONSHIP_FINISHED (Req 6.7)
  // -------------------------------------------------------------------------
  describe("removeLink", () => {
    it("throws CHAMPIONSHIP_FINISHED when trying to remove a link from a finished championship (Req 6.7)", async () => {
      // selectResults[0] → finished championship
      const db = buildDbMock({
        selectResults: [
          [makeChampionship({ status: "finished" })],  // championship is finished
        ],
      });

      const service = new PlayerLinkService(db as never);

      await expect(
        service.removeLink(CHAMPIONSHIP_ID, LINK_ID, CREATOR_ID)
      ).rejects.toMatchObject({ code: "CHAMPIONSHIP_FINISHED" });
    });
  });

  // -------------------------------------------------------------------------
  // updateLink — swaps the linked user correctly (Req 6.9)
  // -------------------------------------------------------------------------
  describe("updateLink", () => {
    it("deletes the old link and inserts a new one with the new user (Req 6.9)", async () => {
      const NEW_USER_ID = "00000000-0000-0000-0000-000000000003";
      const newLink = {
        id: "00000000-0000-0000-0000-000000000021",
        championshipId: CHAMPIONSHIP_ID,
        playerName: "Player1",
        linkedUserId: NEW_USER_ID,
        createdAt: new Date(),
      };

      // selectResults[0] → ongoing championship
      // selectResults[1] → existing link found
      // selectResults[2] → new user found by email
      // selectResults[3] → friendship with new user exists
      const db = buildDbMock({
        selectResults: [
          [makeChampionship()],                                           // championship lookup
          [{ id: LINK_ID, championshipId: CHAMPIONSHIP_ID, playerName: "Player1", linkedUserId: "old-user-id", createdAt: new Date() }],  // existing link
          [{ id: NEW_USER_ID }],                                          // new user found
          [{ userA: CREATOR_ID }],                                        // friendship exists
        ],
        insertReturning: [newLink],
      });

      const service = new PlayerLinkService(db as never);

      const result = await service.updateLink(
        CHAMPIONSHIP_ID,
        LINK_ID,
        CREATOR_ID,
        "newuser@example.com"
      );

      // The old link must be deleted
      expect(db.delete).toHaveBeenCalledTimes(1);

      // A new link must be inserted
      expect(db.insert).toHaveBeenCalledTimes(1);

      // The returned link should point to the new user
      expect(result.linkedUserId).toBe(NEW_USER_ID);
    });
  });
});
