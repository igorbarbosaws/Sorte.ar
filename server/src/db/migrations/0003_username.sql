-- Sorte.ar — Username (unique nickname) migration
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "username" VARCHAR(30);

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_unique_idx"
  ON "users" ("username")
  WHERE "username" IS NOT NULL;
