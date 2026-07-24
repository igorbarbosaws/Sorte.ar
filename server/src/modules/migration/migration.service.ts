import { eq, and } from "drizzle-orm";
import type { Db } from "../../db/index.js";
import { championships } from "../../db/schema.js";
import { AppError } from "../auth/auth.service.js";
import {
  localChampionshipSchema,
  type LocalChampionship,
} from "../../lib/validation.js";

// Re-export LocalChampionship for consumers of this module
export type { LocalChampionship };

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface MigrationResult {
  /** Number of championships successfully inserted into the DB */
  migrated: number;
  /** Number of championships skipped because local_id already exists in DB */
  skipped: number;
  /** Number of championships skipped due to invalid/malformed data or DB errors */
  failed: number;
  /** local_ids of all skipped and failed items */
  skippedItems: string[];
}

// ---------------------------------------------------------------------------
// MigrationService
// ---------------------------------------------------------------------------

export class MigrationService {
  constructor(private readonly db: Db) {}

  /**
   * Migrates a batch of localStorage championships to the DB for a given user.
   *
   * Each championship is processed individually:
   *  1. Validated with localChampionshipSchema — invalid → failed
   *  2. Checked for existing local_id in DB — duplicate → skipped
   *  3. Inserted into championships table — DB error → failed
   *  4. On success → migrated
   *
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7
   */
  async migrateBatch(
    userId: string,
    items: LocalChampionship[],
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      migrated: 0,
      skipped: 0,
      failed: 0,
      skippedItems: [],
    };

    for (const item of items) {
      // Step 1: Validate the item — Requirement 8.5
      const parsed = localChampionshipSchema.safeParse(item);
      if (!parsed.success) {
        result.failed++;
        // Use localId from raw item if available, otherwise mark as unknown
        const rawLocalId =
          typeof (item as Record<string, unknown>)["localId"] === "string"
            ? ((item as Record<string, unknown>)["localId"] as string)
            : "<unknown>";
        result.skippedItems.push(rawLocalId);
        continue;
      }

      const { localId, title, format, data } = parsed.data;

      // Step 2: Check for duplicate local_id in DB — Requirement 8.7
      let existing: { id: string }[];
      try {
        existing = await this.db
          .select({ id: championships.id })
          .from(championships)
          .where(
            and(
              eq(championships.creatorId, userId),
              eq(championships.localId, localId),
            ),
          )
          .limit(1);
      } catch {
        // DB query failure counts as a failed migration for this item
        result.failed++;
        result.skippedItems.push(localId);
        continue;
      }

      if (existing.length > 0) {
        // Duplicate — skip without error — Requirement 8.7
        result.skipped++;
        result.skippedItems.push(localId);
        continue;
      }

      // Step 3: INSERT into championships — Requirement 8.2
      try {
        const inserted = await this.db
          .insert(championships)
          .values({
            creatorId: userId,
            localId,
            title,
            format,
            status: "ongoing",
            data,
          })
          .returning({ id: championships.id });

        if (!inserted || inserted.length === 0) {
          throw new AppError("DB_SAVE_ERROR", "Insert returned no rows");
        }

        // Step 4: Success
        result.migrated++;
      } catch {
        // DB insert failure — Requirement 8.4, 8.5
        result.failed++;
        result.skippedItems.push(localId);
      }
    }

    return result;
  }
}

// ---------------------------------------------------------------------------
// Factory — convenience export for DI / testing
// ---------------------------------------------------------------------------

export function createMigrationService(db: Db): MigrationService {
  return new MigrationService(db);
}
