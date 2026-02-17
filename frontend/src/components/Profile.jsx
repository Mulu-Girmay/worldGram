import { ArrowLeft, MoreVertical, Search } from "lucide-react";
import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectUser } from "../Redux/userRedux/authSelector";
import { resolveProfileUrl, toInitials } from "../utils/media";

const buildDisplayName = (user) => {
  if (!user) return "Guest";
  const first = user?.identity?.firstName || "";
  const last = user?.identity?.lastName || "";
  const full = `${first} ${last}`.trim();
  return full || user?.identity?.username || "Guest";
};

const Profile = () => {
  const user = useSelector(selectUser);
  const displayName = buildDisplayName(user);
  const profileUrl = resolveProfileUrl(user?.identity?.profileUrl);
  const username = user?.identity?.username || "guest";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#6fa63a]/20 bg-white/70 px-3 py-2">
      {profileUrl ? (
        <img
          src={profileUrl}
          alt={displayName}
          className="h-11 w-11 rounded-full border border-[#6fa63a]/35 object-cover"
        />
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#6fa63a]/35 bg-[#eaf4e2] text-xs font-semibold text-[#4a7f4a]">
          {toInitials(displayName) || "U"}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[rgba(23,3,3,0.9)]">
          {displayName}
        </p>
        <p className="truncate text-xs text-[rgba(23,3,3,0.62)]">@{username}</p>
      </div>
    </div>
  );
};

const ProfileNav = ({
  title = "Chats",
  subtitle = "Select a conversation",
  avatarUrl = null,
  backPath = "/home",
}) => {
  const navigate = useNavigate();

  const handleSidebar = (e) => {
    e.preventDefault();
    navigate(backPath);
  };
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] px-2 py-1 text-[rgba(23,3,3,0.87)] shadow-[0_10px_30px_rgba(74,127,74,0.12)]">
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6fa63a]/10 text-[#4a7f4a]"
        aria-label="Go back"
        onClick={handleSidebar}
      >
        <ArrowLeft size={12} />
      </button>
      <div className="flex flex-row items-center gap-3">
        {avatarUrl ? (
          <img
            src={resolveProfileUrl(avatarUrl)}
            alt={title}
            className="h-10 w-10 rounded-full border border-[#6fa63a]/35 object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#6fa63a]/35 bg-[#eaf4e2] text-[10px] font-semibold text-[#4a7f4a]">
            {toInitials(title) || "U"}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="truncate text-xs text-[rgba(23,3,3,0.62)]">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Search
          size={16}
          className="flex w-9 pointer-events-none items-center justify-center rounded-xl bg-[#6fa63a]/10 text-[#4a7f4a]"
        />
        <MoreVertical
          size={14}
          className="flex w-9 items-center justify-center rounded-xl bg-[#6fa63a]/10 text-[#4a7f4a]"
          aria-label="More options"
        />
      </div>
    </div>
  );
};
export { Profile, ProfileNav };
export default Profile;
