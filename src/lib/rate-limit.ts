export interface RateLimitResult {
    limited: boolean;
    retryAfter: number;
}

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const entry = rateLimits.get(key);

    if (!entry) {
        rateLimits.set(key, { count: 1, resetAt: now + windowMs });
        return { limited: false, retryAfter: 0 };
    }

    if (now > entry.resetAt) {
        entry.count = 1;
        entry.resetAt = now + windowMs;
        return { limited: false, retryAfter: 0 };
    }

    if (entry.count >= limit) {
        return { limited: true, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }

    entry.count++;
    return { limited: false, retryAfter: 0 };
}

// Cleanup interval to avoid memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimits.entries()) {
        if (now > entry.resetAt) {
            rateLimits.delete(key);
        }
    }
}, 60000).unref(); // unref prevents this interval from keeping the process alive
