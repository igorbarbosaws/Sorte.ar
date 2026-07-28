import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
  unique,
  check,
  primaryKey,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Shorthand: timestamp in UTC with timezone (TIMESTAMPTZ)
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 50 }).notNull(),
  username: varchar("username", { length: 30 }),
  avatarUrl: text("avatar_url"),
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  verificationExpiresAt: timestamptz("verification_expires_at"),
  resetToken: text("reset_token"),
  resetExpiresAt: timestamptz("reset_expires_at"),
  createdAt: timestamptz("created_at").notNull().default(sql`now()`),
  updatedAt: timestamptz("updated_at").notNull().default(sql`now()`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ---------------------------------------------------------------------------
// refresh_tokens
// ---------------------------------------------------------------------------
export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamptz("expires_at").notNull(),
  createdAt: timestamptz("created_at").notNull().default(sql`now()`),
  revokedAt: timestamptz("revoked_at"),
});

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;

// ---------------------------------------------------------------------------
// championships
// ---------------------------------------------------------------------------
export const championships = pgTable(
  "championships",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    creatorId: uuid("creator_id").references(() => users.id, {
      onDelete: "set null",
    }),
    localId: varchar("local_id", { length: 128 }),
    title: varchar("title", { length: 255 }).notNull(),
    format: varchar("format", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("ongoing"),
    champion: varchar("champion", { length: 255 }),
    data: jsonb("data").notNull(),
    createdAt: timestamptz("created_at").notNull().default(sql`now()`),
    updatedAt: timestamptz("updated_at").notNull().default(sql`now()`),
    finishedAt: timestamptz("finished_at"),
  },
  (t) => [
    index("championships_creator_created_idx").on(t.creatorId, t.createdAt),
    index("championships_creator_local_idx").on(t.creatorId, t.localId),
    // Partial unique: (creator_id, local_id) WHERE local_id IS NOT NULL
    // Drizzle doesn't support partial unique natively in the table builder,
    // so we express it as a named check + raw unique via migration SQL.
    // The migration file below enforces this constraint directly.
  ]
);

export type Championship = typeof championships.$inferSelect;
export type NewChampionship = typeof championships.$inferInsert;

// ---------------------------------------------------------------------------
// friend_requests
// ---------------------------------------------------------------------------
export const friendRequests = pgTable(
  "friend_requests",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    fromUser: uuid("from_user")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toUser: uuid("to_user")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull().default("PENDING"),
    createdAt: timestamptz("created_at").notNull().default(sql`now()`),
    updatedAt: timestamptz("updated_at").notNull().default(sql`now()`),
  },
  (t) => [
    unique("friend_requests_from_to_unique").on(t.fromUser, t.toUser),
    check("friend_requests_no_self", sql`${t.fromUser} <> ${t.toUser}`),
  ]
);

export type FriendRequest = typeof friendRequests.$inferSelect;
export type NewFriendRequest = typeof friendRequests.$inferInsert;

// ---------------------------------------------------------------------------
// friendships
// ---------------------------------------------------------------------------
export const friendships = pgTable(
  "friendships",
  {
    userA: uuid("user_a")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userB: uuid("user_b")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamptz("created_at").notNull().default(sql`now()`),
  },
  (t) => [
    primaryKey({ columns: [t.userA, t.userB] }),
    check("friendships_ordered", sql`${t.userA} < ${t.userB}`),
    index("friendships_user_a_idx").on(t.userA),
    index("friendships_user_b_idx").on(t.userB),
  ]
);

export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;

// ---------------------------------------------------------------------------
// player_links
// ---------------------------------------------------------------------------
export const playerLinks = pgTable(
  "player_links",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    championshipId: uuid("championship_id")
      .notNull()
      .references(() => championships.id, { onDelete: "cascade" }),
    playerName: varchar("player_name", { length: 255 }).notNull(),
    linkedUserId: uuid("linked_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamptz("created_at").notNull().default(sql`now()`),
  },
  (t) => [
    unique("player_links_championship_player_unique").on(
      t.championshipId,
      t.playerName
    ),
    unique("player_links_championship_user_unique").on(
      t.championshipId,
      t.linkedUserId
    ),
  ]
);

export type PlayerLink = typeof playerLinks.$inferSelect;
export type NewPlayerLink = typeof playerLinks.$inferInsert;
