const DEFAULT_API_BASE = "http://localhost:3000/api";

export const getApiOrigin = () => {
  const configuredBase = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
  return configuredBase.replace(/\/api\/?$/, "");
};

export const resolveAssetUrl = (value, folder = "images") => {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;

  if (/^https?:\/\//i.test(normalized)) return normalized;

  const origin = getApiOrigin();
  if (normalized.startsWith("/")) return `${origin}${normalized}`;

  return `${origin}/uploads/${folder}/${normalized}`;
};

export const resolveProfileUrl = (value) => resolveAssetUrl(value, "images");

export const resolveMediaUrl = (value, mediaType = "image") =>
  resolveAssetUrl(value, mediaType === "video" ? "videos" : "images");

export const toInitials = (label) =>
  (label || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
