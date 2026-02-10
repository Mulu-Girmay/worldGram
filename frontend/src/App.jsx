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

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/sidebar" element={<SideBar />} />
        <Route path="/channel" element={<Channel />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
