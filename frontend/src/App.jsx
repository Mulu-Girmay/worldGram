import { useState } from "react";
import reactLogo from "./assets/react.svg";
import React from "react";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import HomePage from "./pages/HomePage";
import SideBar from "./components/SideBar";
import Channel from "./components/Channel";

const App = () => {
  return (
    <div>
      {/* <Signup /> */}
      {/* <Login /> */}
      {/* <HomePage /> */}
      {/* <SideBar /> */}
      <Channel />
    </div>
  );
};

export default App;
