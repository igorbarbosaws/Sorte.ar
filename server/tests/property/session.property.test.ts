// Feature: user-profiles-and-social, Property 5: Session inválida ou expirada é sempre rejeitada
//
// Validates: Requirements 2.5, 9.4
//
// For any access token that is expired, revoked, or malformed, every
// authenticated request SHALL return an authentication error without
// executing the requested operation, regardless of the resource or HTTP method.

// JWT_SECRET must be set before any module that reads it is imported
process.env["JWT_SECRET"] = "test-secret";

import { describe, it, vi } from "vitest";
import * as fc from "fast-check";
import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../../src/lib/jwt.js";
import { authenticate } from "../../src/middleware/authenticate.js";

// ===========================================================================
// Property 5.1 — Malformed tokens are always rejected
// ===========================================================================
//
// For any random string that is not a valid JWT, verifyAccessToken(token)
// throws an error.

describe("Property 5.1: Tokens malformados são sempre rejeitados", () => {
  it(
    "verifyAccessToken lança erro para qualquer string que não seja um JWT válido (500 runs)",
    () => {
      fc.assert(
        fc.property(
          // Arbitrary strings — the vast majority won't be valid JWTs.
          // Filter out strings that happen to be syntactically valid JWTs
          // (three base64url segments separated by dots) to keep the test focused.
          fc.string({ minLength: 0, maxLength: 200 }).filter((s) => {
            // A well-formed JWT has exactly two dots separating three non-empty segments
            const parts = s.split(".");
            return !(
              parts.length === 3 &&
              parts[0]!.length > 0 &&
              parts[1]!.length > 0 &&
              parts[2]!.length > 0
            );
          }),
          (token) => {
            let threw = false;
            try {
              verifyAccessToken(token);
            } catch {
              threw = true;
            }
            return threw;
          },
        ),
        { numRuns: 500 },
      );
    },
  );
});

// ===========================================================================
// Property 5.2 — Expired tokens are always rejected
// ===========================================================================
//
// A JWT signed with exp in the past must be rejected with TokenExpiredError.

describe("Property 5.2: Tokens expirados são sempre rejeitados", () => {
  it(
    "verifyAccessToken lança TokenExpiredError para tokens com exp no passado (500 runs)",
    () => {
      fc.assert(
        fc.property(
          // Any non-empty userId string
          fc.string({ minLength: 1, maxLength: 64 }),
          (userId) => {
            // Sign a token that expired 1 second ago (expiresIn: -1)
            const expiredToken = jwt.sign(
              { sub: userId },
              "test-secret",
              { expiresIn: -1 },
            );

            let threwExpiredError = false;
            try {
              verifyAccessToken(expiredToken);
            } catch (err: unknown) {
              if (err instanceof Error && err.name === "TokenExpiredError") {
                threwExpiredError = true;
              }
            }
            return threwExpiredError;
          },
        ),
        { numRuns: 500 },
      );
    },
  );
});

// ===========================================================================
// Property 5.3 — Tokens signed with a wrong secret are always rejected
// ===========================================================================
//
// For any userId, a token signed with a secret different from JWT_SECRET
// must be rejected by verifyAccessToken.

describe("Property 5.3: Tokens assinados com secret errado são sempre rejeitados", () => {
  it(
    "verifyAccessToken lança erro para tokens assinados com secret diferente do JWT_SECRET (500 runs)",
    () => {
      fc.assert(
        fc.property(
          // Any non-empty userId string
          fc.string({ minLength: 1, maxLength: 64 }),
          // Any secret that is NOT equal to the configured JWT_SECRET ("test-secret")
          fc.string({ minLength: 1, maxLength: 64 }).filter((s) => s !== "test-secret"),
          (userId, wrongSecret) => {
            const badToken = jwt.sign({ sub: userId }, wrongSecret, {
              expiresIn: "60m",
            });

            let threw = false;
            try {
              verifyAccessToken(badToken);
            } catch {
              threw = true;
            }
            return threw;
          },
        ),
        { numRuns: 500 },
      );
    },
  );
});

// ===========================================================================
// Property 5.4 — authenticate middleware rejects invalid/expired tokens
// ===========================================================================
//
// For any malformed or expired token, the authenticate Express middleware
// must respond with HTTP 401 (with code AUTHENTICATION_FAILED or TOKEN_EXPIRED)
// and must NOT call next().

describe("Property 5.4: Middleware authenticate rejeita tokens inválidos/expirados", () => {
  it(
    "middleware retorna 401 e não chama next() para tokens malformados (500 runs)",
    () => {
      fc.assert(
        fc.property(
          // Malformed tokens: strings that are not valid JWTs
          fc.string({ minLength: 0, maxLength: 200 }).filter((s) => {
            const parts = s.split(".");
            return !(
              parts.length === 3 &&
              parts[0]!.length > 0 &&
              parts[1]!.length > 0 &&
              parts[2]!.length > 0
            );
          }),
          (badToken) => {
            const mockNext = vi.fn();
            const statusMock = vi.fn().mockReturnThis();
            const jsonMock = vi.fn();
            const mockReq = {
              headers: { authorization: `Bearer ${badToken}` },
            };
            const mockRes = { status: statusMock, json: jsonMock };

            authenticate(mockReq as never, mockRes as never, mockNext);

            // next must NOT have been called
            if (mockNext.mock.calls.length !== 0) return false;
            // status(401) must have been called
            if (statusMock.mock.calls[0]?.[0] !== 401) return false;
            // response body must include a valid error code
            const body = jsonMock.mock.calls[0]?.[0] as {
              error?: { code?: string };
            };
            const code = body?.error?.code;
            return code === "AUTHENTICATION_FAILED" || code === "TOKEN_EXPIRED";
          },
        ),
        { numRuns: 500 },
      );
    },
  );

  it(
    "middleware retorna 401 e não chama next() para tokens expirados (500 runs)",
    () => {
      fc.assert(
        fc.property(
          // Any non-empty userId string
          fc.string({ minLength: 1, maxLength: 64 }),
          (userId) => {
            const expiredToken = jwt.sign(
              { sub: userId },
              "test-secret",
              { expiresIn: -1 },
            );

            const mockNext = vi.fn();
            const statusMock = vi.fn().mockReturnThis();
            const jsonMock = vi.fn();
            const mockReq = {
              headers: { authorization: `Bearer ${expiredToken}` },
            };
            const mockRes = { status: statusMock, json: jsonMock };

            authenticate(mockReq as never, mockRes as never, mockNext);

            if (mockNext.mock.calls.length !== 0) return false;
            if (statusMock.mock.calls[0]?.[0] !== 401) return false;
            const body = jsonMock.mock.calls[0]?.[0] as {
              error?: { code?: string };
            };
            const code = body?.error?.code;
            return code === "TOKEN_EXPIRED";
          },
        ),
        { numRuns: 500 },
      );
    },
  );
});
