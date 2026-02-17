import React, { useEffect, useState, useCallback } from "react";
import { ProfileNav } from "./Profile";
import { FileBoxIcon, SendHorizontal, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  getChannelPosts,
  addPost,
  editPost,
  deletePost,
  pinPost,
  unpinPost,
  addView,
  reactToPost,
  addCommentToPost,
  replyToPostComment,
  forwardPost,
} from "../Redux/postRedux/postThunk";
import { useToast } from "./ToastProvider";
import {
  selectPosts,
  selectPostsStatus,
  selectPostsNextCursor,
} from "../Redux/postRedux/postSelector";
import {
  myChannel,
  findChannel,
  subscribeChannel,
  unsubscribeChannel,
  addAdmin,
  removeAdmin,
} from "../Redux/channelRedux/channelThunk";
import { resolveMediaUrl } from "../utils/media";
import {
  selectCurrentChannel,
  selectMyChannels,
  selectMyChannelsStatus,
  selectSubscribeStatus,
  selectUnsubscribeStatus,
  selectAddAdminStatus,
  selectRemoveAdminStatus,
  selectChannelError,
  selectLastMessage,
} from "../Redux/channelRedux/channelSelector";
import { selectUser } from "../Redux/userRedux/authSelector";
import ChannelPostCard from "./ChannelPostCard";

