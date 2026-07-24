import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type AccessTokenPayload } from "../lib/jwt.js";

// Extend Express Request to carry the authenticated user payload
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

/**
 * Middleware that validates the Bearer token in the Authorization header.
 * On success, attaches the decoded payload to `req.user`.
 * On failure, returns 401 with AUTHENTICATION_FAILED or TOKEN_EXPIRED.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: {
        code: "AUTHENTICATION_FAILED",
        message: "Missing or malformed Authorization header",
      },
    });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err: unknown) {
    const isExpired =
      err instanceof Error && err.name === "TokenExpiredError";
    res.status(401).json({
      error: {
        code: isExpired ? "TOKEN_EXPIRED" : "AUTHENTICATION_FAILED",
        message: isExpired
          ? "Access token has expired"
          : "Invalid access token",
      },
    });
  }
}
