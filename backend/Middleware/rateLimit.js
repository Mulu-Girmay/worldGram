const buckets = new Map();
let lastGlobalPruneAt = 0;

const nowMs = () => Date.now();

const prune = (entries, threshold) => {
  let i = 0;
  while (i < entries.length && entries[i] <= threshold) i += 1;
  return i > 0 ? entries.slice(i) : entries;
};

const defaultKeyBuilder = (req) => `${req.ip}:${req.baseUrl}:${req.path}`;

const createRateLimiter = ({
  windowMs = 60 * 1000,
  max = 60,
  keyBuilder = defaultKeyBuilder,
} = {}) => {
  if (windowMs <= 0 || max <= 0) {
    throw new Error("windowMs and max must be greater than zero");
  }

  return (req, res, next) => {
    const key = keyBuilder(req);
    const current = nowMs();
    const windowStart = current - windowMs;
    const globalPruneInterval = Math.max(windowMs, 30 * 1000);

    if (current - lastGlobalPruneAt >= globalPruneInterval) {
      for (const [bucketKey, timestamps] of buckets.entries()) {
        const trimmed = prune(timestamps, current - windowMs);
        if (trimmed.length === 0) buckets.delete(bucketKey);
        else buckets.set(bucketKey, trimmed);
      }
      lastGlobalPruneAt = current;
    }

    const existing = buckets.get(key) || [];
    const recent = prune(existing, windowStart);

    if (recent.length >= max) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((recent[0] + windowMs - current) / 1000),
      );
      res.set("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        err: "Too many requests. Please try again later.",
      });
    }

    recent.push(current);
    if (recent.length > max + 1) {
      recent.splice(0, recent.length - (max + 1));
    }
    buckets.set(key, recent);
    return next();
  };
};

module.exports = {
  createRateLimiter,
};
