import React from "react";
import { Profile, ProfileNav } from "./Profile";
import ChannelPostCard from "./ChannelPostCard";

const Channel = () => {
  return (
    <div>
      <ProfileNav />
      <ChannelPostCard />
      <ChannelPostCard />
      <ChannelPostCard />
      <ChannelPostCard />
    </div>
  );
};

export default Channel;
