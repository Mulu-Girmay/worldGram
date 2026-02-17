import React from "react";
import { Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCurrentChannel } from "../Redux/channelRedux/channelSlice";
import { resolveMediaUrl } from "../utils/media";

const ChannelList = ({ channel, onSelect = null, unreadCount = 0 }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChannel = () => {
    dispatch(setCurrentChannel(channel));
    if (typeof onSelect === "function") {
      onSelect(channel);
      return;
    }
    navigate("/channel");
  };

  const channelName = channel?.basicInfo?.name || "Untitled channel";
  const description = channel?.basicInfo?.description || "No description";
  const photo = channel?.basicInfo?.channelPhoto
    ? resolveMediaUrl(channel.basicInfo.channelPhoto, "image")
    : null;

  return (
    <button
      type="button"
      onClick={handleChannel}
      className="w-full flex items-center gap-3 rounded-xl border border-transparent bg-transparent px-2 py-2 text-left transition hover:border-[var(--border-color)] hover:bg-white"
    >
      {photo ? (
        <img
          src={photo}
          alt={channelName}
          className="h-11 w-11 rounded-full border border-[var(--border-color)] object-cover"
        />
      ) : (
        <div className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border-color)] bg-[var(--surface-muted)] text-[#2f5b2f]">
          <Megaphone size={16} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">{channelName}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)]">channel</span>
            {Number(unreadCount) > 0 && (
              <span className="rounded-full bg-[#4a7f4a] px-2 py-0.5 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        <p className="truncate text-xs text-[var(--text-muted)]">{description}</p>
      </div>
    </button>
  );
};

export default ChannelList;
