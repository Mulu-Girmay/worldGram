export const DEFAULT_CACHE_TTL_MS = 2 * 60 * 1000;

export const isCacheFresh = (fetchedAt, ttlMs = DEFAULT_CACHE_TTL_MS) =>
  Date.now() - Number(fetchedAt || 0) < ttlMs;

export const shouldFetchWithCache = ({
  status,
  fetchedAt,
  ttlMs = DEFAULT_CACHE_TTL_MS,
  force = false,
}) => {
  if (force) return true;
  if (status === "loading") return false;
  if (status === "succeeded" && isCacheFresh(fetchedAt, ttlMs)) {
    return false;
  }
  return true;
};