import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MoreVertical, Trash2, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteStory,
  getStoryById,
  reactStory,
  viewStory,
} from "../Redux/storyRedux/storyThunk";
import {
  selectCurrentStory,
  selectCurrentStoryStatus,
  selectDeleteStoryStatus,
  selectStoryError,
} from "../Redux/storyRedux/storySelector";
import { selectUser } from "../Redux/userRedux/authSelector";
import { resolveMediaUrl } from "../utils/media";
import Reaction from "./Reaction";

const QUICK_REACTIONS = [
  "\u{1F44D}",
  "\u{2764}\u{FE0F}",
  "\u{1F525}",
  "\u{1F602}",
  "\u{1F60D}",
  "\u{1F62E}",
];

const Storycontent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const storyId = location.state?.storyId || null;
  const currentStory = useSelector(selectCurrentStory);
  const currentStoryStatus = useSelector(selectCurrentStoryStatus);
  const deleteStatus = useSelector(selectDeleteStoryStatus);
  const error = useSelector(selectStoryError);
  const currentUser = useSelector(selectUser);

  const [showSettings, setShowSettings] = useState(false);
  const [localReaction, setLocalReaction] = useState(null);

  const currentUserId = String(currentUser?._id || currentUser?.id || "");
  const storyAuthorId = String(
    currentStory?.authorId?._id || currentStory?.authorId || "",
  );
  const isOwner =
    Boolean(currentUserId) &&
    Boolean(storyAuthorId) &&
    currentUserId === storyAuthorId;

  useEffect(() => {
    if (!storyId) return;
    let mounted = true;

    const syncStory = async () => {
      await dispatch(getStoryById(storyId));
      await dispatch(viewStory(storyId));
      if (mounted) {
        dispatch(getStoryById(storyId));
      }
    };

    syncStory();

    return () => {
      mounted = false;
    };
  }, [dispatch, storyId]);

  const mediaSrc = useMemo(() => {
    const media = currentStory?.media;
    if (!media || typeof media !== "string") return null;
    return resolveMediaUrl(media, currentStory?.mediaType || "image");
  }, [currentStory?.media, currentStory?.mediaType]);

  const reactionMap = useMemo(() => {
    const map = {};
    (currentStory?.reactions || []).forEach((reaction) => {
      if (reaction?.emoji) map[reaction.emoji] = reaction?.count || 0;
    });
    return map;
  }, [currentStory?.reactions]);

  const viewersCount = Array.isArray(currentStory?.viewers)
    ? currentStory.viewers.length
    : 0;

  const currentReaction = useMemo(() => {
    if (!Array.isArray(currentStory?.reactions) || !currentUserId) return null;
    const found = currentStory.reactions.find((reaction) =>
      (reaction?.reactors || []).some(
        (id) => String(id?._id || id) === currentUserId,
      ),
    );
    return found?.emoji || null;
  }, [currentStory?.reactions, currentUserId]);

  const hasViewed = useMemo(() => {
    if (!Array.isArray(currentStory?.viewers) || !currentUserId) return false;
    return currentStory.viewers.some(
      (viewer) =>
        String(viewer?.userId?._id || viewer?.userId || viewer) === currentUserId,
    );
  }, [currentStory?.viewers, currentUserId]);

  const visibleReactionEntries = useMemo(
    () =>
      Object.entries(reactionMap)
        .filter(([, count]) => Number(count) > 0)
        .sort((a, b) => Number(b[1]) - Number(a[1])),
    [reactionMap],
  );

  const handleBack = (e) => {
    e.preventDefault();
    navigate("/home");
  };

  const handleReact = async (emoji) => {
    if (!storyId || !emoji) return;
    setLocalReaction(emoji);
    await dispatch(reactStory({ storyId, emoji }));
    dispatch(getStoryById(storyId));
  };

  const handleDelete = async () => {
    if (!storyId) return;
    const ok = confirm("Delete this story?");
    if (!ok) return;
    const result = await dispatch(deleteStory(storyId));
    if (deleteStory.fulfilled.match(result)) {
      navigate("/myprofile");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--primary-color)] p-3 md:p-4">
      <div className="mx-auto max-w-3xl space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] px-3 py-2 shadow-[0_10px_30px_rgba(74,127,74,0.12)]">
          <button
            type="button"
            onClick={handleBack}
            className="grid h-8 w-8 place-items-center rounded-lg bg-[#6fa63a]/10 text-[#4a7f4a]"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-[rgba(23,3,3,0.88)]">Story</p>
            <p className="text-[10px] text-[rgba(23,3,3,0.62)]">
              {currentStory?.privacy || "public"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="grid h-8 w-8 place-items-center rounded-lg bg-[#6fa63a]/10 text-[#4a7f4a]"
          >
            <MoreVertical size={16} />
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#6fa63a]/25 bg-black/85">
          {currentStoryStatus === "loading" && (
            <div className="grid h-[65vh] place-items-center text-sm text-white/80">
              Loading story...
            </div>
          )}

          {currentStoryStatus !== "loading" && !currentStory && (
            <div className="grid h-[65vh] place-items-center px-4 text-center text-sm text-white/80">
              {error || "Story not found."}
            </div>
          )}

          {currentStory && mediaSrc && (
            <>
              {currentStory?.mediaType === "video" ? (
                <video
                  src={mediaSrc}
                  controls
                  autoPlay
                  className="h-[65vh] w-full object-contain"
                />
              ) : (
                <img
                  src={mediaSrc}
                  alt={currentStory?.caption || "Story media"}
                  className="h-[65vh] w-full object-contain"
                />
              )}
            </>
          )}
        </div>

        <div className="rounded-2xl border border-[#6fa63a]/25 bg-white/80 p-3">
          <p className="text-sm text-[rgba(23,3,3,0.9)]">
            {currentStory?.caption || "No caption"}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-[rgba(23,3,3,0.62)]">{viewersCount} views</p>
            {hasViewed && <p className="text-[11px] text-[#2f5b2f]">Seen by you</p>}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReact(emoji)}
                className={`rounded-full border px-2.5 py-1 text-sm ${
                  (localReaction || currentReaction) === emoji
                    ? "border-[#4a7f4a] bg-[#eef8e8]"
                    : "border-[#6fa63a]/35 bg-[#f8fdf3]"
                }`}
              >
                {emoji} {reactionMap[emoji] || 0}
              </button>
            ))}
            <Reaction
              initial={localReaction || currentReaction || null}
              onSelect={handleReact}
              triggerClassName="rounded-full border border-[#6fa63a]/35 bg-[#f8fdf3] px-2.5 py-1 text-sm"
              popupClassName="border-[#6fa63a]/35"
            />
          </div>

          {visibleReactionEntries.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {visibleReactionEntries.map(([emoji, count]) => (
                <span
                  key={emoji}
                  className="rounded-full border border-[#6fa63a]/35 bg-[#f8fdf3] px-2 py-0.5 text-xs text-[rgba(23,3,3,0.8)]"
                >
                  {emoji} {count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[120]">
          <div
            className="absolute inset-0 bg-black/35"
            onClick={() => setShowSettings(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-[340px] border-l border-[#6fa63a]/25 bg-[var(--primary-color)] p-3 shadow-[-10px_0_30px_rgba(0,0,0,0.15)]">
            <div className="mb-3 flex items-center justify-between rounded-xl border border-[#6fa63a]/20 bg-white/70 px-3 py-2">
              <p className="text-sm font-semibold text-[#2f5b2f]">Story settings</p>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-lg border border-[#6fa63a]/30 bg-white p-1 text-[#2f5b2f]"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2 rounded-xl border border-[#6fa63a]/20 bg-white/75 p-3">
              <div className="rounded-lg border border-[#6fa63a]/25 bg-[#f9fcf6] px-3 py-2 text-xs text-[rgba(23,3,3,0.75)]">
                Privacy: {currentStory?.privacy || "public"}
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteStatus === "loading"}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 disabled:opacity-60"
                >
                  <Trash2 size={14} />
                  {deleteStatus === "loading" ? "Deleting..." : "Delete story"}
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Storycontent;
