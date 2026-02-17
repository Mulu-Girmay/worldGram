const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const resolveSocketBase = () => {
  const explicit = trimTrailingSlash(import.meta.env.VITE_SOCKET_URL || "");
  if (explicit) return explicit;

  const apiBase = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || "");
  if (apiBase) {
    return apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
  }

  return "http://localhost:3000";
};

export const SOCKET_BASE_URL = resolveSocketBase();
