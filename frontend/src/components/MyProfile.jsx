import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Crown,
  FileIcon,
  Globe,
  ImageIcon,
  Lock,
  LinkIcon,
  Loader2,
  MoreVertical,
  Music2Icon,
  Pen,
  Plus,
  VoicemailIcon,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAuthError,
  selectUpdateProfileStatus,
  selectUser,
} from "../Redux/userRedux/authSelector";
import {
  selectAddStoryStatus,
  selectHighlights,
  selectHighlightsStatus,
  selectUserStories,
  selectUserStoriesStatus,
} from "../Redux/storyRedux/storySelector";
import {
  addStory,
  listHighlights,
  listUserStories,
} from "../Redux/storyRedux/storyThunk";
import { logoutUser, updateProfile } from "../Redux/userRedux/authThunk";
import Story from "./Story";
import { resolveMediaUrl, resolveProfileUrl, toInitials } from "../utils/media";
import { getMessagesApi, listChatsApi } from "../api/chatApi";
import { useToast } from "./ToastProvider";

const mediaItemsBase = [
  { icon: ImageIcon, key: "photosVideos", label: "Photos & Videos" },
  { icon: FileIcon, key: "files", label: "Files" },
  { icon: LinkIcon, key: "links", label: "Links" },
  { icon: Music2Icon, key: "music", label: "Music" },
  { icon: VoicemailIcon, key: "voices", label: "Voices" },
];

const EMPTY_MEDIA_COUNTS = {
  photosVideos: 0,
  files: 0,
  links: 0,
  music: 0,
  voices: 0,
};

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const extractExtension = (value = "") => {
  const clean = String(value || "").split("?")[0].toLowerCase();
  const index = clean.lastIndexOf(".");
  return index >= 0 ? clean.slice(index + 1) : "";
};

const countLinksFromText = (text = "") => {
  const matches = String(text).match(/https?:\/\/[^\s]+/gi);
  return matches ? matches.length : 0;
};

const MyProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const user = useSelector(selectUser);
  const accessToken = useSelector((state) => state.auth?.accessToken || null);
  const userStories = useSelector(selectUserStories);
  const highlights = useSelector(selectHighlights);
  const highlightsStatus = useSelector(selectHighlightsStatus);
  const userStoriesStatus = useSelector(selectUserStoriesStatus);
  const addStoryStatus = useSelector(selectAddStoryStatus);
  const updateStatus = useSelector(selectUpdateProfileStatus);
  const authError = useSelector(selectAuthError);
  const fileRef = useRef(null);
  const avatarInputRef = useRef(null);
  const storiesSectionRef = useRef(null);
  const menuRef = useRef(null);
  const [storyCaption, setStoryCaption] = useState("");
  const [storyPrivacy, setStoryPrivacy] = useState("contacts");
  const [storyDurationHours, setStoryDurationHours] = useState("24");
  const [selectedViewerIdsText, setSelectedViewerIdsText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPhoneEdit, setIsPhoneEdit] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phoneNumber: "",
    Bio: "",
    bioLink: "",
    personalChannelUsername: "",
    emojiStatus: "",
    isPremium: false,
    profileUrl: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [editFeedback, setEditFeedback] = useState("");
  const [sharedMediaCounts, setSharedMediaCounts] = useState(EMPTY_MEDIA_COUNTS);
  const [sharedMediaStatus, setSharedMediaStatus] = useState("idle");
  const [sharedMediaItems, setSharedMediaItems] = useState([]);
  const [sharedSearchTerm, setSharedSearchTerm] = useState("");

  const displayName =
    `${user?.identity?.firstName || ""} ${user?.identity?.lastName || ""}`.trim() ||
    user?.identity?.username ||
    "Guest";
  const username = user?.identity?.username || "guest";
  const phone = user?.identity?.phoneNumber || user?.identity?.mobileNumber || "";
  const bio = user?.identity?.Bio || user?.identity?.bio || "No bio yet";
  const status = user?.AccountStatus?.onlineStatus || "offline";
  const isPremium = Boolean(user?.AccountStatus?.isPremium);
  const emojiStatus = user?.identity?.emojiStatus || "";
  const profileUrl = resolveProfileUrl(user?.identity?.profileUrl);
  const currentUserId = normalizeId(user?._id || user?.id);
  const hasActiveStory = (userStories || []).length > 0;
  const phonePrivacy = user?.privacySettings?.privacyPhoneNumber || "contacts";
  const lastSeenPrivacy = user?.privacySettings?.privacyLastSeen || "contacts";
  const lastSeenLabel =
    user?.AccountStatus?.lastSeenAt
      ? new Date(user.AccountStatus.lastSeenAt).toLocaleString()
      : status === "online"
        ? "Online"
        : "Recently";

  const getPrivacyIcon = (privacy) =>
    privacy === "everyone" ? Globe : Lock;

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) {
      dispatch(listUserStories({ userId, params: { limit: 20 } }));
      dispatch(listHighlights(userId));
    }
  }, [dispatch, user?._id, user?.id]);

  useEffect(() => {
    if (!user) return;
    setEditForm({
      firstName: user?.identity?.firstName || "",
      lastName: user?.identity?.lastName || "",
      username: user?.identity?.username || "",
      phoneNumber: user?.identity?.phoneNumber || "",
      Bio: user?.identity?.Bio || user?.identity?.bio || "",
      bioLink: user?.identity?.bioLink || "",
      personalChannelUsername: user?.identity?.personalChannelUsername || "",
      emojiStatus: user?.identity?.emojiStatus || "",
      isPremium: Boolean(user?.AccountStatus?.isPremium),
      profileUrl: user?.identity?.profileUrl || "",
    });
    setPhoneDraft(user?.identity?.phoneNumber || "");
  }, [user]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    let cancelled = false;

    const inferMediaBucket = (message) => {
      const contentType = String(message?.content?.ContentType || "").toLowerCase();
      const mediaURL = message?.content?.mediaURL || "";
      const fileName = message?.content?.fileName || "";
      const duration = Number(message?.content?.duration || 0);
      const ext = extractExtension(fileName || mediaURL);

      if (contentType === "image" || contentType === "video") return "photosVideos";
      if (contentType === "voice") return "voices";
      if (contentType === "audio") {
        if (duration > 0) return "voices";
        return "music";
      }
      if (contentType === "file") {
        if (["mp3", "wav", "flac", "aac", "m4a", "ogg"].includes(ext)) {
          return "music";
        }
        return "files";
      }

      if (mediaURL) {
        if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "mp4", "mov", "webm"].includes(ext)) {
          return "photosVideos";
        }
        if (["mp3", "wav", "flac", "aac", "m4a"].includes(ext)) return "music";
        if (["ogg", "opus"].includes(ext) && duration > 0) return "voices";
        return "files";
      }

      return null;
    };

    const fetchSharedMedia = async () => {
      if (!currentUserId) {
        setSharedMediaCounts(EMPTY_MEDIA_COUNTS);
        return;
      }

      setSharedMediaStatus("loading");
      try {
        const chatsData = await listChatsApi({ limit: 100 }, accessToken);
        const chats = Array.isArray(chatsData?.items) ? chatsData.items : [];
        const messageResponses = await Promise.all(
          chats.map((chat) =>
            getMessagesApi(chat?._id, accessToken).catch(() => []),
          ),
        );

        const nextCounts = { ...EMPTY_MEDIA_COUNTS };
        const nextItems = [];

        messageResponses.forEach((response) => {
          const messages = Array.isArray(response) ? response : [];
          messages.forEach((message) => {
            const senderId = normalizeId(message?.identity?.senderId);
            if (senderId !== currentUserId) return;

            nextCounts.links += countLinksFromText(message?.content?.text || "");
            const bucket = inferMediaBucket(message);
            if (bucket) nextCounts[bucket] += 1;

            nextItems.push({
              id: message?._id || `${bucket}-${Math.random()}`,
              text: message?.content?.text || "",
              mediaURL: message?.content?.mediaURL || "",
              fileName: message?.content?.fileName || "",
              contentType: message?.content?.ContentType || "",
              bucket: bucket || "text",
            });
          });
        });

        if (!cancelled) {
          setSharedMediaCounts(nextCounts);
          setSharedMediaItems(nextItems);
          setSharedMediaStatus("succeeded");
        }
      } catch (err) {
        if (!cancelled) {
          setSharedMediaStatus("failed");
        }
      }
    };

    fetchSharedMedia();
    const timer = setInterval(fetchSharedMedia, 15000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [accessToken, currentUserId]);

  const handleOpenStoryPicker = () => {
    fileRef.current?.click();
  };

  const handleAvatarStoryOpen = () => {
    if (hasActiveStory && userStories[0]?._id) {
      navigate("/story", {
        state: { storyId: userStories[0]._id, authorId: currentUserId },
      });
      return;
    }
    handleOpenStoryPicker();
  };

  const sharedFilteredItems = sharedMediaItems.filter((item) => {
    const q = sharedSearchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      String(item.text || "").toLowerCase().includes(q) ||
      String(item.fileName || "").toLowerCase().includes(q) ||
      String(item.mediaURL || "").toLowerCase().includes(q) ||
      String(item.contentType || "").toLowerCase().includes(q)
    );
  });

  const handleCreateStory = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("media", file);
    if (storyCaption.trim()) formData.append("caption", storyCaption.trim());
    if (storyPrivacy) formData.append("privacy", storyPrivacy);
    formData.append("durationHours", storyDurationHours || "24");
    if (storyPrivacy === "selectedContacts" && selectedViewerIdsText.trim()) {
      formData.append("selectedViewerIds", selectedViewerIdsText.trim());
    }
    const result = await dispatch(addStory(formData));
    if (addStory.fulfilled.match(result)) {
      setStoryCaption("");
      setSelectedViewerIdsText("");
      const userId = user?._id || user?.id;
      if (userId) {
        dispatch(listUserStories({ userId, params: { limit: 20 } }));
        dispatch(listHighlights(userId));
      }
    } else {
      const raw =
        result.payload?.message || result.payload?.err || "Failed to add story.";
      const text = String(raw).toLowerCase();
      const message = text.includes("active story")
        ? "You can only keep one active story. Delete the current one first."
        : text.includes("file not found")
          ? "Please choose an image or video to post."
          : text.includes("network")
            ? "Network error. Check your connection and try again."
            : String(raw);
      toast.error(message);
    }
    e.target.value = "";
  };

  const handleEditChange = (field) => (e) => {
    setEditForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const openEditPanel = () => {
    setEditFeedback("");
    setAvatarFile(null);
    setAvatarPreview("");
    setIsEditOpen(true);
  };

  const closeEditPanel = () => {
    setEditFeedback("");
    setIsEditOpen(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditFeedback("");

    const payload = {
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      username: editForm.username.trim(),
      phoneNumber: editForm.phoneNumber.trim(),
      Bio: editForm.Bio.trim(),
      bioLink: editForm.bioLink.trim(),
      personalChannelUsername: editForm.personalChannelUsername.trim(),
      emojiStatus: editForm.emojiStatus.trim(),
      isPremium: Boolean(editForm.isPremium),
      profileUrl: editForm.profileUrl.trim(),
    };
    let body = payload;
    if (avatarFile) {
      const formData = new FormData();
      formData.append("firstName", payload.firstName);
      formData.append("lastName", payload.lastName);
      formData.append("username", payload.username);
      formData.append("phoneNumber", payload.phoneNumber);
      formData.append("Bio", payload.Bio);
      formData.append("bioLink", payload.bioLink);
      formData.append("personalChannelUsername", payload.personalChannelUsername);
      formData.append("emojiStatus", payload.emojiStatus);
      formData.append("isPremium", String(payload.isPremium));
      if (payload.profileUrl) formData.append("profileUrl", payload.profileUrl);
      formData.append("media", avatarFile);
      body = formData;
    }

    const result = await dispatch(updateProfile(body));
    if (updateProfile.fulfilled.match(result)) {
      setEditFeedback(result.payload?.message || "Profile updated.");
      setTimeout(() => {
        setIsEditOpen(false);
        setEditFeedback("");
        setAvatarFile(null);
        setAvatarPreview("");
      }, 600);
      return;
    }
    setEditFeedback(
      result.payload?.err || result.payload?.message || "Update failed.",
    );
  };

  const handleSavePhone = async () => {
    const value = phoneDraft.trim();
    if (!value) {
      setEditFeedback("Phone number cannot be empty.");
      return;
    }
    setEditFeedback("");
    const result = await dispatch(updateProfile({ phoneNumber: value }));
    if (updateProfile.fulfilled.match(result)) {
      setIsPhoneEdit(false);
      setEditFeedback(result.payload?.message || "Phone number updated.");
      return;
    }
    setEditFeedback(
      result.payload?.err || result.payload?.message || "Failed to update phone number.",
    );
  };

  const handleOpenMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleOpenEditFromMenu = () => {
    setIsMenuOpen(false);
    openEditPanel();
  };

  const handleScrollToStories = () => {
    setIsMenuOpen(false);
    storiesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCopyUsername = async () => {
    setIsMenuOpen(false);
    if (!navigator?.clipboard?.writeText) return;
    await navigator.clipboard.writeText(`@${username}`);
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    const result = await dispatch(logoutUser());
    if (logoutUser.fulfilled.match(result)) {
      navigate("/login");
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] px-3 py-2 shadow-[0_10px_30px_rgba(74,127,74,0.12)]">
        <button type="button" onClick={() => navigate("/home")}>
          <ArrowLeft size={16} />
        </button>
        <p className="text-sm font-semibold text-[rgba(23,3,3,0.87)]">Profile</p>
        <div className="relative flex items-center gap-2" ref={menuRef}>
          <button type="button" onClick={openEditPanel} aria-label="Edit profile">
            <Pen size={15} />
          </button>
          <button type="button" onClick={handleOpenMenu} aria-label="More profile actions">
            <MoreVertical size={15} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-[#6fa63a]/25 bg-white py-1 shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
              <button
                type="button"
                onClick={handleOpenEditFromMenu}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#f3f9ee]"
              >
                Edit profile
              </button>
              <button
                type="button"
                onClick={handleScrollToStories}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#f3f9ee]"
              >
                Go to stories
              </button>
              <button
                type="button"
                onClick={handleCopyUsername}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#f3f9ee]"
              >
                Copy username
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-3 py-2 text-left text-xs text-red-700 hover:bg-red-50"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-[#6fa63a]/30 bg-[linear-gradient(130deg,#f8fdf3_0%,#eef8e8_55%,#e2f0d7_100%)] p-5 shadow-[0_16px_34px_rgba(74,127,74,0.12)]">
        <div className="relative flex items-center gap-4">
          <button
            type="button"
            onClick={handleAvatarStoryOpen}
            className={`relative h-20 w-20 rounded-full p-[3px] ${
              hasActiveStory
                ? "bg-[linear-gradient(135deg,#4c8bf5,#9b5cf6,#ec4899)]"
                : "bg-[#6fa63a]/30"
            }`}
            title={hasActiveStory ? "View your story" : "Add story"}
          >
            {profileUrl ? (
              <img
                src={profileUrl}
                alt={displayName}
                className="h-full w-full rounded-full border border-[#6fa63a]/35 object-cover bg-white"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full border border-[#6fa63a]/35 bg-[#eaf4e2] text-xl font-semibold text-[#4a7f4a]">
                {toInitials(displayName) || "U"}
              </div>
            )}
          </button>
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-[rgba(23,3,3,0.9)]">
              {displayName}
              {emojiStatus && <span className="text-lg">{emojiStatus}</span>}
              {isPremium && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f7e7a8] px-2 py-0.5 text-[10px] font-semibold text-[#7a5a00]">
                  <Crown size={10} />
                  Premium
                </span>
              )}
            </h2>
            <p className="text-sm text-[rgba(23,3,3,0.7)]">@{username}</p>
            <span className="mt-1 inline-block rounded-full bg-[#6fa63a]/20 px-2 py-0.5 text-xs font-semibold text-[#2f5b2f]">
              {status}
            </span>
          </div>
        </div>
      </section>

      <section
        ref={storiesSectionRef}
        className="rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-4 shadow-[0_10px_28px_rgba(74,127,74,0.12)]"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#4a7f4a]">
          Info
        </p>
        <div className="space-y-2">
          <div className="rounded-xl border border-[#6fa63a]/20 bg-white/80 px-3 py-2">
            {!isPhoneEdit ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {React.createElement(getPrivacyIcon(phonePrivacy), {
                    size: 13,
                    className: "text-[#2f5b2f]",
                  })}
                  <p className="text-sm font-semibold text-[rgba(23,3,3,0.88)]">
                    {phone || "Not set"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhoneEdit(true)}
                  className="rounded-md border border-[#6fa63a]/30 px-2 py-1 text-[11px] text-[#2f5b2f] hover:bg-[#f3f9ee]"
                >
                  {phone ? "Edit" : "Set"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full rounded-md border border-[#6fa63a]/30 px-2 py-1 text-sm outline-none focus:border-[#4a7f4a]"
                />
                <button
                  type="button"
                  onClick={handleSavePhone}
                  disabled={updateStatus === "loading"}
                  className="rounded-md bg-[#4a7f4a] px-2 py-1 text-[11px] text-white disabled:opacity-60"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPhoneEdit(false);
                    setPhoneDraft(phone || "");
                  }}
                  className="rounded-md border border-[#6fa63a]/30 px-2 py-1 text-[11px] text-[#2f5b2f]"
                >
                  Cancel
                </button>
              </div>
            )}
            <p className="text-xs text-[rgba(23,3,3,0.65)]">Mobile</p>
          </div>
          <div className="rounded-xl border border-[#6fa63a]/20 bg-white/80 px-3 py-2">
            <div className="flex items-center gap-2">
              {React.createElement(getPrivacyIcon(lastSeenPrivacy), {
                size: 13,
                className: "text-[#2f5b2f]",
              })}
              <p className="text-sm font-semibold text-[rgba(23,3,3,0.88)]">
                {lastSeenLabel}
              </p>
            </div>
            <p className="text-xs text-[rgba(23,3,3,0.65)]">Last Seen</p>
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
          Premium & Channel
        </p>
        <div className="space-y-2">
          <div className="rounded-xl border border-[#6fa63a]/20 bg-white/80 px-3 py-2">
            <p className="text-xs text-[rgba(23,3,3,0.65)]">Emoji Status</p>
            <p className="text-sm font-semibold text-[rgba(23,3,3,0.88)]">
              {emojiStatus || "Not set"}
            </p>
            <button
              type="button"
              onClick={openEditPanel}
              className="mt-2 rounded-md border border-[#6fa63a]/30 px-2 py-1 text-[11px] text-[#2f5b2f] hover:bg-[#f3f9ee]"
            >
              Manage Premium
            </button>
          </div>
          <div className="rounded-xl border border-[#6fa63a]/20 bg-white/80 px-3 py-2">
            <p className="text-xs text-[rgba(23,3,3,0.65)]">Personal Channel Preview</p>
            {user?.identity?.personalChannelUsername ? (
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="mt-1 inline-flex items-center gap-2 rounded-lg border border-[#6fa63a]/25 bg-[#f8fdf3] px-2 py-1 text-xs font-semibold text-[#2f5b2f]"
              >
                <Globe size={12} />
                @{user.identity.personalChannelUsername}
              </button>
            ) : (
              <p className="text-sm text-[rgba(23,3,3,0.7)]">No channel linked.</p>
            )}
            {user?.identity?.bioLink && (
              <p className="mt-1 truncate text-xs text-[#2f5b2f]">{user.identity.bioLink}</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-4 shadow-[0_10px_28px_rgba(74,127,74,0.12)]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#4a7f4a]">
          Shared Media
        </p>
        <input
          type="text"
          value={sharedSearchTerm}
          onChange={(e) => setSharedSearchTerm(e.target.value)}
          placeholder="Search your media, links, and files"
          className="mb-3 w-full rounded-lg border border-[#6fa63a]/25 bg-white px-3 py-2 text-sm outline-none focus:border-[#4a7f4a]"
        />
        {sharedMediaStatus === "loading" && (
          <p className="mb-2 text-xs text-[rgba(23,3,3,0.62)]">
            Syncing your shared media...
          </p>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {mediaItemsBase.map(({ icon: Icon, label, key }) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl border border-[#6fa63a]/20 bg-white/80 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Icon size={14} className="text-[#4a7f4a]" />
                <p className="text-sm text-[rgba(23,3,3,0.85)]">{label}</p>
              </div>
              <span className="rounded-full bg-[#6fa63a]/15 px-2 py-0.5 text-xs font-semibold text-[#2f5b2f]">
                {sharedMediaCounts[key] || 0}
              </span>
            </div>
          ))}
        </div>
        {sharedSearchTerm.trim() && (
          <div className="mt-3 max-h-36 space-y-1 overflow-y-auto rounded-xl border border-[#6fa63a]/20 bg-white/75 p-2">
            {sharedFilteredItems.length === 0 ? (
              <p className="text-xs text-[rgba(23,3,3,0.62)]">No matches found.</p>
            ) : (
              sharedFilteredItems.slice(0, 20).map((item) => (
                <div key={item.id} className="rounded-md border border-[#6fa63a]/15 bg-white px-2 py-1">
                  <p className="truncate text-xs text-[rgba(23,3,3,0.82)]">
                    {item.fileName || item.text || item.mediaURL || "Shared item"}
                  </p>
                  <p className="text-[10px] text-[rgba(23,3,3,0.55)]">{item.bucket}</p>
                </div>
              ))
            )}
          </div>
        )}
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
            <option value="selectedContacts">selectedContacts</option>
          </select>
        </div>
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_140px]">
          <input
            type="text"
            value={selectedViewerIdsText}
            onChange={(e) => setSelectedViewerIdsText(e.target.value)}
            placeholder="Selected contact IDs (comma-separated)"
            disabled={storyPrivacy !== "selectedContacts"}
            className="rounded-lg border border-[#6fa63a]/25 bg-white px-3 py-2 text-sm outline-none focus:border-[#4a7f4a] disabled:opacity-60"
          />
          <select
            value={storyDurationHours}
            onChange={(e) => setStoryDurationHours(e.target.value)}
            className="rounded-lg border border-[#6fa63a]/25 bg-white px-2 py-2 text-sm outline-none focus:border-[#4a7f4a]"
          >
            <option value="6">6h</option>
            <option value="12">12h</option>
            <option value="24">24h</option>
            <option value="48">48h</option>
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

      <section className="rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-4 shadow-[0_10px_28px_rgba(74,127,74,0.12)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4a7f4a]">
            Highlights
          </p>
          <button
            type="button"
            onClick={() => storiesSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center gap-1 rounded-full bg-[#4a7f4a] px-2 py-1 text-[11px] font-semibold text-white"
          >
            <Plus size={11} />
            Add
          </button>
        </div>
        {highlightsStatus === "loading" && (
          <p className="text-xs text-[rgba(23,3,3,0.62)]">Loading highlights...</p>
        )}
        {highlightsStatus !== "loading" && highlights.length === 0 && (
          <p className="text-xs text-[rgba(23,3,3,0.62)]">
            No highlights yet. Pin a story from story settings.
          </p>
        )}
        <div className="grid grid-cols-3 gap-2">
          {highlights.map((story) => {
            const src = story?.media ? resolveMediaUrl(story.media, story?.mediaType || "image") : null;
            const views = Array.isArray(story?.viewers) ? story.viewers.length : 0;
            return (
              <button
                key={story._id}
                type="button"
                onClick={() => navigate("/story", { state: { storyId: story._id, authorId: currentUserId } })}
                className="relative overflow-hidden rounded-xl border border-[#6fa63a]/20 bg-white"
              >
                {src ? (
                  story?.mediaType === "video" ? (
                    <video src={src} className="h-24 w-full object-cover" />
                  ) : (
                    <img src={src} alt={story?.caption || "Highlight"} className="h-24 w-full object-cover" />
                  )
                ) : (
                  <div className="grid h-24 w-full place-items-center text-xs text-[#2f5b2f]">ST</div>
                )}
                <span className="absolute bottom-1 right-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
                  {views}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {isEditOpen && (
        <div className="fixed inset-0 z-[140]">
          <div
            className="absolute inset-0 bg-black/35"
            onClick={closeEditPanel}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-[380px] border-l border-[#6fa63a]/25 bg-[var(--primary-color)] p-3 shadow-[-10px_0_30px_rgba(0,0,0,0.15)]">
            <div className="mb-3 flex items-center justify-between rounded-xl border border-[#6fa63a]/20 bg-white/70 px-3 py-2">
              <p className="text-sm font-semibold text-[#2f5b2f]">
                Edit profile
              </p>
              <button
                type="button"
                onClick={closeEditPanel}
                className="rounded-lg border border-[#6fa63a]/30 bg-white p-1 text-[#2f5b2f]"
              >
                <X size={14} />
              </button>
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="space-y-3 rounded-xl border border-[#6fa63a]/20 bg-white/75 p-3"
            >
              <div className="flex items-center justify-center pb-1">
                <div className="relative">
                  {avatarPreview || editForm.profileUrl ? (
                    <img
                      src={avatarPreview || resolveProfileUrl(editForm.profileUrl)}
                      alt="Profile preview"
                      className="h-20 w-20 rounded-full border border-[#6fa63a]/35 object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#6fa63a]/35 bg-[#eaf4e2] text-xl font-semibold text-[#4a7f4a]">
                      {toInitials(
                        `${editForm.firstName} ${editForm.lastName}`.trim() ||
                          editForm.username ||
                          "U",
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 rounded-full bg-[#4a7f4a] p-2 text-white shadow"
                    aria-label="Change profile photo"
                  >
                    <Camera size={12} />
                  </button>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
              </div>
              <input
                value={editForm.firstName}
                onChange={handleEditChange("firstName")}
                placeholder="First name"
                className="w-full rounded-lg border border-[#6fa63a]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#4a7f4a]"
              />
              <input
                value={editForm.lastName}
                onChange={handleEditChange("lastName")}
                placeholder="Last name"
                className="w-full rounded-lg border border-[#6fa63a]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#4a7f4a]"
              />
              <input
                value={editForm.username}
                onChange={handleEditChange("username")}
                placeholder="Username"
                className="w-full rounded-lg border border-[#6fa63a]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#4a7f4a]"
              />
              <input
                value={editForm.phoneNumber}
                onChange={handleEditChange("phoneNumber")}
                placeholder="Phone number"
                className="w-full rounded-lg border border-[#6fa63a]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#4a7f4a]"
              />
              <textarea
                value={editForm.Bio}
                onChange={handleEditChange("Bio")}
                placeholder="Bio"
                rows={3}
                className="w-full resize-none rounded-lg border border-[#6fa63a]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#4a7f4a]"
              />
              <input
                value={editForm.bioLink}
                onChange={handleEditChange("bioLink")}
                placeholder="Bio link"
                className="w-full rounded-lg border border-[#6fa63a]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#4a7f4a]"
              />
              <input
                value={editForm.personalChannelUsername}
                onChange={handleEditChange("personalChannelUsername")}
                placeholder="Personal channel username"
                className="w-full rounded-lg border border-[#6fa63a]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#4a7f4a]"
              />
              <input
                value={editForm.emojiStatus}
                onChange={handleEditChange("emojiStatus")}
                placeholder="Emoji status (e.g. ✨)"
                className="w-full rounded-lg border border-[#6fa63a]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#4a7f4a]"
              />
              <label className="flex items-center gap-2 rounded-lg border border-[#6fa63a]/20 bg-[#f8fdf3] px-3 py-2 text-sm text-[rgba(23,3,3,0.82)]">
                <input
                  type="checkbox"
                  checked={Boolean(editForm.isPremium)}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, isPremium: e.target.checked }))
                  }
                />
                Premium enabled
              </label>
              <input
                value={editForm.profileUrl}
                onChange={handleEditChange("profileUrl")}
                placeholder="Profile photo URL"
                className="w-full rounded-lg border border-[#6fa63a]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#4a7f4a]"
              />

              {(editFeedback || authError) && (
                <p
                  className={`text-xs ${
                    updateStatus === "failed" ? "text-red-600" : "text-[#2f5b2f]"
                  }`}
                >
                  {editFeedback || authError}
                </p>
              )}

              <button
                type="submit"
                disabled={updateStatus === "loading"}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4a7f4a] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {updateStatus === "loading" && <Loader2 size={14} className="animate-spin" />}
                {updateStatus === "loading" ? "Saving..." : "Save changes"}
              </button>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
