/**
 * In-memory sliding-window rate limiter for RSVP verification.
 * Protects against brute-force attacks on Registration ID and Leader Email combinations.
 */
export class VerificationRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15-minute lockout window
    this.maxFailures = options.maxFailures || 5; // 5 failed attempts allowed
    this.maxTotalRequests = options.maxTotalRequests || 30; // 30 total requests per IP
    this.records = new Map();

    // Periodic cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  _getKey(ip, regId = "") {
    return `${ip}:${(regId || "").trim().toUpperCase()}`;
  }

  /**
   * Check if an IP/target combination is currently rate limited.
   */
  isRateLimited(ip, regId = "") {
    const now = Date.now();
    const key = this._getKey(ip, regId);
    const ipKey = `ip:${ip}`;

    // Check failed attempts for this target from this IP
    const targetRecord = this.records.get(key);
    if (targetRecord) {
      if (now > targetRecord.resetTime) {
        this.records.delete(key);
      } else if (targetRecord.failedAttempts >= this.maxFailures) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((targetRecord.resetTime - now) / 1000),
        );
        return {
          limited: true,
          retryAfterSeconds,
          reason: "too_many_failures",
        };
      }
    }

    // Check overall IP rate limit
    const ipRecord = this.records.get(ipKey);
    if (ipRecord) {
      if (now > ipRecord.resetTime) {
        this.records.delete(ipKey);
      } else if (ipRecord.totalRequests >= this.maxTotalRequests) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((ipRecord.resetTime - now) / 1000),
        );
        return {
          limited: true,
          retryAfterSeconds,
          reason: "rate_limit_exceeded",
        };
      }
    }

    return { limited: false, retryAfterSeconds: 0 };
  }

  /**
   * Record a general verification attempt from an IP.
   */
  recordRequest(ip) {
    const now = Date.now();
    const ipKey = `ip:${ip}`;
    const ipRecord = this.records.get(ipKey) || {
      totalRequests: 0,
      resetTime: now + this.windowMs,
    };

    if (now > ipRecord.resetTime) {
      ipRecord.totalRequests = 1;
      ipRecord.resetTime = now + this.windowMs;
    } else {
      ipRecord.totalRequests += 1;
    }

    this.records.set(ipKey, ipRecord);
  }

  /**
   * Record a failed credential verification attempt.
   */
  recordFailure(ip, regId = "") {
    const now = Date.now();
    const key = this._getKey(ip, regId);
    const record = this.records.get(key) || {
      failedAttempts: 0,
      resetTime: now + this.windowMs,
    };

    if (now > record.resetTime) {
      record.failedAttempts = 1;
      record.resetTime = now + this.windowMs;
    } else {
      record.failedAttempts += 1;
    }

    this.records.set(key, record);
    return record.failedAttempts;
  }

  /**
   * Reset failed attempts upon successful verification.
   */
  recordSuccess(ip, regId = "") {
    const key = this._getKey(ip, regId);
    this.records.delete(key);
  }

  /**
   * Clear expired records.
   */
  cleanup() {
    const now = Date.now();
    for (const [k, v] of this.records.entries()) {
      if (now > v.resetTime) {
        this.records.delete(k);
      }
    }
  }

  /**
   * Reset all records (useful for test suites).
   */
  reset() {
    this.records.clear();
  }
}

export const rsvpRateLimiter = new VerificationRateLimiter();

/**
 * Fixed-window write limiter for the public Audience Choice endpoints
 * (voter registration and vote casting). Protects the Mongo write path from
 * accidental floods (a stuck client on event day) and casual abuse.
 *
 * Deliberately generous and configurable: everyone at the venue often shares
 * one NAT IP, so limits are per-IP with room for hundreds of real users.
 * Read endpoints (session polling) are intentionally NOT limited — every
 * open phone polls them from the same IP.
 */
export class WriteRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60 * 1000; // 1-minute fixed window
    this.maxRequests = options.maxRequests || 60; // writes allowed per window
    this.records = new Map();

    // Periodic cleanup so idle IPs don't leak memory.
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Count one write from an IP and report whether it is over the limit.
   * The over-limit request still increments (it is counted, not free).
   */
  consume(ip) {
    const now = Date.now();
    const key = String(ip || "unknown");
    let record = this.records.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + this.windowMs };
      this.records.set(key, record);
    }

    record.count += 1;

    if (record.count > this.maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((record.resetTime - now) / 1000),
      );
      return { limited: true, retryAfterSeconds };
    }

    return { limited: false, retryAfterSeconds: 0 };
  }

  /** Clear expired windows. */
  cleanup() {
    const now = Date.now();
    for (const [k, v] of this.records.entries()) {
      if (now > v.resetTime) {
        this.records.delete(k);
      }
    }
  }

  /** Reset all records (useful for test suites). */
  reset() {
    this.records.clear();
  }
}

// On-spot registration: 60 new voters per minute per IP — generous for a
// venue where every phone shares one NAT IP (a busy desk + a burst of
// self-registrations when voting opens), still far below anything a real
// desk produces, and bounded against scripted floods. Env-overridable so
// the limit can be tuned on Render without a redeploy.
export const voterRegisterLimiter = new WriteRateLimiter({
  windowMs: Number(process.env.VOTER_REGISTER_RATE_WINDOW_MS) || 60 * 1000,
  maxRequests: Number(process.env.VOTER_REGISTER_RATE_MAX) || 60,
});

// Vote casting: higher ceiling — everyone votes inside one short window
// behind the venue's NAT (a crowd opening the page at once), but still
// bounded against a write flood.
export const voteCastLimiter = new WriteRateLimiter({
  windowMs: Number(process.env.VOTE_CAST_RATE_WINDOW_MS) || 60 * 1000,
  maxRequests: Number(process.env.VOTE_CAST_RATE_MAX) || 300,
});
