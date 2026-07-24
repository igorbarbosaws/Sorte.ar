/**
 * Unit tests for FriendService
 * Requirements: 5.2, 5.3, 5.6, 5.7, 5.8
 */

import { describe, it, expect, vi } from "vitest";
import { FriendService } from "../../src/modules/friend/friend.service.js";

// ---------------------------------------------------------------------------
// Fake data helpers
// ---------------------------------------------------------------------------

const USER_A_ID = "00000000-0000-0000-0000-000000000001";
const USER_B_ID = "00000000-0000-0000-0000-000000000002";
const REQUEST_ID = "00000000-0000-0000-0000-000000000010";

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
    // support awaiting .values() without .returning()
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve(undefined).then(resolve),
  };
  return {
    values: vi.fn().mockReturnValue(inner),
  };
}

/**
 * Builds an update chain: .set().where() → resolves to undefined
 */
function buildUpdateChain() {
  return {
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
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
 * Assembles a DB mock with configurable per-call select results.
 * `selectResults[i]` is the value returned on the (i+1)-th `db.select()` call.
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FriendService", () => {
  // -------------------------------------------------------------------------
  // sendRequest — own email returns VALIDATION_ERROR (Req 5.2)
  // -------------------------------------------------------------------------
  describe("sendRequest", () => {
    it("throws VALIDATION_ERROR when sending a request to own email (Req 5.2)", async () => {
      // The first select (look up target by email) returns the same user as the sender
      const db = buildDbMock({
        selectResults: [
          [{ id: USER_A_ID }], // targetUser lookup → same id as fromUserId
        ],
      });

      const service = new FriendService(db as never);

      await expect(
        service.sendRequest(USER_A_ID, "user_a@example.com")
      ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    });

    it("throws CONFLICT when a friendship already exists between the two users (Req 5.3)", async () => {
      // select[0] → target user found (different id)
      // select[1] → existing friendship row found
      const db = buildDbMock({
        selectResults: [
          [{ id: USER_B_ID }],        // target user lookup
          [{ userA: USER_A_ID }],     // existing friendship found
        ],
      });

      const service = new FriendService(db as never);

      await expect(
        service.sendRequest(USER_A_ID, "user_b@example.com")
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("throws CONFLICT when a pending friend request already exists (Req 5.3)", async () => {
      // select[0] → target user found
      // select[1] → no existing friendship
      // select[2] → existing pending request found
      const db = buildDbMock({
        selectResults: [
          [{ id: USER_B_ID }],                         // target user lookup
          [],                                           // no existing friendship
          [{ id: REQUEST_ID, status: "PENDING" }],     // existing request found
        ],
      });

      const service = new FriendService(db as never);

      await expect(
        service.sendRequest(USER_A_ID, "user_b@example.com")
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });
  });

  // -------------------------------------------------------------------------
  // acceptRequest — creates bidirectional friendship (Req 5.5)
  // -------------------------------------------------------------------------
  describe("acceptRequest", () => {
    it("calls update and insert when accepting a PENDING request (Req 5.5)", async () => {
      // select returns a PENDING request addressed to USER_B_ID
      const db = buildDbMock({
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

      await expect(
        service.acceptRequest(REQUEST_ID, USER_B_ID)
      ).resolves.toBeUndefined();

      // Both the update (status change) and insert (friendship row) must occur
      expect(db.update).toHaveBeenCalledTimes(1);
      expect(db.insert).toHaveBeenCalledTimes(1);
    });

    it("uses canonical ordering (userA < userB) when inserting the friendship row (Req 5.5)", async () => {
      // USER_B_ID > USER_A_ID lexicographically, so canonical order is (A, B)
      const db = buildDbMock({
        selectResults: [
          [
            {
              id: REQUEST_ID,
              fromUser: USER_B_ID, // B sent to A — canonical order still (A, B)
              toUser: USER_A_ID,
              status: "PENDING",
            },
          ],
        ],
      });

      const service = new FriendService(db as never);

      await expect(
        service.acceptRequest(REQUEST_ID, USER_A_ID)
      ).resolves.toBeUndefined();

      // insert must have been called with canonical userA < userB
      expect(db.insert).toHaveBeenCalledTimes(1);
      // Retrieve the values mock from the first (and only) insert() call result
      const insertChain = (db.insert as ReturnType<typeof vi.fn>).mock.results[0]?.value as ReturnType<typeof buildInsertChain>;
      const insertValues = (insertChain.values as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as { userA: string; userB: string } | undefined;
      // The smaller UUID should be userA
      const expectedUserA =
        USER_A_ID < USER_B_ID ? USER_A_ID : USER_B_ID;
      const expectedUserB =
        USER_A_ID < USER_B_ID ? USER_B_ID : USER_A_ID;
      expect(insertValues?.userA).toBe(expectedUserA);
      expect(insertValues?.userB).toBe(expectedUserB);
    });
  });

  // -------------------------------------------------------------------------
  // rejectRequest — non-PENDING silently succeeds (Req 5.7)
  // -------------------------------------------------------------------------
  describe("rejectRequest", () => {
    it("silently succeeds (no error) when request status is ACCEPTED (Req 5.7)", async () => {
      // Request exists but status is ACCEPTED, not PENDING
      const db = buildDbMock({
        selectResults: [
          [{ id: REQUEST_ID, status: "ACCEPTED" }],
        ],
      });

      const service = new FriendService(db as never);

      // Should NOT throw — requirement says ignore the action without error
      await expect(
        service.rejectRequest(REQUEST_ID, USER_B_ID)
      ).resolves.toBeUndefined();

      // delete must NOT be called since the request is not PENDING
      expect(db.delete).not.toHaveBeenCalled();
    });

    it("silently succeeds when request is not found at all (Req 5.7)", async () => {
      // select returns empty — request not found
      const db = buildDbMock({
        selectResults: [[]],
      });

      const service = new FriendService(db as never);

      await expect(
        service.rejectRequest(REQUEST_ID, USER_B_ID)
      ).resolves.toBeUndefined();

      expect(db.delete).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // removeFriend — removes the friendship row (Req 5.8)
  // -------------------------------------------------------------------------
  describe("removeFriend", () => {
    it("calls delete with canonical ordering and resolves without error (Req 5.8)", async () => {
      const db = buildDbMock();

      const service = new FriendService(db as never);

      await expect(
        service.removeFriend(USER_A_ID, USER_B_ID)
      ).resolves.toBeUndefined();

      // delete must be called exactly once
      expect(db.delete).toHaveBeenCalledTimes(1);
    });

    it("also resolves without error when friendship does not exist (Req 5.8)", async () => {
      // delete().where() resolves to undefined regardless — silently succeeds
      const db = buildDbMock();

      const service = new FriendService(db as never);

      // Calling with reversed order: still uses canonical ordering internally
      await expect(
        service.removeFriend(USER_B_ID, USER_A_ID)
      ).resolves.toBeUndefined();

      expect(db.delete).toHaveBeenCalledTimes(1);
    });
  });
});
