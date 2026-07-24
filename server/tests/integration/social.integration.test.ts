/**
 * Integration test — Social Flow
 *
 * Flow:
 *   1. User A sends a friend request to User B's email → PENDING request
 *   2. User B accepts the request → bidirectional friendship created
 *   3. User A links User B to a player in a championship
 *   4. getFeed(userB) → the championship appears in B's feed
 *
 * Requirements: 5.1, 5.5, 6.2, 6.5, 7.1
 *
 * Uses FriendService, PlayerLinkService, and ChampionshipService directly
 * against mock DBs (no HTTP server needed).
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import { FriendService } from "../../src/modules/friend/friend.service.js";
import { PlayerLinkService } from "../../src/modules/player-link/player-link.service.js";
import { ChampionshipService } from "../../src/modules/championship/championship.service.js";

beforeAll(() => {
  process.env["JWT_SECRET"] = "test-secret";
});

// ---------------------------------------------------------------------------
// Mock DB builder helpers (same fluent chain pattern as unit tests)
// ---------------------------------------------------------------------------

function buildSelectChain(result: unknown) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
}

function buildInsertChain(returning: unknown = []) {
  const inner = {
    returning: vi.fn().mockResolvedValue(returning),
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve(undefined).then(resolve),
  };
  return {
    values: vi.fn().mockReturnValue(inner),
  };
}

function buildUpdateChain() {
  return {
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  };
}

function buildDeleteChain() {
  return {
    where: vi.fn().mockResolvedValue(undefined),
  };
}

/**
 * Generic DB mock factory with per-call select results.
 * `selectResults[i]` is returned on the (i+1)th call to `db.select()`.
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
    update: vi.fn((_table: unknown) => buildUpdateChain()),
    delete: vi.fn((_table: unknown) => buildDeleteChain()),
  };
}

/**
 * Feed-specific select chain where .where() is awaitable (no .limit() call).
 * Used for ChampionshipService.getFeed which awaits .where() directly.
 */
function buildFeedSelectChain(result: unknown) {
  const whereProxy = {
    then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnValue(whereProxy),
  };
}

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
// Shared test constants
// ---------------------------------------------------------------------------

const USER_A_ID = "user-a-001";
const USER_B_ID = "user-b-002";
const USER_B_EMAIL = "bob@example.com";
const REQUEST_ID = "req-001";
const CHAMP_ID = "champ-001";
const PLAYER_NAME = "Bob";
const LINK_ID = "link-001";

const NOW = new Date("2024-06-01T12:00:00Z");
const LATER = new Date("2024-06-01T13:00:00Z");

