import React from "react";
import { Users } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createGroupChat, listChats } from "../Redux/chatRedux/chatThunk";
import { setCurrentChat } from "../Redux/chatRedux/chatSlice";
import { selectChats } from "../Redux/chatRedux/chatSelector";
import { useToast } from "./ToastProvider";
import { joinGroup } from "../Redux/groupRedux/groupThunk";

const GroupList = ({ group, onOpenChat = null, unreadCount = 0 }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const chats = useSelector(selectChats);
  const toast = useToast();

  const findGroupChat = (list, groupId) =>
    (list || []).find(
      (chat) =>
        String(chat?.groupId?._id || chat?.groupId || "") === String(groupId),
    );

  const memberCount = Array.isArray(group?.members?.members)
    ? group.members.members.length
    : 0;

  const handleOpenGroupChat = async (e) => {
    e.preventDefault();
    const groupId = group?._id;
    if (!groupId) return;

    const existing = findGroupChat(chats, groupId);

    if (existing?._id) {
      dispatch(setCurrentChat(existing));
      if (typeof onOpenChat === "function") {
        onOpenChat(existing._id, existing);
      } else {
        navigate("/chat", { state: { chatId: existing._id } });
      }
      return;
    }

    // Try joining first (public groups), so chat membership and visibility are granted.
    await dispatch(joinGroup(groupId));

    // Refresh chats first in case a group chat already exists but is not in local store.
    const beforeCreateList = await dispatch(listChats({ limit: 100 }));
    if (listChats.fulfilled.match(beforeCreateList)) {
      const matched = findGroupChat(beforeCreateList.payload?.items || [], groupId);
      if (matched?._id) {
        dispatch(setCurrentChat(matched));
        if (typeof onOpenChat === "function") {
          onOpenChat(matched._id, matched);
        } else {
          navigate("/chat", { state: { chatId: matched._id } });
        }
        return;
      }
    }

    const createResult = await dispatch(createGroupChat({ groupId, payload: {} }));
    const chatIdFromCreate = createResult.payload?.chatId || null;
    if (chatIdFromCreate) {
      if (typeof onOpenChat === "function") {
        onOpenChat(chatIdFromCreate, null);
      } else {
        navigate("/chat", { state: { chatId: chatIdFromCreate } });
      }
      return;
    }

    // Whether create succeeded without chatId or failed, try one last refresh to resolve chat.
    const refreshResult = await dispatch(listChats({ limit: 100 }));
    if (listChats.fulfilled.match(refreshResult)) {
      const matched = findGroupChat(refreshResult.payload?.items || [], groupId);
      if (matched?._id) {
        dispatch(setCurrentChat(matched));
        if (typeof onOpenChat === "function") {
          onOpenChat(matched._id, matched);
        } else {
          navigate("/chat", { state: { chatId: matched._id } });
        }
        return;
      }
    }

    const createErr =
      createResult.payload?.err ||
      createResult.payload?.message ||
      createResult.error?.message ||
      null;
    toast.error(
      createErr || "Unable to open this group chat. Join the group first.",
    );
  };

  return (
    <button
      type="button"
      className="w-full flex items-center gap-3 rounded-xl border border-transparent bg-transparent px-2 py-2 text-left transition hover:border-[var(--border-color)] hover:bg-white"
      onClick={handleOpenGroupChat}
    >
      <div className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border-color)] bg-[var(--surface-muted)] text-[#2f5b2f]">
        <Users size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-semibold">
            {group?.basicInfo?.groupName || "Unnamed group"}
          </h3>
          <span className="text-[10px] text-[var(--text-muted)]">group</span>
        </div>
        <p className="truncate text-xs text-[var(--text-muted)]">
          {group?.basicInfo?.description || "No description"}
        </p>
      </div>

      <div className="flex items-center">
        {Number(unreadCount) > 0 ? (
          <span className="rounded-full bg-[#4a7f4a] px-2 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : (
          <span className="rounded-full bg-[#4a7f4a] px-2 py-0.5 text-[10px] font-semibold text-white">
            {memberCount}
          </span>
        )}
      </div>
    </button>
  );
};

export default GroupList;
