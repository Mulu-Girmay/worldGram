import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { ProfileNav } from "./Profile";
import { useDispatch } from "react-redux";
import { FileBoxIcon, SendHorizontal, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import GroupManagePanel from "./group/GroupManagePanel";
import { useToast } from "./ToastProvider";
import Reaction from "./Reaction";
import {
  selectChatById,
  selectCurrentChat,
  selectMessages,
  selectMessagesStatus,
} from "../Redux/chatRedux/chatSelector";
import { selectUser } from "../Redux/userRedux/authSelector";
import {
  getChatById,
  getMessages,
  markChatRead,
  reactToMessage,
  sendMediaMessage,
  sendMessage,
  updateChatSettings,
} from "../Redux/chatRedux/chatThunk";
import {
  markMessagesReadByUser,
  pushIncomingMessage,
  setMessageReactions,
} from "../Redux/chatRedux/chatSlice";
import { resolveAssetUrl, resolveProfileUrl, toInitials } from "../utils/media";
import { selectGroups } from "../Redux/groupRedux/groupSelector";
import {
  findGroup,
  listGroupTopics,
  setGroupViewMode,
} from "../Redux/groupRedux/groupThunk";
import {
  selectCurrentGroup,
  selectGroupTopics,
} from "../Redux/groupRedux/groupSelector";

const QUICK_REACTIONS = ["👍", "❤️", "🔥", "😂", "😍", "😮"];

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const applyOptimisticReaction = (existingReactions, emoji, userId) => {
  const normalizedUserId = String(userId || "");
  const next = (existingReactions || []).map((reaction) => ({
    ...reaction,
    reactors: Array.isArray(reaction?.reactors) ? [...reaction.reactors] : [],
  }));

  const previousIndex = next.findIndex((reaction) =>
    reaction.reactors
      .map((id) => (id?._id ? String(id._id) : String(id)))
      .includes(normalizedUserId),
  );

  if (previousIndex >= 0) {
    const previous = next[previousIndex];
    const prevEmoji = previous?.emoji;
    previous.reactors = previous.reactors.filter(
      (id) => (id?._id ? String(id._id) : String(id)) !== normalizedUserId,
    );
    previous.count = Math.max(0, Number(previous?.count || 0) - 1);
    if (prevEmoji === emoji) {
      return next.filter((reaction) => Number(reaction?.count || 0) > 0);
    }
  }

  const targetIndex = next.findIndex((reaction) => reaction?.emoji === emoji);
  if (targetIndex >= 0) {
    const target = next[targetIndex];
    const hasReacted = target.reactors
      .map((id) => (id?._id ? String(id._id) : String(id)))
      .includes(normalizedUserId);
    if (!hasReacted) {
      target.reactors.push(normalizedUserId);
      target.count = Number(target?.count || 0) + 1;
    }
    return next.filter((reaction) => Number(reaction?.count || 0) > 0);
  }

  return [...next, { emoji, count: 1, reactors: [normalizedUserId] }];
};

const Chat = ({
  chatId = null,
  currentChat: currentChatProp = null,
  messages: messagesProp = null,
  onSend = null,
  onAttach = null,
  composerPlaceholder = "Type a message...",
}) => {
  const location = useLocation();
  const routeChatId = location.state?.chatId || null;
  const currentUser = useSelector(selectUser);
  const accessToken = useSelector((state) => state.auth?.accessToken || null);
  const dispatch = useDispatch();
  const toast = useToast();
  const socketRef = useRef(null);
  const currentChatFromStore = useSelector(selectCurrentChat);
  const selectedChatFromStore = useSelector((state) =>
    chatId || routeChatId ? selectChatById(state, chatId || routeChatId) : null,
  );
  const messagesFromStore = useSelector(selectMessages);
  const messagesStatus = useSelector(selectMessagesStatus);

  const [draft, setDraft] = useState("");
  const [presenceMap, setPresenceMap] = useState({});
  const [typingMap, setTypingMap] = useState({});
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [reactionBusyMap, setReactionBusyMap] = useState({});
  const [profileTab, setProfileTab] = useState("media");
  const groups = useSelector(selectGroups);
  const currentGroup = useSelector(selectCurrentGroup);
  const groupTopics = useSelector(selectGroupTopics);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [groupViewMode, setGroupViewModeState] = useState("message");

  const activeChat =
    currentChatProp || selectedChatFromStore || currentChatFromStore || null;
  const renderedMessages = messagesProp || messagesFromStore || [];

  const title = useMemo(() => {
    if (activeChat?.title) return activeChat.title;
    if (activeChat?.type) return `${activeChat.type} chat`;
    return "Chat";
  }, [activeChat]);

  const resolvedChatId = activeChat?._id || chatId || routeChatId || null;
  const resolvedGroupId =
    activeChat?.type === "group"
      ? activeChat?.groupId?._id || activeChat?.groupId || null
      : null;

  useEffect(() => {
    setShowGroupSettings(false);
    setShowProfilePanel(false);
    setShowSearchBar(false);
    setSearchTerm("");
    setShowNavMenu(false);
    setReplyTarget(null);
    setTypingMap({});
  }, [resolvedChatId]);

  useEffect(() => {
    if (!resolvedChatId) return;
    dispatch(getChatById(resolvedChatId));
    dispatch(markChatRead(resolvedChatId));
  }, [dispatch, resolvedChatId]);

  useEffect(() => {
    if (!resolvedGroupId) return;
    dispatch(findGroup(resolvedGroupId));
    dispatch(listGroupTopics(resolvedGroupId));
  }, [dispatch, resolvedGroupId]);

  useEffect(() => {
    const nextMode = currentGroup?.settings?.defaultViewMode || "message";
    setGroupViewModeState(nextMode);
    if (nextMode === "message") {
      setSelectedTopicId("");
      return;
    }
    const firstTopic = (groupTopics || [])[0]?._id || "";
    setSelectedTopicId(firstTopic);
  }, [currentGroup?.settings?.defaultViewMode, groupTopics]);

  useEffect(() => {
    if (!resolvedChatId) return;
    const params =
      groupViewMode === "topic" && selectedTopicId
        ? { topicId: selectedTopicId }
        : {};
    dispatch(getMessages({ chatId: resolvedChatId, params }));
  }, [dispatch, resolvedChatId, groupViewMode, selectedTopicId]);

  useEffect(() => {
    const socket = io("http://localhost:3000", {
      withCredentials: true,
      auth: accessToken ? { token: accessToken } : {},
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !resolvedChatId) return;

    socket.emit("join-chat", resolvedChatId);
    const handleIncomingMessage = (message) => {
      const incomingChatId = message?.identity?.chatId;
      if (String(incomingChatId || "") !== String(resolvedChatId)) return;
      dispatch(pushIncomingMessage(message));
      dispatch(markChatRead(resolvedChatId));
    };

    const handleChatRead = (payload) => {
      if (String(payload?.chatId || "") !== String(resolvedChatId)) return;
      dispatch(markMessagesReadByUser(payload));
    };

    const handleMessageReactionUpdated = (payload) => {
      if (String(payload?.chatId || "") !== String(resolvedChatId)) return;
      const messageId = payload?.messageId;
      if (!messageId) return;
      dispatch(
        setMessageReactions({
          messageId,
          reactions: Array.isArray(payload?.reactions) ? payload.reactions : [],
        }),
      );
    };

    const handleUserStatus = (payload) => {
      const userId = normalizeId(payload?.userId);
      if (!userId) return;
      setPresenceMap((prev) => ({
        ...prev,
        [userId]: payload?.onlineStatus || "offline",
      }));
    };

    const handleChatTyping = (payload) => {
      if (String(payload?.chatId || "") !== String(resolvedChatId)) return;
      const userId = normalizeId(payload?.userId);
      if (!userId || userId === normalizeId(currentUser?._id)) return;
      setTypingMap((prev) => ({
        ...prev,
        [userId]: Boolean(payload?.isTyping),
      }));
    };

    socket.on("new-message", handleIncomingMessage);
    socket.on("chat-read", handleChatRead);
    socket.on("message-reaction-updated", handleMessageReactionUpdated);
    socket.on("user-status", handleUserStatus);
    socket.on("chat-typing", handleChatTyping);
    return () => {
      socket.off("new-message", handleIncomingMessage);
      socket.off("chat-read", handleChatRead);
      socket.off("message-reaction-updated", handleMessageReactionUpdated);
      socket.off("user-status", handleUserStatus);
      socket.off("chat-typing", handleChatTyping);
    };
  }, [dispatch, resolvedChatId, currentUser?._id]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !resolvedChatId || !currentUser?._id) return;
    const isTyping = Boolean(draft.trim());
    socket.emit("typing", { chatId: resolvedChatId, isTyping });

    if (!isTyping) return;
    const timer = window.setTimeout(() => {
      socket.emit("typing", { chatId: resolvedChatId, isTyping: false });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [draft, resolvedChatId, currentUser?._id]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;

    if (!resolvedChatId) {
      toast.error("Open a valid chat before sending messages.");
      return;
    }

    const senderId = currentUser?._id || null;
    if (!senderId) {
      toast.error("Unable to resolve current user.");
      return;
    }

    const result = await dispatch(
      sendMessage({
        chatId: resolvedChatId,
        payload: {
          text,
          replyToMessageId: replyTarget?._id || null,
          topicId: groupViewMode === "topic" && selectedTopicId ? selectedTopicId : null,
        },
      }),
    );

    if (sendMessage.rejected.match(result)) {
      toast.error(
        result.payload?.err ||
          result.payload?.message ||
          "Failed to send message",
      );
      return;
    }

    if (typeof onSend === "function") {
      onSend({
        chatId: resolvedChatId,
        text,
        replyToMessageId: replyTarget?._id || null,
      });
    }
    setDraft("");
    setReplyTarget(null);
  };

  const handleAttach = async (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (typeof onAttach === "function") {
      onAttach(file);
      event.target.value = "";
      return;
    }

    if (!resolvedChatId) {
      toast.error("Open a valid chat before sending media.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("media", file);
    if (draft.trim()) {
      formData.append("text", draft.trim());
    }
    if (replyTarget?._id) {
      formData.append("replyToMessageId", replyTarget._id);
    }
    if (groupViewMode === "topic" && selectedTopicId) {
      formData.append("topicId", selectedTopicId);
    }

    const result = await dispatch(
      sendMediaMessage({
        chatId: resolvedChatId,
        formData,
      }),
    );

    if (sendMediaMessage.rejected.match(result)) {
      toast.error(
        result.payload?.err ||
          result.payload?.message ||
          "Failed to send media",
      );
      event.target.value = "";
      return;
    }

    setDraft("");
    setReplyTarget(null);
    event.target.value = "";
  };

  const participants = Array.isArray(activeChat?.participants)
    ? activeChat.participants
    : [];
  const otherParticipant = participants.find(
    (p) => normalizeId(p?._id || p) !== normalizeId(currentUser?._id),
  );
  const otherName = otherParticipant
    ? `${otherParticipant?.identity?.firstName || ""} ${otherParticipant?.identity?.lastName || ""}`.trim() ||
      otherParticipant?.identity?.username ||
      "Unknown user"
    : title;
  const otherProfile = resolveProfileUrl(otherParticipant?.identity?.profileUrl);
  const otherStatus =
    presenceMap[normalizeId(otherParticipant?._id)] ||
    otherParticipant?.AccountStatus?.onlineStatus ||
    "offline";
  const isGroupChat = activeChat?.type === "group";
  const typingUsers = Object.entries(typingMap)
    .filter(([, isTyping]) => Boolean(isTyping))
    .map(([userId]) => userId);
  const subtitleText = typingUsers.length
    ? "typing..."
    : isGroupChat
      ? "Group conversation"
      : (otherStatus || "offline");
  const otherPhone = otherParticipant?.identity?.phoneNumber || "";
  const phonePrivacy = otherParticipant?.privacySettings?.privacyPhoneNumber || "contacts";
  const otherEmojiStatus = otherParticipant?.identity?.emojiStatus || "";
  const otherIsPremium = Boolean(otherParticipant?.AccountStatus?.isPremium);
  const otherChannelUsername = otherParticipant?.identity?.personalChannelUsername || "";
  const otherBio = otherParticipant?.identity?.Bio || "";
  const isPhoneVisibleToViewer = phonePrivacy === "everyone";

  const formatLastSeen = () => {
    const lastSeenPrivacy = otherParticipant?.privacySettings?.privacyLastSeen;
    if (lastSeenPrivacy === "nobody") return "Last seen hidden";
    if (otherStatus === "online") return "Online";
    const lastSeenAt = otherParticipant?.AccountStatus?.lastSeenAt;
    if (!lastSeenAt) return "Recently";
    const diffMs = Date.now() - new Date(lastSeenAt).getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    if (diffMs < oneDay) return "Recently";
    if (diffMs < 7 * oneDay) return "Within a week";
    return "Long time ago";
  };

  const sharedWithUser = useMemo(() => {
    const docs = [];
    const links = [];
    const media = [];
    const audio = [];

    (renderedMessages || []).forEach((message) => {
      const text = String(message?.content?.text || "");
      const mediaURL = String(message?.content?.mediaURL || "");
      const contentType = String(message?.content?.ContentType || "").toLowerCase();
      const fileName = String(message?.content?.fileName || "");

      if (/https?:\/\/[^\s]+/i.test(text)) links.push({ id: message?._id, text });
      if (contentType === "image" || contentType === "video") {
        media.push({ id: message?._id, mediaURL, text });
      } else if (contentType === "audio" || contentType === "voice") {
        audio.push({ id: message?._id, fileName, mediaURL });
      } else if (contentType === "file") {
        docs.push({ id: message?._id, fileName, mediaURL });
      }
    });

    return { media, docs, links, audio };
  }, [renderedMessages]);

  const groupsInCommon = useMemo(() => {
    const otherId = normalizeId(otherParticipant?._id);
    if (!otherId) return [];
    return (groups || []).filter((group) =>
      (group?.members?.members || []).some((id) => normalizeId(id) === otherId),
    );
  }, [groups, otherParticipant?._id]);

  const filteredMessages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return renderedMessages;

    return (renderedMessages || []).filter((message) => {
      const senderId = message?.identity?.senderId;
      const senderObject =
        typeof senderId === "object" && senderId !== null ? senderId : null;
      const senderName = senderObject
        ? `${senderObject?.identity?.firstName || ""} ${senderObject?.identity?.lastName || ""}`.trim() ||
          senderObject?.identity?.username ||
          ""
        : "";
      const text = String(message?.content?.text || "").toLowerCase();
      const media = String(message?.content?.mediaURL || "").toLowerCase();
      return (
        text.includes(query) ||
        senderName.toLowerCase().includes(query) ||
        media.includes(query)
      );
    });
  }, [renderedMessages, searchTerm]);

  const handleOpenProfile = () => {
    if (isGroupChat && resolvedGroupId) {
      setShowGroupSettings(true);
      return;
    }
    setShowProfilePanel(true);
  };

  const handleToggleSearch = () => {
    setShowNavMenu(false);
    setShowSearchBar((prev) => !prev);
  };

  const handleToggleNavMenu = () => {
    setShowNavMenu((prev) => !prev);
  };

  const handleMenuAction = (action) => {
    setShowNavMenu(false);
    if (action === "profile") handleOpenProfile();
    if (action === "search") setShowSearchBar(true);
    if (action === "markRead" && resolvedChatId) {
      dispatch(markChatRead(resolvedChatId));
    }
    if (action === "mute" && resolvedChatId) {
      dispatch(
        updateChatSettings({
          chatId: resolvedChatId,
          payload: { isMuted: !Boolean(activeChat?.isMuted) },
        }),
      );
    }
  };

  const handleReactMessage = async (message, emoji) => {
    if (!resolvedChatId || !message?._id || !emoji || !currentUser?._id) return;
    const messageId = message._id;
    const previousReactions = Array.isArray(message?.reactions)
      ? message.reactions
      : [];
    const nextReactions = applyOptimisticReaction(
      previousReactions,
      emoji,
      currentUser._id,
    );

    dispatch(setMessageReactions({ messageId, reactions: nextReactions }));
    setReactionBusyMap((prev) => ({ ...prev, [messageId]: true }));

    try {
      const result = await dispatch(
        reactToMessage({
          chatId: resolvedChatId,
          messageId,
          payload: { emoji },
        }),
      );
      if (reactToMessage.rejected.match(result)) {
        dispatch(
          setMessageReactions({ messageId, reactions: previousReactions }),
        );
        toast.error(
          result.payload?.err ||
            result.payload?.message ||
            "Failed to update reaction",
        );
      }
    } finally {
      setReactionBusyMap((prev) => ({ ...prev, [messageId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--primary-color)]">
      <ProfileNav
        title={otherName}
        subtitle={subtitleText}
        avatarUrl={otherProfile}
        backPath="/home"
        onProfileClick={handleOpenProfile}
        onSearchClick={handleToggleSearch}
        onMoreClick={handleToggleNavMenu}
      />
      {showNavMenu && (
        <div className="mx-auto mt-2 w-full max-w-2xl px-4">
          <div className="ml-auto w-48 rounded-xl border border-[#6fa63a]/25 bg-white p-1 shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
            <button
              type="button"
              onClick={() => handleMenuAction("profile")}
              className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-[#f3f9ee]"
            >
              {isGroupChat ? "Open group profile" : "View profile"}
            </button>
            <button
              type="button"
              onClick={() => handleMenuAction("search")}
              className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-[#f3f9ee]"
            >
              Search messages
            </button>
            <button
              type="button"
              onClick={() => handleMenuAction("markRead")}
              className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-[#f3f9ee]"
            >
              Mark as read
            </button>
            <button
              type="button"
              onClick={() => handleMenuAction("mute")}
              className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-[#f3f9ee]"
            >
              {activeChat?.isMuted ? "Unmute chat" : "Mute chat"}
            </button>
          </div>
        </div>
      )}
      {showSearchBar && (
        <div className="mx-auto mt-2 w-full max-w-2xl px-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search messages in this chat"
            className="w-full rounded-xl border border-[#6fa63a]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#4a7f4a]"
          />
        </div>
      )}

      <div className="mx-auto w-full max-w-2xl space-y-3 p-4">
        {isGroupChat && currentGroup?.settings?.topicsEnabled && (
          <div className="rounded-xl border border-[#6fa63a]/20 bg-white/70 p-2">
            <div className="mb-2 flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  await dispatch(setGroupViewMode({ id: resolvedGroupId, viewMode: "message" }));
                  setGroupViewModeState("message");
                }}
                className={`rounded-full px-3 py-1 text-xs ${
                  groupViewMode === "message" ? "bg-[#4a7f4a] text-white" : "border"
                }`}
              >
                Message View
              </button>
              <button
                type="button"
                onClick={async () => {
                  await dispatch(setGroupViewMode({ id: resolvedGroupId, viewMode: "topic" }));
                  setGroupViewModeState("topic");
                }}
                className={`rounded-full px-3 py-1 text-xs ${
                  groupViewMode === "topic" ? "bg-[#4a7f4a] text-white" : "border"
                }`}
              >
                Topic View
              </button>
            </div>
            {groupViewMode === "topic" && (
              <div className="flex gap-2 overflow-x-auto">
                {(groupTopics || []).map((topic) => (
                  <button
                    key={topic._id}
                    type="button"
                    onClick={() => setSelectedTopicId(topic._id)}
                    className={`rounded-full px-3 py-1 text-xs ${
                      String(selectedTopicId) === String(topic._id)
                        ? "bg-[#4a7f4a] text-white"
                        : "border"
                    }`}
                  >
                    #{topic.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div
          role={isGroupChat ? "button" : undefined}
          tabIndex={isGroupChat ? 0 : undefined}
          onClick={() => {
            if (isGroupChat && resolvedGroupId) setShowGroupSettings(true);
          }}
          onKeyDown={(e) => {
            if (!isGroupChat || !resolvedGroupId) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setShowGroupSettings(true);
            }
          }}
          className={`flex items-center gap-3 rounded-xl border border-[#6fa63a]/20 bg-white/60 px-3 py-2 ${
            isGroupChat ? "cursor-pointer hover:bg-white/80" : ""
          }`}
        >
          {otherProfile ? (
            <img
              src={otherProfile}
              alt={otherName}
              className="h-10 w-10 rounded-full border border-[#6fa63a]/25 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#6fa63a]/25 bg-[#eaf4e2] text-xs font-semibold text-[#4a7f4a]">
              {toInitials(otherName) || "U"}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-[rgba(23,3,3,0.9)]">{otherName}</p>
            <p className="text-xs text-[rgba(23,3,3,0.62)] capitalize">
              {isGroupChat ? "Tap to open group profile settings" : otherStatus}
            </p>
          </div>
        </div>

        <div className="h-[60vh] space-y-2 overflow-y-auto rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-3">
          {messagesStatus === "loading" && (
            <p className="text-xs text-[rgba(23,3,3,0.6)]">
              Loading messages...
            </p>
          )}

          {messagesStatus !== "loading" && filteredMessages.length === 0 && (
            <p className="text-xs text-[rgba(23,3,3,0.6)]">
              {searchTerm.trim()
                ? "No messages found for this search."
                : "No messages yet. Start the conversation."}
            </p>
          )}

          {filteredMessages.map((message) => {
            const senderId = message?.identity?.senderId;
            const senderObject =
              typeof senderId === "object" && senderId !== null ? senderId : null;
            const senderName = senderObject
              ? `${senderObject?.identity?.firstName || ""} ${senderObject?.identity?.lastName || ""}`.trim() ||
                senderObject?.identity?.username ||
                "Unknown"
              : "Unknown";
            const senderProfile = resolveProfileUrl(senderObject?.identity?.profileUrl);
            const senderNormalizedId = normalizeId(senderObject?._id || senderId);
            const isOwn =
              senderNormalizedId === normalizeId(currentUser?._id);
            const text = message?.content?.text || "";
            const mediaURL = message?.content?.mediaURL || null;
            const mediaSrc = mediaURL ? resolveAssetUrl(mediaURL, "images") : null;
            const mediaIsVideo =
              typeof mediaURL === "string" &&
              /\.(mp4|webm|ogg|mov)$/i.test(mediaURL);
            const repliedToId = message?.Relations?.replyToMessageId || null;
            const repliedToMessage = repliedToId
              ? renderedMessages.find((m) => String(m?._id) === String(repliedToId))
              : null;
            const repliedToText =
              repliedToMessage?.content?.text ||
              (repliedToMessage?.content?.mediaURL ? "Media message" : "");
            const readBy = Array.isArray(message?.state?.readBy)
              ? message.state.readBy.map((id) => normalizeId(id))
              : [];
            const readStatus =
              readBy.length > 1 || readBy.some((id) => id !== senderNormalizedId)
                ? "Read"
                : "Unread";
            const messageReactions = Array.isArray(message?.reactions)
              ? message.reactions
              : [];
            const visibleMessageReactions = messageReactions.filter(
              (reaction) => Number(reaction?.count || 0) > 0,
            );
            const currentUserReaction =
              messageReactions.find((reaction) =>
                (reaction?.reactors || []).some(
                  (id) =>
                    String(id?._id || id) === String(currentUser?._id || ""),
                ),
              )?.emoji || null;

            return (
              <div
                key={message?._id || `${senderId}-${message?.createdAt}`}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                {!isOwn && (
                  <div className="mr-2 mt-1">
                    {senderProfile ? (
                      <img
                        src={senderProfile}
                        alt={senderName}
                        className="h-8 w-8 rounded-full border border-[#6fa63a]/25 object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#6fa63a]/25 bg-[#eaf4e2] text-[10px] font-semibold text-[#4a7f4a]">
                        {toInitials(senderName) || "U"}
                      </div>
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    isOwn
                      ? "rounded-br-sm bg-[var(--btn-color)] text-white"
                      : "rounded-bl-sm bg-white text-[rgba(23,3,3,0.87)]"
                  }`}
                >
                  {!isOwn && (
                    <p className="mb-1 text-xs font-semibold text-[#355f35]">
                      {senderName}
                    </p>
                  )}
                  {repliedToId && (
                    <div
                      className={`mb-1 rounded-lg border px-2 py-1 text-[11px] ${
                        isOwn
                          ? "border-white/30 bg-white/10 text-white/90"
                          : "border-[#6fa63a]/30 bg-[#f3f9ee] text-[rgba(23,3,3,0.75)]"
                      }`}
                    >
                      Replying to: {repliedToText || "Original message"}
                    </div>
                  )}
                  {text ? (
                    <p className="break-words">{text}</p>
                  ) : (
                    <p className="break-words italic opacity-70">(no text)</p>
                  )}
                  {mediaSrc && (
                    <div className="mt-2 overflow-hidden rounded-xl border border-black/10">
                      {mediaIsVideo ? (
                        <video src={mediaSrc} controls className="max-h-72 w-full object-cover" />
                      ) : (
                        <img src={mediaSrc} alt="media" className="max-h-72 w-full object-cover" />
                      )}
                    </div>
                  )}
                  <div className="mt-1 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setReplyTarget({
                          _id: message?._id,
                          text: text || (mediaURL ? "Media message" : "(no text)"),
                          sender: senderName,
                        })
                      }
                      className={`text-[10px] underline-offset-2 hover:underline ${
                        isOwn ? "text-white/80" : "text-[#355f35]"
                      }`}
                    >
                      Reply
                    </button>
                    {isOwn && (
                      <span className="text-[10px] text-white/70">{readStatus}</span>
                    )}
                    <p
                      className={`text-[10px] ${
                        isOwn ? "text-white/70" : "text-[rgba(23,3,3,0.52)]"
                      }`}
                    >
                      {formatTime(message?.createdAt)}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={`${message?._id}-${emoji}`}
                        type="button"
                        onClick={() => handleReactMessage(message, emoji)}
                        disabled={Boolean(reactionBusyMap[message?._id])}
                        className={`rounded-full border px-2 py-0.5 text-xs transition ${
                          currentUserReaction === emoji
                            ? isOwn
                              ? "border-white/70 bg-white/15 text-white"
                              : "border-[#4a7f4a] bg-[#eef8e8] text-[#2f5b2f]"
                            : isOwn
                              ? "border-white/30 bg-white/10 text-white/90 hover:bg-white/20"
                              : "border-[#6fa63a]/35 bg-[#f8fdf3] text-[rgba(23,3,3,0.85)] hover:bg-[#eef8e8]"
                        } disabled:opacity-60`}
                      >
                        {emoji}
                      </button>
                    ))}
                    <Reaction
                      initial={currentUserReaction}
                      onSelect={(emoji) => handleReactMessage(message, emoji)}
                      triggerClassName={`rounded-full border px-2 py-0.5 text-xs ${
                        isOwn
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-[#6fa63a]/35 bg-[#f8fdf3] text-[rgba(23,3,3,0.85)]"
                      }`}
                      popupClassName="border-[#6fa63a]/35"
                    />
                    {visibleMessageReactions.map((reaction) => (
                      <span
                        key={`${message?._id}-${reaction?.emoji}`}
                        className={`rounded-full border px-2 py-0.5 text-[10px] ${
                          isOwn
                            ? "border-white/25 bg-white/10 text-white/90"
                            : "border-[#6fa63a]/35 bg-[#f8fdf3] text-[rgba(23,3,3,0.78)]"
                        }`}
                      >
                        {reaction?.emoji} {Number(reaction?.count || 0)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-end gap-2">
          {replyTarget && (
            <div className="w-full rounded-xl border border-[#6fa63a]/30 bg-white/80 px-3 py-2 text-xs">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-semibold text-[#2f5b2f]">
                  Replying to {replyTarget.sender || "message"}
                </p>
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="text-[10px] text-[rgba(23,3,3,0.62)] hover:text-[rgba(23,3,3,0.9)]"
                >
                  <X size={12} />
                </button>
              </div>
              <p className="truncate text-[rgba(23,3,3,0.75)]">{replyTarget.text}</p>
            </div>
          )}
        </div>

        <div className="flex items-end gap-2">
          <textarea
            name="message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={composerPlaceholder}
            className="min-h-[42px] flex-1 resize-none rounded-xl border border-[#6fa63a]/30 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#4a7f4a] focus:ring-2 focus:ring-[#6fa63a]/20"
          />

          <label className="cursor-pointer rounded-xl border border-[#6fa63a]/35 bg-[#6fa63a]/15 p-2 text-[#2f5b2f] transition hover:bg-[#6fa63a]/25">
            <FileBoxIcon size={16} />
            <input
              type="file"
              accept="image/*,video/*"
              name="media"
              className="hidden"
              onChange={handleAttach}
            />
          </label>
          <button
            onClick={handleSend}
            type="button"
            className="rounded-xl bg-[#4a7f4a] p-2 text-white transition hover:bg-[#3f6e3f]"
          >
            <SendHorizontal size={16} />
          </button>
        </div>
      </div>

      {showGroupSettings && isGroupChat && resolvedGroupId && (
        <div className="fixed inset-0 z-[120]">
          <div
            className="absolute inset-0 bg-black/35"
            onClick={() => setShowGroupSettings(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-[380px] border-l border-[#6fa63a]/25 bg-[var(--primary-color)] p-3 shadow-[-10px_0_30px_rgba(0,0,0,0.15)]">
            <div className="mb-3 flex items-center justify-between rounded-xl border border-[#6fa63a]/20 bg-white/70 px-3 py-2">
              <p className="text-sm font-semibold text-[#2f5b2f]">Group profile</p>
              <button
                type="button"
                onClick={() => setShowGroupSettings(false)}
                className="rounded-lg border border-[#6fa63a]/30 bg-white p-1 text-[#2f5b2f]"
                aria-label="Close group settings"
              >
                <X size={14} />
              </button>
            </div>
            <GroupManagePanel groupId={resolvedGroupId} />
          </aside>
        </div>
      )}

      {showProfilePanel && !isGroupChat && (
        <div className="fixed inset-0 z-[130]">
          <div
            className="absolute inset-0 bg-black/35"
            onClick={() => setShowProfilePanel(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-[340px] border-l border-[#6fa63a]/25 bg-[var(--primary-color)] p-3 shadow-[-10px_0_30px_rgba(0,0,0,0.15)]">
            <div className="mb-3 flex items-center justify-between rounded-xl border border-[#6fa63a]/20 bg-white/70 px-3 py-2">
              <p className="text-sm font-semibold text-[#2f5b2f]">Profile</p>
              <button
                type="button"
                onClick={() => setShowProfilePanel(false)}
                className="rounded-lg border border-[#6fa63a]/30 bg-white p-1 text-[#2f5b2f]"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-3 rounded-xl border border-[#6fa63a]/20 bg-white/80 p-4">
              <div className="mb-3 flex justify-center">
                {otherProfile ? (
                  <img
                    src={resolveProfileUrl(otherProfile)}
                    alt={otherName}
                    className="h-28 w-28 rounded-full border border-[#6fa63a]/30 object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[#6fa63a]/30 bg-[#eaf4e2] text-xl font-semibold text-[#4a7f4a]">
                    {toInitials(otherName) || "U"}
                  </div>
                )}
              </div>
              <p className="text-center text-base font-semibold text-[rgba(23,3,3,0.88)]">
                {otherName} {otherEmojiStatus}
                {otherIsPremium && (
                  <span className="ml-1 inline-block rounded-full bg-[#f7e7a8] px-1.5 py-0.5 text-[10px] font-semibold text-[#7a5a00]">
                    Premium
                  </span>
                )}
              </p>
              <p className="mt-1 text-center text-xs capitalize text-[rgba(23,3,3,0.62)]">
                {formatLastSeen()}
              </p>
              <div className="space-y-1 rounded-lg border border-[#6fa63a]/20 bg-[#f9fcf6] px-3 py-2 text-xs">
                <p className="font-semibold text-[rgba(23,3,3,0.82)]">
                  @{otherParticipant?.identity?.username || "unknown"}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const username = otherParticipant?.identity?.username || "";
                    if (!username || !navigator?.clipboard?.writeText) return;
                    await navigator.clipboard.writeText(`@${username}`);
                    toast.info("Username copied");
                  }}
                  className="rounded-md border border-[#6fa63a]/20 bg-white px-2 py-1 text-[10px] text-[#2f5b2f]"
                >
                  Copy username
                </button>
                <p className="text-[rgba(23,3,3,0.65)]">
                  Phone: {isPhoneVisibleToViewer && otherPhone ? otherPhone : "Hidden"}
                </p>
                {otherBio ? (
                  <p className="text-[rgba(23,3,3,0.7)]">{otherBio}</p>
                ) : null}
              </div>
              {otherChannelUsername ? (
                <button
                  type="button"
                  className="w-full rounded-lg border border-[#6fa63a]/25 bg-[#f9fcf6] px-3 py-2 text-left text-xs font-semibold text-[#2f5b2f]"
                >
                  View Channel: @{otherChannelUsername}
                </button>
              ) : null}

              <div className="grid grid-cols-4 gap-1 rounded-lg border border-[#6fa63a]/20 bg-[#f9fcf6] p-1">
                {[
                  { id: "media", label: "Media" },
                  { id: "files", label: "Files" },
                  { id: "links", label: "Links" },
                  { id: "groups", label: "Groups" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setProfileTab(tab.id)}
                    className={`rounded-md px-2 py-1 text-[10px] ${
                      profileTab === tab.id
                        ? "bg-[#4a7f4a] text-white"
                        : "text-[#2f5b2f]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[#6fa63a]/20 bg-[#f9fcf6] p-2 text-xs">
                {profileTab === "media" &&
                  (sharedWithUser.media.length === 0 ? (
                    <p className="text-[rgba(23,3,3,0.62)]">No shared media.</p>
                  ) : (
                    sharedWithUser.media.slice(0, 20).map((item) => (
                      <p key={item.id} className="truncate">
                        {item.mediaURL || item.text || "Media"}
                      </p>
                    ))
                  ))}
                {profileTab === "files" &&
                  (sharedWithUser.docs.length === 0 ? (
                    <p className="text-[rgba(23,3,3,0.62)]">No shared files.</p>
                  ) : (
                    sharedWithUser.docs.slice(0, 20).map((item) => (
                      <p key={item.id} className="truncate">
                        {item.fileName || item.mediaURL || "File"}
                      </p>
                    ))
                  ))}
                {profileTab === "links" &&
                  (sharedWithUser.links.length === 0 ? (
                    <p className="text-[rgba(23,3,3,0.62)]">No shared links.</p>
                  ) : (
                    sharedWithUser.links.slice(0, 20).map((item) => (
                      <p key={item.id} className="truncate">
                        {item.text}
                      </p>
                    ))
                  ))}
                {profileTab === "groups" &&
                  (groupsInCommon.length === 0 ? (
                    <p className="text-[rgba(23,3,3,0.62)]">No groups in common.</p>
                  ) : (
                    groupsInCommon.slice(0, 20).map((group) => (
                      <p key={group?._id} className="truncate">
                        {group?.basicInfo?.name || "Group"}
                      </p>
                    ))
                  ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
export default Chat;
