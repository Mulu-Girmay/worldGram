import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteStory,
  getStoryById,
  listStories,
  reactStory,
  updateStory,
  viewStory,
} from "../Redux/storyRedux/storyThunk";
import {
  selectCurrentStory,
  selectCurrentStoryStatus,
  selectDeleteStoryStatus,
  selectStoryError,
  selectStories,
  selectStoriesStatus,
  selectUpdateStoryStatus,
} from "../Redux/storyRedux/storySelector";
import { selectUser } from "../Redux/userRedux/authSelector";
import { resolveMediaUrl } from "../utils/media";
import Reaction from "./Reaction";
import { useToast } from "./ToastProvider";

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
  const stories = useSelector(selectStories);
  const storiesStatus = useSelector(selectStoriesStatus);
  const currentStoryStatus = useSelector(selectCurrentStoryStatus);
  const deleteStatus = useSelector(selectDeleteStoryStatus);
  const updateStatus = useSelector(selectUpdateStoryStatus);
  const error = useSelector(selectStoryError);
  const currentUser = useSelector(selectUser);
  const toast = useToast();

  const [showSettings, setShowSettings] = useState(false);
  const [localReaction, setLocalReaction] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [editForm, setEditForm] = useState({
    caption: "",
    privacy: "contacts",
    durationHours: "24",
    selectedViewerIds: "",
    isHighlight: false,
  });

  const toUserLabel = (value) => {
    if (!value) return "Unknown user";
    const first = value?.identity?.firstName || value?.firstName || "";
    const last = value?.identity?.lastName || value?.lastName || "";
    const full = `${first} ${last}`.trim();
    if (full) return full;
    const username = value?.identity?.username || value?.username || "";
    if (username) return `@${username}`;
    const id = String(value?._id || value || "");
    if (id && id === currentUserId) return "You";
    return "Unknown user";
  };

  const toStoryErrorMessage = (raw) => {
    const text = String(raw || "").toLowerCase();
    if (!text) return "Something went wrong. Please try again.";
    if (text.includes("not allowed")) return "You can't view this story.";
    if (text.includes("not found")) return "This story is no longer available.";
    if (text.includes("network"))
      return "Network issue. Check your connection.";
    return String(raw);
  };

  const currentUserId = String(currentUser?._id || currentUser?.id || "");
  const storyAuthorId = String(
    currentStory?.authorId?._id || currentStory?.authorId || "",
  );
  const isOwner =
    Boolean(currentUserId) &&
    Boolean(storyAuthorId) &&
    currentUserId === storyAuthorId;

  const storySequence = useMemo(() => {
    const authorScoped = (stories || []).filter(
      (story) =>
        String(story?.authorId?._id || story?.authorId || "") ===
        String(storyAuthorId || ""),
    );
    if (authorScoped.length > 0) {
      return authorScoped;
    }
    return currentStory ? [currentStory] : [];
  }, [stories, storyAuthorId, currentStory]);

  const activeStoryIndex = useMemo(
    () =>
      Math.max(
        0,
        storySequence.findIndex(
          (story) => String(story?._id || "") === String(storyId || ""),
        ),
      ),
    [storySequence, storyId],
  );

  const canGoPrev = activeStoryIndex > 0;
  const canGoNext = activeStoryIndex < storySequence.length - 1;

  const openStoryInSequence = (index) => {
    const target = storySequence[index];
    if (!target?._id) return;
    navigate("/story", {
      replace: true,
      state: {
        storyId: target._id,
        authorId: target?.authorId?._id || target?.authorId || null,
      },
    });
  };

  const goPrevStory = () => {
    if (!canGoPrev) return;
    openStoryInSequence(activeStoryIndex - 1);
  };

  const goNextStory = () => {
    if (!canGoNext) return;
    openStoryInSequence(activeStoryIndex + 1);
  };

  useEffect(() => {
    if (!storyId) return;
    const syncStory = async () => {
      const fetchResult = await dispatch(getStoryById(storyId));
      if (getStoryById.rejected.match(fetchResult)) return;

      const fetchedStory = fetchResult.payload;
      const fetchedAuthorId = String(
        fetchedStory?.authorId?._id || fetchedStory?.authorId || "",
      );
      if (fetchedAuthorId && fetchedAuthorId === currentUserId) return;

      const viewResult = await dispatch(viewStory(storyId));
      if (viewStory.fulfilled.match(viewResult)) {
        dispatch(getStoryById(storyId));
      }
    };

    syncStory();

    return undefined;
  }, [dispatch, storyId, currentUserId]);

  useEffect(() => {
    if (storiesStatus !== "idle") return;
    dispatch(listStories({ limit: 50 }));
  }, [dispatch, storiesStatus]);

  useEffect(() => {
    setProgressPercent(0);
  }, [storyId]);

  useEffect(() => {
    if (!currentStory || showSettings || currentStoryStatus === "loading")
      return;
    const durationMs = currentStory?.mediaType === "video" ? 12000 : 7000;
    const tickMs = 100;
    const step = (tickMs / durationMs) * 100;

    const timer = window.setInterval(() => {
      setProgressPercent((prev) => {
        const next = Math.min(100, prev + step);
        if (next >= 100) {
          window.clearInterval(timer);
          if (canGoNext) {
            window.setTimeout(() => goNextStory(), 120);
          }
        }
        return next;
      });
    }, tickMs);

    return () => window.clearInterval(timer);
  }, [
    currentStory?._id,
    currentStory?.mediaType,
    currentStoryStatus,
    showSettings,
    canGoNext,
  ]);

  useEffect(() => {
    const onKey = (event) => {
      if (showSettings) return;
      if (event.key === "ArrowLeft") goPrevStory();
      if (event.key === "ArrowRight") goNextStory();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSettings, canGoPrev, canGoNext, activeStoryIndex, storySequence]);

  useEffect(() => {
    if (!currentStory) return;
    const remainingHours = Math.max(
      1,
      Math.round(
        (new Date(currentStory?.expiredAt || Date.now()).getTime() -
          Date.now()) /
          (1000 * 60 * 60),
      ),
    );
    const nearestAllowed = [6, 12, 24, 48].reduce((prev, current) =>
      Math.abs(current - remainingHours) < Math.abs(prev - remainingHours)
        ? current
        : prev,
    );
    setEditForm({
      caption: currentStory?.caption || "",
      privacy: currentStory?.privacy || "contacts",
      durationHours: String(nearestAllowed),
      selectedViewerIds: (currentStory?.selectedViewerIds || [])
        .map((id) => String(id?._id || id))
        .join(", "),
      isHighlight: Boolean(currentStory?.isHighlight),
    });
  }, [currentStory?._id]);

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
        String(viewer?.userId?._id || viewer?.userId || viewer) ===
        currentUserId,
    );
  }, [currentStory?.viewers, currentUserId]);

  const visibleReactionEntries = useMemo(
    () =>
      Object.entries(reactionMap)
        .filter(([, count]) => Number(count) > 0)
        .sort((a, b) => Number(b[1]) - Number(a[1])),
    [reactionMap],
  );

  const viewerDetails = useMemo(() => {
    if (!Array.isArray(currentStory?.viewers)) return [];
    return currentStory.viewers
      .map((viewer) => {
        const userObject = viewer?.userId;
        const userId = String(userObject?._id || userObject || "");
        return {
          id: userId || `${viewer?.viewedAt || ""}`,
          name: userId === currentUserId ? "You" : toUserLabel(userObject),
          viewedAt: viewer?.viewedAt || null,
        };
      })
      .filter((item) => item.id);
  }, [currentStory?.viewers, currentUserId]);

  const reactionDetails = useMemo(() => {
    if (!Array.isArray(currentStory?.reactions)) return [];
    return currentStory.reactions
      .map((reaction) => ({
        emoji: reaction?.emoji,
        users: (reaction?.reactors || []).map((reactor) => {
          const id = String(reactor?._id || reactor || "");
          return id === currentUserId ? "You" : toUserLabel(reactor);
        }),
        count: Number(reaction?.count || 0),
      }))
      .filter((item) => item.emoji && item.count > 0);
  }, [currentStory?.reactions, currentUserId]);

  const handleBack = (e) => {
    e.preventDefault();
    navigate("/home");
  };

  const handleReact = async (emoji) => {
    if (!storyId || !emoji) return;
    setLocalReaction(emoji);
    const result = await dispatch(reactStory({ storyId, emoji }));
    if (reactStory.rejected.match(result)) {
      toast.error(
        toStoryErrorMessage(
          result.payload?.err || result.payload?.message || "Failed to react",
        ),
      );
      return;
    }
    dispatch(getStoryById(storyId));
  };

  const handleDelete = async () => {
    if (!storyId) return;
    const ok = confirm("Delete this story?");
    if (!ok) return;
    const result = await dispatch(deleteStory(storyId));
    if (deleteStory.fulfilled.match(result)) {
      navigate("/myprofile");
      return;
    }
    toast.error(
      toStoryErrorMessage(
        result.payload?.err ||
          result.payload?.message ||
          "Failed to delete story",
      ),
    );
  };

  const handleSaveStorySettings = async () => {
    if (!storyId) return;
    const payload = {
      caption: editForm.caption,
      privacy: editForm.privacy,
      durationHours: Number(editForm.durationHours || 24),
      isHighlight: Boolean(editForm.isHighlight),
      selectedViewerIds: editForm.selectedViewerIds,
    };
    const result = await dispatch(updateStory({ storyId, payload }));
    if (updateStory.rejected.match(result)) {
      toast.error(
        toStoryErrorMessage(
          result.payload?.err ||
            result.payload?.message ||
            "Failed to update story",
        ),
      );
      return;
    }
    dispatch(getStoryById(storyId));
    toast.success("Story updated");
  };

  return (
    <div className="min-h-screen bg-[var(--primary-color)] p-3 md:p-4">
      <div className="mx-auto max-w-3xl space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] px-3 py-2 shadow-[0_10px_30px_rgba(74,127,74,0.12)]">
          <button
            type="button"
            onClick={handleBack}
            className="grid h-8 w-8 place-items-center rounded-lg bg-[#6fa63a]/10 text-[#4a7f4a] transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-[#6fa63a]/15 active:scale-95"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-[rgba(23,3,3,0.88)]">
              Story
            </p>
            <p className="text-[10px] text-[rgba(23,3,3,0.62)]">
              {currentStory?.privacy || "public"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="grid h-8 w-8 place-items-center rounded-lg bg-[#6fa63a]/10 text-[#4a7f4a] transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-[#6fa63a]/15 active:scale-95"
          >
            <MoreVertical size={16} />
          </button>
        </div>

        {storySequence.length > 0 && (
          <div className="grid grid-cols-1 gap-1">
            <div className="mb-0.5 flex gap-1">
              {storySequence.map((story, index) => {
                const isCompleted = index < activeStoryIndex;
                const isActive = index === activeStoryIndex;
                const width = isCompleted
                  ? 100
                  : isActive
                    ? progressPercent
                    : 0;
                return (
                  <button
                    key={story?._id || index}
                    type="button"
                    onClick={() => openStoryInSequence(index)}
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/35"
                    aria-label={`Open story ${index + 1}`}
                  >
                    <span
                      className="block h-full rounded-full bg-[#6fa63a] transition-[width] duration-100"
                      style={{ width: `${width}%` }}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[rgba(23,3,3,0.62)]">
              Use left/right arrow keys or tap sides to navigate stories.
            </p>
          </div>
        )}

        <div className="relative overflow-hidden rounded-2xl border border-[#6fa63a]/25 bg-black/85">
          {currentStoryStatus === "loading" && (
            <div className="grid h-[65vh] place-items-center text-sm text-white/80">
              Loading story...
            </div>
          )}

          {currentStoryStatus !== "loading" && !currentStory && (
            <div className="grid h-[65vh] place-items-center px-4 text-center text-sm text-white/80">
              {toStoryErrorMessage(error) || "Story not found."}
            </div>
          )}

          {currentStory && mediaSrc && (
            <>
              {canGoPrev && (
                <button
                  type="button"
                  onClick={goPrevStory}
                  aria-label="Previous story"
                  className="absolute left-0 top-0 z-10 h-full w-1/4 bg-transparent"
                >
                  <span className="absolute left-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/25 text-white/90">
                    <ChevronLeft size={16} />
                  </span>
                </button>
              )}
              {canGoNext && (
                <button
                  type="button"
                  onClick={goNextStory}
                  aria-label="Next story"
                  className="absolute right-0 top-0 z-10 h-full w-1/4 bg-transparent"
                >
                  <span className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/25 text-white/90">
                    <ChevronRight size={16} />
                  </span>
                </button>
              )}
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
            <p className="text-xs text-[rgba(23,3,3,0.62)]">
              {viewersCount} views
            </p>
            {hasViewed && (
              <p className="text-[11px] text-[#2f5b2f]">Seen by you</p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReact(emoji)}
                className={`rounded-full border px-2.5 py-1 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-95 ${
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
              triggerClassName="rounded-full border border-[#6fa63a]/35 bg-[#f8fdf3] px-2.5 py-1 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-95"
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
            className="absolute inset-0 bg-black/35 transition-opacity duration-150 micro-pop-in"
            onClick={() => setShowSettings(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-[340px] border-l border-[#6fa63a]/25 bg-[var(--primary-color)] p-3 shadow-[-10px_0_30px_rgba(0,0,0,0.15)] micro-pop-in">
            <div className="mb-3 flex items-center justify-between rounded-xl border border-[#6fa63a]/20 bg-white/70 px-3 py-2">
              <p className="text-sm font-semibold text-[#2f5b2f]">
                Story settings
              </p>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-lg border border-[#6fa63a]/30 bg-white p-1 text-[#2f5b2f] transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-95"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2 rounded-xl border border-[#6fa63a]/20 bg-white/75 p-3">
              <div className="rounded-lg border border-[#6fa63a]/25 bg-[#f9fcf6] px-3 py-2 text-xs text-[rgba(23,3,3,0.75)]">
                Privacy: {currentStory?.privacy || "public"}
              </div>
              {isOwner && (
                <div className="rounded-lg border border-[#6fa63a]/25 bg-[#f9fcf6] px-3 py-2">
                  <p className="text-xs font-semibold text-[#2f5b2f]">
                    Seen by ({viewerDetails.length})
                  </p>
                  {viewerDetails.length === 0 ? (
                    <p className="mt-1 text-xs text-[rgba(23,3,3,0.62)]">
                      No viewers yet.
                    </p>
                  ) : (
                    <div className="mt-2 max-h-28 space-y-1 overflow-y-auto pr-1">
                      {viewerDetails.map((viewer) => (
                        <div
                          key={`${viewer.id}-${viewer.viewedAt || ""}`}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-[rgba(23,3,3,0.85)]">
                            {viewer.name}
                          </span>
                          <span className="text-[rgba(23,3,3,0.55)]">
                            {viewer.viewedAt
                              ? new Date(viewer.viewedAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {reactionDetails.length > 0 && (
                <div className="rounded-lg border border-[#6fa63a]/25 bg-[#f9fcf6] px-3 py-2">
                  <p className="text-xs font-semibold text-[#2f5b2f]">
                    Reactions
                  </p>
                  <div className="mt-2 max-h-36 space-y-2 overflow-y-auto pr-1">
                    {reactionDetails.map((item) => (
                      <div key={item.emoji} className="text-xs">
                        <p className="font-semibold text-[rgba(23,3,3,0.82)]">
                          {item.emoji} {item.count}
                        </p>
                        <p className="text-[rgba(23,3,3,0.62)]">
                          {item.users.slice(0, 6).join(", ")}
                          {item.users.length > 6 ? "..." : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isOwner && (
                <div className="rounded-lg border border-[#6fa63a]/25 bg-[#f9fcf6] p-2">
                  <p className="mb-2 text-xs font-semibold text-[#2f5b2f]">
                    Edit story
                  </p>
                  <textarea
                    value={editForm.caption}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        caption: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Caption"
                    className="w-full rounded-md border border-[#6fa63a]/30 px-2 py-1 text-xs outline-none focus:border-[#4a7f4a]"
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <select
                      value={editForm.privacy}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          privacy: e.target.value,
                        }))
                      }
                      className="rounded-md border border-[#6fa63a]/30 px-2 py-1 text-xs outline-none focus:border-[#4a7f4a]"
                    >
                      <option value="public">public</option>
                      <option value="contacts">contacts</option>
                      <option value="closeFriends">closeFriends</option>
                      <option value="selectedContacts">selectedContacts</option>
                    </select>
                    <select
                      value={editForm.durationHours}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          durationHours: e.target.value,
                        }))
                      }
                      className="rounded-md border border-[#6fa63a]/30 px-2 py-1 text-xs outline-none focus:border-[#4a7f4a]"
                    >
                      <option value="6">6h</option>
                      <option value="12">12h</option>
                      <option value="24">24h</option>
                      <option value="48">48h</option>
                    </select>
                  </div>
                  <input
                    value={editForm.selectedViewerIds}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        selectedViewerIds: e.target.value,
                      }))
                    }
                    disabled={editForm.privacy !== "selectedContacts"}
                    placeholder="Selected contacts (@username or ID, comma-separated)"
                    className="mt-2 w-full rounded-md border border-[#6fa63a]/30 px-2 py-1 text-xs outline-none focus:border-[#4a7f4a] disabled:opacity-60"
                  />
                  <label className="mt-2 flex items-center gap-2 text-xs text-[rgba(23,3,3,0.8)]">
                    <input
                      type="checkbox"
                      checked={Boolean(editForm.isHighlight)}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          isHighlight: e.target.checked,
                        }))
                      }
                    />
                    Pin to highlights
                  </label>
                  <button
                    type="button"
                    onClick={handleSaveStorySettings}
                    disabled={updateStatus === "loading"}
                    className="mt-2 w-full rounded-md bg-[#4a7f4a] px-2 py-1.5 text-xs text-white disabled:opacity-60"
                  >
                    {updateStatus === "loading" ? "Saving..." : "Save changes"}
                  </button>
                </div>
              )}
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
