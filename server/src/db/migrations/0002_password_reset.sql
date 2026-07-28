-- Sorte.ar — Password reset migration
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "reset_token"      TEXT,
  ADD COLUMN IF NOT EXISTS "reset_expires_at" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "users_reset_token_idx"
  ON "users" ("reset_token")
  WHERE "reset_token" IS NOT NULL;
