import { eq, and, lt, desc, inArray } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import { championships, playerLinks } from "../../db/schema.js";
import { AppError } from "../auth/auth.service.js";
import {
  championshipInputSchema,
  type ChampionshipInput,
  type UpdateChampionshipInput,
} from "../../lib/validation.js";
import type { Championship } from "../../db/schema.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type { Championship };

export type ChampionshipDetail = Championship;

export interface PaginatedResult<T> {
  items: T[];
  nextCursor?: string;
}

/**
 * A single item in the user's championship Feed.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
export interface FeedItem {
  /** Championship UUID */
  id: string;
  /** Championship title */
  title: string;
  /** 'ongoing' | 'finished' */
  status: string;
  /** Last update timestamp */
  updatedAt: Date;
  /** Name of the champion — present when status === 'finished' (Req 7.3) */
  champion?: string | null;
  /** Current phase extracted from JSONB data field (Req 7.2) */
  currentPhase?: string | null;
  /** Whether the user is the creator or a linked player */
  userRole: "creator" | "player";
  /** The user's linked team (from player_links + draw data) — only for 'player' role */
  linkedTeam?: string | null;
  /** The user's final position when championship is finished — only for 'player' role */
  finalPosition?: number | null;
}

// ---------------------------------------------------------------------------
// ChampionshipService
// ---------------------------------------------------------------------------

const PAGE_SIZE = 100;

export class ChampionshipService {
  constructor(private readonly db: Db) {}

