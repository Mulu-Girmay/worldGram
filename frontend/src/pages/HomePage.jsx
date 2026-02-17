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
    <div className="min-h-screen bg-[#eaf4e2] px-4 py-6">
      <div className="mx-auto w-full max-w-[900px] space-y-6">
        <Nav />

        {status === "loading" && <p>Loading channels...</p>}

        {status === "failed" && <p className="text-red-600">{error}</p>}

        {status === "succeeded" &&
          (channels.length > 0 ? (
            channels.map((c) => <ChannelList key={c._id} channel={c} />)
          ) : (
            <p>No channels found.</p>
          ))}

        {groupsStatus === "loading" && <p>Loading groups...</p>}

        {groupsStatus === "failed" && (
          <p className="text-red-600">{groupsError}</p>
        )}

        {groupsStatus === "succeeded" &&
          (groups.length > 0 ? (
            groups.map((g) => <GroupList key={g._id} group={g} />)
          ) : (
            <p>No groups found.</p>
          ))}

        {chatsStatus === "loading" && <p>Loading chats...</p>}

        {chatsStatus === "failed" && (
          <p className="text-red-600">{chatsError}</p>
        )}

        {chats.length > 0 ? (
          chats.map((c) => <ContentList key={c._id} chat={c} />)
        ) : (
          <p>No chats found.</p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
