import type { Request, Response, NextFunction } from "express";

/**
 * Factory that returns a middleware verifying the authenticated user owns
 * the resource identified by a route param.
 *
 * Usage:
 *   router.patch("/:id", authenticate, authorizeOwner(getOwnerId), handler)
 *
 * `getOwnerId` receives the request and should return the owner's user ID
 * (or null/undefined if the resource was not found).
 */
export function authorizeOwner(
  getOwnerId: (req: Request) => Promise<string | null | undefined>
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        error: {
          code: "AUTHENTICATION_FAILED",
          message: "Authentication required",
        },
      });
      return;
    }

    const ownerId = await getOwnerId(req);
    if (ownerId === null || ownerId === undefined) {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "Resource not found" },
      });
      return;
    }

    if (ownerId !== userId) {
      res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "You are not authorized to perform this action",
        },
      });
      return;
    }

    next();
  };
}
