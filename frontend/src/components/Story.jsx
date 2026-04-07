import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { resolveMediaUrl } from "../utils/media";
import { selectUser } from "../Redux/userRedux/authSelector";

const toRelativeTime = (value) => {
  if (!value) return "";
  const createdAt = new Date(value).getTime();
  if (Number.isNaN(createdAt)) return "";
  const diffMs = Date.now() - createdAt;
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${Math.floor(diffHour / 24)}d ago`;
};

const Story = ({ story }) => {
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);

  const storyId = story?._id;
  const media = story?.media;
  const mediaType = story?.mediaType || "image";
  const caption = story?.caption || "Story";
  const authorId = story?.authorId?._id || story?.authorId || null;

  const mediaSrc =
    media && typeof media === "string"
      ? resolveMediaUrl(media, mediaType)
      : null;
  const currentUserId = String(currentUser?._id || currentUser?.id || "");
  const seenByCurrentUser = Boolean(
    (story?.viewers || []).some(
      (viewer) =>
        String(viewer?.userId?._id || viewer?.userId || viewer || "") ===
        currentUserId,
    ),
  );
  const createdLabel = toRelativeTime(story?.createdAt);

  const openStory = () => {
    if (!storyId) return;
    navigate("/story", { state: { storyId, authorId } });
  };

  return (
    <button
      type="button"
      onClick={openStory}
      className="w-full flex items-center gap-3 rounded-xl border border-transparent bg-transparent px-2 py-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:border-[var(--border-color)] hover:bg-white"
    >
      <div
        className={`h-12 w-12 overflow-hidden rounded-full border-2 bg-[#eaf4e2] ${
          seenByCurrentUser ? "border-[#9ab78b]/55" : "border-[#6fa63a]/60"
        }`}
      >
        {mediaSrc ? (
          mediaType === "video" ? (
            <video src={mediaSrc} className="h-full w-full object-cover" />
          ) : (
            <img
              src={mediaSrc}
              alt={caption || "Story media"}
              className="h-full w-full object-cover"
            />
          )
        ) : (
          <div className="grid h-full w-full place-items-center text-xs font-semibold text-[#2f5b2f]">
            ST
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {caption || "Untitled story"}
        </p>
        <p className="truncate text-[10px] text-[var(--text-muted)]">
          {story?.privacy || "public"}
          {createdLabel ? ` • ${createdLabel}` : ""}
        </p>
      </div>
    </button>
  );
};

export default Story;
