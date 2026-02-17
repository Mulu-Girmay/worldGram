import React, { useEffect } from "react";
import Nav from "../components/Nav";
import ContentList from "../components/ContentList";
import ChannelList from "../components/ChannelList";
import GroupList from "../components/GroupList";
import { useDispatch, useSelector } from "react-redux";
import { listChannel } from "../Redux/channelRedux/channelThunk";
import {
  selectChannels,
  selectChannelStatus,
  selectChannelError,
} from "../Redux/channelRedux/channelSelector";
import { selectIsAuthenticated } from "../Redux/userRedux/authSelector";
import { listChats } from "../Redux/chatRedux/chatThunk";
import {
  selectChats,
  selectChatsStatus,
  selectChatError,
} from "../Redux/chatRedux/chatSelector";
import { listGroups } from "../Redux/groupRedux/groupThunk";
import {
  selectGroupError,
  selectGroups,
  selectGroupsStatus,
} from "../Redux/groupRedux/groupSelector";

const HomePage = () => {
  const dispatch = useDispatch();
  const channels = useSelector(selectChannels);
  const status = useSelector(selectChannelStatus);
  const error = useSelector(selectChannelError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const chats = useSelector(selectChats);
  const chatsStatus = useSelector(selectChatsStatus);
  const chatsError = useSelector(selectChatError);
  const groups = useSelector(selectGroups);
  const groupsStatus = useSelector(selectGroupsStatus);
  const groupsError = useSelector(selectGroupError);

  useEffect(() => {
    if (isAuthenticated && status === "idle")
      dispatch(listChannel({ limit: 20 }));
  }, [dispatch, status, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && chatsStatus === "idle")
      dispatch(listChats({ limit: 20 }));
  }, [dispatch, chatsStatus, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && groupsStatus === "idle")
      dispatch(listGroups({ limit: 20 }));
  }, [dispatch, groupsStatus, isAuthenticated]);

  return (
    <div className="min-h-screen p-3 md:p-4">
      <div className="mx-auto h-[calc(100vh-1.5rem)] max-w-[1300px] grid grid-cols-1 gap-3 md:h-[calc(100vh-2rem)] md:grid-cols-[360px_1fr]">
        <aside className="flex min-h-0 flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] p-3 shadow-[0_12px_30px_rgba(74,127,74,0.12)]">
          <Nav />

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-white/75 p-2">
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
            {chats.map((c) => (
              <ContentList key={c._id} chat={c} />
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
            {groups.map((g) => (
              <GroupList key={g._id} group={g} />
            ))}

            <div className="my-2 border-t border-[var(--border-color)]" />
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Channels
            </div>

            {status === "loading" && (
              <p className="px-2 py-2 text-xs text-[var(--text-muted)]">
                Loading channels...
              </p>
            )}
            {status === "failed" && (
              <p className="px-2 py-2 text-xs text-red-600">{error}</p>
            )}
            {channels.map((c) => (
              <ChannelList key={c._id} channel={c} />
            ))}
          </div>
        </aside>

        <main className="hidden min-h-0 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] shadow-[0_12px_30px_rgba(74,127,74,0.12)] md:flex md:flex-col">
          <div className="border-b border-[var(--border-color)] px-6 py-4">
            <h1 className="text-lg font-semibold">Telegram Style Workspace</h1>
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
                  <p className="mt-1 text-base font-semibold">{chats.length}</p>
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
        </main>
      </div>
    </div>
  );
};

export default HomePage;
