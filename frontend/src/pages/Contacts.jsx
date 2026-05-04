import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  ShieldAlert,
  Star,
  UserMinus,
  Users,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectContactError,
  selectContacts,
  selectContactsFetchedAt,
  selectContactsStatus,
  selectContactMutateStatus,
  selectRegisteredUsers,
  selectRegisteredUsersFetchedAt,
  selectRegisteredUsersStatus,
} from "../Redux/contactRedux/contactSelector";
import {
  addContact,
  listContacts,
  listRegisteredUsers,
  removeContact,
  updateContact,
} from "../Redux/contactRedux/contactThunk";
import { createChat, listChats } from "../Redux/chatRedux/chatThunk";
import { setCurrentChat } from "../Redux/chatRedux/chatSlice";
import { selectUser } from "../Redux/userRedux/authSelector";
import { resolveProfileUrl, toInitials } from "../utils/media";
import { useToast } from "../components/ToastProvider";
import LoadingStream from "../components/LoadingStream";

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const CONTACT_REFRESH_MS = 2 * 60 * 1000;

const shouldRefresh = (lastTs, ttlMs) =>
  Date.now() - Number(lastTs || 0) >= ttlMs;

const Contacts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const currentUser = useSelector(selectUser);
  const contacts = useSelector(selectContacts);
  const users = useSelector(selectRegisteredUsers);
  const contactsStatus = useSelector(selectContactsStatus);
  const usersStatus = useSelector(selectRegisteredUsersStatus);
  const contactsFetchedAt = useSelector(selectContactsFetchedAt);
  const usersFetchedAt = useSelector(selectRegisteredUsersFetchedAt);
  const mutateStatus = useSelector(selectContactMutateStatus);
  const contactError = useSelector(selectContactError);

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedContactIds, setSelectedContactIds] = useState([]);

  useEffect(() => {
    if (
      contactsStatus === "idle" ||
      (contactsStatus !== "loading" &&
        shouldRefresh(contactsFetchedAt, CONTACT_REFRESH_MS))
    ) {
      dispatch(listContacts({ limit: 200 }));
    }

    if (
      usersStatus === "idle" ||
      (usersStatus !== "loading" &&
        shouldRefresh(usersFetchedAt, CONTACT_REFRESH_MS))
    ) {
      dispatch(listRegisteredUsers({ limit: 60 }));
    }
  }, [
    contactsFetchedAt,
    contactsStatus,
    dispatch,
    usersFetchedAt,
    usersStatus,
  ]);

  const formattedContacts = useMemo(() => {
    return (contacts || []).map((entry) => {
      const user = entry?.contactUserId || {};
      const first = user?.identity?.firstName || "";
      const last = user?.identity?.lastName || "";
      const username = user?.identity?.username || "unknown";
      const full = `${first} ${last}`.trim();
      return {
        ...entry,
        user,
        displayName: entry?.nameOverride?.trim() || full || username,
        username,
        isFavorite: Boolean(entry?.isFavorite),
        isBlocked: Boolean(entry?.isBlocked),
      };
    });
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return formattedContacts.filter((entry) => {
      if (activeFilter === "favorites" && !entry.isFavorite) return false;
      if (activeFilter === "blocked" && !entry.isBlocked) return false;
      if (!q) return true;
      return (
        entry.displayName.toLowerCase().includes(q) ||
        entry.username.toLowerCase().includes(q)
      );
    });
  }, [formattedContacts, activeFilter, query]);

  const contactUserIds = useMemo(
    () =>
      formattedContacts
        .map((entry) => normalizeId(entry?.user?._id || entry?.user))
        .filter(Boolean),
    [formattedContacts],
  );

  const discoverUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
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
  }, [users, query, currentUser?._id, currentUser?.id, contactUserIds]);

  const allVisibleSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((entry) => selectedContactIds.includes(entry._id));

  const toggleSelectOne = (contactId) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId],
    );
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleIds = filteredContacts.map((entry) => entry._id);
      setSelectedContactIds((prev) =>
        prev.filter((id) => !visibleIds.includes(id)),
      );
      return;
    }
    const visibleIds = filteredContacts.map((entry) => entry._id);
    setSelectedContactIds((prev) =>
      Array.from(new Set([...prev, ...visibleIds])),
    );
  };

  const handleOpenChat = async (targetUserId) => {
    const currentUserId = currentUser?._id;
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      return;
    }

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
          if (chat?.type !== "private" || !Array.isArray(chat?.participants)) {
            return false;
          }
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
      dispatch(listContacts({ limit: 200 }));
      return;
    }
    toast.error(
      result.payload?.err || result.payload?.message || "Failed to add contact",
    );
  };

  const handleBulkUpdate = async (payload, successMessage) => {
    if (selectedContactIds.length === 0) return;
    const results = await Promise.all(
      selectedContactIds.map((contactId) =>
        dispatch(updateContact({ contactId, payload })),
      ),
    );
    const failures = results.filter((r) =>
      updateContact.rejected.match(r),
    ).length;
    if (failures > 0) {
      toast.error(`Updated with ${failures} failures. Please retry.`);
    } else {
      toast.success(successMessage);
    }
    dispatch(listContacts({ limit: 200 }));
    setSelectedContactIds([]);
  };

  const handleBulkRemove = async () => {
    if (selectedContactIds.length === 0) return;
    const results = await Promise.all(
      selectedContactIds.map((contactId) => dispatch(removeContact(contactId))),
    );
    const failures = results.filter((r) =>
      removeContact.rejected.match(r),
    ).length;
    if (failures > 0) {
      toast.error(`Removed with ${failures} failures. Please retry.`);
    } else {
      toast.success("Contacts removed");
    }
    dispatch(listContacts({ limit: 200 }));
    setSelectedContactIds([]);
  };

  const handleToggleFavorite = async (entry) => {
    const result = await dispatch(
      updateContact({
        contactId: entry._id,
        payload: { isFavorite: !entry.isFavorite },
      }),
    );
    if (updateContact.rejected.match(result)) {
      toast.error(
        result.payload?.err ||
          result.payload?.message ||
          "Failed to update favorite status",
      );
    }
  };

  const handleToggleBlocked = async (entry) => {
    const result = await dispatch(
      updateContact({
        contactId: entry._id,
        payload: { isBlocked: !entry.isBlocked },
      }),
    );
    if (updateContact.rejected.match(result)) {
      toast.error(
        result.payload?.err ||
          result.payload?.message ||
          "Failed to update blocked status",
      );
    }
  };

  const handleRemoveSingle = async (contactId) => {
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

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-[980px] space-y-4">
        <div className="flex items-center justify-between rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] px-3 py-2 shadow-[0_10px_30px_rgba(74,127,74,0.12)]">
          <button
            type="button"
            onClick={() => navigate("/sidebar")}
            className="rounded-lg border border-[#6fa63a]/20 bg-white p-2 text-[#2f5b2f] transition hover:-translate-y-0.5"
            aria-label="Back"
          >
            <ArrowLeft size={15} />
          </button>
          <p className="text-sm font-semibold text-[rgba(23,3,3,0.88)]">
            Contacts
          </p>
          <span className="rounded-full bg-[#6fa63a]/15 px-2 py-0.5 text-xs font-semibold text-[#2f5b2f]">
            {formattedContacts.length}
          </span>
        </div>

        <section className="rounded-2xl border border-[#6fa63a]/20 bg-white/80 p-3 shadow-[0_10px_24px_rgba(74,127,74,0.1)]">
          <div className="flex flex-wrap items-center gap-2">
            {["all", "favorites", "blocked"].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeFilter === key
                    ? "bg-[#4a7f4a] text-white"
                    : "border border-[#6fa63a]/25 bg-white text-[#2f5b2f]"
                }`}
              >
                {key}
              </button>
            ))}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts or users"
              aria-label="Search contacts or users"
              className="ml-auto min-w-[220px] rounded-lg border border-[#6fa63a]/25 bg-white px-3 py-2 text-sm outline-none focus:border-[#4a7f4a]"
            />
          </div>

          {selectedContactIds.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#6fa63a]/20 bg-[#f8fdf3] p-2">
              <p className="text-xs font-semibold text-[#2f5b2f]">
                {selectedContactIds.length} selected
              </p>
              <button
                type="button"
                onClick={() =>
                  handleBulkUpdate({ isFavorite: true }, "Marked as favorite")
                }
                className="rounded-lg border border-[#6fa63a]/25 bg-white px-2 py-1 text-xs"
              >
                Favorite
              </button>
              <button
                type="button"
                onClick={() =>
                  handleBulkUpdate({ isFavorite: false }, "Favorites removed")
                }
                className="rounded-lg border border-[#6fa63a]/25 bg-white px-2 py-1 text-xs"
              >
                Unfavorite
              </button>
              <button
                type="button"
                onClick={() =>
                  handleBulkUpdate({ isBlocked: true }, "Contacts blocked")
                }
                className="rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700"
              >
                Block
              </button>
              <button
                type="button"
                onClick={() =>
                  handleBulkUpdate({ isBlocked: false }, "Contacts unblocked")
                }
                className="rounded-lg border border-[#6fa63a]/25 bg-white px-2 py-1 text-xs"
              >
                Unblock
              </button>
              <button
                type="button"
                onClick={handleBulkRemove}
                className="rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700"
              >
                Remove
              </button>
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[#6fa63a]/20 bg-white/80 p-3 shadow-[0_10px_24px_rgba(74,127,74,0.1)]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4a7f4a]">
                Your Contacts
              </p>
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                className="text-xs text-[#2f5b2f] underline-offset-2 hover:underline"
              >
                {allVisibleSelected ? "Clear visible" : "Select visible"}
              </button>
            </div>

            {contactsStatus === "loading" && (
              <LoadingStream
                label="Loading contacts"
                lines={3}
                className="rounded-xl border border-[#6fa63a]/20 bg-white/75 p-3"
              />
            )}

            {contactsStatus === "failed" && (
              <p className="text-xs text-red-600">
                {contactError || "Failed to load contacts"}
              </p>
            )}

            {contactsStatus !== "loading" && filteredContacts.length === 0 && (
              <p className="text-xs text-[rgba(23,3,3,0.62)]">
                No contacts found.
              </p>
            )}

            <div className="space-y-2">
              {filteredContacts.map((entry) => {
                const user = entry?.user || {};
                const userId = normalizeId(user?._id || user?.id);
                const checked = selectedContactIds.includes(entry._id);
                const profileUrl = resolveProfileUrl(
                  user?.identity?.profileUrl,
                );
                const onlineStatus =
                  user?.AccountStatus?.onlineStatus || "offline";
                return (
                  <div
                    key={entry._id}
                    className="flex items-center gap-2 rounded-xl border border-[#6fa63a]/15 bg-white px-2 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelectOne(entry._id)}
                    />
                    {profileUrl ? (
                      <img
                        src={profileUrl}
                        alt={entry.displayName}
                        loading="lazy"
                        decoding="async"
                        className="h-9 w-9 rounded-full border border-[#6fa63a]/20 object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#6fa63a]/20 bg-[#eaf4e2] text-xs font-semibold text-[#4a7f4a]">
                        {toInitials(entry.displayName) || "U"}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenChat(userId)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-semibold text-[rgba(23,3,3,0.88)]">
                        {entry.displayName}
                      </p>
                      <p className="truncate text-[11px] text-[rgba(23,3,3,0.62)]">
                        @{entry.username} - {onlineStatus}
                      </p>
                    </button>
                    {entry.isFavorite && (
                      <span title="Favorite" className="text-[#d19f1a]">
                        <Star size={14} fill="currentColor" />
                      </span>
                    )}
                    {entry.isBlocked && (
                      <span title="Blocked" className="text-red-600">
                        <ShieldAlert size={14} />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(entry)}
                      className="rounded-md border border-[#6fa63a]/25 px-2 py-1 text-[10px]"
                    >
                      {entry.isFavorite ? "Unstar" : "Star"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleBlocked(entry)}
                      className="rounded-md border border-[#6fa63a]/25 px-2 py-1 text-[10px]"
                    >
                      {entry.isBlocked ? "Unblock" : "Block"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSingle(entry._id)}
                      className="rounded-md border border-red-300 px-2 py-1 text-[10px] text-red-700"
                    >
                      <UserMinus size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[#6fa63a]/20 bg-white/80 p-3 shadow-[0_10px_24px_rgba(74,127,74,0.1)]">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#4a7f4a]">
              <Users size={13} /> Discover People
            </p>

            {usersStatus === "loading" && (
              <LoadingStream
                label="Loading users"
                lines={3}
                className="rounded-xl border border-[#6fa63a]/20 bg-white/75 p-3"
              />
            )}

            {usersStatus === "failed" && (
              <p className="text-xs text-red-600">
                {contactError || "Failed to load users"}
              </p>
            )}

            <div className="space-y-2">
              {discoverUsers.slice(0, 24).map((user) => {
                const first = user?.identity?.firstName || "";
                const last = user?.identity?.lastName || "";
                const username = user?.identity?.username || "unknown";
                const displayName = `${first} ${last}`.trim() || username;
                const profileUrl = resolveProfileUrl(
                  user?.identity?.profileUrl,
                );
                return (
                  <div
                    key={user?._id}
                    className="flex items-center gap-2 rounded-xl border border-[#6fa63a]/15 bg-white px-2 py-2"
                  >
                    {profileUrl ? (
                      <img
                        src={profileUrl}
                        alt={displayName}
                        loading="lazy"
                        decoding="async"
                        className="h-9 w-9 rounded-full border border-[#6fa63a]/20 object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#6fa63a]/20 bg-[#eaf4e2] text-xs font-semibold text-[#4a7f4a]">
                        {toInitials(displayName) || "U"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[rgba(23,3,3,0.88)]">
                        {displayName}
                      </p>
                      <p className="truncate text-[11px] text-[rgba(23,3,3,0.62)]">
                        @{username}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddContact(user?._id)}
                      disabled={mutateStatus === "loading"}
                      className="rounded-md border border-[#6fa63a]/25 px-2 py-1 text-[11px] text-[#2f5b2f] disabled:opacity-60"
                    >
                      Add
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {mutateStatus === "loading" && (
          <p className="inline-flex items-center gap-2 text-xs text-[rgba(23,3,3,0.62)]">
            <Loader2 size={12} className="animate-spin" />
            Applying contact changes...
          </p>
        )}
      </div>
    </div>
  );
};

export default Contacts;