const Channel = () => {
  const dispatch = useDispatch();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const currentChannel = useSelector(selectCurrentChannel);
  const myChannels = useSelector(selectMyChannels);
  const myChannelsStatus = useSelector(selectMyChannelsStatus);
  const subscribeStatus = useSelector(selectSubscribeStatus);
  const unsubscribeStatus = useSelector(selectUnsubscribeStatus);
  const addAdminStatus = useSelector(selectAddAdminStatus);
  const removeAdminStatus = useSelector(selectRemoveAdminStatus);
  const channelError = useSelector(selectChannelError);
  const channelLastMessage = useSelector(selectLastMessage);
  const posts = useSelector(selectPosts);
  const postsStatus = useSelector(selectPostsStatus);
  const postsNextCursor = useSelector(selectPostsNextCursor);
  const user = useSelector(selectUser);

  const [message, setMessage] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardTargetPost, setForwardTargetPost] = useState(null);
  const [forwardSearch, setForwardSearch] = useState("");
  const [selectedForwardChannelId, setSelectedForwardChannelId] = useState("");
  const [forwardSubmitting, setForwardSubmitting] = useState(false);
  const [forwardError, setForwardError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [postsLocal, setPostsLocal] = useState([]);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [adminToAdd, setAdminToAdd] = useState("");
  const [adminToRemove, setAdminToRemove] = useState("");
  const [channelActionFeedback, setChannelActionFeedback] = useState("");
  const [channelActionError, setChannelActionError] = useState("");
  useEffect(() => {
    if (currentChannel && currentChannel._id) {
      dispatch(
        getChannelPosts({
          channelId: currentChannel._id,
          params: { limit: 20 },
        }),
      );
    }
    console.log("currentChannel:", currentChannel);
  }, [dispatch, currentChannel]);

  useEffect(() => {
    setPostsLocal(posts || []);
  }, [posts]);

  const isOwnerOrAdmin = React.useMemo(() => {
    if (!currentChannel || !user) return false;
    const ownerId = currentChannel?.ownership?.ownerId;
    const admins = currentChannel?.ownership?.admins || [];
    const uid = user._id || user.id || null;
    if (!uid) return false;
    try {
      if (ownerId && ownerId.toString() === uid.toString()) return true;
    } catch (e) {}
    return admins.map((a) => a.toString()).includes(uid.toString());
  }, [currentChannel, user]);

  const currentUserId = React.useMemo(
    () => (user?._id || user?.id || "").toString(),
    [user],
  );

  const isSubscriber = React.useMemo(() => {
    if (!currentUserId) return false;
    const subscribers = (currentChannel?.audience?.subscribers || []).map((id) =>
      id.toString(),
    );
    return subscribers.includes(currentUserId);
  }, [currentChannel?.audience?.subscribers, currentUserId]);

  const isSubscribing = subscribeStatus === "loading";
  const isUnsubscribing = unsubscribeStatus === "loading";
  const isAddingAdmin = addAdminStatus === "loading";
  const isRemovingAdmin = removeAdminStatus === "loading";
  const channelTitle = currentChannel?.basicInfo?.name || "Channel";

  const resolveMediaSrc = (media) => {
    if (!media) return null;
    if (typeof media === "string") {
      return resolveMediaUrl(media, "image");
    }
    if (Array.isArray(media) && media.length > 0) {
      const first = media[0];
      if (!first) return null;
      if (typeof first === "string") {
        return resolveMediaUrl(first, "image");
      }
      if (first.url) {
        return resolveMediaUrl(first.url, "image");
      }
      if (first.filename) {
        return resolveMediaUrl(first.filename, "image");
      }
    }
    if (media.url) {
      return resolveMediaUrl(media.url, "image");
    }
    return null;
  };

  const channelAvatar = resolveMediaSrc(
    currentChannel?.basicInfo?.photo || currentChannel?.basicInfo?.channelPhoto,
  );

  const refreshPosts = () => {
    if (!currentChannel || !currentChannel._id) return;
    dispatch(
      getChannelPosts({ channelId: currentChannel._id, params: { limit: 20 } }),
    );
  };

  const handleLoadMorePosts = async () => {
    if (!currentChannel?._id || !postsNextCursor || loadingMore) return;

    try {
      setLoadingMore(true);
      await dispatch(
        getChannelPosts({
          channelId: currentChannel._id,
          params: { limit: 20, cursor: postsNextCursor },
        }),
      ).unwrap();
    } catch (err) {
      console.error("Load more posts error:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const refreshCurrentChannel = useCallback(() => {
    if (!currentChannel?._id) return;
    dispatch(findChannel(currentChannel._id));
  }, [dispatch, currentChannel?._id]);

  const handleSubscribe = async () => {
    if (!currentChannel?._id) return;
    try {
      setChannelActionError("");
      const result = await dispatch(subscribeChannel(currentChannel._id)).unwrap();
      setChannelActionFeedback(result?.message || "Subscribed");
      refreshCurrentChannel();
    } catch (err) {
      setChannelActionError(
        err?.err || err?.message || "Failed to subscribe to this channel.",
      );
    }
  };

  const handleUnsubscribe = async () => {
    if (!currentChannel?._id) return;
    try {
      setChannelActionError("");
      const result = await dispatch(
        unsubscribeChannel(currentChannel._id),
      ).unwrap();
      setChannelActionFeedback(result?.message || "Unsubscribed");
      refreshCurrentChannel();
    } catch (err) {
      setChannelActionError(
        err?.err || err?.message || "Failed to unsubscribe from this channel.",
      );
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!currentChannel?._id || !adminToAdd.trim()) return;
    try {
      setChannelActionError("");
      const result = await dispatch(
        addAdmin({
          id: currentChannel._id,
          payload: { newAdminUsername: adminToAdd.trim() },
        }),
      ).unwrap();
      setChannelActionFeedback(result?.message || "Admin added");
      setAdminToAdd("");
      refreshCurrentChannel();
      dispatch(myChannel());
    } catch (err) {
      setChannelActionError(
        err?.err || err?.message || "Failed to add admin to this channel.",
      );
    }
  };

  const handleRemoveAdmin = async (e) => {
    e.preventDefault();
    if (!currentChannel?._id || !adminToRemove.trim()) return;
    try {
      setChannelActionError("");
      const result = await dispatch(
        removeAdmin({
          id: currentChannel._id,
          payload: { adminUsername: adminToRemove.trim() },
        }),
      ).unwrap();
      setChannelActionFeedback(result?.message || "Admin removed");
      setAdminToRemove("");
      refreshCurrentChannel();
      dispatch(myChannel());
    } catch (err) {
      setChannelActionError(
        err?.err || err?.message || "Failed to remove admin from this channel.",
      );
    }
  };

  const handleEditPost = async (post, textOverride) => {
    if (!currentChannel?._id || !post?._id) return;
    const nextText =
      typeof textOverride === "string" ? textOverride : post?.text || "";
    const newText = nextText.trim();
    if (!newText) {
      toastError("Post text cannot be empty");
      return;
    }
    const previousText = post?.text;
    setPostsLocal((prev) =>
      (prev || []).map((p) => (p._id === post._id ? { ...p, text: newText } : p)),
    );
    const formData = new FormData();
    formData.append("text", newText);
    try {
      await dispatch(
        editPost({
          channelId: currentChannel._id,
          postId: post._id,
          formData,
        }),
      ).unwrap();
      refreshPosts();
    } catch (err) {
      setPostsLocal((prev) =>
        (prev || []).map((p) =>
          p._id === post._id ? { ...p, text: previousText } : p,
        ),
      );
      console.error("Edit post error:", err);
      toastError(err?.err || err?.message || "Failed to edit post");
    }
  };

  const handleDeletePost = async (post) => {
    if (!currentChannel?._id || !post?._id) return;
    if (!confirm("Delete this post?")) return;
    const previousPosts = postsLocal;
    setPostsLocal((prev) => (prev || []).filter((p) => p._id !== post._id));
    try {
      await dispatch(
        deletePost({
          channelId: currentChannel._id,
          postId: post._id,
        }),
      ).unwrap();
      refreshPosts();
    } catch (err) {
      setPostsLocal(previousPosts);
      console.error("Delete post error:", err);
      toastError(err?.err || err?.message || "Failed to delete post");
    }
  };

  const handleForwardPost = async (post) => {
    if (!currentChannel?._id || !post?._id) return;

    setForwardTargetPost(post);
    setForwardSearch("");
    setSelectedForwardChannelId("");
    setForwardError("");
    setForwardModalOpen(true);

    if (myChannelsStatus === "idle" || myChannelsStatus === "failed") {
      dispatch(myChannel());
    }
  };

  const closeForwardModal = () => {
    setForwardModalOpen(false);
    setForwardTargetPost(null);
    setForwardSearch("");
    setSelectedForwardChannelId("");
    setForwardError("");
  };

  const handleConfirmForward = async () => {
    if (!currentChannel?._id || !forwardTargetPost?._id) return;
    if (!selectedForwardChannelId) {
      setForwardError("Select a channel first.");
      return;
    }

    const previousForwardCount =
      forwardTargetPost?.forward?.count || 0;
    setPostsLocal((prev) =>
      (prev || []).map((p) =>
        p._id === forwardTargetPost._id
          ? {
              ...p,
              forward: { ...(p.forward || {}), count: previousForwardCount + 1 },
            }
          : p,
      ),
    );

    try {
      setForwardError("");
      setForwardSubmitting(true);
      await dispatch(
        forwardPost({
          channelId: currentChannel._id,
          postId: forwardTargetPost._id,
          destination: { type: "channel", id: selectedForwardChannelId },
        }),
      ).unwrap();
      closeForwardModal();
      toastSuccess("Forwarded successfully");
    } catch (err) {
      setPostsLocal((prev) =>
        (prev || []).map((p) =>
          p._id === forwardTargetPost._id
            ? {
                ...p,
                forward: { ...(p.forward || {}), count: previousForwardCount },
              }
            : p,
        ),
      );
      console.error("Forward error:", err);
      setForwardError(err?.err || err?.message || "Failed to forward post");
    } finally {
      setForwardSubmitting(false);
    }
  };

  const forwardChannels = React.useMemo(() => {
    const uid = user?._id || user?.id;
    if (!uid) return [];

    const list = (myChannels || []).filter((ch) => ch?._id);
    return list.filter((ch) => {
      if (ch._id === currentChannel?._id) return false;

      const ownerId = ch?.ownership?.ownerId?.toString?.();
      const adminIds = (ch?.ownership?.admins || []).map((a) => a.toString());
      return ownerId === uid.toString() || adminIds.includes(uid.toString());
    });
  }, [myChannels, currentChannel?._id, user]);

  const filteredForwardChannels = React.useMemo(() => {
    const q = forwardSearch.trim().toLowerCase();
    if (!q) return forwardChannels;

    return forwardChannels.filter((ch) => {
      const name = ch?.basicInfo?.name?.toLowerCase() || "";
      const userName = ch?.basicInfo?.userName?.toLowerCase() || "";
      return name.includes(q) || userName.includes(q);
    });
  }, [forwardChannels, forwardSearch]);

  const handlePinPost = async (post) => {
    if (!currentChannel?._id || !post?._id) return;
    const previousPinned = !!post.isPinned;
    setPostsLocal((prev) =>
      (prev || []).map((p) =>
        p._id === post._id ? { ...p, isPinned: !previousPinned } : p,
      ),
    );
    try {
      if (post.isPinned) {
        await dispatch(
          unpinPost({
            channelId: currentChannel._id,
            postId: post._id,
          }),
        ).unwrap();
      } else {
        await dispatch(
          pinPost({
            channelId: currentChannel._id,
            postId: post._id,
          }),
        ).unwrap();
      }
      refreshPosts();
    } catch (err) {
      setPostsLocal((prev) =>
        (prev || []).map((p) =>
          p._id === post._id ? { ...p, isPinned: previousPinned } : p,
        ),
      );
      console.error("Pin post error:", err);
      toastError(err?.err || err?.message || "Failed to update pin state");
    }
  };

  const handleCopyPost = (post) => {
    if (!post?.text) return;
    if (!navigator?.clipboard?.writeText) {
      toastError("Clipboard is not available in this browser.");
      return;
    }
    navigator.clipboard
      .writeText(post.text)
      .then(() => toastSuccess("Text copied"))
      .catch(() => toastError("Failed to copy text"));
  };

  const handleReactPost = async (post, emoji) => {
    if (!currentChannel || !currentChannel._id) return;
    if (!post?._id || !emoji) return;

    try {
      await dispatch(
        reactToPost({
          channelId: currentChannel._id,
          postId: post._id,
          emoji,
        }),
      ).unwrap();
      refreshPosts();
    } catch (err) {
      console.error("React error:", err);
      toastError(err?.err || err?.message || "Failed to update reaction");
    }
  };

  const handleAddView = useCallback(
    async (post, userId) => {
      if (!userId || !currentChannel?._id) return;

      dispatch(
        addView({
          channelId: currentChannel._id,
          postId: post._id,
        }),
      );
    },
    [dispatch, currentChannel?._id],
  );

  const handleAddComment = async (post, text) => {
    if (!currentChannel?._id || !post?._id || !text?.trim()) return;
    try {
      await dispatch(
        addCommentToPost({
          channelId: currentChannel._id,
          postId: post._id,
          text: text.trim(),
        }),
      ).unwrap();
      refreshPosts();
    } catch (err) {
      console.error("Comment error:", err);
      toastError(err?.err || err?.message || "Failed to add comment");
      throw err;
    }
  };

  const handleReplyToComment = async (post, commentId, text) => {
    if (!currentChannel?._id || !post?._id || !commentId || !text?.trim()) {
      return;
    }
    try {
      await dispatch(
        replyToPostComment({
          channelId: currentChannel._id,
          postId: post._id,
          commentId,
          text: text.trim(),
        }),
      ).unwrap();
      refreshPosts();
    } catch (err) {
      console.error("Reply error:", err);
      toastError(err?.err || err?.message || "Failed to add reply");
      throw err;
    }
  };

  const handleSharePost = (post) => {
    if (navigator.share) {
      navigator
        .share({ title: post.title || "Post", text: post.text || "" })
        .catch(() => toastInfo("Share canceled"));
    } else if (post?.text) {
      if (!navigator?.clipboard?.writeText) {
        toastError("Clipboard is not available in this browser.");
        return;
      }
      navigator.clipboard
        .writeText(post.text)
        .then(() => toastSuccess("Post copied for sharing"))
        .catch(() => toastError("Failed to copy post for sharing"));
    }
  };

  useEffect(() => {
    setChannelActionFeedback("");
    setChannelActionError("");
  }, [currentChannel?._id]);

  useEffect(() => {
    setShowChannelSettings(false);
  }, [currentChannel?._id]);

  async function handleSubmit(e) {
    e.preventDefault();
    console.log("submitting...");
    if (!currentChannel || !currentChannel._id) return;
    if (!message && !mediaFile) return;
    const formData = new FormData();
    formData.append("text", message);
    if (mediaFile) formData.append("media", mediaFile);
    setSubmitting(true);
    try {
      // log FormData entries for debugging
      console.log("FormData:", formData);
      for (const pair of formData.entries()) {
        console.log("formData entry:", pair[0], pair[1]);
      }

      const action = await dispatch(
        addPost({ channelId: currentChannel._id, formData }),
      );
      console.log("addPost action:", action);
      if (action?.error) console.error("addPost error:", action.error);

      if (action && action.payload) {
        // refresh posts after successful create
        dispatch(
          getChannelPosts({
            channelId: currentChannel._id,
            params: { limit: 20 },
          }),
        );
        setMessage("");
        setMediaFile(null);
      }
    } catch (err) {
      console.error("dispatch(addPost) threw:", err);
    } finally {
      console.log("submitted...");

      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <ProfileNav
        title={channelTitle}
        subtitle={`${currentChannel?.membersCount || 0} members`}
        avatarUrl={channelAvatar}
        backPath="/home"
      />
      <section className="relative overflow-hidden rounded-3xl border border-[#6fa63a]/30 bg-[linear-gradient(135deg,#f8fdf3_0%,#eef8e8_60%,#e5f2dc_100%)] p-4 shadow-[0_16px_35px_rgba(74,127,74,0.12)]">
        <div className="pointer-events-none absolute -right-10 -top-8 h-28 w-28 rounded-full bg-[#6fa63a]/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-[#4a7f4a]/10 blur-2xl" />

        <div
          role={currentChannel?._id ? "button" : undefined}
          tabIndex={currentChannel?._id ? 0 : undefined}
          onClick={() => {
            if (currentChannel?._id) setShowChannelSettings(true);
          }}
          onKeyDown={(e) => {
            if (!currentChannel?._id) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setShowChannelSettings(true);
            }
          }}
          className={`relative mb-4 flex items-center justify-between rounded-2xl border border-[#6fa63a]/25 bg-white/65 px-3 py-2 ${
            currentChannel?._id ? "cursor-pointer hover:bg-white/80" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-[#4a7f4a] flex items-center justify-center">
              {currentChannel?.basicInfo?.photo ? (
                <img
                  src={resolveMediaSrc(currentChannel.basicInfo.photo)}
                  alt={currentChannel?.basicInfo?.name || "Channel"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className={`text-xs font-bold text-white ${currentChannel?.basicInfo?.photo ? "hidden" : "flex"} items-center justify-center h-full w-full`}
              >
                {currentChannel?.basicInfo?.name?.charAt(0)?.toUpperCase() ||
                  "C"}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4a7f4a]">
                Channel Feed
              </p>
              <p className="text-sm font-semibold text-[rgba(23,3,3,0.87)]">
                {currentChannel?.basicInfo?.name || "Select a channel"}
              </p>
              {currentChannel?._id && (
                <p className="text-[10px] text-[rgba(23,3,3,0.58)]">
                  Tap to open channel profile settings
                </p>
              )}
            </div>
          </div>
          <p className="rounded-full bg-[#6fa63a]/15 px-2.5 py-1 text-xs font-medium text-[#2f5b2f]">
            {currentChannel?.membersCount || "--"} members
          </p>
        </div>

        <div className="relative max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {postsStatus === "loading" && postsLocal.length === 0 && (
            <div className="space-y-2">
              <div className="h-20 rounded-xl bg-white/60 animate-pulse" />
              <div className="h-20 rounded-xl bg-white/60 animate-pulse" />
            </div>
          )}
          {postsStatus === "succeeded" && postsLocal.length === 0 && (
            <p className="text-sm">No posts yet.</p>
          )}
          {!isOwnerOrAdmin && (
            <p className="text-sm text-[rgba(23,3,3,0.75)]">
              Only channel owner or admins can write posts.
            </p>
          )}
          {isOwnerOrAdmin && postsStatus === "loading" && (
            <p>Loading posts...</p>
          )}
          {(postsStatus === "succeeded" || postsLocal.length > 0) &&
            (isOwnerOrAdmin ? (
              postsLocal.length === 0 ? (
                <p className="text-sm">No posts yet.</p>
              ) : (
                postsLocal.map((post) => (
                  <ChannelPostCard
                    key={post._id}
                    post={post}
                    channel={currentChannel}
                    isOwner={true}
                    canEdit={isOwnerOrAdmin}
                    canDelete={isOwnerOrAdmin}
                    canPin={isOwnerOrAdmin}
                    onEdit={handleEditPost}
                    onDelete={handleDeletePost}
                    onForward={handleForwardPost}
                    onPin={handlePinPost}
                    onCopy={handleCopyPost}
                    onShare={handleSharePost}
                    onReact={handleReactPost}
                    onView={handleAddView}
                    onAddComment={handleAddComment}
                    onReply={handleReplyToComment}
                  />
                ))
              )
            ) : postsLocal.length === 0 ? (
              <p className="text-sm">No posts yet.</p>
            ) : (
              postsLocal.map((post) => (
                <ChannelPostCard
                  key={post._id}
                  post={post}
                  channel={currentChannel}
                  canEdit={isOwnerOrAdmin}
                  canDelete={isOwnerOrAdmin}
                  canPin={isOwnerOrAdmin}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                  onForward={handleForwardPost}
                  onPin={handlePinPost}
                  onCopy={handleCopyPost}
                  onShare={handleSharePost}
                  onReact={handleReactPost}
                  onView={handleAddView}
                  onAddComment={handleAddComment}
                  onReply={handleReplyToComment}
                />
              ))
            ))}

          {postsNextCursor && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleLoadMorePosts}
                disabled={loadingMore}
                className="w-full rounded-xl border border-[#6fa63a]/35 bg-white/70 px-3 py-2 text-sm text-[#2f5b2f] hover:bg-[#f3f9ee] disabled:opacity-60"
              >
                {loadingMore ? "Loading more..." : "Load more posts"}
              </button>
            </div>
          )}
        </div>

        {isOwnerOrAdmin && (
          <form
            onSubmit={handleSubmit}
            className="relative mt-4 rounded-2xl border border-[#6fa63a]/30 bg-white/75 p-3 backdrop-blur-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="h-8 w-8 overflow-hidden rounded-full bg-[#4a7f4a] flex items-center justify-center">
                {currentChannel?.basicInfo?.photo ? (
                  <img
                    src={resolveMediaSrc(currentChannel.basicInfo.photo)}
                    alt={currentChannel?.basicInfo?.name || "Channel"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={`text-xs font-bold text-white ${currentChannel?.basicInfo?.photo ? "hidden" : "flex"} items-center justify-center h-full w-full`}
                >
                  {currentChannel?.basicInfo?.name?.charAt(0)?.toUpperCase() ||
                    "C"}
                </div>
              </div>
              <p className="text-xs font-medium text-[rgba(23,3,3,0.72)]">
                Drop an update to your subscribers
              </p>
            </div>
            <div className="flex items-end gap-2">
              <textarea
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share news, drop links, or ask your audience a question..."
                className="min-h-[42px] flex-1 resize-none rounded-xl border border-[#6fa63a]/30 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#4a7f4a] focus:ring-2 focus:ring-[#6fa63a]/20"
              />
              <label className="rounded-xl border border-[#6fa63a]/35 bg-[#6fa63a]/15 p-2 text-[#2f5b2f] transition hover:bg-[#6fa63a]/25 cursor-pointer">
                <FileBoxIcon size={16} />
                <input
                  type="file"
                  accept="image/*,video/*"
                  name="media"
                  className="hidden"
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                />
              </label>
              <button
                onClick={handleSubmit}
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[#4a7f4a] p-2 text-white transition hover:bg-[#3f6e3f]"
              >
                <SendHorizontal size={16} />
              </button>
            </div>
          </form>
        )}
      </section>
      <div className="h-2" />

      {showChannelSettings && currentChannel?._id && (
        <div className="fixed inset-0 z-[120]">
          <div
            className="absolute inset-0 bg-black/35"
            onClick={() => setShowChannelSettings(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-[380px] border-l border-[#6fa63a]/25 bg-[var(--primary-color)] p-3 shadow-[-10px_0_30px_rgba(0,0,0,0.15)]">
            <div className="mb-3 flex items-center justify-between rounded-xl border border-[#6fa63a]/20 bg-white/70 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-[#2f5b2f]">
                  Channel profile
                </p>
                <p className="text-[11px] text-[rgba(23,3,3,0.62)]">
                  {channelTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowChannelSettings(false)}
                className="rounded-lg border border-[#6fa63a]/30 bg-white p-1 text-[#2f5b2f]"
                aria-label="Close channel settings"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3 rounded-xl border border-[#6fa63a]/20 bg-white/75 p-3">
              <div className="flex flex-wrap items-center gap-2">
                {currentUserId && (
                  <button
                    type="button"
                    onClick={isSubscriber ? handleUnsubscribe : handleSubscribe}
                    disabled={isSubscribing || isUnsubscribing}
                    className="rounded-lg border border-[#6fa63a]/35 px-3 py-1.5 text-xs font-medium text-[#2f5b2f] hover:bg-[#f3f9ee] disabled:opacity-60"
                  >
                    {isSubscribing || isUnsubscribing
                      ? "Updating..."
                      : isSubscriber
                        ? "Unsubscribe"
                        : "Subscribe"}
                  </button>
                )}
                {isOwnerOrAdmin && (
                  <span className="rounded-full bg-[#6fa63a]/15 px-2 py-1 text-[10px] font-semibold text-[#2f5b2f]">
                    You are{" "}
                    {currentChannel?.ownership?.ownerId?.toString?.() ===
                    currentUserId
                      ? "Owner"
                      : "Admin"}
                  </span>
                )}
              </div>

              {isOwnerOrAdmin && (
                <div className="grid gap-2">
                  <form
                    onSubmit={handleAddAdmin}
                    className="rounded-xl border border-[#6fa63a]/20 p-2 bg-[#f9fcf6]"
                  >
                    <p className="text-xs font-semibold text-[#2f5b2f]">
                      Add Admin
                    </p>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={adminToAdd}
                        onChange={(e) => setAdminToAdd(e.target.value)}
                        placeholder="username"
                        className="w-full rounded-md border border-[#6fa63a]/30 px-2 py-1 text-xs outline-none focus:border-[#4a7f4a]"
                      />
                      <button
                        type="submit"
                        disabled={!adminToAdd.trim() || isAddingAdmin}
                        className="rounded-md bg-[#4a7f4a] px-2 py-1 text-xs text-white disabled:opacity-60"
                      >
                        {isAddingAdmin ? "Adding..." : "Add"}
                      </button>
                    </div>
                  </form>

                  <form
                    onSubmit={handleRemoveAdmin}
                    className="rounded-xl border border-[#6fa63a]/20 p-2 bg-[#f9fcf6]"
                  >
                    <p className="text-xs font-semibold text-[#2f5b2f]">
                      Remove Admin
                    </p>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={adminToRemove}
                        onChange={(e) => setAdminToRemove(e.target.value)}
                        placeholder="username"
                        className="w-full rounded-md border border-[#6fa63a]/30 px-2 py-1 text-xs outline-none focus:border-[#4a7f4a]"
                      />
                      <button
                        type="submit"
                        disabled={!adminToRemove.trim() || isRemovingAdmin}
                        className="rounded-md bg-[#4a7f4a] px-2 py-1 text-xs text-white disabled:opacity-60"
                      >
                        {isRemovingAdmin ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {(channelActionFeedback || channelLastMessage) && (
                <p className="text-xs text-[#2f5b2f]">
                  {channelActionFeedback || channelLastMessage}
                </p>
              )}
              {(channelActionError || channelError) && (
                <p className="text-xs text-red-600">
                  {channelActionError || channelError}
                </p>
              )}
            </div>
          </aside>
        </div>
      )}

      {forwardModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/35 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#6fa63a]/30 bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-[rgba(23,3,3,0.87)]">
                Forward Post To Channel
              </h3>
              <button
                type="button"
                onClick={closeForwardModal}
                className="rounded-md border border-[#6fa63a]/30 px-2 py-1 text-xs hover:bg-[#f3f9ee]"
                disabled={forwardSubmitting}
              >
                Close
              </button>
            </div>

            <input
              type="text"
              value={forwardSearch}
              onChange={(e) => setForwardSearch(e.target.value)}
              placeholder="Search your channels..."
              className="mt-3 w-full rounded-lg border border-[#6fa63a]/30 px-3 py-2 text-sm outline-none focus:border-[#4a7f4a] focus:ring-2 focus:ring-[#6fa63a]/20"
              disabled={forwardSubmitting}
            />

            <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1">
              {myChannelsStatus === "loading" && (
                <p className="text-sm text-[rgba(23,3,3,0.7)]">
                  Loading channels...
                </p>
              )}

              {myChannelsStatus !== "loading" &&
                filteredForwardChannels.length === 0 && (
                  <p className="text-sm text-[rgba(23,3,3,0.7)]">
                    No owned/admin channels found.
                  </p>
                )}

              {filteredForwardChannels.map((ch) => {
                const uid = (user?._id || user?.id || "").toString();
                const isOwner =
                  ch?.ownership?.ownerId?.toString?.() === uid;
                const photo = ch?.basicInfo?.channelPhoto;
                const photoSrc = photo ? resolveMediaUrl(photo, "image") : null;

                return (
                  <button
                    key={ch._id}
                    type="button"
                    onClick={() => {
                      setSelectedForwardChannelId(ch._id);
                      setForwardError("");
                    }}
                    className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                      selectedForwardChannelId === ch._id
                        ? "border-[#4a7f4a] bg-[#eef8e8]"
                        : "border-[#6fa63a]/25 bg-[#f9fcf6] hover:bg-[#f3f9ee]"
                    }`}
                    disabled={forwardSubmitting}
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#4a7f4a]/20 grid place-items-center text-xs font-semibold text-[#2f5b2f]">
                      {photoSrc ? (
                        <img
                          src={photoSrc}
                          alt={ch?.basicInfo?.name || "Channel"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (ch?.basicInfo?.name || "C").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[rgba(23,3,3,0.87)]">
                        {ch?.basicInfo?.name || "Unnamed channel"}
                      </p>
                      <p className="truncate text-xs text-[rgba(23,3,3,0.65)]">
                        @{ch?.basicInfo?.userName || "channel"}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#6fa63a]/20 px-2 py-0.5 text-[10px] font-semibold text-[#2f5b2f]">
                      {isOwner ? "Owner" : "Admin"}
                    </span>
                  </button>
                );
              })}
            </div>

            {forwardError && (
              <p className="mt-3 text-xs text-red-600">{forwardError}</p>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeForwardModal}
                className="rounded-lg border border-[#6fa63a]/30 px-3 py-2 text-sm hover:bg-[#f3f9ee]"
                disabled={forwardSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmForward}
                className="rounded-lg bg-[#4a7f4a] px-3 py-2 text-sm text-white hover:bg-[#3f6e3f] disabled:opacity-60"
                disabled={!selectedForwardChannelId || forwardSubmitting}
              >
                {forwardSubmitting ? "Forwarding..." : "Forward"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Channel;
