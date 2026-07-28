import { Router, type Request, type Response } from "express";
import { AuthService, AppError } from "./auth.service.js";
import type { RegisterInput, LoginInput } from "../../lib/validation.js";
import {
  loginEmailRateLimit,
  loginIpRateLimit,
} from "../../middleware/rate-limit.js";
import { db } from "../../db/index.js";

const authService = new AuthService(db);

const ERROR_STATUS: Record<string, number> = {
  VALIDATION_ERROR: 400,
  EMAIL_ALREADY_EXISTS: 409,
  AUTHENTICATION_FAILED: 401,
  EMAIL_NOT_VERIFIED: 403,
  INVALID_TOKEN: 400,
  TOKEN_EXPIRED: 400,
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

export const authRouter = Router();

/** POST /api/auth/register */
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken } = await authService.register(req.body as RegisterInput);
    res.status(201).json({ accessToken, refreshToken });
  } catch (err) {
    handleError(err, res);
  }
});

/** POST /api/auth/login */
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

/** POST /api/auth/logout */
authRouter.post("/logout", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    await authService.logout(refreshToken ?? "");
    res.status(204).send();
  } catch (err) {
    handleError(err, res);
  }
});

/** POST /api/auth/refresh */
authRouter.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    const accessToken = await authService.refreshSession(refreshToken ?? "");
    res.status(200).json({ accessToken });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * GET /api/auth/verify-email?token=xxx
 * Called when user clicks the link in the verification email.
 * Redirects to the frontend with a success or error flag.
 */
authRouter.get("/verify-email", async (req: Request, res: Response) => {
  const token = req.query["token"] as string | undefined;
  const appUrl = process.env["APP_URL"] ?? "https://sorte-ar.vercel.app";

  try {
    await authService.verifyEmail(token ?? "");
    res.redirect(`${appUrl}/login?verified=1`);
  } catch (err) {
    if (err instanceof AppError && err.code === "TOKEN_EXPIRED") {
      res.redirect(`${appUrl}/login?verified=expired`);
    } else {
      res.redirect(`${appUrl}/login?verified=error`);
    }
  }
});

/**
 * POST /api/auth/resend-verification
 */
authRouter.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Email is required" } });
      return;
    }
    await authService.resendVerification(email);
    res.status(200).json({ message: "If the email exists and is unverified, a new link has been sent." });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * POST /api/auth/forgot-password
 * Sends a password reset link to the given email.
 */
authRouter.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Email is required" } });
      return;
    }
    await authService.forgotPassword(email);
    res.status(200).json({ message: "If the email is registered, a reset link has been sent." });
  } catch (err) {
    handleError(err, res);
  }
});

/**
 * POST /api/auth/reset-password
 * Validates token and sets a new password.
 */
authRouter.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    await authService.resetPassword(token ?? "", password ?? "");
    res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    handleError(err, res);
  }
});
