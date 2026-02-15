import React, { useEffect, useMemo, useState } from "react";
import Profile from "./Profile";
import {
  UserCircle,
  Users,
  Megaphone,
  Contact,
  Folders,
  Bookmark,
  Phone,
  Settings,
  Settings2,
  LogOutIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  selectIsAuthenticated,
  selectUser,
} from "../Redux/userRedux/authSelector";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../Redux/userRedux/authThunk";
import {
  selectContactError,
  selectRegisteredUsers,
  selectRegisteredUsersStatus,
} from "../Redux/contactRedux/contactSelector";
import { listRegisteredUsers } from "../Redux/contactRedux/contactThunk";
import { createChat, listChats } from "../Redux/chatRedux/chatThunk";
import { setCurrentChat } from "../Redux/chatRedux/chatSlice";

const SideBar = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectUser);
  const users = useSelector(selectRegisteredUsers);
  const usersStatus = useSelector(selectRegisteredUsersStatus);
  const usersError = useSelector(selectContactError);
  const [searchValue, setSearchValue] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(listRegisteredUsers({ limit: 30 }));
    }
  }, [dispatch, isAuthenticated]);

  const visibleUsers = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const first = user?.identity?.firstName || "";
      const last = user?.identity?.lastName || "";
      const username = user?.identity?.username || "";
      const full = `${first} ${last}`.trim();
      return (
        full.toLowerCase().includes(q) || username.toLowerCase().includes(q)
      );
    });
  }, [users, searchValue]);
  const handleLogout = async (e) => {
    e.preventDefault();
    const result = await dispatch(logoutUser());
    if (logoutUser.fulfilled.match(result)) {
      navigate("/login");
    }
  };
  const handleContactClick = async (targetUserId) => {
    const currentUserId = currentUser?._id;
    if (!currentUserId || !targetUserId || currentUserId === targetUserId)
      return;

    const participants = [currentUserId, targetUserId];
    let resolvedChatId = null;
    let resolvedChat = null;

    const createResult = await dispatch(createChat({ type: "private", participants }));
    if (createChat.rejected.match(createResult)) {
      resolvedChatId = createResult.payload?.chatId || null;
    }

    const listResult = await dispatch(listChats({ limit: 50 }));
    if (listChats.fulfilled.match(listResult)) {
      const chats = listResult.payload?.items || [];
      resolvedChat =
        chats.find((chat) => {
          if (chat?.type !== "private" || !Array.isArray(chat?.participants))
            return false;
          const ids = chat.participants.map((p) => String(p?._id || p));
          return (
            ids.length === 2 &&
            ids.includes(String(currentUserId)) &&
            ids.includes(String(targetUserId))
          );
        }) || null;

      if (resolvedChat?._id) {
        resolvedChatId = resolvedChat._id;
        dispatch(setCurrentChat(resolvedChat));
      }
    }

    navigate("/chat", { state: { chatId: resolvedChatId } });
  };
  const handleNewChannel = (e) => {
    e.preventDefault();
    navigate("/newchannel");
  };
  const handleNewGroup = (e) => {
    e.preventDefault();
    navigate("/newgroup");
  };
  const handleProfile = (e) => {
    e.preventDefault();
    navigate("/myprofile");
  };
  return (
    <>
      <aside className="w-full h-screen max-w-[320px] rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-4 text-[rgba(23,3,3,0.87)] shadow-[0_10px_30px_rgba(74,127,74,0.12)]">
        <Profile />

        <div className="mt-4 space-y-1">
          <div
            onClick={handleProfile}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10"
          >
            <UserCircle size={18} />
            <span>My Profile</span>
          </div>

          <div
            onClick={handleNewGroup}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10"
          >
            <Users size={18} />
            <span>New Group</span>
          </div>

          <div
            onClick={handleNewChannel}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10"
          >
            <Megaphone size={18} />
            <span>New Channel</span>
          </div>

          <div className="rounded-xl border border-[#6fa63a]/20 bg-white/60 px-3 py-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Contact size={16} />
              <span>Contacts</span>
            </div>

            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search users"
              className="mb-2 w-full rounded-lg border border-[#6fa63a]/20 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#6fa63a]/50"
            />

            <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
              {usersStatus === "loading" && (
                <p className="px-1 py-1 text-xs text-[rgba(23,3,3,0.65)]">
                  Loading users...
                </p>
              )}

              {usersStatus === "failed" && (
                <p className="px-1 py-1 text-xs text-red-600">
                  {usersError || "Failed to load users"}
                </p>
              )}

              {usersStatus === "succeeded" && visibleUsers.length === 0 && (
                <p className="px-1 py-1 text-xs text-[rgba(23,3,3,0.65)]">
                  No users found.
                </p>
              )}

              {visibleUsers.map((user) => {
                const first = user?.identity?.firstName || "";
                const last = user?.identity?.lastName || "";
                const username = user?.identity?.username || "unknown";
                const displayName = `${first} ${last}`.trim() || username;
                const profileUrl = user?.identity?.profileUrl;
                const onlineStatus = user?.AccountStatus?.onlineStatus || "offline";
                const initials = displayName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() || "")
                  .join("");

                return (
                  <div
                    key={user._id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#6fa63a]/10"
                    onClick={() => handleContactClick(user._id)}
                  >
                    {profileUrl ? (
                      <img
                        src={profileUrl}
                        alt={displayName}
                        className="h-8 w-8 rounded-full border border-[#6fa63a]/25 object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#6fa63a]/25 bg-[#eaf4e2] text-[10px] font-semibold text-[#4a7f4a]">
                        {initials || "U"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">
                        {displayName}
                      </p>
                      <p className="truncate text-[10px] text-[rgba(23,3,3,0.62)]">
                        @{username} • {onlineStatus}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10">
            <div className="flex items-center gap-3">
              <Folders size={18} />
              <span>Chat Folders</span>
            </div>
            <span className="text-xs font-semibold text-[#4a7f4a]">
              4 Online
            </span>
          </div>

          <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10">
            <Bookmark size={18} />
            <span>Saved Message</span>
          </div>

          <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10">
            <Phone size={18} />
            <span>Call</span>
          </div>

          <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10">
            <Settings size={18} />
            <span>Settings</span>
          </div>

          <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10">
            <Settings2 size={18} />
            <span>Plus Settings</span>
          </div>
          <div
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10"
          >
            <LogOutIcon size={18} />
            <span>Log Out</span>
          </div>
        </div>

        <p className="mt-10 mb-0 text-center text-xs text-[#4a7f4a]">
          WorldGram Web
        </p>
      </aside>
    </>
  );
};

export default SideBar;
