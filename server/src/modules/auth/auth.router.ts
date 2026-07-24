import { Router, type Request, type Response } from "express";
import { AuthService, AppError } from "./auth.service.js";
import type { RegisterInput, LoginInput } from "../../lib/validation.js";
import {
  loginEmailRateLimit,
  loginIpRateLimit,
} from "../../middleware/rate-limit.js";
import { db } from "../../db/index.js";

// ---------------------------------------------------------------------------
// Singleton AuthService backed by the shared DB pool
// ---------------------------------------------------------------------------

const authService = new AuthService(db);

// ---------------------------------------------------------------------------
// Error code → HTTP status mapping
// ---------------------------------------------------------------------------

const ERROR_STATUS: Record<string, number> = {
  VALIDATION_ERROR: 400,
  EMAIL_ALREADY_EXISTS: 409,
  AUTHENTICATION_FAILED: 401,
  TOKEN_EXPIRED: 401,
};

function handleError(err: unknown, res: Response): void {
  if (err instanceof AppError) {
    const status = ERROR_STATUS[err.code] ?? 500;
    res.status(status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  console.error("[auth.router] Unexpected error:", err);
  res.status(500).json({
    error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" },
  });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const authRouter = Router();

/**
 * POST /api/auth/register
 * Creates a new user account and returns an initial session pair.
 * Requirement 1.1
 */
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken } = await authService.register(req.body as RegisterInput);
    res.status(201).json({ accessToken, refreshToken });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * POST /api/auth/login
 * Rate-limited by email and IP; returns a session pair on success.
 * Requirements 2.1, 2.3, 9.5
 */
authRouter.post(
  "/login",
  loginEmailRateLimit,
  loginIpRateLimit,
  async (req: Request, res: Response) => {
    try {
      const { accessToken, refreshToken } = await authService.login(
        req.body as LoginInput,
        req.ip ?? "",
      );
      res.status(200).json({ accessToken, refreshToken });
    } catch (err) {
      handleError(err, res);
    }
  },
);

/**
 * POST /api/auth/logout
 * Revokes the supplied refresh token.
 * Requirement 2.4
 */
authRouter.post("/logout", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    await authService.logout(refreshToken ?? "");
    res.status(204).send();
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * POST /api/auth/refresh
 * Exchanges a valid refresh token for a new access token.
 * Requirements 2.6, 2.7
 */
authRouter.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    const accessToken = await authService.refreshSession(refreshToken ?? "");
    res.status(200).json({ accessToken });
  } catch (err) {
    handleError(err, res);
  }
});
