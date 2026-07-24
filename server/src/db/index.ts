import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const { Pool } = pg;

if (!process.env["DATABASE_URL"]) {
  throw new Error("DATABASE_URL environment variable is required");
}

// In production (Railway, etc.) PostgreSQL requires SSL.
// The pg driver handles the sslmode param in the connection string,
// but we also set ssl explicitly so it works regardless of the URL format.
const isProduction = process.env["NODE_ENV"] === "production";

const pool = new Pool({
  connectionString: process.env["DATABASE_URL"],
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
export type Db = typeof db;
