import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { ProfileNav } from "./Profile";
import { useDispatch } from "react-redux";
import { FileBoxIcon, SendHorizontal, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import GroupManagePanel from "./group/GroupManagePanel";
import { useToast } from "./ToastProvider";
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
  sendMessage,
} from "../Redux/chatRedux/chatThunk";
import { markMessagesReadByUser, pushIncomingMessage } from "../Redux/chatRedux/chatSlice";
import { resolveAssetUrl, resolveProfileUrl, toInitials } from "../utils/media";

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
  const [showGroupSettings, setShowGroupSettings] = useState(false);

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
  }, [resolvedChatId]);

  useEffect(() => {
    if (!resolvedChatId) return;
    dispatch(getChatById(resolvedChatId));
    dispatch(getMessages(resolvedChatId));
    dispatch(markChatRead(resolvedChatId));
  }, [dispatch, resolvedChatId]);

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

    const handleUserStatus = (payload) => {
      const userId = normalizeId(payload?.userId);
      if (!userId) return;
      setPresenceMap((prev) => ({
        ...prev,
        [userId]: payload?.onlineStatus || "offline",
      }));
    };

    socket.on("new-message", handleIncomingMessage);
    socket.on("chat-read", handleChatRead);
    socket.on("user-status", handleUserStatus);
    return () => {
      socket.off("new-message", handleIncomingMessage);
      socket.off("chat-read", handleChatRead);
      socket.off("user-status", handleUserStatus);
    };
  }, [dispatch, resolvedChatId]);

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
          senderId,
          text,
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
      });
    }
    setDraft("");
  };

  const handleAttach = (event) => {
    if (typeof onAttach === "function") {
      onAttach(event.target.files?.[0] || null);
    }
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

  return (
    <div className="min-h-screen bg-[var(--primary-color)]">
      <ProfileNav
        title={otherName}
        subtitle={
          isGroupChat ? "Group conversation" : (otherStatus || "offline")
        }
        avatarUrl={otherProfile}
        backPath="/home"
      />

      <div className="mx-auto w-full max-w-2xl space-y-3 p-4">
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

          {messagesStatus !== "loading" && renderedMessages.length === 0 && (
            <p className="text-xs text-[rgba(23,3,3,0.6)]">
              No messages yet. Start the conversation.
            </p>
          )}

          {renderedMessages.map((message) => {
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
            const readBy = Array.isArray(message?.state?.readBy)
              ? message.state.readBy.map((id) => normalizeId(id))
              : [];
            const readStatus =
              readBy.length > 1 || readBy.some((id) => id !== senderNormalizedId)
                ? "Read"
                : "Unread";

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
                </div>
              </div>
            );
          })}
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
    </div>
  );
};
export default Chat;
