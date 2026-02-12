import React, { useEffect, useState } from "react";
import { ProfileNav } from "./Profile";
import { Bell, FileBoxIcon, Instagram, SendHorizontal } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  getChannelPosts,
  addPost,
  reactToPost,
  addView,
} from "../Redux/postRedux/postThunk";
import {
  selectPosts,
  selectPostsStatus,
} from "../Redux/postRedux/postSelector";
import { selectCurrentChannel } from "../Redux/channelRedux/channelSelector";
import { selectUser } from "../Redux/userRedux/authSelector";

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

  const PostItem = ({ post, isOwner }) => {
    return (
      <article className="rounded-2xl border border-[#6fa63a]/25 bg-white p-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-[#4a7f4a] text-white grid place-items-center font-bold">
            {(post.authorName || "U").charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold truncate">
                {post.title || post.authorName || "Post"}
              </h4>
              <span className="text-xs text-[rgba(23,3,3,0.6)]">
                {new Date(post.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-2 text-sm text-[rgba(23,3,3,0.8)]">{post.text}</p>
            {post.media && (
              <img
                src={`/uploads/images/${post.media}`}
                alt="post media"
                className="mt-2 max-h-48 w-full object-cover rounded-md"
              />
            )}
            {isOwner && (
              <div className="mt-2 flex gap-2">
                <button className="text-xs text-[#4a7f4a]">Edit</button>
                <button className="text-xs text-red-500">Delete</button>
                <button className="text-xs">Pin</button>
              </div>
            )}
          </div>
        </div>
      </article>
    );
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
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4a7f4a]">
              Channel Feed
            </p>
            <p className="text-sm font-semibold text-[rgba(23,3,3,0.87)]">
              {currentChannel?.basicInfo?.name || "Select a channel"}
            </p>
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
                  <PostItem key={post._id} post={post} isOwner={true} />
                ))
              )
            ) : posts.length === 0 ? (
              <p className="text-sm">No posts yet.</p>
            ) : (
              posts.map((post) => (
                <article
                  key={post._id}
                  className="rounded-2xl border border-[#6fa63a]/25 bg-white p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#4a7f4a] text-white grid place-items-center font-bold">
                      {(post.authorName || "U").charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold truncate">
                          {post.title || post.authorName || "Post"}
                        </h4>
                        <span className="text-xs text-[rgba(23,3,3,0.6)]">
                          {new Date(post.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[rgba(23,3,3,0.8)]">
                        {post.text}
                      </p>
                      {post.media && (
                        <img
                          src={`/uploads/images/${post.media}`}
                          alt="post media"
                          className="mt-2 max-h-48 w-full object-cover rounded-md"
                        />
                      )}
                    </div>
                  </div>
                </article>
              ))
            ))}
        </div>

        {isOwnerOrAdmin && (
          <form
            onSubmit={handleSubmit}
            className="relative mt-4 rounded-2xl border border-[#6fa63a]/30 bg-white/75 p-3 backdrop-blur-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[#4a7f4a] text-xs font-bold text-white">
                SC
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
