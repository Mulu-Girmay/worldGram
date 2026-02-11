import React from "react";
import Nav from "../components/Nav";
import ContentList from "../components/ContentList";
import ChannelPostCard from "../components/ChannelPostCard";
import ChannelList from "../components/ChannelList";
import NewChannelForm from "../components/Channel/newChannelForm";
import NewGroupForm from "../components/group/NewGroupForm";
import MyProfile from "../components/MyProfile";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-[#eaf4e2] px-4 py-6">
      <div className="mx-auto w-full max-w-[900px] space-y-6">
        <Nav />
        <ContentList />
        <ChannelList />
        <ContentList />
        <ChannelList />
        <ContentList />
        <ChannelList />
        <ContentList />
      </div>
    </div>
  );
};

export default HomePage;
