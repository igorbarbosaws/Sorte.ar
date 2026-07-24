import bcrypt from "bcrypt";
import { eq, and, isNull } from "drizzle-orm";
import { randomBytes } from "crypto";
import type { Db } from "../../db/index.js";
import { users, refreshTokens } from "../../db/schema.js";
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../../lib/jwt.js";
import { sendVerificationEmail } from "../../lib/email.js";
import {
  registerSchema,
  loginSchema,
  type RegisterInput,
  type LoginInput,
} from "../../lib/validation.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SessionPair {
  accessToken: string;  // JWT, exp: 60 min
  refreshToken: string; // opaque token, exp: 7 days
}

export type AccessToken = string;

// ---------------------------------------------------------------------------
// App-level error type
// ---------------------------------------------------------------------------

export class AppError extends Error {
  constructor(public readonly code: string, message?: string) {
    super(message ?? code);
    this.name = "AppError";
  }
}

// ---------------------------------------------------------------------------
// AuthService
// ---------------------------------------------------------------------------

const BCRYPT_COST = 12;
const REFRESH_TOKEN_TTL_DAYS = 7;
const VERIFICATION_TOKEN_TTL_HOURS = 24;

/** Generates a secure random hex token for email verification. */
function generateVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export class AuthService {
  constructor(private readonly db: Db) {}

  // -------------------------------------------------------------------------
  // register
  // -------------------------------------------------------------------------
  async register(input: RegisterInput): Promise<SessionPair> {
    // 1. Validate input via Zod schema (throws if invalid via the caller, but
    //    we run it here as a defence layer so service is usable standalone).
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      throw new AppError(
        "VALIDATION_ERROR",
        firstError?.message ?? "Validation error",
      );
    }

    const { email, password, displayName } = parsed.data;

    // 2. Check e-mail uniqueness — Requirement 1.2
    const existing = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      throw new AppError("EMAIL_ALREADY_EXISTS", "Email is already registered");
    }

    // 3. Hash password — Requirement 1.6
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    // 4. Insert user row — unverified by default
    const verificationToken = generateVerificationToken();
    const verificationExpiresAt = new Date();
    verificationExpiresAt.setHours(
      verificationExpiresAt.getHours() + VERIFICATION_TOKEN_TTL_HOURS
    );

    const [newUser] = await this.db
      .insert(users)
      .values({
        email,
        passwordHash,
        displayName,
        emailVerified: false,
        verificationToken,
        verificationExpiresAt,
      })
      .returning({ id: users.id });

    if (!newUser) {
      throw new AppError("DB_SAVE_ERROR", "Failed to create user");
    }

    // 5. Send verification email (non-blocking — failure doesn't break registration)
    sendVerificationEmail(email, displayName, verificationToken).catch((err) => {
      console.error("[auth] Failed to send verification email:", err);
    });

    // 6. Return session pair — user is logged in but not yet verified.
    //    Login will be blocked until email is confirmed.
    const { accessToken, refreshToken } = await this._issueSessionPair(
      newUser.id,
    );

    return { accessToken, refreshToken };
  }

  // -------------------------------------------------------------------------
  // login
  // -------------------------------------------------------------------------
  async login(input: LoginInput, _ipAddress: string): Promise<SessionPair> {
    // 1. Validate input
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      // Generic error — Requirement 2.2 (don't leak which field failed)
      throw new AppError("AUTHENTICATION_FAILED", "Authentication failed");
    }

    const { email, password } = parsed.data;

    // 2. Find user by email
    const [user] = await this.db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new AppError("AUTHENTICATION_FAILED", "Authentication failed");
    }

    // 3. Compare password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new AppError("AUTHENTICATION_FAILED", "Authentication failed");
    }

    // 4. Block login if email not verified
    if (!user.emailVerified) {
      throw new AppError(
        "EMAIL_NOT_VERIFIED",
        "Please verify your email before logging in"
      );
    }

    // 4. Issue session pair
    const { accessToken, refreshToken } = await this._issueSessionPair(
      user.id,
    );

    return { accessToken, refreshToken };
  }

  // -------------------------------------------------------------------------
  // verifyEmail
  // -------------------------------------------------------------------------
  async verifyEmail(token: string): Promise<void> {
    if (!token) {
      throw new AppError("INVALID_TOKEN", "Verification token is required");
    }

    const [user] = await this.db
      .select({
        id: users.id,
        emailVerified: users.emailVerified,
        verificationExpiresAt: users.verificationExpiresAt,
      })
      .from(users)
      .where(eq(users.verificationToken, token))
      .limit(1);

    if (!user) {
      throw new AppError("INVALID_TOKEN", "Invalid or already used verification token");
    }

    if (user.emailVerified) {
      // Already verified — silently succeed
      return;
    }

    if (!user.verificationExpiresAt || user.verificationExpiresAt < new Date()) {
      throw new AppError("TOKEN_EXPIRED", "Verification link has expired. Request a new one.");
    }

    await this.db
      .update(users)
      .set({
        emailVerified: true,
        verificationToken: null,
        verificationExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  }

  // -------------------------------------------------------------------------
  // resendVerification
  // -------------------------------------------------------------------------
  async resendVerification(email: string): Promise<void> {
    const [user] = await this.db
      .select({
        id: users.id,
        displayName: users.displayName,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Don't reveal whether the email exists
    if (!user || user.emailVerified) return;

    const verificationToken = generateVerificationToken();
    const verificationExpiresAt = new Date();
    verificationExpiresAt.setHours(
      verificationExpiresAt.getHours() + VERIFICATION_TOKEN_TTL_HOURS
    );

    await this.db
      .update(users)
      .set({ verificationToken, verificationExpiresAt, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    sendVerificationEmail(email, user.displayName, verificationToken).catch((err) => {
      console.error("[auth] Failed to resend verification email:", err);
    });
  }

  // -------------------------------------------------------------------------
  // logout
  // -------------------------------------------------------------------------
  async logout(refreshToken: string): Promise<void> {
    // Hash the token to find the stored row — Requirement 2.4
    const tokenHash = hashRefreshToken(refreshToken);

    // Find the matching, non-revoked row
    const [row] = await this.db
      .select({ id: refreshTokens.id })
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
        ),
      )
      .limit(1);

    if (!row) {
      // Silently succeed if token not found or already revoked — Requirement 2.4
      return;
    }

    // Revoke the token
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, row.id));
  }

  // -------------------------------------------------------------------------
  // refreshSession
  // -------------------------------------------------------------------------
  async refreshSession(refreshToken: string): Promise<AccessToken> {
    const tokenHash = hashRefreshToken(refreshToken);

    // Find matching row
    const [row] = await this.db
      .select({
        id: refreshTokens.id,
        userId: refreshTokens.userId,
        expiresAt: refreshTokens.expiresAt,
        revokedAt: refreshTokens.revokedAt,
      })
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);

    // Not found → AUTHENTICATION_FAILED — Requirement 2.5, 2.7
    if (!row) {
      throw new AppError("AUTHENTICATION_FAILED", "Invalid refresh token");
    }

    // Revoked → AUTHENTICATION_FAILED — Requirement 2.4, 2.5
    if (row.revokedAt !== null) {
      throw new AppError("AUTHENTICATION_FAILED", "Refresh token has been revoked");
    }

    // Expired → TOKEN_EXPIRED — Requirement 2.7
    if (row.expiresAt < new Date()) {
      throw new AppError("TOKEN_EXPIRED", "Refresh token has expired");
    }

    // Issue a new access token — Requirement 2.6
    const accessToken = signAccessToken(row.userId);

    return accessToken;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Generates a refresh token, stores its hash in the DB, and returns both
   * the access token and the raw refresh token for the client.
   */
  private async _issueSessionPair(userId: string): Promise<SessionPair> {
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.db.insert(refreshTokens).values({
      userId,
      tokenHash,
      expiresAt,
    });

    const accessToken = signAccessToken(userId);

    return { accessToken, refreshToken: rawRefreshToken };
  }
}

// ---------------------------------------------------------------------------
// Factory — convenience export for DI / testing
// ---------------------------------------------------------------------------

export function createAuthService(db: Db): AuthService {
  return new AuthService(db);
}
