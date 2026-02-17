import React from "react";
import { useNavigate } from "react-router-dom";
import { resolveMediaUrl } from "../utils/media";

const Story = ({ story }) => {
  const navigate = useNavigate();

  const storyId = story?._id;
  const media = story?.media;
  const mediaType = story?.mediaType || "image";
  const caption = story?.caption || "Story";
  const authorId = story?.authorId?._id || story?.authorId || null;

  const mediaSrc =
    media && typeof media === "string" ? resolveMediaUrl(media, mediaType) : null;

  const openStory = () => {
    if (!storyId) return;
    navigate("/story", { state: { storyId, authorId } });
  };

  return (
    <button
      type="button"
      onClick={openStory}
      className="w-full flex items-center gap-3 rounded-xl border border-transparent bg-transparent px-2 py-2 text-left transition hover:border-[var(--border-color)] hover:bg-white"
    >
      <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-[#6fa63a]/60 bg-[#eaf4e2]">
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
        </p>
      </div>
    </button>
  );
};

export default Story;
