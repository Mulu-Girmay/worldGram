import React from "react";
import { ProfileNav } from "./Profile";
import ChannelPostCard from "./ChannelPostCard";
import { Bell, FileBoxIcon, Instagram, SendHorizontal } from "lucide-react";

const Channel = () => {
  const [message, setMessage] = React.useState("");

  return (
    <div className="space-y-4">
      <ProfileNav />
      <section className="relative overflow-hidden rounded-3xl border border-[#6fa63a]/30 bg-[linear-gradient(135deg,#f8fdf3_0%,#eef8e8_60%,#e5f2dc_100%)] p-4 shadow-[0_16px_35px_rgba(74,127,74,0.12)]">
        <div className="pointer-events-none absolute -right-10 -top-8 h-28 w-28 rounded-full bg-[#6fa63a]/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-[#4a7f4a]/10 blur-2xl" />

        <div className="relative mb-4 flex items-center justify-between rounded-2xl border border-[#6fa63a]/25 bg-white/65 px-3 py-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4a7f4a]">
              Channel Feed
            </p>
            <p className="text-sm font-semibold text-[rgba(23,3,3,0.87)]">
              selfmadecoder
            </p>
          </div>
          <p className="rounded-full bg-[#6fa63a]/15 px-2.5 py-1 text-xs font-medium text-[#2f5b2f]">
            12.4k members
          </p>
        </div>

        <div className="relative max-h-[520px] space-y-3 overflow-y-auto pr-1">
          <ChannelPostCard />
          <ChannelPostCard />
          <ChannelPostCard />
          <ChannelPostCard />
        </div>

        <form className="relative mt-4 rounded-2xl border border-[#6fa63a]/30 bg-white/75 p-3 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#4a7f4a] text-xs font-bold text-white">
              SC
            </div>
            <p className="text-xs font-medium text-[rgba(23,3,3,0.72)]">
              Drop an update to your subscribers
            </p>
          </div>
          <div className="flex items-end gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share news, drop links, or ask your audience a question..."
              className="min-h-[42px] flex-1 resize-none rounded-xl border border-[#6fa63a]/30 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#4a7f4a] focus:ring-2 focus:ring-[#6fa63a]/20"
            />
            <button
              type="button"
              className="rounded-xl border border-[#6fa63a]/35 bg-[#6fa63a]/15 p-2 text-[#2f5b2f] transition hover:bg-[#6fa63a]/25"
            >
              <Bell size={16} />
            </button>
            <button
              type="button"
              className="rounded-xl border border-[#6fa63a]/35 bg-[#6fa63a]/15 p-2 text-[#2f5b2f] transition hover:bg-[#6fa63a]/25"
            >
              <FileBoxIcon size={16} />
            </button>
            <button
              type="button"
              className="rounded-xl border border-[#6fa63a]/35 bg-[#6fa63a]/15 p-2 text-[#2f5b2f] transition hover:bg-[#6fa63a]/25"
            >
              <Instagram size={16} />
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#4a7f4a] p-2 text-white transition hover:bg-[#3f6e3f]"
            >
              <SendHorizontal size={16} />
            </button>
          </div>
        </form>
      </section>
      <div className="h-2" />
    </div>
  );
};

export default Channel;
