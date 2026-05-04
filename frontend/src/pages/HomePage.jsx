import React, { useEffect, useMemo, useRef, useState } from "react";
import Nav from "../components/Nav";
import ContentList from "../components/ContentList";
import ChannelList from "../components/ChannelList";
import GroupList from "../components/GroupList";
import LoadingStream from "../components/LoadingStream";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  getChannelUnreadCount,
  listChannel,
} from "../Redux/channelRedux/channelThunk";
import {
  selectChannels,
  selectChannelStatus,
  selectChannelError,
  selectUnreadCountByChannel,
} from "../Redux/channelRedux/channelSelector";
import { selectIsAuthenticated } from "../Redux/userRedux/authSelector";
import { listChats } from "../Redux/chatRedux/chatThunk";
import {
  selectChats,
  selectChatsStatus,
  selectChatError,
  selectUnreadCountByChat,
} from "../Redux/chatRedux/chatSelector";
import { listGroups } from "../Redux/groupRedux/groupThunk";
import {
  selectGroupError,
  selectGroups,
  selectGroupsStatus,
} from "../Redux/groupRedux/groupSelector";
import { listStories } from "../Redux/storyRedux/storyThunk";
import { selectStoriesStatus } from "../Redux/storyRedux/storySelector";
import { setCurrentChat } from "../Redux/chatRedux/chatSlice";
import { getUnreadCount } from "../Redux/chatRedux/chatThunk";
import { setCurrentChannel } from "../Redux/channelRedux/channelSlice";

const Chat = React.lazy(() => import("../components/Chat"));
const Channel = React.lazy(() => import("../components/Channel"));

const LIST_REFRESH_MS = 2 * 60 * 1000;
const UNREAD_REFRESH_MS = 30 * 1000;

