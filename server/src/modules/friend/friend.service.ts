import { eq, or, and } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import { users, friendRequests, friendships } from "../../db/schema.js";
import { AppError } from "../auth/auth.service.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface FriendRequest {
  id: string;
  fromUser: string;
  toUser: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FriendListItem {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

// ---------------------------------------------------------------------------
// FriendService
// ---------------------------------------------------------------------------

export class FriendService {
  constructor(private readonly db: Db) {}

  // -------------------------------------------------------------------------
  // sendRequest
  // Requirement: 5.1, 5.2, 5.3, 5.4
  // -------------------------------------------------------------------------
  async sendRequest(fromUserId: string, toEmail: string): Promise<FriendRequest> {
    // 1. Look up target user by email — Requirement 5.4
    const [targetUser] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, toEmail))
      .limit(1);

    if (!targetUser) {
      throw new AppError("NOT_FOUND", "Email not found");
    }

    // 2. Check not self — Requirement 5.2
    if (fromUserId === targetUser.id) {
      throw new AppError("VALIDATION_ERROR", "Cannot send friend request to yourself");
    }

    // 3. Check existing friendship — Requirement 5.3
    const userA = fromUserId < targetUser.id ? fromUserId : targetUser.id;
    const userB = fromUserId < targetUser.id ? targetUser.id : fromUserId;

    const [existingFriendship] = await this.db
      .select({ userA: friendships.userA })
      .from(friendships)
      .where(
        and(
          eq(friendships.userA, userA),
          eq(friendships.userB, userB),
        ),
      )
      .limit(1);

    if (existingFriendship) {
      throw new AppError("CONFLICT", "Already friends");
    }

    // 4. Check existing pending request in either direction — Requirement 5.3
    const [existingRequest] = await this.db
      .select({ id: friendRequests.id, status: friendRequests.status })
      .from(friendRequests)
      .where(
        or(
          and(
            eq(friendRequests.fromUser, fromUserId),
            eq(friendRequests.toUser, targetUser.id),
          ),
          and(
            eq(friendRequests.fromUser, targetUser.id),
            eq(friendRequests.toUser, fromUserId),
          ),
        ),
      )
      .limit(1);

    if (existingRequest) {
      throw new AppError("CONFLICT", "Friend request already exists");
    }

    // 5. Insert new friend request — Requirement 5.1
    const [newRequest] = await this.db
      .insert(friendRequests)
      .values({
        fromUser: fromUserId,
        toUser: targetUser.id,
        status: "PENDING",
      })
      .returning();

    if (!newRequest) {
      throw new AppError("DB_SAVE_ERROR", "Failed to create friend request");
    }

    return newRequest;
  }

  // -------------------------------------------------------------------------
  // acceptRequest
  // Requirement: 5.5
  // -------------------------------------------------------------------------
  async acceptRequest(requestId: string, userId: string): Promise<void> {
    // 1. Find request by id WHERE to_user = userId AND status = 'PENDING'
    const [request] = await this.db
      .select({
        id: friendRequests.id,
        fromUser: friendRequests.fromUser,
        toUser: friendRequests.toUser,
        status: friendRequests.status,
      })
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.id, requestId),
          eq(friendRequests.toUser, userId),
          eq(friendRequests.status, "PENDING"),
        ),
      )
      .limit(1);

    if (!request) {
      throw new AppError("NOT_FOUND", "Friend request not found");
    }

    // 2. Update request status to ACCEPTED — Requirement 5.5
    await this.db
      .update(friendRequests)
      .set({ status: "ACCEPTED", updatedAt: new Date() })
      .where(eq(friendRequests.id, requestId));

    // 3. Insert bidirectional friendship with canonical ordering (user_a < user_b)
    const userA = request.fromUser < request.toUser ? request.fromUser : request.toUser;
    const userB = request.fromUser < request.toUser ? request.toUser : request.fromUser;

    await this.db
      .insert(friendships)
      .values({ userA, userB });
  }

  // -------------------------------------------------------------------------
  // rejectRequest
  // Requirement: 5.6, 5.7
  // -------------------------------------------------------------------------
  async rejectRequest(requestId: string, userId: string): Promise<void> {
    // 1. Find request by id WHERE to_user = userId
    const [request] = await this.db
      .select({
        id: friendRequests.id,
        status: friendRequests.status,
      })
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.id, requestId),
          eq(friendRequests.toUser, userId),
        ),
      )
      .limit(1);

    // 2. If not found OR status !== 'PENDING' → silently succeed — Requirement 5.7
    if (!request || request.status !== "PENDING") {
      return;
    }

    // 3. Delete the request row — Requirement 5.6
    await this.db
      .delete(friendRequests)
      .where(eq(friendRequests.id, requestId));
  }

  // -------------------------------------------------------------------------
  // removeFriend
  // Requirement: 5.8
  // -------------------------------------------------------------------------
  async removeFriend(userId: string, friendId: string): Promise<void> {
    // Determine canonical order: user_a = min, user_b = max
    const userA = userId < friendId ? userId : friendId;
    const userB = userId < friendId ? friendId : userId;

    // Delete from friendships — silently succeeds if not found — Requirement 5.8
    await this.db
      .delete(friendships)
      .where(
        and(
          eq(friendships.userA, userA),
          eq(friendships.userB, userB),
        ),
      );
  }

  // -------------------------------------------------------------------------
  // listPendingRequests
  // Requirement: 5.1
  // -------------------------------------------------------------------------
  async listPendingRequests(userId: string): Promise<FriendRequest[]> {
    const rows = await this.db
      .select({
        id: friendRequests.id,
        fromUser: friendRequests.fromUser,
        toUser: friendRequests.toUser,
        status: friendRequests.status,
        createdAt: friendRequests.createdAt,
        updatedAt: friendRequests.updatedAt,
      })
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.toUser, userId),
          eq(friendRequests.status, "PENDING"),
        ),
      );

    return rows;
  }

  // -------------------------------------------------------------------------
  // listFriends
  // Requirement: 5.9
  // -------------------------------------------------------------------------
  async listFriends(userId: string): Promise<FriendListItem[]> {
    // 1. Query friendships WHERE user_a = userId OR user_b = userId
    const rows = await this.db
      .select({
        userA: friendships.userA,
        userB: friendships.userB,
      })
      .from(friendships)
      .where(
        or(
          eq(friendships.userA, userId),
          eq(friendships.userB, userId),
        ),
      );

    if (rows.length === 0) {
      return [];
    }

    // 2. Collect the "other" user's id for each friendship
    const friendIds = rows.map((row) =>
      row.userA === userId ? row.userB : row.userA,
    );

    // 3. Fetch profile info for each friend
    // Build an OR condition across all friend IDs
    const friendProfiles = await this.db
      .select({
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(
        friendIds.length === 1
          ? eq(users.id, friendIds[0]!)
          : or(...friendIds.map((id) => eq(users.id, id))),
      );

    // 4. Return ordered alphabetically by display_name — Requirement 5.9
    return friendProfiles.sort((a, b) =>
      a.displayName.localeCompare(b.displayName),
    );
  }
}

// ---------------------------------------------------------------------------
// Factory — convenience export for DI / testing
// ---------------------------------------------------------------------------

export function createFriendService(db: Db): FriendService {
  return new FriendService(db);
}
