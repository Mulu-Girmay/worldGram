import React, { useEffect, useState, useCallback } from "react";
import { ProfileNav } from "./Profile";
import { Bell, FileBoxIcon, Instagram, SendHorizontal } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { getChannelPosts, addPost } from "../Redux/postRedux/postThunk";
import {
  selectPosts,
  selectPostsStatus,
} from "../Redux/postRedux/postSelector";
import { selectCurrentChannel } from "../Redux/channelRedux/channelSelector";
import { selectUser, selectAuth } from "../Redux/userRedux/authSelector";
import ChannelPostCard from "./ChannelPostCard";
import {
  editPostApi,
  deletePostApi,
  forwardPostApi,
  pinPostApi,
  unpinPostApi,
} from "../api/postApi";
import {
  reactToPostApi,
  addViewApi,
  addCommentApi,
  replyToCommentApi,
} from "../api/postApi";

const Channel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentChannel = useSelector(selectCurrentChannel);
  const posts = useSelector(selectPosts);
  const postsStatus = useSelector(selectPostsStatus);
  const user = useSelector(selectUser);

  const [message, setMessage] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const auth = useSelector(selectAuth);
  const token = auth?.accessToken;

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

  const resolveMediaSrc = (media) => {
    if (!media) return null;
    if (typeof media === "string") {
      return media.startsWith("/") || media.startsWith("http")
        ? media
        : `/uploads/images/${media}`;
    }
    if (Array.isArray(media) && media.length > 0) {
      const first = media[0];
      if (!first) return null;
      if (typeof first === "string") {
        return first.startsWith("/") || first.startsWith("http")
          ? first
          : `/uploads/images/${first}`;
      }
      if (first.url) {
        return first.url.startsWith("/") || first.url.startsWith("http")
          ? first.url
          : `/uploads/images/${first.url}`;
      }
      if (first.filename) {
        return first.filename.startsWith("/") ||
          first.filename.startsWith("http")
          ? first.filename
          : `/uploads/images/${first.filename}`;
      }
    }
    if (media.url) {
      return media.url.startsWith("/") || media.url.startsWith("http")
        ? media.url
        : `/uploads/images/${media.url}`;
    }
    return null;
  };

  const refreshPosts = () => {
    if (!currentChannel || !currentChannel._id) return;
    dispatch(
      getChannelPosts({ channelId: currentChannel._id, params: { limit: 20 } }),
    );
  };

  const handleEditPost = async (post) => {
    if (!token) return;
    const newText = prompt("Edit post text", post?.text || "");
    if (newText == null) return;
    const formData = new FormData();
    formData.append("text", newText);
    try {
      await editPostApi(currentChannel._id, post._id, formData, token);
      refreshPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (post) => {
    if (!token) return;
    if (!confirm("Delete this post?")) return;
    try {
      await deletePostApi(currentChannel._id, post._id, token);
      refreshPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleForwardPost = async (post) => {
    if (!token) return;
    const dest = prompt("Forward destination (type:id) e.g. channel:6123");
    if (!dest) return;
    const [type, id] = dest.split(":");
    if (!type || !id) return alert("Invalid destination");
    try {
      await forwardPostApi(currentChannel._id, post._id, { type, id }, token);
      alert("Forwarded successfully!");
      refreshPosts();
    } catch (err) {
      console.error("Forward error:", err);
      alert("Failed to forward post");
    }
  };

  const handlePinPost = async (post) => {
    if (!token) return;
    try {
      if (post.isPinned) {
        await unpinPostApi(currentChannel._id, post._id, token);
      } else {
        await pinPostApi(currentChannel._id, post._id, token);
      }
      refreshPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyPost = (post) => {
    if (post?.text) {
      navigator.clipboard.writeText(post.text);
      alert("Text copied!");
    }
  };

  const handleReactPost = async (post, emoji) => {
    if (!token) return;
    try {
      await reactToPostApi(currentChannel._id, post._id, { emoji }, token);
      refreshPosts();
    } catch (err) {
      console.error("React error:", err);
    }
  };

  const handleAddView = useCallback(async (post, userId) => {
    if (!token || !userId) return;
    try {
      await addViewApi(currentChannel._id, post._id, token);
    } catch (err) {
      console.error("View error:", err);
    }
  }, [token, currentChannel._id]);

  const handleAddComment = async (post, text) => {
    if (!token || !text.trim()) return;
    try {
      await addCommentApi(currentChannel._id, post._id, { text: text.trim() }, token);
      refreshPosts();
    } catch (err) {
      console.error("Comment error:", err);
      alert("Failed to add comment");
    }
  };

  const handleReplyToComment = async (post, commentId, text) => {
    if (!token || !text.trim()) return;
    try {
      await replyToCommentApi(
        currentChannel._id,
        post._id,
        commentId,
        { text: text.trim() },
        token,
      );
      refreshPosts();
    } catch (err) {
      console.error("Reply error:", err);
      alert("Failed to add reply");
    }
  };

  const handleSharePost = (post) => {
    if (navigator.share) {
      navigator
        .share({ title: post.title || "Post", text: post.text || "" })
        .catch(() => {});
    } else if (post?.text) {
      navigator.clipboard.writeText(post.text);
      alert("Post text copied to clipboard for sharing");
    }
  };

  useEffect(() => {
    if (currentChannel && currentChannel._id && isOwnerOrAdmin) {
      dispatch(
        getChannelPosts({
          channelId: currentChannel._id,
          params: { limit: 20 },
        }),
      );
    }
  }, [dispatch, currentChannel, isOwnerOrAdmin]);

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
      <ProfileNav />
      <section className="relative overflow-hidden rounded-3xl border border-[#6fa63a]/30 bg-[linear-gradient(135deg,#f8fdf3_0%,#eef8e8_60%,#e5f2dc_100%)] p-4 shadow-[0_16px_35px_rgba(74,127,74,0.12)]">
        <div className="pointer-events-none absolute -right-10 -top-8 h-28 w-28 rounded-full bg-[#6fa63a]/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-[#4a7f4a]/10 blur-2xl" />

        <div className="relative mb-4 flex items-center justify-between rounded-2xl border border-[#6fa63a]/25 bg-white/65 px-3 py-2">
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
            </div>
          </div>
          <p className="rounded-full bg-[#6fa63a]/15 px-2.5 py-1 text-xs font-medium text-[#2f5b2f]">
            {currentChannel?.membersCount || "--"} members
          </p>
        </div>

        <div className="relative max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {postsStatus === "loading" && <p>Loading posts...</p>}
          {postsStatus === "succeeded" && posts.length === 0 && (
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
          {postsStatus === "succeeded" &&
            (isOwnerOrAdmin ? (
              posts.length === 0 ? (
                <p className="text-sm">No posts yet.</p>
              ) : (
                posts.map((post) => (
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
            ) : posts.length === 0 ? (
              <p className="text-sm">No posts yet.</p>
            ) : (
              posts.map((post) => (
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
    </div>
  );
};

export default Channel;
