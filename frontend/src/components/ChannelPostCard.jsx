import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, ArrowRight, Eye, MoreVertical } from "lucide-react";
import MessageContextMenu from "./MessageContextMenu";
import Reaction from "./Reaction";
import { useSelector } from "react-redux";

const resolveMediaSrc = (media) => {
  const baseURL = "http://localhost:3000";

  if (!media) return null;

  // string filename
  if (typeof media === "string") {
    if (media.startsWith("http")) return media;
    return media.startsWith("/")
      ? `${baseURL}${media}`
      : `${baseURL}/uploads/images/${media}`;
  }

  // array of items
  if (Array.isArray(media) && media.length > 0) {
    const first = media[0];
    if (!first) return null;
    if (typeof first === "string") {
      if (first.startsWith("http")) return first;
      return first.startsWith("/")
        ? `${baseURL}${first}`
        : `${baseURL}/uploads/images/${first}`;
    }
    if (first.url) {
      const url = first.url;
      if (url.startsWith("http")) return url;
      return url.startsWith("/")
        ? `${baseURL}${url}`
        : `${baseURL}/uploads/images/${url}`;
    }
    if (first.filename) {
      const filename = first.filename;
      if (filename.startsWith("http")) return filename;
      return filename.startsWith("/")
        ? `${baseURL}${filename}`
        : `${baseURL}/uploads/images/${filename}`;
    }
  }

  // object with url
  if (media.url) {
    const url = media.url;
    if (url.startsWith("http")) return url;
    return url.startsWith("/")
      ? `${baseURL}${url}`
      : `${baseURL}/uploads/images/${url}`;
  }

  return null;
};

