/**
 * Unit tests for AuthService
 * Requirements: 2.1, 2.2, 2.4, 2.5
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import bcrypt from "bcrypt";
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../../src/lib/jwt.js";
import { AuthService, AppError } from "../../src/modules/auth/auth.service.js";

// JWT signing requires this env var to be set before any import resolves it
beforeAll(() => {
  process.env["JWT_SECRET"] = "test-secret-value-for-unit-tests";
});

// ---------------------------------------------------------------------------
// Mock DB factory helpers
// ---------------------------------------------------------------------------

/**
 * Creates a chainable fluent mock that returns `resolveWith` at the end of the
 * chain.  All chain methods (from, where, limit, values, returning, set) return
 * the same proxy so any chain length works.
 */
function makeChain(resolveWith: unknown): unknown {
  const proxy: Record<string, unknown> = {};
  const handler: ProxyHandler<typeof proxy> = {
    get(_target, prop) {
      if (prop === "then") return undefined; // not a Promise itself
      // Every method returns another chainable proxy that resolves to the same value
      return (..._args: unknown[]) => new Proxy(proxy, handler);
    },
  };
  // The final awaited result is the resolveWith value — we wrap the chain in a
  // Promise so that `await db.select().from().where().limit()` resolves.
  const thenable = {
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(resolveWith).then(resolve),
    ...Object.fromEntries(
      ["select", "insert", "update", "from", "where", "limit", "values", "returning", "set"].map(
        (m) => [m, vi.fn()]
      )
    ),
  };
  return thenable;
}

/**
 * Builds a minimal Db mock where every query operation can be configured per
 * call via `vi.fn()` return values.
 *
 * `selectResults` — array of return values; each call pops the first entry.
 * `insertReturning` — value returned by `.insert().values().returning()`.
 */
function buildDbMock(options: {
  selectResults?: unknown[][];
  insertReturning?: unknown[];
  updateReturns?: void;
} = {}) {
  let selectCallCount = 0;
  const selectResults = options.selectResults ?? [];

  const db = {
    select: vi.fn((_fields?: unknown) => {
      const result = selectResults[selectCallCount++] ?? [];
      return buildSelectChain(result);
    }),
    insert: vi.fn((_table: unknown) => buildInsertChain(options.insertReturning ?? [])),
    update: vi.fn((_table: unknown) => buildUpdateChain()),
  };

  return db;
}

function buildSelectChain(result: unknown) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

function buildInsertChain(returning: unknown) {
  const chain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(returning),
  };
  // Also support insert().values() with no .returning() (just resolves void)
  chain.values = vi.fn(() => ({
    returning: vi.fn().mockResolvedValue(returning),
    // plain awaitable (no .returning call)
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(undefined).then(resolve),
  }));
  return chain;
}

function buildUpdateChain() {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };
  return chain;
}

// ---------------------------------------------------------------------------
// Helpers to produce consistent fake data
// ---------------------------------------------------------------------------

const FAKE_USER_ID = "00000000-0000-0000-0000-000000000001";
const FAKE_TOKEN_ID = "00000000-0000-0000-0000-000000000002";
const VALID_PASSWORD = "ValidPass1!";

