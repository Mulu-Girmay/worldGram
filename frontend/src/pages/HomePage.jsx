import React, { useEffect, useMemo, useState } from "react";
import Nav from "../components/Nav";
import ContentList from "../components/ContentList";
import ChannelList from "../components/ChannelList";
import GroupList from "../components/GroupList";
import Chat from "../components/Chat";
import Channel from "../components/Channel";
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
import {
  selectIsAuthenticated,
} from "../Redux/userRedux/authSelector";
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

const HomePage = () => {
  const dispatch = useDispatch();
  const [activeFilter, setActiveFilter] = useState("all");
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 768px)").matches
      : false,
  );
  const [selectedPane, setSelectedPane] = useState({ type: null, id: null });

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
    if (isAuthenticated && channelStatus === "idle") {
      dispatch(listChannel({ limit: 20 }));
    }
  }, [dispatch, channelStatus, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !Array.isArray(channels) || channels.length === 0)
      return;
    channels.forEach((channel) => {
      if (channel?._id) {
        dispatch(getChannelUnreadCount(channel._id));
      }
    });
  }, [dispatch, channels, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && chatsStatus === "idle") {
      dispatch(listChats({ limit: 20 }));
    }
  }, [dispatch, chatsStatus, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !Array.isArray(chats) || chats.length === 0) return;
    chats.forEach((chat) => {
      if (chat?._id) {
        dispatch(getUnreadCount(chat._id));
      }
    });
  }, [dispatch, chats, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && groupsStatus === "idle") {
      dispatch(listGroups({ limit: 20 }));
    }
  }, [dispatch, groupsStatus, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && storiesStatus === "idle") {
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
    setSelectedPane({ type: "chat", id: chat._id });
  };

  const handleGroupChatSelect = (chatId, chatObj = null) => {
    if (!chatId) return;
    if (chatObj) dispatch(setCurrentChat(chatObj));
    setSelectedPane({ type: "chat", id: chatId });
  };

  const handleChannelSelect = (channel) => {
    if (!channel?._id) return;
    dispatch(setCurrentChannel(channel));
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

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-white/75 p-2">
            <div className="my-2 border-t border-[var(--border-color)]" />
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Conversations
            </div>

            {chatsStatus === "loading" && (
              <p className="px-2 py-2 text-xs text-[var(--text-muted)]">
                Loading chats...
              </p>
            )}
            {chatsStatus === "failed" && (
              <p className="px-2 py-2 text-xs text-red-600">{chatsError}</p>
            )}
            {visibleChats.map((chat) => (
              <ContentList
                key={chat._id}
                chat={chat}
                onSelect={isDesktop ? handlePrivateChatSelect : null}
                unreadCount={unreadCountByChat?.[chat._id] || 0}
              />
            ))}

            <div className="my-2 border-t border-[var(--border-color)]" />
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Groups
            </div>

            {groupsStatus === "loading" && (
              <p className="px-2 py-2 text-xs text-[var(--text-muted)]">
                Loading groups...
              </p>
            )}
            {groupsStatus === "failed" && (
              <p className="px-2 py-2 text-xs text-red-600">{groupsError}</p>
            )}
            {visibleGroups.map((group) => (
              <GroupList
                key={group._id}
                group={group}
                onOpenChat={isDesktop ? handleGroupChatSelect : null}
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

            <div className="my-2 border-t border-[var(--border-color)]" />
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Channels
            </div>

            {channelStatus === "loading" && (
              <p className="px-2 py-2 text-xs text-[var(--text-muted)]">
                Loading channels...
              </p>
            )}
            {channelStatus === "failed" && (
              <p className="px-2 py-2 text-xs text-red-600">{channelError}</p>
            )}
            {visibleChannels.map((channel) => (
              <ChannelList
                key={channel._id}
                channel={channel}
                onSelect={isDesktop ? handleChannelSelect : null}
                unreadCount={unreadCountByChannel?.[channel._id] || 0}
              />
            ))}
          </div>
        </aside>

        <main className="hidden min-h-0 bg-[var(--surface-color)] shadow-[0_12px_30px_rgba(74,127,74,0.12)] md:flex md:flex-col md:rounded-2xl md:border md:border-[var(--border-color)]">
          {selectedPane.type === "chat" && selectedPane.id ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Chat chatId={selectedPane.id} />
            </div>
          ) : selectedPane.type === "channel" && selectedPane.id ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <Channel />
            </div>
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
                        {(chats || []).filter((chat) => chat?.type === "private").length}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-muted)] p-3">
                      <p className="text-[var(--text-muted)]">Groups</p>
                      <p className="mt-1 text-base font-semibold">{groups.length}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-muted)] p-3">
                      <p className="text-[var(--text-muted)]">Channels</p>
                      <p className="mt-1 text-base font-semibold">{channels.length}</p>
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