function makeChampionship(overrides: Record<string, unknown> = {}) {
  return {
    id: CHAMP_ID,
    creatorId: USER_A_ID,
    localId: null,
    title: "Social Cup",
    format: "groups-knockout",
    status: "ongoing",
    champion: null,
    data: { players: [], teams: [], draw: [], format: {} },
    createdAt: NOW,
    updatedAt: NOW,
    finishedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Integration: Social Flow
// ---------------------------------------------------------------------------

describe("Social Integration — Friend Request → Accept → Link → Feed (Req 5.1, 5.5, 6.2, 6.5, 7.1)", () => {
  // -------------------------------------------------------------------------
  // Step 1: User A sends friend request to User B
  // -------------------------------------------------------------------------
  describe("Step 1 — User A sends friend request to User B (Req 5.1)", () => {
    it("creates a PENDING friend request and returns it", async () => {
      const pendingRequest = {
        id: REQUEST_ID,
        fromUser: USER_A_ID,
        toUser: USER_B_ID,
        status: "PENDING",
        createdAt: NOW,
        updatedAt: NOW,
      };

      const db = buildDbMock({
        // select[0]: look up target user by email → found
        // select[1]: check existing friendship → none
        // select[2]: check existing request → none
        selectResults: [
          [{ id: USER_B_ID }],   // target user found
          [],                     // no existing friendship
          [],                     // no existing request
        ],
        insertReturning: [pendingRequest],
      });

      const service = new FriendService(db as never);
      const result = await service.sendRequest(USER_A_ID, USER_B_EMAIL);

      expect(result.status).toBe("PENDING");
      expect(result.fromUser).toBe(USER_A_ID);
      expect(result.toUser).toBe(USER_B_ID);
      expect(result.id).toBe(REQUEST_ID);
    });
  });

  // -------------------------------------------------------------------------
  // Step 2: User B accepts the friend request
  // -------------------------------------------------------------------------
  describe("Step 2 — User B accepts the request → bidirectional friendship (Req 5.5)", () => {
    it("updates request status to ACCEPTED and inserts a friendship row", async () => {
      const db = buildDbMock({
        // select[0]: find the PENDING request for USER_B
        selectResults: [
          [
            {
              id: REQUEST_ID,
              fromUser: USER_A_ID,
              toUser: USER_B_ID,
              status: "PENDING",
            },
          ],
        ],
      });

      const service = new FriendService(db as never);
      await expect(service.acceptRequest(REQUEST_ID, USER_B_ID)).resolves.toBeUndefined();

      // Both the update (status → ACCEPTED) and insert (friendship row) must be called
      expect(db.update).toHaveBeenCalledTimes(1);
      expect(db.insert).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Step 3: User A links User B to a player in the championship
  // -------------------------------------------------------------------------
  describe("Step 3 — User A links User B to a player (Req 6.2)", () => {
    it("creates a PlayerLink for the championship and returns it", async () => {
      const newLink = {
        id: LINK_ID,
        championshipId: CHAMP_ID,
        playerName: PLAYER_NAME,
        linkedUserId: USER_B_ID,
        createdAt: LATER,
      };

      // PlayerLinkService.createLink call sequence:
      //   select[0]: fetch championship by id (ownership + status check)
      //   select[1]: find target user by email
      //   select[2]: check friendship (userA < userB canonical order)
      //   select[3]: check existing player-name link in championship
      //   select[4]: check existing user link in championship
      const db = buildDbMock({
        selectResults: [
          [makeChampionship()],                          // [0] championship found, ongoing
          [{ id: USER_B_ID }],                           // [1] target user by email
          [{ userA: Math.min(...[USER_A_ID, USER_B_ID].map(s => s.charCodeAt(0))) }], // [2] friendship exists
          [],                                            // [3] no existing player-name link
          [],                                            // [4] no existing user link
        ],
        insertReturning: [newLink],
      });

      const service = new PlayerLinkService(db as never);
      const result = await service.createLink(
        CHAMP_ID,
        USER_A_ID,
        PLAYER_NAME,
        USER_B_EMAIL,
      );

      expect(result.id).toBe(LINK_ID);
      expect(result.championshipId).toBe(CHAMP_ID);
      expect(result.playerName).toBe(PLAYER_NAME);
      expect(result.linkedUserId).toBe(USER_B_ID);
    });
  });

  // -------------------------------------------------------------------------
  // Step 4: Championship appears in User B's Feed
  // -------------------------------------------------------------------------
  describe("Step 4 — getFeed(userB) includes the championship (Req 7.1)", () => {
    it("returns a feed item with the championship where User B has a player_link", async () => {
      // ChampionshipService.getFeed call sequence for USER_B_ID:
      //   select[0]: championships WHERE creatorId = USER_B_ID → [] (B is not creator)
      //   select[1]: player_link rows WHERE linkedUserId = USER_B_ID → [{ championshipId }]
      //   select[2]: championships WHERE id IN [CHAMP_ID] → [championship]
      //   select[3]: player_link details for that championship → [link row]
      const db = buildFeedDbMock([
        [],                                               // [0] B created no championships
        [{ championshipId: CHAMP_ID }],                   // [1] B has a player_link
        [makeChampionship()],                             // [2] championship data
        [
          {
            id: LINK_ID,
            championshipId: CHAMP_ID,
            playerName: PLAYER_NAME,
            linkedUserId: USER_B_ID,
            createdAt: LATER,
          },
        ],                                                // [3] player_link detail
      ]);

      const service = new ChampionshipService(db as never);
      const feed = await service.getFeed(USER_B_ID);

      // The championship must appear in B's feed
      expect(feed).toHaveLength(1);
      const item = feed[0]!;
      expect(item.id).toBe(CHAMP_ID);
      expect(item.title).toBe("Social Cup");
      expect(item.status).toBe("ongoing");
      expect(item.userRole).toBe("player"); // B is a player, not the creator
    });
  });

  // -------------------------------------------------------------------------
  // End-to-end: full social flow chained together
  // -------------------------------------------------------------------------
  describe("Full chained flow — sendRequest → acceptRequest → createLink → getFeed", () => {
    it("completes all 4 steps without errors and feed contains the championship", async () => {
      // --- Step 1: sendRequest ---
      const pendingRequest = {
        id: REQUEST_ID,
        fromUser: USER_A_ID,
        toUser: USER_B_ID,
        status: "PENDING",
        createdAt: NOW,
        updatedAt: NOW,
      };
      const sendDb = buildDbMock({
        selectResults: [
          [{ id: USER_B_ID }],   // target user
          [],                     // no friendship
          [],                     // no request
        ],
        insertReturning: [pendingRequest],
      });
      const friendService1 = new FriendService(sendDb as never);
      const request = await friendService1.sendRequest(USER_A_ID, USER_B_EMAIL);
      expect(request.status).toBe("PENDING");

      // --- Step 2: acceptRequest ---
      const acceptDb = buildDbMock({
        selectResults: [
          [
            {
              id: REQUEST_ID,
              fromUser: USER_A_ID,
              toUser: USER_B_ID,
              status: "PENDING",
            },
          ],
        ],
      });
      const friendService2 = new FriendService(acceptDb as never);
      await expect(
        friendService2.acceptRequest(REQUEST_ID, USER_B_ID)
      ).resolves.toBeUndefined();

      // --- Step 3: createLink ---
      const newLink = {
        id: LINK_ID,
        championshipId: CHAMP_ID,
        playerName: PLAYER_NAME,
        linkedUserId: USER_B_ID,
        createdAt: LATER,
      };
      const linkDb = buildDbMock({
        selectResults: [
          [makeChampionship()],   // championship found
          [{ id: USER_B_ID }],    // target user by email
          [{ userA: USER_A_ID }], // friendship exists
          [],                     // no player-name link
          [],                     // no user link
        ],
        insertReturning: [newLink],
      });
      const playerLinkService = new PlayerLinkService(linkDb as never);
      const link = await playerLinkService.createLink(
        CHAMP_ID,
        USER_A_ID,
        PLAYER_NAME,
        USER_B_EMAIL,
      );
      expect(link.linkedUserId).toBe(USER_B_ID);

      // --- Step 4: getFeed(userB) ---
      const feedDb = buildFeedDbMock([
        [],                                               // B created no championships
        [{ championshipId: CHAMP_ID }],                   // B has a player_link
        [makeChampionship()],                             // championship data
        [
          {
            id: LINK_ID,
            championshipId: CHAMP_ID,
            playerName: PLAYER_NAME,
            linkedUserId: USER_B_ID,
            createdAt: LATER,
          },
        ],
      ]);
      const champService = new ChampionshipService(feedDb as never);
      const feed = await champService.getFeed(USER_B_ID);

      expect(feed.length).toBeGreaterThan(0);
      const feedItem = feed.find((item) => item.id === CHAMP_ID);
      expect(feedItem).toBeDefined();
      expect(feedItem!.userRole).toBe("player");
      expect(feedItem!.title).toBe("Social Cup");
    });
  });
});
