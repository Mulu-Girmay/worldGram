import React, { useEffect } from "react";
import Nav from "../components/Nav";
import ContentList from "../components/ContentList";
import ChannelPostCard from "../components/ChannelPostCard";
import ChannelList from "../components/ChannelList";
import NewChannelForm from "../components/Channel/newChannelForm";
import NewGroupForm from "../components/group/NewGroupForm";
import MyProfile from "../components/MyProfile";
import { useDispatch, useSelector } from "react-redux";
import { listChannel } from "../Redux/channelRedux/channelThunk";
import {
  selectChannels,
  selectChannelStatus,
  selectNextCursor,
  selectChannelError,
} from "../Redux/channelRedux/channelSelector";
import { selectIsAuthenticated } from "../Redux/userRedux/authSelector";
import Reaction from "../components/Reaction";

const HomePage = () => {
  const dispatch = useDispatch();
  const channels = useSelector(selectChannels);
  const status = useSelector(selectChannelStatus);
  const nextCursor = useSelector(selectNextCursor);
  const error = useSelector(selectChannelError);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (isAuthenticated && status === "idle")
      dispatch(listChannel({ limit: 20 }));
  }, [dispatch, status, isAuthenticated]);

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

        {/* Other content */}
        <ContentList />
      </div>
    </div>
  );
};

export default HomePage;
