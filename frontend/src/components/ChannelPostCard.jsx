import React, { useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  MessageSquare,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import {} from "lucide-react";

const ChannelPostCard = (channel) => {
  const reactions = useMemo(
    () => [
      "😂",
      "🫤",
      "🤷‍♂️",
      "🔶",
      "❤️",
      "😒",
      "😁",
      "😊",
      "😀",
      "🤯",
      "😍",
      "🤨",
      "👌",
      "🤣",
      "😘",
      "💕",
      "👍",
      "🙌",
      "🤦‍♀️",
      "🤦‍♂️",
      "🤷‍♀️",
      "✌️",
      "🤞",
      "😉",
      "😏",
      "😣",
      "😥",
      "😴",
      "🥱",
      "😫",
      "😪",
      "😯",
      "🤐",
      "😌",
      "😛",
      "😝",
      "😜",
      "🤤",
      "🫠",
      "🙃",
      "😕",
      "😔",
      "😓",
      "🤑",
      "😲",
      "☹️",
      "🙁",
      "😖",
      "😧",
      "😦",
      "😭",
      "😢",
      "😤",
      "😨",
      "😩",
      "😬",
      "😮‍💨",
      "😵",
      "🤪",
      "😳",
      "🥶",
      "🥵",
      "😱",
      "😵‍💫",
      "🥴",
      "😠",
      "😡",
      "🤬",
      "😷",
      "🤒",
      "🤢",
      "🤮",
      "🤧",
      "😇",
      "🥹",
      "🥳",
      "🫨",
      "🤥",
      "🙂‍↔️",
      "🙂‍↕️",
      "🤫",
      "🤓",
      "🧐",
      "🫢",
    ],
    [],
  );

  return (
    <div className="w-full max-w-md rounded-2xl border border-[var(--secondary-color)]/25 bg-[var(--primary-color)] p-4 text-[rgba(23,3,3,0.87)] shadow-sm">
      <img
        className="h-48 w-full rounded-xl object-cover"
        src={
          channel?.basicInfo?.channelPhoto
            ? `/uploads/images/${channel.basicInfo.channelPhoto}`
            : "/default-channel-image.jpg"
        }
      />
      <p className="mt-4 text-base leading-relaxed text-[rgba(23,3,3,0.87)]">
        {channel?.basicInfo?.description ||
          "all gotts help your boy out with a marketing tip"}
      </p>
      <h4 className="mt-2 text-sm font-semibold text-[rgba(23,3,3,0.87)]">
        @{channel?.basicInfo?.userName || "selfmadecoder"}
      </h4>

      <div className="mt-3 flex items-center justify-between text-xs text-[rgba(23,3,3,0.6)]">
        <p className="flex items-center gap-1 text-[rgba(23,3,3,0.75)]">
          <Eye size={10} />
          <span className="font-medium text-[rgba(23,3,3,0.87)]">2.2k</span>
        </p>
        <p className="rounded-full bg-[var(--secondary-color)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--btn-color)]">
          {channel?.basicInfo?.name || "Tech Nerd"}
        </p>
        <p>1:24 AM</p>
      </div>
      <div className="flex flex-row justify-around">
        <p>🥴 5</p>
        <p>😠 7</p>
        <p>🤬 8</p>
        <p>😷 6</p>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-white/70 px-3 py-2">
        <div className="flex items-center gap-2 text-sm text-[rgba(23,3,3,0.7)]">
          <MessageSquare size={14} />
          <p>Leave a comment</p>
        </div>
        <ArrowRight className="text-[var(--btn-color)]" size={16} />
      </div>
    </div>
  );
};

export default ChannelPostCard;
