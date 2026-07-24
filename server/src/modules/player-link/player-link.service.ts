import { eq, and } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import {
  championships,
  users,
  friendships,
  playerLinks,
} from "../../db/schema.js";
import { AppError } from "../auth/auth.service.js";
export { AppError };

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type { PlayerLink } from "../../db/schema.js";
import type { PlayerLink } from "../../db/schema.js";

// ---------------------------------------------------------------------------
// PlayerLinkService
// ---------------------------------------------------------------------------

export class PlayerLinkService {
  constructor(private readonly db: Db) {}

  // -------------------------------------------------------------------------
  // createLink
  // Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
  // -------------------------------------------------------------------------
  async createLink(
    championshipId: string,
    creatorId: string,
    playerName: string,
    linkedUserEmail: string,
  ): Promise<PlayerLink> {
    // 1. Fetch championship; verify existence and ownership
    const [championship] = await this.db
      .select()
      .from(championships)
      .where(eq(championships.id, championshipId))
      .limit(1);

    if (!championship) {
      throw new AppError("NOT_FOUND", "Championship not found");
    }

    if (championship.creatorId !== creatorId) {
      throw new AppError("AUTHORIZATION_FAILED", "You are not the creator of this championship");
    }

    // 2. Verify championship is not finished — Requirement 6.5
    if (championship.status === "finished") {
      throw new AppError("CHAMPIONSHIP_FINISHED", "Cannot link players in a finished championship");
    }

    // 3. Find target user by email — Requirement 6.3
    const [targetUser] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, linkedUserEmail))
      .limit(1);

    if (!targetUser) {
      throw new AppError("NOT_FOUND", "Email not found");
    }

    // 4. Check target user is a friend of creatorId — Requirement 6.3
    const userA = creatorId < targetUser.id ? creatorId : targetUser.id;
    const userB = creatorId < targetUser.id ? targetUser.id : creatorId;

    const [friendship] = await this.db
      .select({ userA: friendships.userA })
      .from(friendships)
      .where(
        and(
          eq(friendships.userA, userA),
          eq(friendships.userB, userB),
        ),
      )
      .limit(1);

    if (!friendship) {
      throw new AppError("FRIEND_NOT_FOUND", "Not a friend of the creator");
    }

    // 5. Check no existing link for player_name in championship — Requirement 6.4
    const [existingPlayerLink] = await this.db
      .select({ id: playerLinks.id })
      .from(playerLinks)
      .where(
        and(
          eq(playerLinks.championshipId, championshipId),
          eq(playerLinks.playerName, playerName),
        ),
      )
      .limit(1);

    if (existingPlayerLink) {
      throw new AppError("CONFLICT", "A link already exists for this player in the championship");
    }

    // 6. Check no existing link for linked_user_id in championship — Requirement 6.4
    const [existingUserLink] = await this.db
      .select({ id: playerLinks.id })
      .from(playerLinks)
      .where(
        and(
          eq(playerLinks.championshipId, championshipId),
          eq(playerLinks.linkedUserId, targetUser.id),
        ),
      )
      .limit(1);

    if (existingUserLink) {
      throw new AppError("CONFLICT", "This user is already linked to a player in the championship");
    }

    // 7. Insert player_links row — Requirement 6.2, 6.5
    const [newLink] = await this.db
      .insert(playerLinks)
      .values({
        championshipId,
        playerName,
        linkedUserId: targetUser.id,
      })
      .returning();

    if (!newLink) {
      throw new AppError("DB_SAVE_ERROR", "Failed to create player link");
    }

    return newLink;
  }

  // -------------------------------------------------------------------------
  // updateLink
  // Requirements: 6.6, 6.8, 6.9
  // -------------------------------------------------------------------------
  async updateLink(
    championshipId: string,
    linkId: string,
    creatorId: string,
    newEmail: string,
  ): Promise<PlayerLink> {
    // 1. Fetch championship; verify existence and ownership
    const [championship] = await this.db
      .select()
      .from(championships)
      .where(eq(championships.id, championshipId))
      .limit(1);

    if (!championship) {
      throw new AppError("NOT_FOUND", "Championship not found");
    }

    if (championship.creatorId !== creatorId) {
      throw new AppError("AUTHORIZATION_FAILED", "You are not the creator of this championship");
    }

    // 2. Verify championship is not finished
    if (championship.status === "finished") {
      throw new AppError("CHAMPIONSHIP_FINISHED", "Cannot update links in a finished championship");
    }

    // 3. Find existing link by linkId in championship
    const [existingLink] = await this.db
      .select()
      .from(playerLinks)
      .where(
        and(
          eq(playerLinks.id, linkId),
          eq(playerLinks.championshipId, championshipId),
        ),
      )
      .limit(1);

    if (!existingLink) {
      throw new AppError("NOT_FOUND", "Player link not found");
    }

    // 4. Find new target user by email
    const [newTargetUser] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, newEmail))
      .limit(1);

    if (!newTargetUser) {
      throw new AppError("NOT_FOUND", "Email not found");
    }

    // 5. Verify new target user is a friend of creatorId
    const userA = creatorId < newTargetUser.id ? creatorId : newTargetUser.id;
    const userB = creatorId < newTargetUser.id ? newTargetUser.id : creatorId;

    const [friendship] = await this.db
      .select({ userA: friendships.userA })
      .from(friendships)
      .where(
        and(
          eq(friendships.userA, userA),
          eq(friendships.userB, userB),
        ),
      )
      .limit(1);

    if (!friendship) {
      throw new AppError("FRIEND_NOT_FOUND", "Not a friend of the creator");
    }

    // 6. Delete old link row — Requirement 6.8, 6.9
    await this.db
      .delete(playerLinks)
      .where(eq(playerLinks.id, linkId));

    // 7. Insert new link row — Requirement 6.9
    const [newLink] = await this.db
      .insert(playerLinks)
      .values({
        championshipId,
        playerName: existingLink.playerName,
        linkedUserId: newTargetUser.id,
      })
      .returning();

    if (!newLink) {
      throw new AppError("DB_SAVE_ERROR", "Failed to update player link");
    }

    return newLink;
  }

  // -------------------------------------------------------------------------
  // removeLink
  // Requirements: 6.6, 6.7, 6.8
  // -------------------------------------------------------------------------
  async removeLink(
    championshipId: string,
    linkId: string,
    creatorId: string,
  ): Promise<void> {
    // 1. Fetch championship; verify existence and ownership
    const [championship] = await this.db
      .select()
      .from(championships)
      .where(eq(championships.id, championshipId))
      .limit(1);

    if (!championship) {
      throw new AppError("NOT_FOUND", "Championship not found");
    }

    if (championship.creatorId !== creatorId) {
      throw new AppError("AUTHORIZATION_FAILED", "You are not the creator of this championship");
    }

    // 2. Verify championship is not finished — Requirement 6.7
    if (championship.status === "finished") {
      throw new AppError("CHAMPIONSHIP_FINISHED", "Cannot remove links from a finished championship");
    }

    // 3. Find link by linkId
    const [existingLink] = await this.db
      .select({ id: playerLinks.id })
      .from(playerLinks)
      .where(
        and(
          eq(playerLinks.id, linkId),
          eq(playerLinks.championshipId, championshipId),
        ),
      )
      .limit(1);

    if (!existingLink) {
      throw new AppError("NOT_FOUND", "Player link not found");
    }

    // 4. Delete player_links row — Requirement 6.8
    await this.db
      .delete(playerLinks)
      .where(eq(playerLinks.id, linkId));
  }
}

// ---------------------------------------------------------------------------
// Factory — convenience export for DI / testing
// ---------------------------------------------------------------------------

export function createPlayerLinkService(db: Db): PlayerLinkService {
  return new PlayerLinkService(db);
}
