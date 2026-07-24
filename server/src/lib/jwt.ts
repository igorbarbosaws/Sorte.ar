import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "crypto";

/**
 * The decoded shape returned by verifyAccessToken.
 * `userId` maps to the `sub` claim in the JWT payload.
 */
export interface AccessTokenPayload {
  userId: string;
}

function getSecret(): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}

/**
 * Creates a signed JWT for the given user.
 * Payload: { sub: userId }
 * Expiry: 60 minutes (fixed).
 */
export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, getSecret(), { expiresIn: "60m" });
}

/**
 * Validates a JWT access token.
 * Returns { userId } on success.
 * Throws TokenExpiredError or JsonWebTokenError if invalid/expired.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, getSecret()) as jwt.JwtPayload;
  const sub = decoded["sub"];
  if (typeof sub !== "string" || sub.length === 0) {
    throw new Error("Invalid token: missing sub claim");
  }
  return { userId: sub };
}

/**
 * Generates a cryptographically random opaque refresh token.
 * Returns 48 random bytes encoded as a 96-character hex string.
 */
export function generateRefreshToken(): string {
  return randomBytes(48).toString("hex");
}

/**
 * Computes the SHA-256 hash of a refresh token.
 * The hash is stored in the DB; the raw token is sent to the client.
 */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
