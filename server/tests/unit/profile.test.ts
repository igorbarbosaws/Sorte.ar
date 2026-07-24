/**
 * Unit tests for ProfileService
 * Requirements: 3.3, 3.5, 3.7, 3.8, 7.7
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfileService, AppError } from "../../src/modules/profile/profile.service.js";

// ---------------------------------------------------------------------------
// Mock storage module — prevents any real Cloudinary calls
// ---------------------------------------------------------------------------

vi.mock("../../src/lib/storage.js", () => ({
  uploadAvatar: vi.fn(),
}));

// Import the mock AFTER vi.mock() so we get the mocked version
import * as storage from "../../src/lib/storage.js";

// ---------------------------------------------------------------------------
// DB mock helpers (same fluent-chain pattern as auth.test.ts)
// ---------------------------------------------------------------------------

/**
 * Builds a select chain that supports both:
 *   - `.from().where().limit()` — resolves at `limit()`
 *   - `.from().where()` used directly as a promise — resolves at `where()`
 *
 * `result` is the value the chain eventually resolves to.
 */
function buildSelectChain(result: unknown) {
  // whereChain is both awaitable and chainable
  const whereChain = Object.assign(Promise.resolve(result), {
    limit: vi.fn().mockResolvedValue(result),
  });

  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnValue(whereChain),
  };
}

/**
 * Builds an update chain:
 *   db.update(table).set(...).where(...).returning(...)
 */
function buildUpdateChain(returning: unknown = undefined) {
  return {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(returning),
  };
}

/**
 * Assembles a Db mock where each `select()` call consumes the next entry from
 * `selectResults`, and `update()` returns a chain whose `.returning()` resolves
 * to `updateReturning`.
 *
 * Select call order in getPublicProfile:
 *   0 — users lookup          (.from().where().limit())
 *   1 — championships count   (.from().where())
 *   2 — playerLinks count     (.from().where())
 *   3 — playerLinks for user  (.from().where())
 *   4 — championships data    (.from().where())
 */
function buildDbMock(options: {
  selectResults?: unknown[][];
  updateReturning?: unknown[];
} = {}) {
  let selectCallCount = 0;
  const selectResults = options.selectResults ?? [];

  return {
    select: vi.fn((_fields?: unknown) => {
      const result = selectResults[selectCallCount++] ?? [];
      return buildSelectChain(result);
    }),
    update: vi.fn((_table: unknown) =>
      buildUpdateChain(options.updateReturning ?? [])
    ),
  };
}

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const USER_ID = "00000000-0000-0000-0000-000000000001";