  // -------------------------------------------------------------------------
  // getFeed
  // -------------------------------------------------------------------------
  /**
   * Returns the Feed for a user: all championships where the user is the
   * creator OR has a player_link, ordered by updated_at DESC.
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
   */
  async getFeed(userId: string): Promise<FeedItem[]> {
    // 1. Championships where this user is the creator
    const creatorChampionships = await this.db
      .select()
      .from(championships)
      .where(eq(championships.creatorId, userId));

    // 2. Championship IDs where this user has a player_link
    const playerLinkRows = await this.db
      .select({ championshipId: playerLinks.championshipId })
      .from(playerLinks)
      .where(eq(playerLinks.linkedUserId, userId));

    const playerChampionshipIds = playerLinkRows.map((r) => r.championshipId);

    // 3. Fetch those player championships (if any)
    let playerChampionships: Championship[] = [];
    if (playerChampionshipIds.length > 0) {
      playerChampionships = await this.db
        .select()
        .from(championships)
        .where(inArray(championships.id, playerChampionshipIds));
    }

    // 4. Merge and deduplicate by id
    const seen = new Set<string>();
    const merged: Championship[] = [];

    for (const c of [...creatorChampionships, ...playerChampionships]) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        merged.push(c);
      }
    }

    // Sort by updated_at DESC — Requirement 7.1
    merged.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // 5. For player-role items, fetch the corresponding player_link rows
    //    to get linkedTeam and finalPosition
    let playerLinksMap: Map<string, { linkedTeam: string | null; finalPosition: number | null }> =
      new Map();

    if (playerChampionshipIds.length > 0) {
      const playerLinkDetails = await this.db
        .select()
        .from(playerLinks)
        .where(
          and(
            eq(playerLinks.linkedUserId, userId),
            inArray(playerLinks.championshipId, playerChampionshipIds),
          ),
        );

      for (const link of playerLinkDetails) {
        // Extract linked team from championship draw data
        const champData = merged.find((c) => c.id === link.championshipId);
        const data = champData?.data as {
          draw?: Array<{ player: string; team: string }>;
          finalPositions?: Record<string, number>;
        } | null | undefined;

        const drawEntry = data?.draw?.find(
          (d) => d.player === link.playerName,
        );
        const linkedTeam = drawEntry?.team ?? null;

        // Extract final position from championship data if available
        const finalPosition =
          data?.finalPositions?.[link.playerName] ?? null;

        playerLinksMap.set(link.championshipId, { linkedTeam, finalPosition });
      }
    }

    // 6. Build FeedItem array
    const creatorIdSet = new Set(creatorChampionships.map((c) => c.id));

    return merged.map((c): FeedItem => {
      const isCreator = c.creatorId === userId || creatorIdSet.has(c.id);
      const userRole: "creator" | "player" = isCreator ? "creator" : "player";

      // Extract currentPhase from JSONB data — Requirement 7.2
      const data = c.data as {
        currentPhase?: string;
        format?: { phase?: string };
      } | null | undefined;
      const currentPhase = (data as { currentPhase?: string } | null | undefined)?.currentPhase ?? null;

      const item: FeedItem = {
        id: c.id,
        title: c.title,
        status: c.status,
        updatedAt: c.updatedAt,
        currentPhase,
        userRole,
      };

      // Include champion when finished — Requirement 7.3
      if (c.status === "finished") {
        item.champion = c.champion ?? null;
      }

      // Include player-specific fields — Requirements 7.4, 7.6
      if (userRole === "player") {
        const playerInfo = playerLinksMap.get(c.id);
        item.linkedTeam = playerInfo?.linkedTeam ?? null;
        item.finalPosition = playerInfo?.finalPosition ?? null;
      }

      return item;
    });
  }

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  /**
   * Creates a new championship for the given user.
   * Requirements: 4.1
   */
  async create(userId: string, input: ChampionshipInput): Promise<Championship> {
    // Validate input
    const parsed = championshipInputSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      throw new AppError(
        "VALIDATION_ERROR",
        firstError?.message ?? "Validation error",
      );
    }

    const { title, format, localId, data } = parsed.data;

    const [newChampionship] = await this.db
      .insert(championships)
      .values({
        creatorId: userId,
        title,
        format,
        localId: localId ?? null,
        status: "ongoing",
        data,
      })
      .returning();

    if (!newChampionship) {
      throw new AppError("DB_SAVE_ERROR", "Failed to create championship");
    }

    return newChampionship;
  }

  // -------------------------------------------------------------------------
  // list
  // -------------------------------------------------------------------------
  /**
   * Lists championships for a user with cursor-based pagination.
   * Requirements: 4.2, 4.9
   */
  async list(
    userId: string,
    cursor?: string,
  ): Promise<PaginatedResult<Championship>> {
    // Build conditions
    const conditions = [eq(championships.creatorId, userId)];

    if (cursor) {
      const cursorDate = new Date(cursor);
      conditions.push(lt(championships.createdAt, cursorDate));
    }

    const items = await this.db
      .select()
      .from(championships)
      .where(and(...conditions))
      .orderBy(desc(championships.createdAt))
      .limit(PAGE_SIZE);

    let nextCursor: string | undefined;
    if (items.length === PAGE_SIZE) {
      const lastItem = items[items.length - 1];
      if (lastItem) {
        nextCursor = lastItem.createdAt.toISOString();
      }
    }

    return { items, nextCursor };
  }

  // -------------------------------------------------------------------------
  // get
  // -------------------------------------------------------------------------
  /**
   * Gets a championship by ID.
   * Requirements: 4.3
   */
  async get(id: string, _requestingUserId: string): Promise<ChampionshipDetail> {
    const [championship] = await this.db
      .select()
      .from(championships)
      .where(eq(championships.id, id))
      .limit(1);

    if (!championship) {
      throw new AppError("NOT_FOUND", "Championship not found");
    }

    return championship;
  }

  // -------------------------------------------------------------------------
  // updateScore
  // -------------------------------------------------------------------------
  /**
   * Updates the championship data (scores, state).
   * Requirements: 4.4, 4.5, 9.1
   */
  async updateScore(
    id: string,
    updateData: UpdateChampionshipInput,
    userId: string,
  ): Promise<void> {
    // Fetch the championship
    const [championship] = await this.db
      .select()
      .from(championships)
      .where(eq(championships.id, id))
      .limit(1);

    if (!championship) {
      throw new AppError("NOT_FOUND", "Championship not found");
    }

    // Verify ownership — Requirement 9.1
    if (championship.creatorId !== userId) {
      throw new AppError(
        "AUTHORIZATION_FAILED",
        "You are not authorized to update this championship",
      );
    }

    // Perform update — throw DB_SAVE_ERROR on failure without modifying state
    const updateValues: Partial<typeof championships.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (updateData.data !== undefined) {
      updateValues.data = updateData.data;
    }
    if (updateData.status !== undefined) {
      updateValues.status = updateData.status;
    }
    if (updateData.champion !== undefined) {
      updateValues.champion = updateData.champion;
    }

    try {
      const result = await this.db
        .update(championships)
        .set(updateValues)
        .where(eq(championships.id, id))
        .returning({ id: championships.id });

      if (!result || result.length === 0) {
        throw new AppError("DB_SAVE_ERROR", "Failed to update championship");
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("DB_SAVE_ERROR", "Failed to update championship");
    }
  }

  // -------------------------------------------------------------------------
  // finalize
  // -------------------------------------------------------------------------
  /**
   * Finalizes a championship, setting status to 'finished' and recording the champion.
   * Sets finished_at independently — if it fails, the finalization still succeeds.
   * Requirements: 4.8, 9.2
   */
  async finalize(id: string, champion: string, userId: string): Promise<void> {
    // Fetch the championship
    const [championship] = await this.db
      .select()
      .from(championships)
      .where(eq(championships.id, id))
      .limit(1);

    if (!championship) {
      throw new AppError("NOT_FOUND", "Championship not found");
    }

    // Verify ownership
    if (championship.creatorId !== userId) {
      throw new AppError(
        "AUTHORIZATION_FAILED",
        "You are not authorized to finalize this championship",
      );
    }

    const now = new Date();

    // Update status and champion — this is the critical operation
    await this.db
      .update(championships)
      .set({ status: "finished", champion, updatedAt: now })
      .where(eq(championships.id, id));

    // Try independently to set finished_at — if it fails, still succeed
    // Requirement 4.8: finalize status independently of finished_at
    try {
      await this.db
        .update(championships)
        .set({ finishedAt: now })
        .where(eq(championships.id, id));
    } catch {
      // Intentionally ignored — finishedAt is best-effort
    }
  }

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  /**
   * Deletes a championship.
   * Requirements: 9.1, 9.2
   */
  async delete(id: string, userId: string): Promise<void> {
    // Fetch the championship
    const [championship] = await this.db
      .select()
      .from(championships)
      .where(eq(championships.id, id))
      .limit(1);

    if (!championship) {
      throw new AppError("NOT_FOUND", "Championship not found");
    }

    // Verify ownership
    if (championship.creatorId !== userId) {
      throw new AppError(
        "AUTHORIZATION_FAILED",
        "You are not authorized to delete this championship",
      );
    }

    await this.db
      .delete(championships)
      .where(eq(championships.id, id));
  }
}

// ---------------------------------------------------------------------------
// Factory — convenience export for DI / testing
// ---------------------------------------------------------------------------

export function createChampionshipService(db: Db): ChampionshipService {
  return new ChampionshipService(db);
}
