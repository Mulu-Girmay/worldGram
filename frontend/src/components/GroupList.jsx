import React from "react";
import { Users } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createGroupChat, listChats } from "../Redux/chatRedux/chatThunk";
import { setCurrentChat } from "../Redux/chatRedux/chatSlice";
import { selectChats } from "../Redux/chatRedux/chatSelector";
import { useToast } from "./ToastProvider";
import { joinGroup } from "../Redux/groupRedux/groupThunk";

const GroupList = ({ group }) => {
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
      navigate("/chat", { state: { chatId: existing._id } });
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
        navigate("/chat", { state: { chatId: matched._id } });
        return;
      }
    }

    const createResult = await dispatch(createGroupChat({ groupId, payload: {} }));
    const chatIdFromCreate = createResult.payload?.chatId || null;
    if (chatIdFromCreate) {
      navigate("/chat", { state: { chatId: chatIdFromCreate } });
      return;
    }

    // Whether create succeeded without chatId or failed, try one last refresh to resolve chat.
    const refreshResult = await dispatch(listChats({ limit: 100 }));
    if (listChats.fulfilled.match(refreshResult)) {
      const matched = findGroupChat(refreshResult.payload?.items || [], groupId);
      if (matched?._id) {
        dispatch(setCurrentChat(matched));
        navigate("/chat", { state: { chatId: matched._id } });
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
    <div
      className="w-full flex items-start gap-4 rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-4 text-[rgba(23,3,3,0.87)] shadow-[0_10px_30px_rgba(74,127,74,0.12)] mb-0"
      onClick={handleOpenGroupChat}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#6fa63a]/35 bg-[#eaf4e2] text-[#4a7f4a]">
        <Users size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-semibold">
            {group?.basicInfo?.groupName || "Unnamed group"}
          </h3>
        </div>
        <p className="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm text-[rgba(23,3,3,0.72)]">
          {group?.basicInfo?.description || "No description"}
        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <span className="rounded-full bg-[#4a7f4a] px-2 py-0.5 text-xs font-semibold text-white">
          {memberCount}
        </span>
      </div>
    </div>
  );
};

export default GroupList;