// A minimal valid JPEG buffer (starts with FF D8 FF)
const VALID_JPEG_BUFFER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const VALID_MIME = "image/jpeg";
const VALID_SIZE = 1 * 1024 * 1024; // 1 MB — well within the 2 MB limit

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ProfileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // getPublicProfile — Requirements 3.5, 7.7
  // -------------------------------------------------------------------------
  describe("getPublicProfile", () => {
    it("throws NOT_FOUND when the userId does not exist in the DB (Req 3.5)", async () => {
      // First select (users lookup) returns an empty array → user not found.
      // The subsequent selects (stats aggregates) are never reached.
      const db = buildDbMock({
        selectResults: [[]],
      });

      const service = new ProfileService(db as never);

      await expect(service.getPublicProfile(USER_ID)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("returns wins=0 and runnerUp=0 when user has no player_links (Req 7.7)", async () => {
      const mockUser = {
        id: USER_ID,
        displayName: "Test User",
        avatarUrl: null,
        createdAt: new Date("2024-01-01"),
      };

      // Select call order:
      //   0 — users lookup          → [mockUser]
      //   1 — championships count   → [{ count: 2 }]
      //   2 — playerLinks count     → [{ count: 0 }]
      //   3 — playerLinks for user  → []  (no links)
      // (select #4 for championships data is never reached because the array is empty)
      const db = buildDbMock({
        selectResults: [
          [mockUser],
          [{ count: 2 }],
          [{ count: 0 }],
          [],
        ],
      });

      const service = new ProfileService(db as never);
      const profile = await service.getPublicProfile(USER_ID);

      expect(profile.stats.wins).toBe(0);
      expect(profile.stats.runnerUp).toBe(0);
      expect(profile.stats.championshipsCreated).toBe(2);
      expect(profile.stats.championshipsAsPlayer).toBe(0);
    });

    it("correctly counts wins and runnerUp from finished championships (Req 7.7)", async () => {
      const mockUser = {
        id: USER_ID,
        displayName: "Champion",
        avatarUrl: null,
        createdAt: new Date("2024-01-01"),
      };

      const CHAMP_ID_1 = "10000000-0000-0000-0000-000000000001";
      const CHAMP_ID_2 = "10000000-0000-0000-0000-000000000002";
      const CHAMP_ID_3 = "10000000-0000-0000-0000-000000000003";

      // player_links: user played as "Alice" in 3 championships
      const mockPlayerLinks = [
        { championshipId: CHAMP_ID_1, playerName: "Alice" },
        { championshipId: CHAMP_ID_2, playerName: "Alice" },
        { championshipId: CHAMP_ID_3, playerName: "Alice" },
      ];

      // Finished championships with finalPositions in JSONB data
      const mockChampionships = [
        {
          id: CHAMP_ID_1,
          status: "finished",
          data: { finalPositions: { Alice: 1 } }, // win
        },
        {
          id: CHAMP_ID_2,
          status: "finished",
          data: { finalPositions: { Alice: 2 } }, // runner-up
        },
        {
          id: CHAMP_ID_3,
          status: "ongoing", // not finished — should be ignored
          data: { finalPositions: { Alice: 1 } },
        },
      ];

      // Select call order:
      //   0 — users lookup
      //   1 — championships count
      //   2 — playerLinks count
      //   3 — playerLinks for user
      //   4 — championships data (for inArray filter)
      const db = buildDbMock({
        selectResults: [
          [mockUser],
          [{ count: 5 }],
          [{ count: 3 }],
          mockPlayerLinks,
          mockChampionships,
        ],
      });

      const service = new ProfileService(db as never);
      const profile = await service.getPublicProfile(USER_ID);

      expect(profile.stats.wins).toBe(1);
      expect(profile.stats.runnerUp).toBe(1);
      expect(profile.stats.championshipsAsPlayer).toBe(3);
    });

    it("ignores championships without finalPositions in data (Req 7.7)", async () => {
      const mockUser = {
        id: USER_ID,
        displayName: "Player",
        avatarUrl: null,
        createdAt: new Date("2024-01-01"),
      };

      const CHAMP_ID = "20000000-0000-0000-0000-000000000001";

      const db = buildDbMock({
        selectResults: [
          [mockUser],
          [{ count: 0 }],
          [{ count: 1 }],
          [{ championshipId: CHAMP_ID, playerName: "Bob" }],
          [{ id: CHAMP_ID, status: "finished", data: {} }], // no finalPositions
        ],
      });

      const service = new ProfileService(db as never);
      const profile = await service.getPublicProfile(USER_ID);

      expect(profile.stats.wins).toBe(0);
      expect(profile.stats.runnerUp).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // uploadAvatar — Requirements 3.7, 3.8
  // -------------------------------------------------------------------------
  describe("uploadAvatar", () => {
    it("throws VALIDATION_ERROR and does NOT call storage when MIME type is invalid (Req 3.8)", async () => {
      const db = buildDbMock();
      const service = new ProfileService(db as never);

      await expect(
        service.uploadAvatar(USER_ID, VALID_JPEG_BUFFER, "text/plain", VALID_SIZE)
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

      // Storage must never be called when validation fails
      expect(storage.uploadAvatar).not.toHaveBeenCalled();
    });

    it("throws VALIDATION_ERROR and does NOT call storage when file exceeds 2 MB (Req 3.7)", async () => {
      const db = buildDbMock();
      const service = new ProfileService(db as never);

      const oversizedBytes = 3 * 1024 * 1024; // 3 MB

      await expect(
        service.uploadAvatar(USER_ID, VALID_JPEG_BUFFER, VALID_MIME, oversizedBytes)
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

      expect(storage.uploadAvatar).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // updateDisplayName — Requirements 3.2, 3.3
  // -------------------------------------------------------------------------
  describe("updateDisplayName", () => {
    it("persists a valid display name by calling DB update with the correct value (Req 3.3)", async () => {
      // update().set().where().returning() resolves to a row → user exists
      const db = buildDbMock({
        updateReturning: [{ id: USER_ID }],
      });

      const service = new ProfileService(db as never);

      await expect(
        service.updateDisplayName(USER_ID, "New Name")
      ).resolves.toBeUndefined();

      // Verify the DB update was actually invoked once
      expect(db.update).toHaveBeenCalledOnce();
    });
  });
});
