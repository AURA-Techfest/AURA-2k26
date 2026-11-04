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
