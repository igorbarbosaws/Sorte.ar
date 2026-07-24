-- Sorte.ar — Initial schema migration
-- Generated for: user-profiles-and-social feature
-- Apply with: drizzle-kit migrate (requires DATABASE_URL to be set)

-- ---------------------------------------------------------------------------
-- Enable pgcrypto for gen_random_uuid()
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "users" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"         VARCHAR(255) NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "display_name"  VARCHAR(50) NOT NULL,
  "avatar_url"    TEXT,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- refresh_tokens
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"     UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash"  TEXT NOT NULL,
  "expires_at"  TIMESTAMPTZ NOT NULL,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "revoked_at"  TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- championships
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "championships" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "creator_id"  UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "local_id"    VARCHAR(128),
  "title"       VARCHAR(255) NOT NULL,
  "format"      VARCHAR(50) NOT NULL,
  "status"      VARCHAR(20) NOT NULL DEFAULT 'ongoing',
  "champion"    VARCHAR(255),
  "data"        JSONB NOT NULL,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "finished_at" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "championships_creator_created_idx"
  ON "championships" ("creator_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "championships_creator_local_idx"
  ON "championships" ("creator_id", "local_id");

-- Partial unique: only enforce uniqueness when local_id is not NULL
CREATE UNIQUE INDEX IF NOT EXISTS "championships_creator_local_id_unique"
  ON "championships" ("creator_id", "local_id")
  WHERE "local_id" IS NOT NULL;

-- ---------------------------------------------------------------------------
-- friend_requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "friend_requests" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "from_user"   UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "to_user"     UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status"      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "friend_requests_from_to_unique" UNIQUE ("from_user", "to_user"),
  CONSTRAINT "friend_requests_no_self"        CHECK  ("from_user" <> "to_user")
);

-- ---------------------------------------------------------------------------
-- friendships
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "friendships" (
  "user_a"     UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "user_b"     UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "friendships_pk"      PRIMARY KEY ("user_a", "user_b"),
  CONSTRAINT "friendships_ordered" CHECK       ("user_a" < "user_b")
);

CREATE INDEX IF NOT EXISTS "friendships_user_a_idx" ON "friendships" ("user_a");
CREATE INDEX IF NOT EXISTS "friendships_user_b_idx" ON "friendships" ("user_b");

-- ---------------------------------------------------------------------------
-- player_links
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "player_links" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "championship_id"   UUID NOT NULL REFERENCES "championships"("id") ON DELETE CASCADE,
  "player_name"       VARCHAR(255) NOT NULL,
  "linked_user_id"    UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "player_links_championship_player_unique"
    UNIQUE ("championship_id", "player_name"),
  CONSTRAINT "player_links_championship_user_unique"
    UNIQUE ("championship_id", "linked_user_id")
);
