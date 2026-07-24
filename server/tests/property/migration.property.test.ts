// Feature: user-profiles-and-social, Property 9: Migração é idempotente por identificador local
//
// Validates: Requirements 8.7
//
// For any batch of valid championships with unique local_ids, calling
// migrateBatch N times (N >= 2) with the same userId and same batch:
//   - First call  → result.migrated === championships.length
//   - Calls 2..N  → result.skipped === championships.length,
//                   result.migrated === 0,
//                   result.failed  === 0
//
// This proves the same local_id is never inserted twice (idempotency).

import { describe, it, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { MigrationService } from "../../src/modules/migration/migration.service.js";

// ---------------------------------------------------------------------------
// Mock DB factory
// ---------------------------------------------------------------------------

/**
 * Creates a Drizzle-compatible mock DB that simulates the idempotency scenario:
 *
 *  select().from().where().limit()
 *    - On the FIRST batch call: returns [] for every championship (no duplicate)
 *    - On SUBSEQUENT calls: returns [{ id: 'existing' }] for every championship
 *
 *  insert().values().returning()
 *    - Always resolves with [{ id: 'new-id' }] (successful insert)
 *
 * The mock tracks how many times select has been called so it can switch
 * behaviour after the first batch.
 */
function createIdempotentMockDb(batchSize: number) {
  // Each batch of batchSize championships issues batchSize select calls.
  // selectCallCount tracks the total calls across all batches.
  let selectCallCount = 0;

  const selectMock = vi.fn().mockImplementation(() => ({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockImplementation(() => {
          const callIndex = selectCallCount++;
          // Calls 0 .. batchSize-1 belong to the first batch → no duplicates
          if (callIndex < batchSize) {
            return Promise.resolve([]);
          }
          // All subsequent calls → duplicate already exists
          return Promise.resolve([{ id: "existing" }]);
        }),
      }),
    }),
  }));

  const returningMock = vi.fn().mockResolvedValue([{ id: "new-id" }]);
  const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
  const insertMock = vi.fn().mockReturnValue({ values: valuesMock });

  const db = {
    select: selectMock,
    insert: insertMock,
  };

  return { db, selectMock, insertMock };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const championshipArb = fc.record({
  localId: fc.uuid(),
  title: fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => s.trim().length > 0),
  format: fc.constantFrom(
    "groups-knockout" as const,
    "groups" as const,
    "knockout" as const,
    "league" as const,
  ),
  data: fc.constant({ players: [], teams: [], draw: [], format: {} }),
});

const batchArb = fc.array(championshipArb, { minLength: 1, maxLength: 5 });

/** Number of migration calls: 2 to 4 */
const nArb = fc.integer({ min: 2, max: 4 });

// ---------------------------------------------------------------------------
// Property 9 — Migration is idempotent by local identifier
// ---------------------------------------------------------------------------

describe("Property 9: Migração é idempotente por identificador local", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(
    "primeira chamada migra todos; chamadas subsequentes ignoram todos (skipped) sem duplicar (100 runs)",
    async () => {
      await fc.assert(
        fc.asyncProperty(batchArb, nArb, async (batch, n) => {
          const userId = "test-user-id";
          const { db } = createIdempotentMockDb(batch.length);
          const service = new MigrationService(db as never);

          // ----------------------------------------------------------------
          // First call: every championship should be migrated (inserted)
          // ----------------------------------------------------------------
          const firstResult = await service.migrateBatch(userId, batch);

          if (firstResult.migrated !== batch.length) return false;
          if (firstResult.skipped !== 0) return false;
          if (firstResult.failed !== 0) return false;

          // ----------------------------------------------------------------
          // Calls 2..N: every championship should be skipped (duplicate)
          // ----------------------------------------------------------------
          for (let i = 1; i < n; i++) {
            const subsequentResult = await service.migrateBatch(userId, batch);

            if (subsequentResult.migrated !== 0) return false;
            if (subsequentResult.skipped !== batch.length) return false;
            if (subsequentResult.failed !== 0) return false;
          }

          return true;
        }),
        { numRuns: 100 },
      );
    },
  );
});