const ChannelPostCard = (props) => {
  const {
    post,
    channel,
    isOwner,
    canEdit = false,
    canDelete = false,
    canPin = false,
    onEdit: onEditProp,
    onDelete: onDeleteProp,
    onForward: onForwardProp,
    onPin: onPinProp,
    onCopy: onCopyProp,
    onReply: onReplyProp,
    onShare: onShareProp,
    onReact: onReactProp,
    onView: onViewProp,
    onAddComment: onAddCommentProp,
  } = props || {};

  const [showMenu, setShowMenu] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyOpen, setReplyOpen] = useState({});
  const [hasViewed, setHasViewed] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [replyError, setReplyError] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingReplyId, setSubmittingReplyId] = useState(null);
  const postRef = useRef(null);
  const currentUser = useSelector((state) => state.auth.user);
  const visibleReactions = (post?.reactions || []).filter(
    (reaction) => Number(reaction?.count) > 0,
  );
  const commentsCount = post?.comments?.length || 0;

  const handleEdit = async () => {
    if (onEditProp) return onEditProp(post);
    const newText = prompt("Edit post text", post?.text || "");
    if (newText == null) return;
    // fallback: emit event or log
    console.log("Edited text:", newText);
  };

  const handleDelete = async () => {
    if (onDeleteProp) return onDeleteProp(post);
    if (!confirm("Delete this post?")) return;
    console.log("Delete post:", post);
  };

  const handleForward = async () => {
    if (onForwardProp) return onForwardProp(post);
    const dest = prompt("Forward destination (type:id) e.g. channel:6123...");
    if (!dest) return;
    console.log("Forward to:", dest, post);
  };

  const handlePin = async () => {
    if (onPinProp) return onPinProp(post);
    console.log("Toggle pin for post:", post);
  };

  const handleCopy = () => {
    if (onCopyProp) return onCopyProp(post);
    if (post?.text) {
      navigator.clipboard.writeText(post.text);
      alert("Text copied!");
    }
  };

  const handleReply = () => {
    if (onReplyProp) return onReplyProp(post);
    console.log("Reply to post:", post);
  };

  const handleShare = () => {
    if (onShareProp) return onShareProp(post);
    if (navigator.share) {
      navigator
        .share({ title: "Post", text: post?.text || "" })
        .catch(() => {});
    } else if (post?.text) {
      navigator.clipboard.writeText(post.text);
      alert("Post text copied to clipboard for sharing");
    }
  };

  useEffect(() => {
    if (!post?._id || !currentUser?._id || !onViewProp) return;

    const alreadyViewed =
      post?.viewedBy?.includes(currentUser?._id) || hasViewed;
    if (alreadyViewed) {
      setHasViewed(true);
      return;
    }

    let viewTimeout = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Start the timer when the post becomes visible
          viewTimeout = setTimeout(() => {
            if (!hasViewed) {
              setHasViewed(true);
              onViewProp(post, currentUser._id);
            }
          }, 1000);
        } else {
          // If the user scrolls away before 1s, cancel the view count
          if (viewTimeout) {
            clearTimeout(viewTimeout);
            viewTimeout = null;
          }
        }
      },
      { threshold: 0.1 },
    );

    if (postRef.current) {
      observer.observe(postRef.current);
    }

    return () => {
      observer.disconnect();
      if (viewTimeout) clearTimeout(viewTimeout);
    };
  }, [post?._id, post?.viewedBy, currentUser?._id, onViewProp]);

  function handleReactSelect(reaction) {
    if (onReactProp) return onReactProp(post, reaction);
    console.log("React selected", reaction, post);
  }

  async function submitComment() {
    if (!commentText || !commentText.trim()) return;

    try {
      setCommentError("");
      setSubmittingComment(true);
      if (onAddCommentProp) await onAddCommentProp(post, commentText.trim());
      setCommentText("");
    } catch (err) {
      setCommentError(
        err?.err || err?.message || "Failed to save comment. Please try again.",
      );
    } finally {
      setSubmittingComment(false);
    }
  }

  async function submitReply(commentId, text) {
    if (!text || !text.trim()) return;

    try {
      setReplyError("");
      setSubmittingReplyId(commentId);
      if (onReplyProp) await onReplyProp(post, commentId, text.trim());
      setReplyOpen((s) => ({ ...s, [commentId]: false }));
    } catch (err) {
      setReplyError(
        err?.err || err?.message || "Failed to save reply. Please try again.",
      );
    } finally {
      setSubmittingReplyId(null);
    }
  }

  if (post) {
    const ch = channel || {};
    return (
      <div
        ref={postRef}
        className="w-full max-w-md rounded-2xl border border-[var(--secondary-color)]/25 bg-[var(--primary-color)] p-4 text-[rgba(23,3,3,0.87)] shadow-sm"
      >
        <p className="rounded-full bg-[var(--secondary-color)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--btn-color)]">
          {ch?.basicInfo?.name || "Tech Nerd"}
        </p>
        {post.media && resolveMediaSrc(post.media) && (
          <img
            src={resolveMediaSrc(post.media)}
            alt="post media"
            className="h-20 w-20 rounded-xl object-cover"
          />
        )}
        <p className="mt-4 text-base leading-relaxed text-[rgba(23,3,3,0.87)]">
          {post.text || "all gotts help your boy out with a marketing tip"}
        </p>

        <div className="mt-3 flex items-center justify-between text-xs text-[rgba(23,3,3,0.6)]">
          <p className="flex items-center gap-1 text-[rgba(23,3,3,0.75)]">
            <Eye size={10} />
            <span className="font-medium text-[rgba(23,3,3,0.87)]">
              {(post.viewedBy?.length || 0) +
                (hasViewed && !post.viewedBy?.includes(currentUser._id)
                  ? 1
                  : 0)}
            </span>
          </p>

          <p>1:24 AM</p>
        </div>
        <div className="flex flex-row justify-around">
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

        <div className="mt-4 flex items-center justify-between rounded-xl bg-white/70 px-3 py-2">
          <div
            className="flex items-center gap-2 text-sm text-[rgba(23,3,3,0.7)] cursor-pointer"
            onClick={() => setShowComments(true)}
          >
            <MessageSquare size={14} />
            <p>{`Read comments${commentsCount ? ` (${commentsCount})` : ""}`}</p>
          </div>
          <Reaction onSelect={handleReactSelect} />
          <MoreVertical
            size={25}
            onClick={() => setShowMenu(true)}
            className="group-hover:opacity-100 transition p-1 rounded-full text-green cursor-pointer"
          />
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
          <button
            type="button"
            className="text-xs text-blue-700 underline-offset-2 hover:underline"
            onClick={() => setShowComments((v) => !v)}
          >
            {showComments
              ? "Hide comments"
              : `Read comments${commentsCount ? ` (${commentsCount})` : ""}`}
          </button>

          {showComments && (
            <div className="space-y-2 mt-2">
              {(post.comments || []).map((c) => (
                <div
                  key={c._id || c.createdAt}
                  className="rounded-md border p-2 bg-white/80"
                >
                  <div className="text-sm font-medium">{c.text}</div>
                  <div className="text-xs text-gray-500">
                    by {c.authorId || "user"}
                  </div>
                  <div className="mt-2">
                    {(c.replies || []).map((r) => (
                      <div
                        key={r._id || r.createdAt}
                        className="ml-3 text-sm text-gray-700"
                      >
                        {r.text}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() =>
                        setReplyOpen((s) => ({
                          ...s,
                          [c._id || c.createdAt]: true,
                        }))
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
                              submitReply(c._id, e.target.value);
                              e.target.value = "";
                            }
                          }}
                        />
                        <button
                          onClick={(e) => {
                            const input = e.target.previousElementSibling;
                            submitReply(c._id, input.value);
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

          {commentError && (
            <p className="mt-2 text-xs text-red-600">{commentError}</p>
          )}
          {replyError && <p className="mt-2 text-xs text-red-600">{replyError}</p>}

          {showComments && commentsCount === 0 && (
            <p className="mt-2 text-xs text-gray-500">No comments yet</p>
          )}
          <div className="mt-2 flex gap-2">
            <input
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
        </div>
      </div>
    );
  }
};

export default ChannelPostCard;
