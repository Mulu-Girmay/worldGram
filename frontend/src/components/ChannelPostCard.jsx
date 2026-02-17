import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Eye, MoreVertical } from "lucide-react";
import MessageContextMenu from "./MessageContextMenu";
import Reaction from "./Reaction";
import { useSelector } from "react-redux";
import { useToast } from "./ToastProvider";
import { resolveMediaUrl } from "../utils/media";

const QUICK_REACTIONS = ["👍", "❤️", "🔥", "😂", "😍", "😮"];

const resolveMediaSrc = (media) => {
  if (!media) return null;
  if (typeof media === "string") return resolveMediaUrl(media, "image");
  if (Array.isArray(media) && media.length > 0) {
    const first = media[0];
    if (!first) return null;
    if (typeof first === "string") return resolveMediaUrl(first, "image");
    if (first.url) return resolveMediaUrl(first.url, "image");
    if (first.filename) return resolveMediaUrl(first.filename, "image");
  }
  if (media.url) return resolveMediaUrl(media.url, "image");
  return null;
};

const ChannelPostCard = ({
  post,
  channel,
  canEdit = false,
  canDelete = false,
  canPin = false,
  onEdit,
  onDelete,
  onForward,
  onPin,
  onCopy,
  onReply,
  onShare,
  onReact,
  onView,
  onAddComment,
  allowedReactions = [],
  commentsEnabled = true,
  contentProtection = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyOpen, setReplyOpen] = useState({});
  const [hasViewed, setHasViewed] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post?.text || "");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [replyError, setReplyError] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingReplyId, setSubmittingReplyId] = useState(null);
  const [actionBusy, setActionBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const [displayReactions, setDisplayReactions] = useState(post?.reactions || []);
  const [displayComments, setDisplayComments] = useState(post?.comments || []);
  const postRef = useRef(null);
  const commentInputRef = useRef(null);
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?._id?.toString?.() || "";
  const visibleReactions = (displayReactions || []).filter(
    (reaction) => Number(reaction?.count) > 0,
  );
  const commentsCount = displayComments?.length || 0;
  const signature = post?.authorSignature;

  const resolveAuthorLabel = (author) => {
    if (!author) return "Unknown user";
    if (typeof author === "object") {
      const directFirst = author?.firstName || "";
      const directLast = author?.lastName || "";
      const directFull = `${directFirst} ${directLast}`.trim();
      if (directFull) return directFull;
      if (author?.username) return `@${author.username}`;
      const first = author?.identity?.firstName || "";
      const last = author?.identity?.lastName || "";
      const full = `${first} ${last}`.trim();
      if (full) return full;
      if (author?.identity?.username) return `@${author.identity.username}`;
      if (author?._id && String(author._id) === currentUserId) return "You";
      return "Unknown user";
    }
    const raw = String(author);
    if (raw === currentUserId) return "You";
    if (/^[a-f0-9]{24}$/i.test(raw)) return "Unknown user";
    return raw;
  };

  useEffect(() => {
    setEditText(post?.text || "");
    setIsEditing(false);
    setEditSaving(false);
    setEditError("");
  }, [post?._id, post?.text]);

  useEffect(() => {
    setDisplayReactions(post?.reactions || []);
  }, [post?._id, post?.reactions]);

  useEffect(() => {
    setDisplayComments(post?.comments || []);
  }, [post?._id, post?.comments]);

  const handleEdit = async () => {
    setEditError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditText(post?.text || "");
    setIsEditing(false);
    setEditError("");
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      setEditError("Post text cannot be empty.");
      return;
    }
    try {
      setEditSaving(true);
      setEditError("");
      if (onEdit) await onEdit(post, editText.trim());
      setIsEditing(false);
    } catch (err) {
      setEditError(err?.err || err?.message || "Failed to update post.");
    } finally {
      setEditSaving(false);
    }
  };

  const guardedAction = async (type, actionFn, blockedMessage) => {
    if (blockedMessage) {
      toastInfo(blockedMessage);
      return;
    }
    setActionError("");
    setActionBusy(type);
    try {
      await actionFn();
    } catch (err) {
      setActionError(err?.err || err?.message || `${type} failed.`);
    } finally {
      setActionBusy("");
    }
  };

  const handleDelete = async () =>
    guardedAction("delete", async () => {
      if (onDelete) return onDelete(post);
    });

  const handleForward = async () =>
    guardedAction(
      "forward",
      async () => {
        if (onForward) return onForward(post);
      },
      contentProtection ? "Forwarding is disabled by channel content protection." : "",
    );

  const handlePin = async () =>
    guardedAction("pin", async () => {
      if (onPin) return onPin(post);
    });

  const handleCopy = () => {
    if (contentProtection) {
      toastInfo("Copy is disabled by channel content protection.");
      return;
    }
    if (onCopy) return onCopy(post);
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

  const handleReply = () => {
    if (!commentsEnabled) {
      toastInfo("Comments are disabled for this channel.");
      return;
    }
    setShowComments(true);
    setTimeout(() => commentInputRef.current?.focus(), 0);
    if (onReply) return onReply(post);
  };

  const handleShare = () => {
    if (contentProtection) {
      toastInfo("Sharing is disabled by channel content protection.");
      return;
    }
    if (onShare) return onShare(post);
  };

  useEffect(() => {
    if (!post?._id || !currentUserId || !onView) return;
    const alreadyViewed = post?.viewedBy?.includes(currentUserId) || hasViewed;
    if (alreadyViewed) {
      setHasViewed(true);
      return;
    }
    let viewTimeout = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          viewTimeout = setTimeout(() => {
            if (!hasViewed) {
              setHasViewed(true);
              onView(post, currentUserId);
            }
          }, 1000);
        } else if (viewTimeout) {
          clearTimeout(viewTimeout);
          viewTimeout = null;
        }
      },
      { threshold: 0.1 },
    );

    if (postRef.current) observer.observe(postRef.current);
    return () => {
      observer.disconnect();
      if (viewTimeout) clearTimeout(viewTimeout);
    };
  }, [post?._id, post?.viewedBy, currentUserId, onView, hasViewed, post]);

  const applyOptimisticReaction = (existingReactions, emoji) => {
    const next = (existingReactions || []).map((reaction) => ({
      ...reaction,
      reactors: Array.isArray(reaction?.reactors) ? [...reaction.reactors] : [],
    }));
    const previousIndex = next.findIndex((reaction) =>
      reaction.reactors
        .map((id) => id?.toString?.() || id)
        .includes(currentUserId),
    );
    if (previousIndex >= 0) {
      const previous = next[previousIndex];
      const prevEmoji = previous?.emoji;
      previous.reactors = previous.reactors.filter(
        (id) => (id?.toString?.() || id) !== currentUserId,
      );
      previous.count = Math.max(0, Number(previous?.count || 0) - 1);
      if (prevEmoji === emoji) return next;
    }
    const targetIndex = next.findIndex((reaction) => reaction?.emoji === emoji);
    if (targetIndex >= 0) {
      const target = next[targetIndex];
      if (
        !target.reactors
          .map((id) => id?.toString?.() || id)
          .includes(currentUserId)
      ) {
        target.reactors.push(currentUserId);
        target.count = Number(target?.count || 0) + 1;
      }
      return next;
    }
    return [...next, { emoji, count: 1, reactors: [currentUserId] }];
  };

  const handleReactSelect = async (reaction) => {
    const available = allowedReactions?.length ? allowedReactions : QUICK_REACTIONS;
    if (!available.includes(reaction)) {
      toastInfo("This reaction is not allowed in this channel.");
      return;
    }
    const before = displayReactions;
    setActionError("");
    setDisplayReactions((prev) => applyOptimisticReaction(prev, reaction));
    setActionBusy("reaction");
    try {
      if (onReact) await onReact(post, reaction);
    } catch (err) {
      setDisplayReactions(before);
      setActionError(err?.err || err?.message || "Reaction failed.");
    } finally {
      setActionBusy("");
    }
  };

  const submitComment = async () => {
    if (!commentsEnabled) {
      toastInfo("Comments are disabled for this channel.");
      return;
    }
    if (!commentText || !commentText.trim()) return;
    const tempComment = {
      _id: `temp-comment-${Date.now()}`,
      authorId: currentUserId || "you",
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
      replies: [],
      optimistic: true,
    };
    try {
      setCommentError("");
      setSubmittingComment(true);
      setDisplayComments((prev) => [...(prev || []), tempComment]);
      if (onAddComment) await onAddComment(post, commentText.trim());
      setCommentText("");
    } catch (err) {
      setDisplayComments((prev) =>
        (prev || []).filter((c) => c._id !== tempComment._id),
      );
      setCommentError(
        err?.err || err?.message || "Failed to save comment. Please try again.",
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  const submitReply = async (commentId, text) => {
    if (!commentsEnabled) {
      toastInfo("Replies are disabled for this channel.");
      return;
    }
    if (!text || !text.trim()) return;
    const tempReplyId = `temp-reply-${Date.now()}`;
    const tempReply = {
      _id: tempReplyId,
      authorId: currentUserId || "you",
      text: text.trim(),
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    try {
      setReplyError("");
      setSubmittingReplyId(commentId);
      setDisplayComments((prev) =>
        (prev || []).map((comment) =>
          (comment?._id || comment?.createdAt) === commentId
            ? { ...comment, replies: [...(comment?.replies || []), tempReply] }
            : comment,
        ),
      );
      if (onReply) await onReply(post, commentId, text.trim());
      setReplyOpen((s) => ({ ...s, [commentId]: false }));
    } catch (err) {
      setDisplayComments((prev) =>
        (prev || []).map((comment) =>
          (comment?._id || comment?.createdAt) === commentId
            ? {
                ...comment,
                replies: (comment?.replies || []).filter(
                  (reply) => reply?._id !== tempReplyId,
                ),
              }
            : comment,
        ),
      );
      setReplyError(
        err?.err || err?.message || "Failed to save reply. Please try again.",
      );
    } finally {
      setSubmittingReplyId(null);
    }
  };

  if (!post) return null;
  const ch = channel || {};
  const reactionOptions = allowedReactions?.length ? allowedReactions : QUICK_REACTIONS;
  return (
    <div
      ref={postRef}
      className="w-full max-w-md rounded-2xl border border-[var(--secondary-color)]/25 bg-[var(--primary-color)] p-4 text-[rgba(23,3,3,0.87)] shadow-sm"
    >
      <div className="flex items-center justify-between">
        <p className="rounded-full bg-[var(--secondary-color)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--btn-color)]">
          {ch?.basicInfo?.name || "Channel"}
        </p>
        {post?.isSilent && (
          <span className="text-[10px] text-[rgba(23,3,3,0.65)]">Silent</span>
        )}
      </div>
      {signature?.show && (
        <p className="mt-1 text-[11px] text-[rgba(23,3,3,0.65)]">
          {signature?.title || "Channel admin"}
        </p>
      )}

      {post.media && resolveMediaSrc(post.media) && (
        <img
          src={resolveMediaSrc(post.media)}
          alt="post media"
          className="mt-3 h-20 w-20 rounded-xl object-cover"
          draggable={false}
          onContextMenu={(e) => {
            if (contentProtection) e.preventDefault();
          }}
        />
      )}
      {isEditing ? (
        <div className="mt-4 space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full min-h-[90px] resize-y rounded-lg border border-[#6fa63a]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#4a7f4a] focus:ring-2 focus:ring-[#6fa63a]/20"
            placeholder="Edit post..."
            disabled={editSaving}
          />
          {editError && <p className="text-xs text-red-600">{editError}</p>}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={editSaving || !editText.trim()}
              className="rounded-md bg-[#4a7f4a] px-3 py-1.5 text-xs text-white disabled:opacity-60"
            >
              {editSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={editSaving}
              className="rounded-md border border-[#6fa63a]/35 px-3 py-1.5 text-xs text-[#2f5b2f] hover:bg-[#f3f9ee] disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-base leading-relaxed text-[rgba(23,3,3,0.87)]">
          {post.text || ""}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-[rgba(23,3,3,0.6)]">
        <p className="flex items-center gap-1 text-[rgba(23,3,3,0.75)]">
          <Eye size={10} />
          <span className="font-medium text-[rgba(23,3,3,0.87)]">
            {(post.viewedBy?.length || 0) +
              (hasViewed && !post.viewedBy?.includes(currentUserId) ? 1 : 0)}
          </span>
        </p>
        <p>{post?.createdAt ? new Date(post.createdAt).toLocaleTimeString() : ""}</p>
      </div>

      <div className="mt-2 flex flex-row justify-around">
        {visibleReactions.length > 0 ? (
          visibleReactions.map((reaction, index) => (
            <p key={index}>
              {reaction.emoji} {reaction.count}
            </p>
          ))
        ) : (
          <p className="text-xs text-gray-500">No reactions yet</p>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {reactionOptions.map((reaction) => (
          <button
            key={`${post?._id}-${reaction}`}
            type="button"
            onClick={() => handleReactSelect(reaction)}
            className="rounded-full border border-[#6fa63a]/35 bg-[#f8fdf3] px-2 py-0.5 text-xs text-[rgba(23,3,3,0.85)] transition hover:bg-[#eef8e8]"
          >
            {reaction}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-white/70 px-3 py-2">
        <button
          type="button"
          className="flex items-center gap-2 text-sm text-[rgba(23,3,3,0.7)] disabled:opacity-60"
          onClick={() => setShowComments((v) => !v)}
          disabled={!commentsEnabled}
        >
          <MessageSquare size={14} />
          <p>
            {!commentsEnabled
              ? "Comments disabled"
              : showComments
                ? "Hide comments"
                : `Read comments${commentsCount ? ` (${commentsCount})` : ""}`}
          </p>
        </button>
        <Reaction onSelect={handleReactSelect} />
        <button
          type="button"
          aria-label="Post actions"
          onClick={() => setShowMenu(true)}
          className="rounded-full p-1 transition hover:bg-slate-100"
        >
          <MoreVertical size={20} />
        </button>
      </div>

      <MessageContextMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        message={post}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onForward={handleForward}
        onPin={handlePin}
        onCopy={handleCopy}
        onReply={handleReply}
        onShare={handleShare}
        canEdit={canEdit}
        canDelete={canDelete}
        canPin={canPin}
      />

      <div className="mt-3">
        {actionBusy && (
          <p className="mb-2 text-xs text-[rgba(23,3,3,0.6)]">
            {actionBusy === "reaction" && "Updating reaction..."}
            {actionBusy === "delete" && "Deleting post..."}
            {actionBusy === "pin" && "Updating pin..."}
            {actionBusy === "forward" && "Forwarding..."}
          </p>
        )}
        {actionError && <p className="mb-2 text-xs text-red-600">{actionError}</p>}

        {showComments && commentsEnabled && (
          <div className="space-y-2 mt-2">
            {(displayComments || []).map((c) => (
              <div key={c._id || c.createdAt} className="rounded-md border p-2 bg-white/80">
                <div className="text-sm font-medium">{c.text}</div>
                <div className="text-xs text-gray-500">
                  by {resolveAuthorLabel(c.authorId)}
                </div>
                <div className="mt-2">
                  {(c.replies || []).map((r) => (
                    <div key={r._id || r.createdAt} className="ml-3 text-sm text-gray-700">
                      {r.text}
                      <div className="text-[11px] text-gray-500">
                        by {resolveAuthorLabel(r.authorId)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() =>
                      setReplyOpen((s) => ({ ...s, [c._id || c.createdAt]: true }))
                    }
                    className="text-xs text-blue-600"
                  >
                    Reply
                  </button>
                  {replyOpen[c._id || c.createdAt] && (
                    <div className="flex gap-2 mt-2">
                      <input
                        placeholder="Write reply"
                        className="flex-1 rounded border px-2 py-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            submitReply(c._id || c.createdAt, e.target.value);
                            e.target.value = "";
                          }
                        }}
                      />
                      <button
                        onClick={(e) => {
                          const input = e.target.previousElementSibling;
                          submitReply(c._id || c.createdAt, input.value);
                          input.value = "";
                        }}
                        disabled={submittingReplyId === c._id}
                        className="text-xs text-green-600 px-2 py-1 rounded border hover:bg-green-50 disabled:opacity-60"
                      >
                        {submittingReplyId === c._id ? "Sending..." : "Send"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {commentError && <p className="mt-2 text-xs text-red-600">{commentError}</p>}
        {replyError && <p className="mt-2 text-xs text-red-600">{replyError}</p>}
        {showComments && commentsEnabled && commentsCount === 0 && (
          <p className="mt-2 text-xs text-gray-500">No comments yet</p>
        )}

        {commentsEnabled && (
          <div className="mt-2 flex gap-2">
            <input
              ref={commentInputRef}
              id={`comment-input-${post._id}`}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment"
              className="flex-1 rounded border px-2 py-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitComment();
                }
              }}
            />
            <button
              onClick={submitComment}
              className="text-sm text-green-600 px-2 py-1 rounded border hover:bg-green-50 disabled:opacity-60"
              disabled={!commentText.trim() || submittingComment}
            >
              {submittingComment ? "Posting..." : "Post"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelPostCard;