async function makePasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, 4); // low cost for test speed
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AuthService", () => {
  // -------------------------------------------------------------------------
  // login
  // -------------------------------------------------------------------------
  describe("login", () => {
    it("returns an accessToken and refreshToken when credentials are correct (Req 2.1)", async () => {
      const hash = await makePasswordHash(VALID_PASSWORD);

      // First select → find user; second select (inside _issueSessionPair insert) is never called
      const db = buildDbMock({
        selectResults: [[{ id: FAKE_USER_ID, passwordHash: hash }]],
        insertReturning: [], // insert refreshToken — no returning needed
      });

      const service = new AuthService(db as never);
      const result = await service.login(
        { email: "user@example.com", password: VALID_PASSWORD },
        "127.0.0.1",
      );

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(typeof result.accessToken).toBe("string");
      expect(typeof result.refreshToken).toBe("string");
      expect(result.accessToken.length).toBeGreaterThan(0);
      expect(result.refreshToken.length).toBeGreaterThan(0);
    });

    it("throws AUTHENTICATION_FAILED when password is wrong — never reveals which field (Req 2.2)", async () => {
      const hash = await makePasswordHash(VALID_PASSWORD);

      const db = buildDbMock({
        selectResults: [[{ id: FAKE_USER_ID, passwordHash: hash }]],
      });

      const service = new AuthService(db as never);

      await expect(
        service.login({ email: "user@example.com", password: "WrongPass!" }, "127.0.0.1"),
      ).rejects.toMatchObject({ code: "AUTHENTICATION_FAILED" });
    });

    it("throws AUTHENTICATION_FAILED when email is unknown — same generic error (Req 2.2)", async () => {
      // select returns empty array → user not found
      const db = buildDbMock({ selectResults: [[]] });

      const service = new AuthService(db as never);

      await expect(
        service.login({ email: "nobody@example.com", password: "AnyPass1!" }, "127.0.0.1"),
      ).rejects.toMatchObject({ code: "AUTHENTICATION_FAILED" });
    });
  });

  // -------------------------------------------------------------------------
  // bcrypt — hashed password never equals plaintext (Req 1.6)
  // -------------------------------------------------------------------------
  describe("password hashing", () => {
    it("bcrypt hash is always different from the original plaintext (Req 1.6)", async () => {
      const passwords = [
        "short123",
        "averylongpasswordthatisunlikely",
        "P@ssw0rd!",
        "12345678",
      ];

      for (const pw of passwords) {
        const hash = await bcrypt.hash(pw, 4);
        expect(hash).not.toBe(pw);
        // Hash must also verify correctly
        await expect(bcrypt.compare(pw, hash)).resolves.toBe(true);
        // Wrong password must not verify
        await expect(bcrypt.compare(pw + "x", hash)).resolves.toBe(false);
      }
    });
  });

  // -------------------------------------------------------------------------
  // refreshSession — expired token rejected
  // -------------------------------------------------------------------------
  describe("refreshSession", () => {
    it("throws TOKEN_EXPIRED when refresh token is past its expiry date (Req 2.7)", async () => {
      const rawToken = generateRefreshToken();
      const tokenHash = hashRefreshToken(rawToken);
      const pastDate = new Date(Date.now() - 1000); // 1 second in the past

      const db = buildDbMock({
        selectResults: [
          [
            {
              id: FAKE_TOKEN_ID,
              userId: FAKE_USER_ID,
              expiresAt: pastDate,
              revokedAt: null,
            },
          ],
        ],
      });

      const service = new AuthService(db as never);

      await expect(service.refreshSession(rawToken)).rejects.toMatchObject({
        code: "TOKEN_EXPIRED",
      });
    });

    it("returns a new access token when refresh token is valid (Req 2.6)", async () => {
      const rawToken = generateRefreshToken();
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead

      const db = buildDbMock({
        selectResults: [
          [
            {
              id: FAKE_TOKEN_ID,
              userId: FAKE_USER_ID,
              expiresAt: futureDate,
              revokedAt: null,
            },
          ],
        ],
      });

      const service = new AuthService(db as never);
      const accessToken = await service.refreshSession(rawToken);

      expect(typeof accessToken).toBe("string");
      expect(accessToken.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // logout + refreshSession — invalidation check (Req 2.4, 2.5)
  // -------------------------------------------------------------------------
  describe("logout", () => {
    it("invalidates the refresh token so subsequent refreshSession returns AUTHENTICATION_FAILED (Req 2.4)", async () => {
      const rawToken = generateRefreshToken();
      const tokenHash = hashRefreshToken(rawToken);

      // logout: select finds the token row, then update revokes it
      const logoutDb = buildDbMock({
        selectResults: [[{ id: FAKE_TOKEN_ID }]],
      });

      const logoutService = new AuthService(logoutDb as never);
      await logoutService.logout(rawToken);

      // Now simulate a refreshSession call using a NEW service instance whose
      // DB returns the row with revokedAt set (i.e., what the DB would return
      // after the logout update was applied).
      const revokedAt = new Date();
      const futureExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const refreshDb = buildDbMock({
        selectResults: [
          [
            {
              id: FAKE_TOKEN_ID,
              userId: FAKE_USER_ID,
              expiresAt: futureExpiry,
              revokedAt, // token is now revoked
            },
          ],
        ],
      });

      const refreshService = new AuthService(refreshDb as never);
      await expect(refreshService.refreshSession(rawToken)).rejects.toMatchObject({
        code: "AUTHENTICATION_FAILED",
      });
    });

    it("silently succeeds when logout is called with an unknown token (Req 2.4)", async () => {
      const rawToken = generateRefreshToken();

      // select returns nothing → token not found
      const db = buildDbMock({ selectResults: [[]] });

      const service = new AuthService(db as never);
      // Should not throw
      await expect(service.logout(rawToken)).resolves.toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // register — duplicate email (Req 1.2)
  // -------------------------------------------------------------------------
  describe("register", () => {
    it("throws EMAIL_ALREADY_EXISTS when registering with a duplicate email (Req 1.2)", async () => {
      // select returns an existing user row
      const db = buildDbMock({
        selectResults: [[{ id: FAKE_USER_ID }]],
      });

      const service = new AuthService(db as never);

      await expect(
        service.register({
          email: "taken@example.com",
          password: "ValidPass1!",
          displayName: "Existing User",
        }),
      ).rejects.toMatchObject({ code: "EMAIL_ALREADY_EXISTS" });
    });
  });
});
