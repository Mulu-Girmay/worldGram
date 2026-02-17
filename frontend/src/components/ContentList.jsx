import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentChat } from "../Redux/chatRedux/chatSlice";
import { selectUser } from "../Redux/userRedux/authSelector";
import { resolveProfileUrl, toInitials } from "../utils/media";

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ContentList = ({ chat, onSelect = null, unreadCount = 0 }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);

  const participants = Array.isArray(chat?.participants) ? chat.participants : [];
  const otherParticipant = participants.find(
    (p) => normalizeId(p?._id || p) !== normalizeId(currentUser?._id),
  );

  const displayName = otherParticipant
    ? `${otherParticipant?.identity?.firstName || ""} ${otherParticipant?.identity?.lastName || ""}`.trim() ||
      otherParticipant?.identity?.username ||
      "Unknown user"
    : chat?.type === "group"
      ? "Group chat"
      : "Direct chat";

  const avatarUrl = resolveProfileUrl(otherParticipant?.identity?.profileUrl);
  const initials = toInitials(displayName || "U");

  const lastMessage = chat?.lastMessageId || null;
  const lastMessageText =
    lastMessage?.content?.text ||
    (lastMessage?.content?.mediaURL ? "Media message" : "No messages yet");

  const handleChat = () => {
    if (typeof onSelect === "function") {
      onSelect(chat);
      return;
    }
    dispatch(setCurrentChat(chat));
    navigate("/chat", { state: { chatId: chat?._id } });
  };

  return (
    <button
      type="button"
      onClick={handleChat}
      className="w-full flex items-center gap-3 rounded-xl border border-transparent bg-transparent px-2 py-2 text-left transition hover:border-[var(--border-color)] hover:bg-white"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="h-11 w-11 rounded-full border border-[var(--border-color)] object-cover"
        />
      ) : (
        <div className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border-color)] bg-[var(--surface-muted)] text-xs font-semibold text-[#2f5b2f]">
          {initials || "U"}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-[var(--text-muted)]">
              {formatTime(lastMessage?.createdAt)}
            </p>
            {Number(unreadCount) > 0 && (
              <span className="rounded-full bg-[#4a7f4a] px-2 py-0.5 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        <p className="truncate text-xs text-[var(--text-muted)]">{lastMessageText}</p>
      </div>
    </button>
  );
};

export default ContentList;
