import React from "react";
import Profile from "./Profile";
import {
  UserCircle,
  Users,
  Megaphone,
  Contact,
  Folders,
  Bookmark,
  Phone,
  Settings,
  Settings2,
  Sliders,
  LogOutIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  selectAuthError,
  selectRegisterStatus,
} from "../Redux/userRedux/authSelector";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../Redux/userRedux/authThunk";

const SideBar = () => {
  const navigate = useNavigate();
  const registerStatus = useSelector(selectRegisterStatus);
  const error = useSelector(selectAuthError);
  const dispatch = useDispatch();
  const handleLogout = async (e) => {
    e.preventDefault();
    const result = await dispatch(logoutUser());
    if (logoutUser.fulfilled.match(result)) {
      navigate("/login");
    }
  };
  const handleNewChannel = (e) => {
    e.preventDefault();
    navigate("/newchannel");
  };
  const handleNewGroup = (e) => {
    e.preventDefault();
    navigate("/newgroup");
  };
  const handleSidebar = (e) => {
    e.preventDefault();
    navigate("/home");
  };
  const handleProfile = (e) => {
    e.preventDefault();
    navigate("/myprofile");
  };
  return (
    <>
      <aside className="w-full h-screen max-w-[320px] rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-4 text-[rgba(23,3,3,0.87)] shadow-[0_10px_30px_rgba(74,127,74,0.12)]">
        <Profile />

        <div className="mt-4 space-y-1">
          <div
            onClick={handleProfile}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10"
          >
            <UserCircle size={18} />
            <span>My Profile</span>
          </div>

          <div
            onClick={handleNewGroup}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10"
          >
            <Users size={18} />
            <span>New Group</span>
          </div>

          <div
            onClick={handleNewChannel}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10"
          >
            <Megaphone size={18} />
            <span>New Channel</span>
          </div>

          <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10">
            <Contact size={18} />
            <span>Contact</span>
          </div>

          <div className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10">
            <div className="flex items-center gap-3">
              <Folders size={18} />
              <span>Chat Folders</span>
            </div>
            <span className="text-xs font-semibold text-[#4a7f4a]">
              4 Online
            </span>
          </div>

          <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10">
            <Bookmark size={18} />
            <span>Saved Message</span>
          </div>

          <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10">
            <Phone size={18} />
            <span>Call</span>
          </div>

          <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10">
            <Settings size={18} />
            <span>Settings</span>
          </div>

          <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10">
            <Settings2 size={18} />
            <span>Plus Settings</span>
          </div>
          <div
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-[#6fa63a]/10"
          >
            <LogOutIcon size={18} />
            <span>Log Out</span>
          </div>
        </div>

        <p className="mt-10 mb-0 text-center text-xs text-[#4a7f4a]">
          WorldGram Web
        </p>
      </aside>
    </>
  );
};

export default SideBar;
