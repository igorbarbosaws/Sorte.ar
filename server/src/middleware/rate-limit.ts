import rateLimit, { type Store, type Options, type ClientRateLimitInfo } from "express-rate-limit";
import type { Redis } from "ioredis";

// ---------------------------------------------------------------------------
// Lazy Redis client — only created when REDIS_URL is present so tests can run
// without a Redis instance and fall back to the default MemoryStore.
// ---------------------------------------------------------------------------

let _redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) return null;

  if (_redis) return _redis;

  // Dynamic import kept synchronous by resolving at startup time.
  // We use require-style dynamic instantiation to avoid top-level await.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: IORedis } = require("ioredis") as { default: typeof import("ioredis").default };
    _redis = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 0, // fail fast; don't block requests
      enableReadyCheck: false,
      lazyConnect: true,
    });
    _redis.on("error", (err: Error) => {
      console.error("[rate-limit] Redis error:", err.message);
    });
  } catch {
    console.warn("[rate-limit] ioredis not available; falling back to MemoryStore.");
  }

  return _redis;
}

// ---------------------------------------------------------------------------
// Custom Redis-backed Store implementing the express-rate-limit Store interface
// ---------------------------------------------------------------------------

class RedisStore implements Store {
  /** localKeys = false because Redis is shared across processes */
  readonly localKeys = false;

  private readonly windowMs: number;
  private readonly keyPrefix: string;
  private readonly redis: Redis;

  constructor(redis: Redis, keyPrefix: string, windowMs: number) {
    this.redis = redis;
    this.keyPrefix = keyPrefix;
    this.windowMs = windowMs;
  }

  private key(rawKey: string): string {
    return `${this.keyPrefix}${rawKey}`;
  }

  /** Called by express-rate-limit when it is configured with Options. */
  init(options: Options): void {
    // windowMs is already captured at construction time; nothing extra needed.
    void options;
  }

  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    const raw = await this.redis.get(this.key(key));
    if (raw === null) return undefined;
    const totalHits = parseInt(raw, 10);
    const ttl = await this.redis.pttl(this.key(key)); // ms remaining
    const resetTime = ttl > 0 ? new Date(Date.now() + ttl) : undefined;
    return { totalHits, resetTime };
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const redisKey = this.key(key);
    const totalHits = await this.redis.incr(redisKey);

    if (totalHits === 1) {
      // First hit — set the expiry for the entire window.
      await this.redis.pexpire(redisKey, this.windowMs);
    }

    const ttl = await this.redis.pttl(redisKey);
    const resetTime = ttl > 0 ? new Date(Date.now() + ttl) : new Date(Date.now() + this.windowMs);

    return { totalHits, resetTime };
  }

  async decrement(key: string): Promise<void> {
    const redisKey = this.key(key);
    const current = await this.redis.decr(redisKey);
    // Prevent the counter from going below 0
    if (current < 0) {
      await this.redis.set(redisKey, "0", "KEEPTTL");
    }
  }

  async resetKey(key: string): Promise<void> {
    await this.redis.del(this.key(key));
  }

  async resetAll(): Promise<void> {
    // Scan and delete all keys with this prefix
    let cursor = "0";
    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        "MATCH",
        `${this.keyPrefix}*`,
        "COUNT",
        100,
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } while (cursor !== "0");
  }
}

// ---------------------------------------------------------------------------
// Factory: returns a RedisStore when Redis is available, otherwise undefined
// (express-rate-limit will fall back to the built-in MemoryStore).
// ---------------------------------------------------------------------------

function makeStore(prefix: string, windowMs: number): Store | undefined {
  const redis = getRedisClient();
  if (!redis) return undefined;
  return new RedisStore(redis, prefix, windowMs);
}

// ---------------------------------------------------------------------------
// Window / block durations
// ---------------------------------------------------------------------------

/** Sliding-window in which failed attempts are counted (60 s). */
const WINDOW_MS = 60 * 1_000;

/** How long the account/IP is blocked after hitting the limit (15 min). */
const BLOCK_MS = 15 * 60 * 1_000;

// ---------------------------------------------------------------------------
// Per-email rate limiter
//
// Key: rl:email:{email} (lowercase)
// Threshold: 10 failed attempts in WINDOW_MS → block for BLOCK_MS
// Only failed (non-2xx) responses count (skipSuccessfulRequests: true).
// ---------------------------------------------------------------------------

export const loginEmailRateLimit = rateLimit({
  windowMs: BLOCK_MS,    // the window IS the block duration once triggered
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Extract the email from the request body; fall back to IP if absent.
  keyGenerator(req) {
    const email = (req.body as { email?: unknown })?.email;
    if (typeof email === "string" && email.trim().length > 0) {
      return `email:${email.trim().toLowerCase()}`;
    }
    return req.ip ?? "unknown";
  },
  store: makeStore("rl:email:", BLOCK_MS),
  handler(_req, res) {
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EMAIL",
        message:
          "Too many failed login attempts for this email address. Please try again in 15 minutes.",
      },
    });
  },
});

// ---------------------------------------------------------------------------
// Per-IP rate limiter
//
// Key: rl:ip:{ip}
// Threshold: 10 failed attempts in WINDOW_MS → block for BLOCK_MS
// Only failed (non-2xx) responses count (skipSuccessfulRequests: true).
// ---------------------------------------------------------------------------

export const loginIpRateLimit = rateLimit({
  windowMs: BLOCK_MS,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator(req) {
    return `ip:${req.ip ?? "unknown"}`;
  },
  store: makeStore("rl:ip:", BLOCK_MS),
  handler(_req, res) {
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_IP",
        message:
          "Too many failed login attempts from this IP address. Please try again in 15 minutes.",
      },
    });
  },
});

// ---------------------------------------------------------------------------
// General API rate limiter — broad protection for all routes
// ---------------------------------------------------------------------------

export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1_000,
  limit: 500,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMIT_IP",
      message: "Too many requests. Please try again later.",
    },
  },
});
