import React, { useEffect, useMemo, useState } from "react";
import Profile from "./Profile";
import {
  Loader2,
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
  selectContacts,
  selectContactsStatus,
  selectContactMutateStatus,
  selectRegisteredUsers,
  selectRegisteredUsersStatus,
} from "../Redux/contactRedux/contactSelector";
import {
  addContact,
  listContacts,
  listRegisteredUsers,
  removeContact,
} from "../Redux/contactRedux/contactThunk";
import { createChat, listChats } from "../Redux/chatRedux/chatThunk";
import { setCurrentChat } from "../Redux/chatRedux/chatSlice";
import { resolveProfileUrl, toInitials } from "../utils/media";
import { useToast } from "./ToastProvider";

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const SideBar = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectUser);
  const contacts = useSelector(selectContacts);
  const contactsStatus = useSelector(selectContactsStatus);
  const contactMutateStatus = useSelector(selectContactMutateStatus);
  const users = useSelector(selectRegisteredUsers);
  const usersStatus = useSelector(selectRegisteredUsersStatus);
  const usersError = useSelector(selectContactError);
  const [searchValue, setSearchValue] = useState("");
  const dispatch = useDispatch();
  const toast = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(listRegisteredUsers({ limit: 30 }));
      dispatch(listContacts({ limit: 100 }));
    }
  }, [dispatch, isAuthenticated]);

  const contactUserIds = useMemo(() => {
    return (contacts || [])
      .map((entry) =>
        normalizeId(entry?.contactUserId?._id || entry?.contactUserId),
      )
      .filter(Boolean);
  }, [contacts]);

  const visibleContacts = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    const list = (contacts || []).map((contact) => {
      const user = contact?.contactUserId || {};
      const first = user?.identity?.firstName || "";
      const last = user?.identity?.lastName || "";
      const username = user?.identity?.username || "";
      const full = `${first} ${last}`.trim();
      return {
        ...contact,
        user,
        displayName: contact?.nameOverride?.trim() || full || username,
        username,
      };
    });
    if (!q) return list;
    return list.filter((entry) => {
      return (
        entry.displayName.toLowerCase().includes(q) ||
        entry.username.toLowerCase().includes(q)
      );
    });
  }, [contacts, searchValue]);

  const discoverUsers = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    const currentUserId = normalizeId(currentUser?._id || currentUser?.id);
    return (users || []).filter((user) => {
      const id = normalizeId(user?._id || user?.id);
      if (!id || id === currentUserId) return false;
      if (contactUserIds.includes(id)) return false;
      const first = user?.identity?.firstName || "";
      const last = user?.identity?.lastName || "";
      const username = user?.identity?.username || "";
      const full = `${first} ${last}`.trim();
      if (!q) return true;
      return (
        full.toLowerCase().includes(q) || username.toLowerCase().includes(q)
      );
    });
  }, [users, currentUser?._id, currentUser?.id, contactUserIds, searchValue]);
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

    const createResult = await dispatch(
      createChat({ type: "private", participants }),
    );
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

    if (!resolvedChatId) {
      toast.error("Unable to open private chat right now.");
      return;
    }

    navigate("/chat", { state: { chatId: resolvedChatId } });
  };

  const handleAddContact = async (targetUserId) => {
    const result = await dispatch(addContact({ userId: targetUserId }));
    if (addContact.fulfilled.match(result)) {
      toast.success("Contact added");
      dispatch(listContacts({ limit: 100 }));
      return;
    }
    toast.error(
      result.payload?.err || result.payload?.message || "Failed to add contact",
    );
  };

  const handleRemoveContact = async (contactId) => {
    const result = await dispatch(removeContact(contactId));
    if (removeContact.fulfilled.match(result)) {
      toast.success("Contact removed");
      return;
    }
    toast.error(
      result.payload?.err ||
        result.payload?.message ||
        "Failed to remove contact",
    );
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
  const handleSettings = (e) => {
    e.preventDefault();
    navigate("/settings");
  };
  return (
    <>
      <aside className="w-full h-screen max-w-[320px] rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-4 text-[rgba(23,3,3,0.87)] shadow-[0_10px_30px_rgba(74,127,74,0.12)]">
        <Profile />

        <div className="mt-4 space-y-1">
          <button
            type="button"
            onClick={handleProfile}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10"
          >
            <UserCircle size={18} />
            <span>My Profile</span>
          </button>

          <button
            type="button"
            onClick={handleNewGroup}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10"
          >
            <Users size={18} />
            <span>New Group</span>
          </button>

          <button
            type="button"
            onClick={handleNewChannel}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10"
          >
            <Megaphone size={18} />
            <span>New Channel</span>
          </button>

          <div className="rounded-xl border border-[#6fa63a]/20 bg-white/60 px-3 py-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Contact size={16} />
              <span>Contacts</span>
              <span className="ml-auto rounded-full bg-[#6fa63a]/15 px-2 py-0.5 text-[10px] font-semibold text-[#2f5b2f]">
                {contacts.length}
              </span>
              <button
                type="button"
                onClick={() => navigate("/contacts")}
                className="rounded-md border border-[#6fa63a]/25 bg-white px-2 py-0.5 text-[10px] font-semibold text-[#2f5b2f] hover:bg-[#f3f9ee]"
              >
                Open
              </button>
            </div>

            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search users"
              className="mb-2 w-full rounded-lg border border-[#6fa63a]/20 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#6fa63a]/50"
            />

            <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
              {contactsStatus === "loading" && (
                <p className="px-1 py-1 text-xs text-[rgba(23,3,3,0.65)]">
                  Loading contacts...
                </p>
              )}

              {contactsStatus === "failed" && (
                <p className="px-1 py-1 text-xs text-red-600">
                  {usersError || "Failed to load contacts"}
                </p>
              )}

              {contactsStatus === "succeeded" &&
                visibleContacts.length === 0 && (
                  <p className="px-1 py-1 text-xs text-[rgba(23,3,3,0.65)]">
                    No contacts yet.
                  </p>
                )}

              {visibleContacts.map((entry) => {
                const user = entry?.user || {};
                const username = entry?.username || "unknown";
                const displayName = entry?.displayName || username;
                const profileUrl = resolveProfileUrl(
                  user?.identity?.profileUrl,
                );
                const onlineStatus =
                  user?.AccountStatus?.onlineStatus || "offline";
                const initials = toInitials(displayName);
                const targetUserId = normalizeId(user?._id || user?.id);

                return (
                  <div
                    key={entry?._id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#6fa63a]/10"
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      onClick={() => handleContactClick(targetUserId)}
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
                          @{username} - {onlineStatus}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(entry?._id)}
                      className="rounded-md border border-[#6fa63a]/25 px-2 py-1 text-[10px] text-[#2f5b2f] hover:bg-white"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}

              <div className="my-2 border-t border-[#6fa63a]/15" />
              <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-[rgba(23,3,3,0.55)]">
                Discover
              </p>

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

              {usersStatus === "succeeded" && discoverUsers.length === 0 && (
                <p className="px-1 py-1 text-xs text-[rgba(23,3,3,0.65)]">
                  No more users to add.
                </p>
              )}

              {discoverUsers.slice(0, 20).map((user) => {
                const first = user?.identity?.firstName || "";
                const last = user?.identity?.lastName || "";
                const username = user?.identity?.username || "unknown";
                const displayName = `${first} ${last}`.trim() || username;
                const profileUrl = resolveProfileUrl(
                  user?.identity?.profileUrl,
                );
                const initials = toInitials(displayName);
                return (
                  <div
                    key={user?._id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#6fa63a]/10"
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
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {displayName}
                      </p>
                      <p className="truncate text-[10px] text-[rgba(23,3,3,0.62)]">
                        @{username}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddContact(user?._id)}
                      disabled={contactMutateStatus === "loading"}
                      className="rounded-md border border-[#6fa63a]/25 px-2 py-1 text-[10px] text-[#2f5b2f] hover:bg-white disabled:opacity-60"
                    >
                      {contactMutateStatus === "loading" ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        "Add"
                      )}
                    </button>
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

          <button
            type="button"
            onClick={handleSettings}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-[#6fa63a]/10"
          >
            <Settings size={18} />
            <span>Privacy & Settings</span>
          </button>

          <button
            type="button"
            onClick={handleSettings}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-[#6fa63a]/10"
          >
            <Settings2 size={18} />
            <span>Advanced Privacy</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10"
          >
            <LogOutIcon size={18} />
            <span>Log Out</span>
          </button>
        </div>

        <p className="mt-10 mb-0 text-center text-xs text-[#4a7f4a]">
          WorldGram Web
        </p>
      </aside>
    </>
  );
};

export default SideBar;
