import React from "react";
import {
  ArrowLeft,
  FileIcon,
  ImageIcon,
  LinkIcon,
  MoreVertical,
  Music2Icon,
  Pen,
  Plus,
  VoicemailIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const mediaItems = [
  { icon: ImageIcon, label: "Photos & Videos", count: 87 },
  { icon: FileIcon, label: "Files", count: 23 },
  { icon: LinkIcon, label: "Links", count: 14 },
  { icon: Music2Icon, label: "Music", count: 31 },
  { icon: VoicemailIcon, label: "Voices", count: 9 },
];

const stories = [
  "MB",
  "AB",
  "TG",
  "EA",
  "AB",
  "TG",
  "EA",
  "AB",
  "TG",
  "EA",
  "AB",
  "TG",
  "EA",
];

const MyProfile = () => {
  const navigate = useNavigate();

  const handleBack = (e) => {
    e.preventDefault();
    navigate("/home");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] px-3 py-2 shadow-[0_10px_30px_rgba(74,127,74,0.12)]">
        <ArrowLeft size={16} onClick={handleBack} />
        <p className="text-sm font-semibold text-[rgba(23,3,3,0.87)]">
          Profile
        </p>
        <div className="flex items-center gap-2">
          <Pen size={15} />

          <MoreVertical size={15} />
        </div>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-[#6fa63a]/30 bg-[linear-gradient(130deg,#f8fdf3_0%,#eef8e8_55%,#e2f0d7_100%)] p-5 shadow-[0_16px_34px_rgba(74,127,74,0.12)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#6fa63a]/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-[#4a7f4a]/10 blur-2xl" />

        <div className="relative flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-3xl border border-[#6fa63a]/30 bg-[#4a7f4a] text-xl font-bold text-white shadow-[0_8px_18px_rgba(74,127,74,0.25)]">
            MB
          </div>
          <div>
            <h2 className="text-xl font-bold text-[rgba(23,3,3,0.9)]">
              Messi Bre
            </h2>
            <p className="text-sm text-[rgba(23,3,3,0.7)]">@meeeeeeee</p>
            <span className="mt-1 inline-block rounded-full bg-[#6fa63a]/20 px-2 py-0.5 text-xs font-semibold text-[#2f5b2f]">
              Online
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-4 shadow-[0_10px_28px_rgba(74,127,74,0.12)]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#4a7f4a]">
          Info
        </p>
        <div className="space-y-2">
          <div className="rounded-xl border border-[#6fa63a]/20 bg-white/80 px-3 py-2">
            <p className="text-sm font-semibold text-[rgba(23,3,3,0.88)]">
              +2512345678
            </p>
            <p className="text-xs text-[rgba(23,3,3,0.65)]">Mobile</p>
          </div>
          <div className="rounded-xl border border-[#6fa63a]/20 bg-white/80 px-3 py-2">
            <p className="text-sm font-semibold text-[rgba(23,3,3,0.88)]">
              Amleset Gual Edaga BIERAY
            </p>
            <p className="text-xs text-[rgba(23,3,3,0.65)]">Bio</p>
          </div>
          <div className="rounded-xl border border-[#6fa63a]/20 bg-white/80 px-3 py-2">
            <p className="text-sm font-semibold text-[rgba(23,3,3,0.88)]">
              @meeeeeeee
            </p>
            <p className="text-xs text-[rgba(23,3,3,0.65)]">Username</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-4 shadow-[0_10px_28px_rgba(74,127,74,0.12)]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#4a7f4a]">
          Shared Media
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {mediaItems.map(({ icon: Icon, label, count }) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl border border-[#6fa63a]/20 bg-white/80 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Icon size={14} className="text-[#4a7f4a]" />
                <p className="text-sm text-[rgba(23,3,3,0.85)]">{label}</p>
              </div>
              <span className="rounded-full bg-[#6fa63a]/15 px-2 py-0.5 text-xs font-semibold text-[#2f5b2f]">
                {count}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#6fa63a]/25 bg-[#f3f9ee] p-4 shadow-[0_10px_28px_rgba(74,127,74,0.12)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4a7f4a]">
            Stories
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full bg-[#4a7f4a] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#3f6e3f]"
          >
            <Plus size={12} />
            Add Story
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {stories.map((story) => (
            <div key={story} className="text-center">
              <div className="grid h-19 w-17 place-items-center  border-2 border-[#6fa63a]/45 bg-white font-semibold text-[#2f5b2f]">
                {story}
              </div>
              <p className="mt-1 text-xs text-[rgba(23,3,3,0.7)]">Story</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MyProfile;