const shouldRefresh = (lastTs, ttlMs) =>
  Date.now() - Number(lastTs || 0) >= ttlMs;

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 768px)").matches
      : false,
  );
  const [selectedPane, setSelectedPane] = useState({ type: null, id: null });
  const lastListFetchRef = useRef({
    channels: 0,
    chats: 0,
    groups: 0,
    stories: 0,
  });
  const unreadFetchRef = useRef({
    chats: new Map(),
    channels: new Map(),
  });

  const channels = useSelector(selectChannels);
  const channelStatus = useSelector(selectChannelStatus);
  const channelError = useSelector(selectChannelError);
  const unreadCountByChannel = useSelector(selectUnreadCountByChannel);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const chats = useSelector(selectChats);
  const chatsStatus = useSelector(selectChatsStatus);
  const chatsError = useSelector(selectChatError);
  const unreadCountByChat = useSelector(selectUnreadCountByChat);
  const groups = useSelector(selectGroups);
  const groupsStatus = useSelector(selectGroupsStatus);
  const groupsError = useSelector(selectGroupError);
  const storiesStatus = useSelector(selectStoriesStatus);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (
      channelStatus === "idle" ||
      shouldRefresh(lastListFetchRef.current.channels, LIST_REFRESH_MS)
    ) {
      lastListFetchRef.current.channels = Date.now();
      dispatch(listChannel({ limit: 20 }));
    }
  }, [dispatch, channelStatus, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !Array.isArray(channels) || channels.length === 0)
      return;
    const now = Date.now();
    const validIds = new Set(
      channels.map((channel) => String(channel?._id || "")),
    );
    unreadFetchRef.current.channels.forEach((_, key) => {
      if (!validIds.has(String(key)))
        unreadFetchRef.current.channels.delete(key);
    });

    channels.forEach((channel) => {
      const id = String(channel?._id || "");
      if (id) {
        const last = unreadFetchRef.current.channels.get(id) || 0;
        if (!shouldRefresh(last, UNREAD_REFRESH_MS)) return;
        unreadFetchRef.current.channels.set(id, now);
        dispatch(getChannelUnreadCount(channel._id));
      }
    });
  }, [dispatch, channels, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (
      chatsStatus === "idle" ||
      shouldRefresh(lastListFetchRef.current.chats, LIST_REFRESH_MS)
    ) {
      lastListFetchRef.current.chats = Date.now();
      dispatch(listChats({ limit: 20 }));
    }
  }, [dispatch, chatsStatus, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !Array.isArray(chats) || chats.length === 0) return;
    const now = Date.now();
    const validIds = new Set(chats.map((chat) => String(chat?._id || "")));
    unreadFetchRef.current.chats.forEach((_, key) => {
      if (!validIds.has(String(key))) unreadFetchRef.current.chats.delete(key);
    });

    chats.forEach((chat) => {
      const id = String(chat?._id || "");
      if (id) {
        const last = unreadFetchRef.current.chats.get(id) || 0;
        if (!shouldRefresh(last, UNREAD_REFRESH_MS)) return;
        unreadFetchRef.current.chats.set(id, now);
        dispatch(getUnreadCount(chat._id));
      }
    });
  }, [dispatch, chats, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (
      groupsStatus === "idle" ||
      shouldRefresh(lastListFetchRef.current.groups, LIST_REFRESH_MS)
    ) {
      lastListFetchRef.current.groups = Date.now();
      dispatch(listGroups({ limit: 20 }));
    }
  }, [dispatch, groupsStatus, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (
      storiesStatus === "idle" ||
      shouldRefresh(lastListFetchRef.current.stories, LIST_REFRESH_MS)
    ) {
      lastListFetchRef.current.stories = Date.now();
      dispatch(listStories({ limit: 20 }));
    }
  }, [dispatch, storiesStatus, isAuthenticated]);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const onChange = (event) => setIsDesktop(event.matches);
    setIsDesktop(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const visibleChats = useMemo(() => {
    if (activeFilter === "groups" || activeFilter === "channels") return [];
    return (chats || []).filter((chat) => chat?.type === "private");
  }, [activeFilter, chats]);

  const visibleGroups = useMemo(() => {
    if (activeFilter === "groups" || activeFilter === "all") return groups;
    return [];
  }, [activeFilter, groups]);

  const visibleChannels = useMemo(() => {
    if (activeFilter === "channels" || activeFilter === "all") return channels;
    return [];
  }, [activeFilter, channels]);

  const handlePrivateChatSelect = (chat) => {
    if (!chat?._id) return;
    dispatch(setCurrentChat(chat));
    if (!isDesktop) {
      navigate("/chat", { state: { chatId: chat._id } });
      return;
    }
    setSelectedPane({ type: "chat", id: chat._id });
  };

  const handleGroupChatSelect = (chatId, chatObj = null) => {
    if (!chatId) return;
    if (chatObj) dispatch(setCurrentChat(chatObj));
    if (!isDesktop) {
      navigate("/chat", { state: { chatId } });
      return;
    }
    setSelectedPane({ type: "chat", id: chatId });
  };

  const handleChannelSelect = (channel) => {
    if (!channel?._id) return;
    dispatch(setCurrentChannel(channel));
    if (!isDesktop) {
      navigate("/channel");
      return;
    }
    setSelectedPane({ type: "channel", id: channel._id });
  };

  return (
    <div className="min-h-screen p-0 md:p-4">
      <div className="mx-auto grid h-screen max-w-[1400px] grid-cols-1 gap-0 md:h-[calc(100vh-2rem)] md:grid-cols-[390px_1fr] md:gap-3">
        <aside className="flex min-h-0 flex-col border-r border-[var(--border-color)] bg-[var(--surface-color)] p-3 shadow-[0_12px_30px_rgba(74,127,74,0.12)] md:rounded-2xl md:border">
          <Nav />

          <div className="mt-3 flex items-center gap-2 px-1">
            {[
              { id: "all", label: "All" },
              { id: "groups", label: "Groups" },
              { id: "channels", label: "Channels" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveFilter(item.id)}
                aria-pressed={activeFilter === item.id}
                aria-label={`Show ${item.label.toLowerCase()} conversations`}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeFilter === item.id
                    ? "bg-[#4a7f4a] text-white"
                    : "bg-[#eef6e8] text-[#2f5b2f] hover:bg-[#e2efd8]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-[var(--border-color)] bg-white/75 p-2">
            <div className="my-2 border-t border-[var(--border-color)]" />
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Conversations
            </div>

            {chatsStatus === "loading" && (
              <LoadingStream
                label="Loading chats"
                lines={3}
                className="mb-2 rounded-xl border border-[var(--border-color)] bg-white/80 p-3"
              />
            )}
            {chatsStatus === "failed" && (
              <p className="px-2 py-2 text-xs text-red-600">{chatsError}</p>
            )}
            {visibleChats.map((chat) => (
              <ContentList
                key={chat._id}
                chat={chat}
                onSelect={handlePrivateChatSelect}
                unreadCount={unreadCountByChat?.[chat._id] || 0}
              />
            ))}
            {chatsStatus !== "loading" && visibleChats.length === 0 && (
              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--surface-muted)] p-2 text-xs">
                <p className="text-[var(--text-muted)]">
                  No private chats yet.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/contacts")}
                  className="mt-1 rounded-md border border-[#6fa63a]/25 bg-white px-2 py-1 text-[11px] font-semibold text-[#2f5b2f]"
                >
                  Find contacts
                </button>
              </div>
            )}

            <div className="my-2 border-t border-[var(--border-color)]" />
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Groups
            </div>

            {groupsStatus === "loading" && (
              <LoadingStream
                label="Loading groups"
                lines={3}
                className="mb-2 rounded-xl border border-[var(--border-color)] bg-white/80 p-3"
              />
            )}
            {groupsStatus === "failed" && (
              <p className="px-2 py-2 text-xs text-red-600">{groupsError}</p>
            )}
            {visibleGroups.map((group) => (
              <GroupList
                key={group._id}
                group={group}
                onOpenChat={handleGroupChatSelect}
                unreadCount={
                  unreadCountByChat?.[
                    (chats || []).find(
                      (chat) =>
                        String(chat?.groupId?._id || chat?.groupId || "") ===
                        String(group?._id || ""),
                    )?._id || ""
                  ] || 0
                }
              />
            ))}
            {groupsStatus !== "loading" && visibleGroups.length === 0 && (
              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--surface-muted)] p-2 text-xs">
                <p className="text-[var(--text-muted)]">No groups available.</p>
                <button
                  type="button"
                  onClick={() => navigate("/newgroup")}
                  className="mt-1 rounded-md border border-[#6fa63a]/25 bg-white px-2 py-1 text-[11px] font-semibold text-[#2f5b2f]"
                >
                  Create group
                </button>
              </div>
            )}

            <div className="my-2 border-t border-[var(--border-color)]" />
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Channels
            </div>

            {channelStatus === "loading" && (
              <LoadingStream
                label="Loading channels"
                lines={3}
                className="mb-2 rounded-xl border border-[var(--border-color)] bg-white/80 p-3"
              />
            )}
            {channelStatus === "failed" && (
              <p className="px-2 py-2 text-xs text-red-600">{channelError}</p>
            )}
            {visibleChannels.map((channel) => (
              <ChannelList
                key={channel._id}
                channel={channel}
                onSelect={handleChannelSelect}
                unreadCount={unreadCountByChannel?.[channel._id] || 0}
              />
            ))}
            {channelStatus !== "loading" && visibleChannels.length === 0 && (
              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--surface-muted)] p-2 text-xs">
                <p className="text-[var(--text-muted)]">
                  No channels available.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/newchannel")}
                  className="mt-1 rounded-md border border-[#6fa63a]/25 bg-white px-2 py-1 text-[11px] font-semibold text-[#2f5b2f]"
                >
                  Create channel
                </button>
              </div>
            )}
          </div>
        </aside>

        <main className="hidden min-h-0 bg-[var(--surface-color)] shadow-[0_12px_30px_rgba(74,127,74,0.12)] md:flex md:flex-col md:rounded-2xl md:border md:border-[var(--border-color)]">
          {selectedPane.type === "chat" && selectedPane.id ? (
            <React.Suspense
              fallback={
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                  <LoadingStream
                    label="Loading chat"
                    lines={4}
                    className="rounded-2xl border border-[var(--border-color)] bg-white/75 p-4"
                  />
                </div>
              }
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <Chat chatId={selectedPane.id} />
              </div>
            </React.Suspense>
          ) : selectedPane.type === "channel" && selectedPane.id ? (
            <React.Suspense
              fallback={
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                  <LoadingStream
                    label="Loading channel"
                    lines={4}
                    className="rounded-2xl border border-[var(--border-color)] bg-white/75 p-4"
                  />
                </div>
              }
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                <Channel />
              </div>
            </React.Suspense>
          ) : (
            <>
              <div className="border-b border-[var(--border-color)] px-6 py-4">
                <h1 className="text-lg font-semibold">Telegram Workspace</h1>
                <p className="text-sm text-[var(--text-muted)]">
                  Select a conversation from the left panel to start messaging.
                </p>
              </div>

              <div className="grid flex-1 place-items-center p-8">
                <div className="max-w-[520px] rounded-2xl border border-[var(--border-color)] bg-white p-6 text-center">
                  <p className="text-sm font-semibold text-[#2f5b2f]">
                    Quick summary
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-muted)] p-3">
                      <p className="text-[var(--text-muted)]">Chats</p>
                      <p className="mt-1 text-base font-semibold">
                        {
                          (chats || []).filter(
                            (chat) => chat?.type === "private",
                          ).length
                        }
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-muted)] p-3">
                      <p className="text-[var(--text-muted)]">Groups</p>
                      <p className="mt-1 text-base font-semibold">
                        {groups.length}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-muted)] p-3">
                      <p className="text-[var(--text-muted)]">Channels</p>
                      <p className="mt-1 text-base font-semibold">
                        {channels.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default HomePage;
