import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  FileIcon,
  ImageIcon,
  LinkIcon,
  MoreVertical,
  Music2Icon,
  Pen,
  Plus,
  VoicemailIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../Redux/userRedux/authSelector";
import {
  selectAddStoryStatus,
  selectUserStories,
  selectUserStoriesStatus,
} from "../Redux/storyRedux/storySelector";
import { addStory, listUserStories } from "../Redux/storyRedux/storyThunk";
import Story from "./Story";
import { resolveProfileUrl, toInitials } from "../utils/media";

const mediaItems = [
  { icon: ImageIcon, label: "Photos & Videos", count: 0 },
  { icon: FileIcon, label: "Files", count: 0 },
  { icon: LinkIcon, label: "Links", count: 0 },
  { icon: Music2Icon, label: "Music", count: 0 },
  { icon: VoicemailIcon, label: "Voices", count: 0 },
];

const MyProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const userStories = useSelector(selectUserStories);
  const userStoriesStatus = useSelector(selectUserStoriesStatus);
  const addStoryStatus = useSelector(selectAddStoryStatus);
  const fileRef = useRef(null);
  const [storyCaption, setStoryCaption] = useState("");
  const [storyPrivacy, setStoryPrivacy] = useState("contacts");

  const displayName =
    `${user?.identity?.firstName || ""} ${user?.identity?.lastName || ""}`.trim() ||
    user?.identity?.username ||
    "Guest";
  const username = user?.identity?.username || "guest";
  const phone = user?.identity?.mobileNumber || "Not set";
  const bio = user?.identity?.bio || "No bio yet";
  const status = user?.AccountStatus?.onlineStatus || "offline";
  const profileUrl = resolveProfileUrl(user?.identity?.profileUrl);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) {
      dispatch(listUserStories({ userId, params: { limit: 20 } }));
    }
  }, [dispatch, user?._id, user?.id]);

  const handleOpenStoryPicker = () => {
    fileRef.current?.click();
  };

  const handleCreateStory = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("media", file);
    if (storyCaption.trim()) formData.append("caption", storyCaption.trim());
    if (storyPrivacy) formData.append("privacy", storyPrivacy);
    const result = await dispatch(addStory(formData));
    if (addStory.fulfilled.match(result)) {
      setStoryCaption("");
      const userId = user?._id || user?.id;
      if (userId) {
        dispatch(listUserStories({ userId, params: { limit: 20 } }));
      }
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] px-3 py-2 shadow-[0_10px_30px_rgba(74,127,74,0.12)]">
        <button type="button" onClick={() => navigate("/home")}>
          <ArrowLeft size={16} />
        </button>
        <p className="text-sm font-semibold text-[rgba(23,3,3,0.87)]">Profile</p>
        <div className="flex items-center gap-2">
          <Pen size={15} />
          <MoreVertical size={15} />
        </div>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-[#6fa63a]/30 bg-[linear-gradient(130deg,#f8fdf3_0%,#eef8e8_55%,#e2f0d7_100%)] p-5 shadow-[0_16px_34px_rgba(74,127,74,0.12)]">
        <div className="relative flex items-center gap-4">
          {profileUrl ? (
            <img
              src={profileUrl}
              alt={displayName}
              className="h-20 w-20 rounded-full border border-[#6fa63a]/35 object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#6fa63a]/35 bg-[#eaf4e2] text-xl font-semibold text-[#4a7f4a]">
              {toInitials(displayName) || "U"}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-[rgba(23,3,3,0.9)]">{displayName}</h2>
            <p className="text-sm text-[rgba(23,3,3,0.7)]">@{username}</p>
            <span className="mt-1 inline-block rounded-full bg-[#6fa63a]/20 px-2 py-0.5 text-xs font-semibold text-[#2f5b2f]">
              {status}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-4 shadow-[0_10px_28px_rgba(74,127,74,0.12)]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#4a7f4a]">
          Info
        </p>
        <div className="space-y-2">
          <div className="rounded-xl border border-[#6fa63a]/20 bg-white/80 px-3 py-2">
            <p className="text-sm font-semibold text-[rgba(23,3,3,0.88)]">{phone}</p>
            <p className="text-xs text-[rgba(23,3,3,0.65)]">Mobile</p>
          </div>
          <div className="rounded-xl border border-[#6fa63a]/20 bg-white/80 px-3 py-2">
            <p className="text-sm font-semibold text-[rgba(23,3,3,0.88)]">{bio}</p>
            <p className="text-xs text-[rgba(23,3,3,0.65)]">Bio</p>
          </div>
          <div className="rounded-xl border border-[#6fa63a]/20 bg-white/80 px-3 py-2">
            <p className="text-sm font-semibold text-[rgba(23,3,3,0.88)]">@{username}</p>
            <p className="text-xs text-[rgba(23,3,3,0.65)]">Username</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-4 shadow-[0_10px_28px_rgba(74,127,74,0.12)]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#4a7f4a]">
          Shared Media
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {mediaItems.map(({ icon: Icon, label, count }) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl border border-[#6fa63a]/20 bg-white/80 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Icon size={14} className="text-[#4a7f4a]" />
                <p className="text-sm text-[rgba(23,3,3,0.85)]">{label}</p>
              </div>
              <span className="rounded-full bg-[#6fa63a]/15 px-2 py-0.5 text-xs font-semibold text-[#2f5b2f]">
                {count}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-4 shadow-[0_10px_28px_rgba(74,127,74,0.12)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4a7f4a]">
            Stories
          </p>
          <button
            type="button"
            onClick={handleOpenStoryPicker}
            disabled={addStoryStatus === "loading"}
            className="inline-flex items-center gap-1 rounded-full bg-[#4a7f4a] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#3f6e3f] disabled:opacity-60"
          >
            <Plus size={12} />
            {addStoryStatus === "loading" ? "Posting..." : "Add Story"}
          </button>
        </div>
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_140px]">
          <input
            type="text"
            value={storyCaption}
            onChange={(e) => setStoryCaption(e.target.value)}
            placeholder="Story caption (optional)"
            className="rounded-lg border border-[#6fa63a]/25 bg-white px-3 py-2 text-sm outline-none focus:border-[#4a7f4a]"
          />
          <select
            value={storyPrivacy}
            onChange={(e) => setStoryPrivacy(e.target.value)}
            className="rounded-lg border border-[#6fa63a]/25 bg-white px-2 py-2 text-sm outline-none focus:border-[#4a7f4a]"
          >
            <option value="public">public</option>
            <option value="contacts">contacts</option>
            <option value="closeFriends">closeFriends</option>
          </select>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleCreateStory}
        />

        {userStoriesStatus === "loading" && (
          <p className="text-xs text-[rgba(23,3,3,0.62)]">Loading stories...</p>
        )}
        {userStoriesStatus !== "loading" && userStories.length === 0 && (
          <p className="text-xs text-[rgba(23,3,3,0.62)]">
            No stories yet. Add your first story.
          </p>
        )}
        <div className="space-y-1">
          {userStories.map((story) => (
            <Story key={story._id} story={story} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default MyProfile;
