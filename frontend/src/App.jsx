import { useState } from "react";
import reactLogo from "./assets/react.svg";
import React from "react";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import HomePage from "./pages/HomePage";
import SideBar from "./components/SideBar";
import Channel from "./components/Channel";
import Chat from "./components/Chat";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Storycontent from "./components/Storycontent";
import NewChannelForm from "./components/Channel/NewChannelForm";
import NewGroupForm from "./components/group/NewGroupForm";
import MyProfile from "./components/MyProfile";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/sidebar" element={<SideBar />} />
        <Route path="/channel" element={<Channel />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/story" element={<Storycontent />} />
        <Route path="/newchannel" element={<NewChannelForm />} />
        <Route path="/newgroup" element={<NewGroupForm />} />
        <Route path="/myprofile" element={<MyProfile />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
