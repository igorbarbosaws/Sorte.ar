/**
 * Unit tests for MigrationService
 * Requirements: 8.4, 8.5, 8.7
 */

import { describe, it, expect, vi } from "vitest";
import { MigrationService } from "../../src/modules/migration/migration.service.js";

// ---------------------------------------------------------------------------
// Mock DB builder helpers
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
 * Builds an insert chain that resolves to `returning` after .returning().
 * Pass `throws: true` to make .returning() reject with the given error.
 */
function buildInsertChain(options: { returning?: unknown[]; throws?: Error } = {}) {
  const returningFn = options.throws
    ? vi.fn().mockRejectedValue(options.throws)
    : vi.fn().mockResolvedValue(options.returning ?? [{ id: "new-id" }]);

  return {
    values: vi.fn().mockReturnValue({
      returning: returningFn,
    }),
  };
}

/**
 * Builds a DB mock that handles multiple sequential select calls and multiple
 * sequential insert calls.
 *
 * @param selectResults  Array of return values, one per `.select()` call.
 * @param insertOutcomes Array of insert outcomes, one per `.insert()` call.
 *                       Each entry is either { returning: [...] } (success)
 *                       or { throws: Error } (failure).
 */
function buildDbMock(
  selectResults: unknown[][] = [],
  insertOutcomes: Array<{ returning?: unknown[]; throws?: Error }> = [],
) {
  let selectCallCount = 0;
  let insertCallCount = 0;

  return {
    select: vi.fn((_fields?: unknown) => {
      const result = selectResults[selectCallCount++] ?? [];
      return buildSelectChain(result);
    }),
    insert: vi.fn((_table: unknown) => {
      const outcome = insertOutcomes[insertCallCount++] ?? {};
      return buildInsertChain(outcome);
    }),
  };
}

// ---------------------------------------------------------------------------
// Fake data helpers
// ---------------------------------------------------------------------------

const USER_ID = "user-abc-123";

/** A valid LocalChampionship fixture */
function makeItem(overrides: Partial<{
  localId: string;
  title: string;
  format: "groups-knockout" | "groups" | "knockout" | "league";
  data: Record<string, unknown>;
}> = {}) {
  return {
    localId: `local-id-${Math.random().toString(36).slice(2, 8)}`,
    title: "Test Championship",
    format: "groups-knockout" as const,
    data: { players: [], teams: [], draw: [], format: {} },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MigrationService", () => {
  // -------------------------------------------------------------------------
  // Test 1: all valid items migrate successfully (Req 8.4, 8.5)
  // -------------------------------------------------------------------------
  describe("migrateBatch — all valid items", () => {
    it("migrates all items when no duplicates exist and all inserts succeed — returns { migrated: 3, skipped: 0, failed: 0 }", async () => {
      const items = [makeItem(), makeItem(), makeItem()];

      // Each select returns [] (no duplicate found)
      const selectResults = [[], [], []];
      // Each insert returns [{ id: 'new-id' }]
      const insertOutcomes = [
        { returning: [{ id: "new-id" }] },
        { returning: [{ id: "new-id" }] },
        { returning: [{ id: "new-id" }] },
      ];

      const db = buildDbMock(selectResults, insertOutcomes);
      const service = new MigrationService(db as never);

      const result = await service.migrateBatch(USER_ID, items);

      expect(result.migrated).toBe(3);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.skippedItems).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Test 2: duplicate local_id is skipped without error (Req 8.7)
  // -------------------------------------------------------------------------
  describe("migrateBatch — duplicate local_id", () => {
    it("skips an item whose local_id already exists in the DB without error — returns { migrated: 1, skipped: 1 }", async () => {
      const firstItem = makeItem({ localId: "shared-local-id" });
      const secondItem = makeItem({ localId: "shared-local-id" }); // same localId — duplicate

      // First select: no duplicate → insert succeeds
      // Second select: duplicate found → skip
      const selectResults = [
        [],                       // first item: no existing record
        [{ id: "existing-id" }],  // second item: already exists in DB
      ];
      const insertOutcomes = [{ returning: [{ id: "new-id" }] }]; // only one insert happens

      const db = buildDbMock(selectResults, insertOutcomes);
      const service = new MigrationService(db as never);

      const result = await service.migrateBatch(USER_ID, [firstItem, secondItem]);

      expect(result.migrated).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.skippedItems).toContain(secondItem.localId);
    });
  });

  // -------------------------------------------------------------------------
  // Test 3: invalid item fails validation, others are migrated (Req 8.5)
  // -------------------------------------------------------------------------
  describe("migrateBatch — invalid item in batch", () => {
    it("skips an item with empty title (fails schema validation) and migrates the rest — returns { migrated: 2, failed: 1 }", async () => {
      const item1 = makeItem({ localId: "item-1" });
      const item2 = makeItem({ localId: "item-2", title: "" }); // invalid: empty title
      const item3 = makeItem({ localId: "item-3" });

      // item2 fails validation before DB is touched, so only 2 selects and 2 inserts
      const selectResults = [[], []];
      const insertOutcomes = [
        { returning: [{ id: "new-id-1" }] },
        { returning: [{ id: "new-id-3" }] },
      ];

      const db = buildDbMock(selectResults, insertOutcomes);
      const service = new MigrationService(db as never);

      const result = await service.migrateBatch(USER_ID, [item1, item2, item3]);

      expect(result.migrated).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.skippedItems).toContain(item2.localId);
      // Valid items should NOT be in skippedItems
      expect(result.skippedItems).not.toContain(item1.localId);
      expect(result.skippedItems).not.toContain(item3.localId);
    });
  });

  // -------------------------------------------------------------------------
  // Test 4: DB failure on insert rolls back only that item (Req 8.4)
  // -------------------------------------------------------------------------
  describe("migrateBatch — DB insert failure", () => {
    it("counts a failed insert as failed and continues migrating remaining items — returns { migrated: 1, failed: 1 }", async () => {
      const item1 = makeItem({ localId: "item-ok" });
      const item2 = makeItem({ localId: "item-db-fail" });

      // Both selects return [] (no duplicates)
      const selectResults = [[], []];
      // First insert succeeds, second throws
      const insertOutcomes = [
        { returning: [{ id: "new-id" }] },
        { throws: new Error("DB down") },
      ];

      const db = buildDbMock(selectResults, insertOutcomes);
      const service = new MigrationService(db as never);

      const result = await service.migrateBatch(USER_ID, [item1, item2]);

      expect(result.migrated).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.skippedItems).toContain(item2.localId);
      // The successful item must not appear in skippedItems
      expect(result.skippedItems).not.toContain(item1.localId);
    });
  });
});
