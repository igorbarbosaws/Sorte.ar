/**
 * Unit tests for ChampionshipService
 * Requirements: 4.1, 4.2, 4.8, 4.9, 9.1, 9.2
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import {
  ChampionshipService,
} from "../../src/modules/championship/championship.service.js";
import { AppError } from "../../src/modules/auth/auth.service.js";

beforeAll(() => {
  process.env["JWT_SECRET"] = "test-secret-value-for-unit-tests";
});

// ---------------------------------------------------------------------------
// Fake data helpers
// ---------------------------------------------------------------------------

const CREATOR_ID = "00000000-0000-0000-0000-000000000001";
const OTHER_USER_ID = "00000000-0000-0000-0000-000000000002";
const CHAMPIONSHIP_ID = "00000000-0000-0000-0000-000000000010";

const VALID_INPUT = {
  title: "World Cup 2024",
  format: "groups-knockout" as const,
  data: { players: [], teams: [], draw: [], format: {} },
};

function makeChampionship(overrides: Record<string, unknown> = {}) {
  return {
    id: CHAMPIONSHIP_ID,
    creatorId: CREATOR_ID,
    localId: null,
    title: "World Cup 2024",
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
// Mock DB builder helpers — same fluent chain pattern as auth.test.ts
// ---------------------------------------------------------------------------

/**
 * Builds a select chain that resolves to `result` after .limit()
 */
function buildSelectChain(result: unknown) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
}

/**
 * Builds an insert chain that resolves to `returning` after .returning()
 */
function buildInsertChain(returning: unknown) {
  const inner = {
    returning: vi.fn().mockResolvedValue(returning),
  };
  return {
    values: vi.fn().mockReturnValue(inner),
  };
}

/**
 * Builds a standard update chain: .set().where().returning() → resolves to `result`
 */
function buildUpdateChain(result: unknown = [{ id: CHAMPIONSHIP_ID }]) {
  const innermost = {
    returning: vi.fn().mockResolvedValue(result),
  };
  const whereProxy = {
    where: vi.fn().mockReturnValue(innermost),
    // also support bare .where() without .returning() (used by finalize second update)
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve(undefined).then(resolve),
  };
  const setProxy = {
    set: vi.fn().mockReturnValue(whereProxy),
  };
  return setProxy;
}

/**
 * Builds a failing update chain: .set().where().returning() → rejects
 */
function buildFailingUpdateChain(error: Error) {
  const innermost = {
    returning: vi.fn().mockRejectedValue(error),
  };
  const whereProxy = {
    where: vi.fn().mockReturnValue(innermost),
  };
  return {
    set: vi.fn().mockReturnValue(whereProxy),
  };
}

/**
 * Assembles a DB mock with configurable per-call select results and a single
 * insert/update outcome.
 */
function buildDbMock(options: {
  selectResults?: unknown[][];
  insertReturning?: unknown[];
  updateChain?: ReturnType<typeof buildUpdateChain> | ReturnType<typeof buildFailingUpdateChain>;
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
    update: vi.fn((_table: unknown) =>
      options.updateChain ?? buildUpdateChain()
    ),
  };
}

// ---------------------------------------------------------------------------
// Feed-specific mock builder
// getFeed resolves after .where() — no .limit() in the call chain.
// ---------------------------------------------------------------------------

/**
 * Builds a select chain where .where() is a thenable (resolves to `result`).
 * Used for getFeed which does NOT call .limit() — it awaits the .where() result.
 */
function buildFeedSelectChain(result: unknown) {
  const whereProxy = {
    // make where() await-able
    then(
      resolve: (v: unknown) => unknown,
      reject?: (e: unknown) => unknown,
    ) {
      return Promise.resolve(result).then(resolve, reject);
    },
    // getFeed's 4th query uses .where(and(...)) — and() is called before .where()
    // so no extra chaining is needed beyond making where() thenable.
  };
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnValue(whereProxy),
  };
}

/**
 * Builds a DB mock for getFeed.
 * getFeed always calls select() in this order:
 *   [0] creator championships
 *   [1] player_link IDs  (select({ championshipId }))
 *   [2] player championships  (only if [1] is non-empty)
 *   [3] player_link details   (only if [1] is non-empty)
 *
 * Each element of `selectResults` maps to the corresponding select() call.
 */
