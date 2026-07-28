import { eq, count, inArray } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import { users, championships, playerLinks } from "../../db/schema.js";
import { AppError } from "../auth/auth.service.js";
import {
  displayNameSchema,
  isAllowedAvatarMimeType,
  isAvatarSizeValid,
} from "../../lib/validation.js";
import { uploadAvatar as uploadToStorage } from "../../lib/storage.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ProfileStats {
  championshipsCreated: number;
  championshipsAsPlayer: number;
  wins: number;     // 1st place finishes via Player_Link
  runnerUp: number; // 2nd place finishes via Player_Link
}

export interface PublicProfile {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  stats: ProfileStats;
}

// ---------------------------------------------------------------------------
// Magic bytes helpers — Requirement 3.8
// ---------------------------------------------------------------------------

/**
 * Verifies that the buffer's magic bytes match JPEG, PNG, or WebP.
 * - JPEG: FF D8 FF
 * - PNG:  89 50 4E 47 (‰PNG)
 * - WebP: 52 49 46 46 ?? ?? ?? ?? 57 45 42 50 (RIFF....WEBP)
 */
function hasValidImageMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;

  // JPEG: starts with FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: starts with 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }

  // WebP: RIFF (4 bytes) + size (4 bytes) + WEBP (4 bytes) — need at least 12 bytes
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// ProfileService
// ---------------------------------------------------------------------------

export class ProfileService {
  constructor(private readonly db: Db) {}

  // -------------------------------------------------------------------------
  // getPublicProfile — Requirements 3.1, 3.4, 3.5
  // -------------------------------------------------------------------------
  async getPublicProfile(userId: string): Promise<PublicProfile> {
    // 1. Look up the user row
    const [user] = await this.db
      .select({
        id: users.id,
        displayName: users.displayName,
        username: users.username,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new AppError("NOT_FOUND", "User not found");
    }

    // 2. Aggregate stats — count of championships created
    const [createdResult] = await this.db
      .select({ count: count() })
      .from(championships)
      .where(eq(championships.creatorId, userId));

    // 3. Aggregate stats — count of player links (championships as player)
    const [playerResult] = await this.db
      .select({ count: count() })
      .from(playerLinks)
      .where(eq(playerLinks.linkedUserId, userId));

    // 4. Wins & runner-up — Requirement 7.7
    // Fetch all player_links for this user to get (championshipId, playerName) pairs
    const userPlayerLinks = await this.db
      .select({
        championshipId: playerLinks.championshipId,
        playerName: playerLinks.playerName,
      })
      .from(playerLinks)
      .where(eq(playerLinks.linkedUserId, userId));

    let wins = 0;
    let runnerUp = 0;

    if (userPlayerLinks.length > 0) {
      const championshipIds = userPlayerLinks.map((pl) => pl.championshipId);

      // Fetch finished championships among those the user participated in
      const finishedChampionships = await this.db
        .select({
          id: championships.id,
          status: championships.status,
          data: championships.data,
        })
        .from(championships)
        .where(
          inArray(championships.id, championshipIds)
        );

      // Build a lookup map: championshipId → data (only finished ones)
      const finishedMap = new Map(
        finishedChampionships
          .filter((c) => c.status === "finished")
          .map((c) => [c.id, c.data])
      );

      for (const pl of userPlayerLinks) {
        const data = finishedMap.get(pl.championshipId);
        if (!data) continue;

        const finalPositions = (data as any).finalPositions;
        if (!finalPositions) continue;

        const position = finalPositions[pl.playerName];
        if (position === 1) wins++;
        else if (position === 2) runnerUp++;
      }
    }

    return {
      id: user.id,
      displayName: user.displayName,
      username: user.username ?? null,
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt,
      stats: {
        championshipsCreated: createdResult?.count ?? 0,
        championshipsAsPlayer: playerResult?.count ?? 0,
        wins,
        runnerUp,
      },
    };
  }

  // -------------------------------------------------------------------------
  // updateUsername — unique nickname
  // -------------------------------------------------------------------------
  async updateUsername(userId: string, username: string): Promise<void> {
    const trimmed = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (trimmed.length < 3 || trimmed.length > 30) {
      throw new AppError("VALIDATION_ERROR", "Username must be 3-30 characters (letters, numbers, underscores)");
    }

    // Check uniqueness
    const [existing] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, trimmed))
      .limit(1);

    if (existing && existing.id !== userId) {
      throw new AppError("USERNAME_TAKEN", "This username is already taken");
    }

    await this.db
      .update(users)
      .set({ username: trimmed, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // -------------------------------------------------------------------------
  // updateDisplayName — Requirements 3.2, 3.3
  // -------------------------------------------------------------------------
  async updateDisplayName(
    userId: string,
    displayName: string
  ): Promise<void> {
    // 1. Validate the new display name
    const parsed = displayNameSchema.safeParse(displayName);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      throw new AppError(
        "VALIDATION_ERROR",
        firstError?.message ?? "Invalid display name"
      );
    }

    const trimmedName = parsed.data;

    // 2. Persist the change
    const result = await this.db
      .update(users)
      .set({ displayName: trimmedName, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    // 3. If no row was updated, the user doesn't exist
    if (result.length === 0) {
      throw new AppError("NOT_FOUND", "User not found");
    }
  }

  // -------------------------------------------------------------------------
  // uploadAvatar — Requirements 3.6, 3.7, 3.8
  // -------------------------------------------------------------------------
  async uploadAvatar(
    userId: string,
    fileBuffer: Buffer,
    mimeType: string,
    fileSize: number
  ): Promise<string> {
    // 1. Validate MIME type
    if (!isAllowedAvatarMimeType(mimeType)) {
      throw new AppError("VALIDATION_ERROR", "Invalid avatar file type");
    }

    // 2. Validate file size (≤ 2 MB)
    if (!isAvatarSizeValid(fileSize)) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Avatar file exceeds 2 MB limit"
      );
    }

    // 3. Validate magic bytes — defend against MIME type spoofing
    if (!hasValidImageMagicBytes(fileBuffer)) {
      throw new AppError("VALIDATION_ERROR", "Invalid avatar file type");
    }

    // 4. Upload to storage (Cloudinary)
    const { url } = await uploadToStorage(fileBuffer, userId);

    // 5. Persist the new avatar URL in the DB
    await this.db
      .update(users)
      .set({ avatarUrl: url, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return url;
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createProfileService(db: Db): ProfileService {
  return new ProfileService(db);
}
