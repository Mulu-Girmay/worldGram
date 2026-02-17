import React from "react";
import { Menu, Search, Plus, Users, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectStories } from "../Redux/storyRedux/storySelector";
import { resolveMediaUrl } from "../utils/media";

const Nav = () => {
  const navigate = useNavigate();
  const stories = useSelector(selectStories);
  const hasStories = Array.isArray(stories) && stories.length > 0;

  const goTo = (path) => navigate(path);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] px-3 py-3 shadow-sm">
        <button
          type="button"
          onClick={() => goTo("/sidebar")}
          className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--border-color)] bg-white p-0 text-[#2f5b2f]"
          aria-label="Open menu"
        >
          <Menu size={16} />
        </button>

        {hasStories ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            {stories.slice(0, 12).map((story) => {
              const media = story?.media;
              const mediaType = story?.mediaType || "image";
              const mediaSrc =
                media && typeof media === "string"
                  ? resolveMediaUrl(media, mediaType)
                  : null;
              return (
                <button
                  key={story?._id}
                  type="button"
                  onClick={() =>
                    navigate("/story", {
                      state: {
                        storyId: story?._id,
                        authorId: story?.authorId?._id || story?.authorId || null,
                      },
                    })
                  }
                  className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-[#6fa63a]/60 bg-[#eaf4e2]"
                  aria-label="Open story"
                >
                  {mediaSrc ? (
                    mediaType === "video" ? (
                      <video src={mediaSrc} className="h-full w-full object-cover" />
                    ) : (
                      <img
                        src={mediaSrc}
                        alt={story?.caption || "Story"}
                        className="h-full w-full object-cover"
                      />
                    )
                  ) : (
                    <div className="grid h-full w-full place-items-center text-[10px] font-semibold text-[#2f5b2f]">
                      ST
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <h2 className="text-base font-semibold leading-none">WorldGram</h2>
          </div>
        )}
      </div>

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          type="text"
          placeholder="Search"
          className="w-full rounded-xl border border-[var(--border-color)] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#4a7f4a]"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => goTo("/newgroup")}
          className="flex items-center justify-center gap-1 rounded-xl border border-[var(--border-color)] bg-white p-2 text-xs font-semibold text-[#2f5b2f]"
        >
          <Users size={14} />
          Group
        </button>
        <button
          type="button"
          onClick={() => goTo("/newchannel")}
          className="flex items-center justify-center gap-1 rounded-xl border border-[var(--border-color)] bg-white p-2 text-xs font-semibold text-[#2f5b2f]"
        >
          <Megaphone size={14} />
          Channel
        </button>
        <button
          type="button"
          onClick={() => goTo("/sidebar")}
          className="flex items-center justify-center gap-1 rounded-xl border border-[var(--border-color)] bg-white p-2 text-xs font-semibold text-[#2f5b2f]"
        >
          <Plus size={14} />
          More
        </button>
      </div>

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-muted)] px-3 py-2 text-[11px] text-[var(--text-muted)]">
        Chats and groups appear below. Select one to open conversation.
      </div>
    </div>
  );
};

export default Nav;
