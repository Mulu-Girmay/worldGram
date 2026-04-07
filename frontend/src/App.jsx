import React from "react";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import HomePage from "./pages/HomePage";
import SideBar from "./components/SideBar";
import Channel from "./components/Channel";
import Chat from "./components/Chat";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "./Redux/userRedux/authSelector";
import Storycontent from "./components/Storycontent";
import NewChannelForm from "./components/Channel/NewChannelForm";
import NewGroupForm from "./components/group/NewGroupForm";
import MyProfile from "./components/MyProfile";
import JoinChannel from "./pages/JoinChannel";
import JoinGroup from "./pages/JoinGroup";
import Settings from "./pages/Settings";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          index
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <Signup />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route path="/join-channel" element={<JoinChannel />} />
        <Route path="/join-group" element={<JoinGroup />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sidebar"
          element={
            <ProtectedRoute>
              <SideBar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/channel"
          element={
            <ProtectedRoute>
              <Channel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/story"
          element={
            <ProtectedRoute>
              <Storycontent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/newchannel"
          element={
            <ProtectedRoute>
              <NewChannelForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/newgroup"
          element={
            <ProtectedRoute>
              <NewGroupForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/myprofile"
          element={
            <ProtectedRoute>
              <MyProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