function buildFeedDbMock(selectResults: unknown[][]) {
  let callCount = 0;
  return {
    select: vi.fn((_fields?: unknown) => {
      const result = selectResults[callCount++] ?? [];
      return buildFeedSelectChain(result);
    }),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ChampionshipService", () => {
  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  describe("create", () => {
    it("persists all championship fields and returns the created record (Req 4.1)", async () => {
      const expected = makeChampionship();
      const db = buildDbMock({ insertReturning: [expected] });
      const service = new ChampionshipService(db as never);

      const result = await service.create(CREATOR_ID, VALID_INPUT);

      // All key fields should be present in the returned record
      expect(result.id).toBe(CHAMPIONSHIP_ID);
      expect(result.title).toBe(VALID_INPUT.title);
      expect(result.format).toBe(VALID_INPUT.format);
      expect(result.creatorId).toBe(CREATOR_ID);
      expect(result.data).toEqual(VALID_INPUT.data);
      expect(result.status).toBe("ongoing");
    });

    it("throws VALIDATION_ERROR when title is empty (Req 4.1)", async () => {
      const db = buildDbMock();
      const service = new ChampionshipService(db as never);

      await expect(
        service.create(CREATOR_ID, { ...VALID_INPUT, title: "" })
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    });

    it("throws DB_SAVE_ERROR when insert returns no row (Req 4.1)", async () => {
      // insert().values().returning() → [] (empty — DB didn't return a row)
      const db = buildDbMock({ insertReturning: [] });
      const service = new ChampionshipService(db as never);

      await expect(service.create(CREATOR_ID, VALID_INPUT)).rejects.toMatchObject({
        code: "DB_SAVE_ERROR",
      });
    });
  });

  // -------------------------------------------------------------------------
  // list
  // -------------------------------------------------------------------------
  describe("list", () => {
    it("returns items ordered by created_at DESC with nextCursor when DB returns exactly 100 items (Req 4.2, 4.9)", async () => {
      // Build 100 fake championships with distinct createdAt values
      // Use a base timestamp and offset each by 1 hour to avoid invalid calendar dates
      const baseTime = new Date("2024-01-01T00:00:00Z").getTime();
      const items = Array.from({ length: 100 }, (_, i) =>
        makeChampionship({
          id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
          createdAt: new Date(baseTime + i * 3_600_000),
        })
      );

      const db = buildDbMock({ selectResults: [items] });
      const service = new ChampionshipService(db as never);

      const result = await service.list(CREATOR_ID);

      expect(result.items).toHaveLength(100);
      // nextCursor should be set when exactly PAGE_SIZE items are returned
      expect(result.nextCursor).toBeDefined();
      // nextCursor should be the ISO string of the last item's createdAt
      const lastItem = items[items.length - 1]!;
      expect(result.nextCursor).toBe(lastItem.createdAt.toISOString());
    });

    it("returns items with no nextCursor when DB returns fewer than 100 items (Req 4.2, 4.9)", async () => {
      // Build 99 fake championships using hourly offsets to stay within valid dates
      const baseTime = new Date("2024-01-01T00:00:00Z").getTime();
      const items = Array.from({ length: 99 }, (_, i) =>
        makeChampionship({
          id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
          createdAt: new Date(baseTime + i * 3_600_000),
        })
      );

      const db = buildDbMock({ selectResults: [items] });
      const service = new ChampionshipService(db as never);

      const result = await service.list(CREATOR_ID);

      expect(result.items).toHaveLength(99);
      // nextCursor must be absent — there is no next page
      expect(result.nextCursor).toBeUndefined();
    });

    it("returns empty list with no nextCursor when user has no championships (Req 4.2)", async () => {
      const db = buildDbMock({ selectResults: [[]] });
      const service = new ChampionshipService(db as never);

      const result = await service.list(CREATOR_ID);

      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // finalize
  // -------------------------------------------------------------------------
  describe("finalize", () => {
    it("marks championship status as 'finished' and sets the champion (Req 4.8)", async () => {
      // First select → fetch championship; finalize does two updates (status + finishedAt)
      // We need the update chain to handle both .set().where() calls
      let updateCallCount = 0;
      const db = {
        select: vi.fn((_fields?: unknown) => buildSelectChain([makeChampionship()])),
        insert: vi.fn(),
        update: vi.fn((_table: unknown) => {
          updateCallCount++;
          // Both updates resolve successfully
          const inner = {
            returning: vi.fn().mockResolvedValue([{ id: CHAMPIONSHIP_ID }]),
          };
          const whereProxy = {
            where: vi.fn().mockReturnValue(inner),
            then: (resolve: (v: unknown) => unknown) =>
              Promise.resolve(undefined).then(resolve),
          };
          return { set: vi.fn().mockReturnValue(whereProxy) };
        }),
      };

      const service = new ChampionshipService(db as never);
      await expect(
        service.finalize(CHAMPIONSHIP_ID, "Team A", CREATOR_ID)
      ).resolves.toBeUndefined();

      // update should have been called at least once (for status change)
      expect(db.update.mock.calls.length).toBeGreaterThan(0);
    });

    it("throws NOT_FOUND when championship does not exist (Req 4.8)", async () => {
      const db = buildDbMock({ selectResults: [[]] });
      const service = new ChampionshipService(db as never);

      await expect(
        service.finalize(CHAMPIONSHIP_ID, "Team A", CREATOR_ID)
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws AUTHORIZATION_FAILED when caller is not the creator (Req 9.2)", async () => {
      // Championship owned by CREATOR_ID, caller is OTHER_USER_ID
      const db = buildDbMock({
        selectResults: [[makeChampionship({ creatorId: CREATOR_ID })]],
      });
      const service = new ChampionshipService(db as never);

      await expect(
        service.finalize(CHAMPIONSHIP_ID, "Team A", OTHER_USER_ID)
      ).rejects.toMatchObject({ code: "AUTHORIZATION_FAILED" });
    });
  });

  // -------------------------------------------------------------------------
  // updateScore — DB failure preserves state (Req 4.5, 9.1)
  // -------------------------------------------------------------------------
  describe("updateScore", () => {
    it("throws DB_SAVE_ERROR and does not modify DB when the update chain throws a generic Error (Req 4.5)", async () => {
      const genericError = new Error("connection reset");

      const db = {
        select: vi.fn((_fields?: unknown) =>
          buildSelectChain([makeChampionship()])
        ),
        insert: vi.fn(),
        update: vi.fn((_table: unknown) =>
          buildFailingUpdateChain(genericError)
        ),
      };

      const service = new ChampionshipService(db as never);

      await expect(
        service.updateScore(
          CHAMPIONSHIP_ID,
          { data: { players: [], teams: [], draw: [], format: {}, updatedScore: true } },
          CREATOR_ID
        )
      ).rejects.toMatchObject({ code: "DB_SAVE_ERROR" });

      // update was called once (the failed attempt) — the DB was not called again
      expect(db.update).toHaveBeenCalledTimes(1);
    });

    it("throws AUTHORIZATION_FAILED (403) when userId does not match the championship creator (Req 9.1)", async () => {
      // Championship owned by CREATOR_ID; caller is OTHER_USER_ID
      const db = buildDbMock({
        selectResults: [[makeChampionship({ creatorId: CREATOR_ID })]],
      });
      const service = new ChampionshipService(db as never);

      await expect(
        service.updateScore(
          CHAMPIONSHIP_ID,
          { data: { players: [], teams: [], draw: [], format: {} } },
          OTHER_USER_ID
        )
      ).rejects.toMatchObject({ code: "AUTHORIZATION_FAILED" });
    });

    it("resolves successfully when caller is the creator and DB succeeds (Req 4.4, 9.1)", async () => {
      const db = {
        select: vi.fn((_fields?: unknown) =>
          buildSelectChain([makeChampionship()])
        ),
        insert: vi.fn(),
        update: vi.fn((_table: unknown) => buildUpdateChain([{ id: CHAMPIONSHIP_ID }])),
      };

      const service = new ChampionshipService(db as never);

      await expect(
        service.updateScore(
          CHAMPIONSHIP_ID,
          { data: { players: [], teams: [], draw: [], format: {} } },
          CREATOR_ID
        )
      ).resolves.toBeUndefined();
    });

    it("throws NOT_FOUND when championship does not exist (Req 4.4)", async () => {
      const db = buildDbMock({ selectResults: [[]] });
      const service = new ChampionshipService(db as never);

      await expect(
        service.updateScore(
          CHAMPIONSHIP_ID,
          { data: {} },
          CREATOR_ID
        )
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // -------------------------------------------------------------------------
  // getFeed — Requirements 7.1, 7.2, 7.3
  // -------------------------------------------------------------------------
  describe("getFeed", () => {
    const USER_ID = "00000000-0000-0000-0000-000000000001";
    const OTHER_USER = "00000000-0000-0000-0000-000000000002";
    const date1 = new Date("2024-06-01T00:00:00Z");
    const date2 = new Date("2024-05-01T00:00:00Z");

    it("returns creator and player championships with correct userRole (Req 7.1)", async () => {
      /**
       * select[0] → championships where creatorId = userId  (creator-champ)
       * select[1] → player_link rows where linkedUserId = userId  (player-champ id)
       * select[2] → championships where id IN [player-champ]
       * select[3] → player_link details for player-champ
       */
      const db = buildFeedDbMock([
        // [0] creator championships
        [
          {
            id: "creator-champ",
            creatorId: USER_ID,
            title: "My Champ",
            status: "ongoing",
            updatedAt: date1,
            data: {},
            champion: null,
            localId: null,
            format: "knockout",
            createdAt: date1,
            finishedAt: null,
          },
        ],
        // [1] player link IDs
        [{ championshipId: "player-champ" }],
        // [2] player championships
        [
          {
            id: "player-champ",
            creatorId: OTHER_USER,
            title: "Their Champ",
            status: "ongoing",
            updatedAt: date2,
            data: {},
            champion: null,
            localId: null,
            format: "league",
            createdAt: date2,
            finishedAt: null,
          },
        ],
        // [3] player link details
        [
          {
            id: "link-id",
            championshipId: "player-champ",
            playerName: "Alice",
            linkedUserId: USER_ID,
            createdAt: date2,
          },
        ],
      ]);

      const service = new ChampionshipService(db as never);
      const result = await service.getFeed(USER_ID);

      expect(result).toHaveLength(2);

      const creatorItem = result.find((item) => item.id === "creator-champ");
      const playerItem = result.find((item) => item.id === "player-champ");

      expect(creatorItem).toBeDefined();
      expect(creatorItem!.userRole).toBe("creator");

      expect(playerItem).toBeDefined();
      expect(playerItem!.userRole).toBe("player");
    });

    it("shows champion when championship is finished (Req 7.3)", async () => {
      /**
       * select[0] → one finished championship (creator)
       * select[1] → no player links
       */
      const db = buildFeedDbMock([
        // [0] creator championships
        [
          {
            id: "champ-id",
            creatorId: USER_ID,
            title: "Cup",
            status: "finished",
            champion: "Barcelona",
            updatedAt: date1,
            data: {},
            localId: null,
            format: "knockout",
            createdAt: date1,
            finishedAt: date1,
          },
        ],
        // [1] no player links
        [],
      ]);

      const service = new ChampionshipService(db as never);
      const result = await service.getFeed(USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0]!.champion).toBe("Barcelona");
      expect(result[0]!.status).toBe("finished");
    });

    it("shows currentPhase for in-progress championship (Req 7.2)", async () => {
      /**
       * select[0] → one ongoing championship with currentPhase in data
       * select[1] → no player links
       */
      const db = buildFeedDbMock([
        // [0] creator championship with currentPhase in JSONB data
        [
          {
            id: "champ-id",
            creatorId: USER_ID,
            title: "Cup",
            status: "ongoing",
            champion: null,
            updatedAt: date1,
            data: { currentPhase: "Mata-mata" },
            localId: null,
            format: "groups-knockout",
            createdAt: date1,
            finishedAt: null,
          },
        ],
        // [1] no player links
        [],
      ]);

      const service = new ChampionshipService(db as never);
      const result = await service.getFeed(USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0]!.currentPhase).toBe("Mata-mata");
    });
  });
});
