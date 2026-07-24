-- Sorte.ar — Email verification migration
-- Adds email_verified flag and verification token fields to users table.
-- Apply with: drizzle-kit migrate (requires DATABASE_URL to be set)

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "email_verified"          BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "verification_token"      TEXT,
  ADD COLUMN IF NOT EXISTS "verification_expires_at" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "users_verification_token_idx"
  ON "users" ("verification_token")
  WHERE "verification_token" IS NOT NULL;
