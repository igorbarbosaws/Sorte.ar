import { z } from "zod";

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z
    .string()
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(1, "Display name cannot be empty")
        .max(50, "Display name cannot exceed 50 characters"),
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Profile schemas
// ---------------------------------------------------------------------------

/**
 * DisplayName schema for profile updates.
 * Validates trimmed length to catch whitespace-only inputs as empty.
 * Requirements 3.2, 3.3
 */
export const displayNameSchema = z
  .string()
  .transform((val) => val.trim())
  .pipe(
    z
      .string()
      .min(1, "Display name cannot be empty")
      .max(50, "Display name cannot exceed 50 characters"),
  );

export type DisplayNameInput = z.infer<typeof displayNameSchema>;

export const updateProfileSchema = z.object({
  displayName: displayNameSchema,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ---------------------------------------------------------------------------
// Avatar constraints
// Requirements 3.6, 3.7, 3.8
// ---------------------------------------------------------------------------

/** Allowed MIME types for avatar uploads */
export const AVATAR_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AvatarMimeType = (typeof AVATAR_ALLOWED_MIME_TYPES)[number];

/** Maximum avatar file size: 2 MB in bytes */
export const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Checks whether a MIME type is an allowed avatar format.
 */
export function isAllowedAvatarMimeType(
  mimeType: string,
): mimeType is AvatarMimeType {
  return (AVATAR_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Checks whether a file size (in bytes) is within the allowed limit.
 */
export function isAvatarSizeValid(sizeBytes: number): boolean {
  return sizeBytes <= AVATAR_MAX_SIZE_BYTES;
}

// ---------------------------------------------------------------------------
// Championship schemas
// ---------------------------------------------------------------------------

export const championshipInputSchema = z.object({
  title: z
    .string()
    .min(1, "Championship title cannot be empty")
    .max(255, "Championship title cannot exceed 255 characters"),
  format: z.enum(["groups-knockout", "groups", "knockout", "league"], {
    errorMap: () => ({
      message:
        "Format must be one of: groups-knockout, groups, knockout, league",
    }),
  }),
  /** Optional local storage ID used for deduplication during migration */
  localId: z
    .string()
    .max(128, "Local ID cannot exceed 128 characters")
    .optional(),
  /** Full championship state (JSONB) */
  data: z.record(z.unknown()),
});

export type ChampionshipInput = z.infer<typeof championshipInputSchema>;

export const updateChampionshipSchema = z.object({
  data: z.record(z.unknown()).optional(),
  status: z.enum(["ongoing", "finished"]).optional(),
  champion: z.string().max(255).optional(),
});

export type UpdateChampionshipInput = z.infer<typeof updateChampionshipSchema>;

// ---------------------------------------------------------------------------
// Player link schemas
// Requirements 6.2, 6.3
// ---------------------------------------------------------------------------

export const playerLinkSchema = z.object({
  playerName: z
    .string()
    .min(1, "Player name cannot be empty")
    .max(255, "Player name cannot exceed 255 characters"),
  linkedUserEmail: z.string().email("Invalid email format"),
});

export type PlayerLink = z.infer<typeof playerLinkSchema>;

// Keep the existing alias for backwards compatibility
export const createPlayerLinkSchema = playerLinkSchema;
export type CreatePlayerLinkInput = PlayerLink;

// ---------------------------------------------------------------------------
// Migration schemas
// Requirements 8.2, 8.5
// ---------------------------------------------------------------------------

/**
 * A single championship entry from localStorage to be migrated.
 */
export const localChampionshipSchema = z.object({
  localId: z.string().min(1, "Local ID is required"),
  title: z
    .string()
    .min(1, "Championship title cannot be empty")
    .max(255, "Championship title cannot exceed 255 characters"),
  format: z.enum(["groups-knockout", "groups", "knockout", "league"], {
    errorMap: () => ({
      message:
        "Format must be one of: groups-knockout, groups, knockout, league",
    }),
  }),
  data: z.record(z.unknown()),
});

export type LocalChampionship = z.infer<typeof localChampionshipSchema>;

/**
 * MigrateInput: batch of local championships to migrate to the DB.
 * Accepts an array of 1 or more local championship entries.
 */
export const migrateInputSchema = z.object({
  championships: z
    .array(localChampionshipSchema)
    .min(1, "At least one championship is required for migration"),
});

export type MigrateInput = z.infer<typeof migrateInputSchema>;

// ---------------------------------------------------------------------------
// Friend schemas
// ---------------------------------------------------------------------------

export const sendFriendRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validates input against a Zod schema and returns a typed result.
 * On failure, returns the first error message with a field name.
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; field?: string; message: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.errors[0];
  return {
    success: false,
    field: firstError?.path.join("."),
    message: firstError?.message ?? "Validation error",
  };
}
