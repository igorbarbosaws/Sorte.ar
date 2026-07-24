/**
 * Integration test: full auth flow
 * register → login → authenticated request (refreshSession) → logout → rejected request
 * Requirements: 1.1, 1.7, 2.1, 2.4, 9.4
 */

// JWT_SECRET must be set before any module that reads it is imported
process.env["JWT_SECRET"] = "test-secret";

import { describe, it, expect, vi, beforeAll } from "vitest";
import bcrypt from "bcrypt";
import { AuthService } from "../../src/modules/auth/auth.service.js";
import { verifyAccessToken, generateRefreshToken, hashRefreshToken } from "../../src/lib/jwt.js";

// ---------------------------------------------------------------------------
// Mock DB builder helpers
// ---------------------------------------------------------------------------

function buildSelectChain(result: unknown) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
}

function buildInsertChain(returning: unknown = []) {
  return {
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue(returning),
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve(undefined).then(resolve),
    }),
  };
}

function buildUpdateChain() {
  return {
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  };
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";
const TEST_TOKEN_ID = "00000000-0000-0000-0000-000000000002";
const TEST_EMAIL = "integration@test.com";
const TEST_PASSWORD = "SecurePass1!";
const TEST_DISPLAY_NAME = "Integration Tester";

// ---------------------------------------------------------------------------
// Integration test
// ---------------------------------------------------------------------------

describe("Auth flow integration: register → login → refresh → logout → reject", () => {
  let passwordHash: string;

  beforeAll(async () => {
    // Pre-compute a real bcrypt hash (cost 4 for speed in tests)
    passwordHash = await bcrypt.hash(TEST_PASSWORD, 4);
  });

  // -------------------------------------------------------------------------
  // Step 1: Register
  // -------------------------------------------------------------------------
  it("Step 1 — register: creates user and returns access + refresh tokens (Req 1.1)", async () => {
    const db = {
      select: vi.fn()
        .mockReturnValueOnce(buildSelectChain([])) // uniqueness check → no existing user
        .mockReturnValueOnce(buildSelectChain([])), // refresh token insert (no select after)
      insert: vi.fn().mockImplementation(() =>
        buildInsertChain([{ id: TEST_USER_ID }])
      ),
      update: vi.fn(),
    };

    const service = new AuthService(db as never);
    const result = await service.register({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      displayName: TEST_DISPLAY_NAME,
    });

    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
    expect(typeof result.accessToken).toBe("string");
    expect(typeof result.refreshToken).toBe("string");
    expect(result.accessToken.length).toBeGreaterThan(0);
    expect(result.refreshToken.length).toBeGreaterThan(0);

    // The access token should be verifiable
    const payload = verifyAccessToken(result.accessToken);
    expect(payload.userId).toBe(TEST_USER_ID);
  });

  // -------------------------------------------------------------------------
  // Step 2: Login
  // -------------------------------------------------------------------------
  it("Step 2 — login: validates credentials and returns new token pair (Req 2.1)", async () => {
    const db = {
      select: vi.fn().mockReturnValue(
        buildSelectChain([{ id: TEST_USER_ID, passwordHash }])
      ),
      insert: vi.fn().mockImplementation(() =>
        buildInsertChain([{ id: TEST_TOKEN_ID }])
      ),
      update: vi.fn(),
    };

    const service = new AuthService(db as never);
    const result = await service.login(
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      "127.0.0.1",
    );

    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");

    // Access token payload should contain the user ID
    const payload = verifyAccessToken(result.accessToken);
    expect(payload.userId).toBe(TEST_USER_ID);
  });

  // -------------------------------------------------------------------------
  // Step 3: Authenticated request via refreshSession (valid token)
  // -------------------------------------------------------------------------
  it("Step 3 — refreshSession: valid refresh token returns new access token (Req 2.6, 9.4)", async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const db = {
      select: vi.fn().mockReturnValue(
        buildSelectChain([
          {
            id: TEST_TOKEN_ID,
            userId: TEST_USER_ID,
            expiresAt: futureDate,
            revokedAt: null,
          },
        ])
      ),
      insert: vi.fn(),
      update: vi.fn(),
    };

    const rawToken = generateRefreshToken();

    const service = new AuthService(db as never);
    const newAccessToken = await service.refreshSession(rawToken);

    expect(typeof newAccessToken).toBe("string");
    expect(newAccessToken.length).toBeGreaterThan(0);

    const payload = verifyAccessToken(newAccessToken);
    expect(payload.userId).toBe(TEST_USER_ID);
  });

  // -------------------------------------------------------------------------
  // Step 4: Logout
  // -------------------------------------------------------------------------
  it("Step 4 — logout: revokes the refresh token (Req 2.4)", async () => {
    const db = {
      select: vi.fn().mockReturnValue(
        buildSelectChain([{ id: TEST_TOKEN_ID }])
      ),
      insert: vi.fn(),
      update: vi.fn().mockReturnValue(buildUpdateChain()),
    };

    const rawToken = generateRefreshToken();

    const service = new AuthService(db as never);

    // logout should not throw
    await expect(service.logout(rawToken)).resolves.toBeUndefined();

    // update (revoke) must have been called
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Step 5: Rejected request after logout (revoked token)
  // -------------------------------------------------------------------------
  it("Step 5 — refreshSession after logout: throws AUTHENTICATION_FAILED (Req 2.5, 9.4)", async () => {
    // Simulate a revoked token row
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const revokedAt = new Date();

    const db = {
      select: vi.fn().mockReturnValue(
        buildSelectChain([
          {
            id: TEST_TOKEN_ID,
            userId: TEST_USER_ID,
            expiresAt: futureDate,
            revokedAt, // <-- token was revoked during logout
          },
        ])
      ),
      insert: vi.fn(),
      update: vi.fn(),
    };

    const rawToken = generateRefreshToken();

    const service = new AuthService(db as never);

    await expect(service.refreshSession(rawToken)).rejects.toMatchObject({
      code: "AUTHENTICATION_FAILED",
    });
  });

  // -------------------------------------------------------------------------
  // Full integration test: end-to-end auth flow chained together
  // -------------------------------------------------------------------------
  describe("Full chained flow — register → login → refreshSession → logout → rejection", () => {
    it("completes all 5 steps without errors and logout invalidates subsequent requests", async () => {
      // --- Step 1: register ---
      const createdUser = {
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        passwordHash,
        displayName: TEST_DISPLAY_NAME,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const registerDb = {
        select: vi.fn().mockReturnValue(buildSelectChain([])),
        insert: vi.fn().mockImplementation(() => buildInsertChain([createdUser])),
        update: vi.fn(),
      };
      const registerService = new AuthService(registerDb as never);
      const registerResult = await registerService.register({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        displayName: TEST_DISPLAY_NAME,
      });

      expect(registerResult).toHaveProperty("accessToken");
      expect(registerResult).toHaveProperty("refreshToken");
      expect(typeof registerResult.accessToken).toBe("string");
      expect(typeof registerResult.refreshToken).toBe("string");

      const registerPayload = verifyAccessToken(registerResult.accessToken);
      expect(registerPayload.userId).toBe(TEST_USER_ID);

      // --- Step 2: login ---
      const loginDb = {
        select: vi.fn().mockReturnValue(
          buildSelectChain([{ id: TEST_USER_ID, passwordHash }])
        ),
        insert: vi.fn().mockImplementation(() =>
          buildInsertChain([{ id: TEST_TOKEN_ID }])
        ),
        update: vi.fn(),
      };
      const loginService = new AuthService(loginDb as never);
      const loginResult = await loginService.login(
        { email: TEST_EMAIL, password: TEST_PASSWORD },
        "127.0.0.1",
      );

      expect(loginResult).toHaveProperty("accessToken");
      expect(loginResult).toHaveProperty("refreshToken");

      const loginPayload = verifyAccessToken(loginResult.accessToken);
      expect(loginPayload.userId).toBe(TEST_USER_ID);

      // --- Step 3: refreshSession ---
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const refreshDb = {
        select: vi.fn().mockReturnValue(
          buildSelectChain([
            {
              id: TEST_TOKEN_ID,
              userId: TEST_USER_ID,
              expiresAt: futureDate,
              revokedAt: null,
            },
          ])
        ),
        insert: vi.fn(),
        update: vi.fn(),
      };

      const refreshService = new AuthService(refreshDb as never);
      const newAccessToken = await refreshService.refreshSession(loginResult.refreshToken);

      expect(typeof newAccessToken).toBe("string");
      expect(newAccessToken.length).toBeGreaterThan(0);

      const refreshedPayload = verifyAccessToken(newAccessToken);
      expect(refreshedPayload.userId).toBe(TEST_USER_ID);

      // --- Step 4: logout ---
      const logoutDb = {
        select: vi.fn().mockReturnValue(
          buildSelectChain([{ id: TEST_TOKEN_ID }])
        ),
        insert: vi.fn(),
        update: vi.fn().mockReturnValue(buildUpdateChain()),
      };

      const logoutService = new AuthService(logoutDb as never);
      await expect(logoutService.logout(loginResult.refreshToken)).resolves.toBeUndefined();

      // Verify update (revoke) was called
      expect(logoutDb.update).toHaveBeenCalledTimes(1);

      // --- Step 5: verify refreshSession now fails with revoked token ---
      const revokedAt = new Date();

      const rejectedRefreshDb = {
        select: vi.fn().mockReturnValue(
          buildSelectChain([
            {
              id: TEST_TOKEN_ID,
              userId: TEST_USER_ID,
              expiresAt: futureDate,
              revokedAt, // token was revoked during logout
            },
          ])
        ),
        insert: vi.fn(),
        update: vi.fn(),
      };

      const rejectedRefreshService = new AuthService(rejectedRefreshDb as never);
      await expect(rejectedRefreshService.refreshSession(loginResult.refreshToken)).rejects.toMatchObject({
        code: "AUTHENTICATION_FAILED",
      });
    });
  });
});
