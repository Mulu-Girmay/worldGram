import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { ProfileNav } from "./Profile";
import { useDispatch } from "react-redux";
import { FileBoxIcon, SendHorizontal } from "lucide-react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import {
  selectChatById,
  selectCurrentChat,
  selectMessages,
  selectMessagesStatus,
} from "../Redux/chatRedux/chatSelector";
import { selectUser } from "../Redux/userRedux/authSelector";
import { getMessages, sendMessage } from "../Redux/chatRedux/chatThunk";
import { pushIncomingMessage } from "../Redux/chatRedux/chatSlice";

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  const socketRef = useRef(null);
  const currentChatFromStore = useSelector(selectCurrentChat);
  const selectedChatFromStore = useSelector((state) =>
    chatId || routeChatId ? selectChatById(state, chatId || routeChatId) : null,
  );
  const messagesFromStore = useSelector(selectMessages);
  const messagesStatus = useSelector(selectMessagesStatus);

  const [draft, setDraft] = useState("");

  const activeChat =
    currentChatProp || selectedChatFromStore || currentChatFromStore || null;
  const renderedMessages = messagesProp || messagesFromStore || [];

  const title = useMemo(() => {
    if (activeChat?.title) return activeChat.title;
    if (activeChat?.type) return `${activeChat.type} chat`;
    return "Chat";
  }, [activeChat]);

  const resolvedChatId = activeChat?._id || chatId || routeChatId || null;

  useEffect(() => {
    if (!resolvedChatId) return;
    dispatch(getMessages(resolvedChatId));
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
    };

    socket.on("new-message", handleIncomingMessage);
    return () => {
      socket.off("new-message", handleIncomingMessage);
    };
  }, [dispatch, resolvedChatId]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;

    if (!resolvedChatId) {
      console.error("Send blocked: missing chatId", {
        activeChatId: activeChat?._id || null,
        propChatId: chatId || null,
        routeChatId: routeChatId || null,
      });
      return;
    }

    const senderId = currentUser?._id || null;
    if (!senderId) {
      console.error("Send blocked: missing current user id");
      return;
    }

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("send-message", { chatId: resolvedChatId, text });
    } else {
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
        console.error("Send failed", {
          chatId: resolvedChatId,
          senderId,
          payload: result.payload,
          error: result.error,
        });
        return;
      }
    }

    console.log("Send success", { chatId: resolvedChatId });

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

  return (
    <div className="min-h-screen bg-[var(--primary-color)]">
      <ProfileNav />

      <div className="mx-auto w-full max-w-2xl space-y-3 p-4">
        <div className="rounded-xl border border-[#6fa63a]/20 bg-white/60 px-3 py-2">
          <p className="text-sm font-semibold text-[rgba(23,3,3,0.9)]">
            {title}
          </p>
          <p className="text-xs text-[rgba(23,3,3,0.62)]">
            {activeChat?._id || "No active chat selected"}
          </p>
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
            const isOwn =
              String(senderId || "") === String(currentUser?._id || "");
            const text = message?.content?.text || "";

            return (
              <div
                key={message?._id || `${senderId}-${message?.createdAt}`}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    isOwn
                      ? "rounded-br-sm bg-[var(--btn-color)] text-white"
                      : "rounded-bl-sm bg-white text-[rgba(23,3,3,0.87)]"
                  }`}
                >
                  <p className="break-words">{text || "(no text)"}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      isOwn ? "text-white/70" : "text-[rgba(23,3,3,0.52)]"
                    }`}
                  >
                    {formatTime(message?.createdAt)}
                  </p>
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
    </div>
  );
};
export default Chat;
