import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "./Redux/userRedux/authSelector";
import LoadingStream from "./components/LoadingStream";

const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const HomePage = lazy(() => import("./pages/HomePage"));
const SideBar = lazy(() => import("./components/SideBar"));
const Channel = lazy(() => import("./components/Channel"));
const Chat = lazy(() => import("./components/Chat"));
const Storycontent = lazy(() => import("./components/Storycontent"));
const NewChannelForm = lazy(() => import("./components/Channel/NewChannelForm"));
const NewGroupForm = lazy(() => import("./components/group/NewGroupForm"));
const MyProfile = lazy(() => import("./components/MyProfile"));
const JoinChannel = lazy(() => import("./pages/JoinChannel"));
const JoinGroup = lazy(() => import("./pages/JoinGroup"));
const Settings = lazy(() => import("./pages/Settings"));
const Contacts = lazy(() => import("./pages/Contacts"));

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

const AppLoader = () => (
  <div className="min-h-screen grid place-items-center px-4">
    <LoadingStream
      label="Loading application"
      lines={4}
      className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-white/75 p-4 shadow-[0_10px_24px_rgba(74,127,74,0.12)]"
    />
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <a href="#app-content" className="skip-link">
        Skip to main content
      </a>
      <div id="app-content" tabIndex={-1} aria-label="Application content">
        <Suspense fallback={<AppLoader />}>
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
          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <Contacts />
              </ProtectedRoute>
            }
          />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
};

export default App;
