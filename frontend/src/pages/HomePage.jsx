import React from "react";
import Nav from "../components/Nav";
import ContentList from "../components/ContentList";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-[#eaf4e2] px-4 py-6">
      <div className="mx-auto w-full max-w-[900px] space-y-6">
        <Nav />
        <ContentList />
        <ContentList />
        <ContentList />
        <ContentList />
      </div>
    </div>
  );
};

export default HomePage;
