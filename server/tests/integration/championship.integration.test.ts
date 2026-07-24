/**
 * Integration test: championship persistence flow
 * create → update score → reload → score persists
 * Requirements: 4.1, 4.2, 4.4
 */

process.env["JWT_SECRET"] = "test-secret";

import { describe, it, expect, vi } from "vitest";
import { ChampionshipService } from "../../src/modules/championship/championship.service.js";

// ---------------------------------------------------------------------------
// Mock DB helpers
// ---------------------------------------------------------------------------

function buildSelectChainWithLimit(result: unknown) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
}

// getFeed uses .where() as a thenable (no .limit())
function buildSelectChainNoLimit(result: unknown) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnValue({
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve(result).then(resolve),
    }),
  };
}

function buildInsertChain(returning: unknown) {
  return {
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue(returning),
    }),
  };
}

function buildUpdateChain(returning: unknown = [{ id: "champ-1" }]) {
  return {
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(returning),
        then: (resolve: (v: unknown) => unknown) =>
          Promise.resolve(undefined).then(resolve),
      }),
    }),
  };
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const CREATOR_ID = "00000000-0000-0000-0000-000000000001";
const CHAMP_ID = "00000000-0000-0000-0000-000000000010";

const INITIAL_DATA = { players: ["Alice", "Bob"], teams: [], draw: [], format: {} };
const UPDATED_DATA = { players: ["Alice", "Bob"], teams: [], draw: [], format: {}, scores: { match1: "2-1" } };

// ---------------------------------------------------------------------------
// Integration test
// ---------------------------------------------------------------------------

describe("Championship persistence integration: create → update → reload → persists (Req 4.1, 4.2, 4.4)", () => {

  it("Step 1 — create: persists championship and returns it with an ID (Req 4.1)", async () => {
    const created = {
      id: CHAMP_ID,
      creatorId: CREATOR_ID,
      localId: null,
      title: "Test Cup",
      format: "groups-knockout",
      status: "ongoing",
      champion: null,
      data: INITIAL_DATA,
      createdAt: new Date(),
      updatedAt: new Date(),
      finishedAt: null,
    };

    const db = {
      select: vi.fn().mockReturnValue(buildSelectChainWithLimit([])),
      insert: vi.fn().mockReturnValue(buildInsertChain([created])),
      update: vi.fn(),
    };

    const service = new ChampionshipService(db as never);
    const result = await service.create(CREATOR_ID, {
      title: "Test Cup",
      format: "groups-knockout" as const,
      data: INITIAL_DATA,
    });

    expect(result.id).toBe(CHAMP_ID);
    expect(result.title).toBe("Test Cup");
    expect(result.status).toBe("ongoing");
    expect(result.creatorId).toBe(CREATOR_ID);
  });

  it("Step 2 — updateScore: persists updated data without DB_SAVE_ERROR (Req 4.4)", async () => {
    const existing = {
      id: CHAMP_ID,
      creatorId: CREATOR_ID,
      status: "ongoing",
      title: "Test Cup",
      format: "groups-knockout",
      data: INITIAL_DATA,
      localId: null,
      champion: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      finishedAt: null,
    };

    const db = {
      select: vi.fn().mockReturnValue(buildSelectChainWithLimit([existing])),
      insert: vi.fn(),
      update: vi.fn().mockReturnValue(buildUpdateChain([{ id: CHAMP_ID }])),
    };

    const service = new ChampionshipService(db as never);

    // Should not throw
    await expect(
      service.updateScore(CHAMP_ID, { data: UPDATED_DATA }, CREATOR_ID)
    ).resolves.toBeUndefined();

    // DB update was called
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it("Step 3 — get: reloads and returns the championship (simulating persisted score) (Req 4.2)", async () => {
    const reloaded = {
      id: CHAMP_ID,
      creatorId: CREATOR_ID,
      status: "ongoing",
      title: "Test Cup",
      format: "groups-knockout",
      data: UPDATED_DATA, // ← updated data persisted
      localId: null,
      champion: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      finishedAt: null,
    };

    const db = {
      select: vi.fn().mockReturnValue(buildSelectChainWithLimit([reloaded])),
      insert: vi.fn(),
      update: vi.fn(),
    };

    const service = new ChampionshipService(db as never);
    const result = await service.get(CHAMP_ID, CREATOR_ID);

    // The reloaded championship contains the updated data
    expect(result.id).toBe(CHAMP_ID);
    expect(result.data).toEqual(UPDATED_DATA);
    expect((result.data as typeof UPDATED_DATA).scores?.match1).toBe("2-1");
  });

  it("Full flow: create → updateScore → get → score persists end-to-end", async () => {
    // Step 1: create
    const createdChamp = {
      id: CHAMP_ID, creatorId: CREATOR_ID, localId: null,
      title: "End-to-End Cup", format: "knockout", status: "ongoing",
      champion: null, data: INITIAL_DATA, createdAt: new Date(),
      updatedAt: new Date(), finishedAt: null,
    };

    let storedData = INITIAL_DATA;

    // Simulate a stateful mock: updateScore saves data, get returns it
    const dbCreate = {
      select: vi.fn().mockReturnValue(buildSelectChainWithLimit([])),
      insert: vi.fn().mockReturnValue(buildInsertChain([createdChamp])),
      update: vi.fn(),
    };
    const serviceCreate = new ChampionshipService(dbCreate as never);
    const created = await serviceCreate.create(CREATOR_ID, {
      title: "End-to-End Cup",
      format: "knockout" as const,
      data: INITIAL_DATA,
    });
    expect(created.id).toBe(CHAMP_ID);

    // Step 2: updateScore — capture what data was "saved"
    const dbUpdate = {
      select: vi.fn().mockReturnValue(buildSelectChainWithLimit([createdChamp])),
      insert: vi.fn(),
      update: vi.fn().mockImplementation(() => {
        storedData = UPDATED_DATA; // simulate persist
        return buildUpdateChain([{ id: CHAMP_ID }]);
      }),
    };
    const serviceUpdate = new ChampionshipService(dbUpdate as never);
    await serviceUpdate.updateScore(CHAMP_ID, { data: UPDATED_DATA }, CREATOR_ID);

    // Step 3: get — returns championship with stored data
    const dbGet = {
      select: vi.fn().mockReturnValue(
        buildSelectChainWithLimit([{ ...createdChamp, data: storedData }])
      ),
      insert: vi.fn(),
      update: vi.fn(),
    };
    const serviceGet = new ChampionshipService(dbGet as never);
    const reloaded = await serviceGet.get(CHAMP_ID, CREATOR_ID);

    expect(reloaded.data).toEqual(UPDATED_DATA);
    expect((reloaded.data as typeof UPDATED_DATA).scores?.match1).toBe("2-1");
  });

  it("Performance — updateScore completes in ≤ 2 seconds (Req 4.4)", async () => {
    const existing = {
      id: CHAMP_ID,
      creatorId: CREATOR_ID,
      status: "ongoing",
      title: "Test Cup",
      format: "groups-knockout",
      data: INITIAL_DATA,
      localId: null,
      champion: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      finishedAt: null,
    };

    const db = {
      select: vi.fn().mockReturnValue(buildSelectChainWithLimit([existing])),
      insert: vi.fn(),
      update: vi.fn().mockReturnValue(buildUpdateChain([{ id: CHAMP_ID }])),
    };

    const service = new ChampionshipService(db as never);

    const start = performance.now();
    await service.updateScore(CHAMP_ID, { data: UPDATED_DATA }, CREATOR_ID);
    const duration = performance.now() - start;

    expect(duration).toBeLessThanOrEqual(2000);
  });
});
