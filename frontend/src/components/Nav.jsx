import React from "react";
import { Menu, Search, Plus, Users, Megaphone, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addStory, listStories } from "../Redux/storyRedux/storyThunk";
import { selectStories, selectStoriesStatus } from "../Redux/storyRedux/storySelector";
import { selectUser } from "../Redux/userRedux/authSelector";
import { resolveMediaUrl } from "../utils/media";
import { useToast } from "./ToastProvider";

const Nav = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const stories = useSelector(selectStories);
  const storiesStatus = useSelector(selectStoriesStatus);
  const currentUser = useSelector(selectUser);
  const hasStories = Array.isArray(stories) && stories.length > 0;
  const addStoryInputRef = React.useRef(null);
  const [storiesExpanded, setStoriesExpanded] = React.useState(false);

  const toStoryErrorMessage = (raw) => {
    const text = String(raw || "").toLowerCase();
    if (!text) return "Couldn't add story. Please try again.";
    if (text.includes("active story"))
      return "You can only have one active story. Delete your current story first.";
    if (text.includes("file not found")) return "Please select an image or video.";
    if (text.includes("network")) return "Network issue. Please check your internet.";
    return String(raw);
  };

  const orderedStories = React.useMemo(() => {
    const ownId = String(currentUser?._id || currentUser?.id || "");
    const ownStories = (stories || []).filter(
      (story) => String(story?.authorId?._id || story?.authorId || "") === ownId,
    );
    const others = (stories || []).filter(
      (story) => String(story?.authorId?._id || story?.authorId || "") !== ownId,
    );
    return [...ownStories, ...others];
  }, [stories, currentUser?._id, currentUser?.id]);

  const handleAddStoryClick = () => addStoryInputRef.current?.click();

  const handleAddStoryChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("media", file);
    formData.append("privacy", "contacts");

    const result = await dispatch(addStory(formData));
    if (addStory.rejected.match(result)) {
      toastError(
        toStoryErrorMessage(
          result.payload?.message || result.payload?.err || "Failed to add story",
        ),
      );
      e.target.value = "";
      return;
    }
    await dispatch(listStories({ limit: 20 }));
    e.target.value = "";
  };

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

        <div
          className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto"
          onWheel={(e) => {
            if (!storiesExpanded && e.deltaY > 12) {
              setStoriesExpanded(true);
            }
          }}
        >
          <button
            type="button"
            onClick={() => setStoriesExpanded((value) => !value)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#6fa63a]/30 bg-white text-[#2f5b2f]"
            aria-label={storiesExpanded ? "Collapse stories" : "Expand stories"}
            title={storiesExpanded ? "Collapse stories" : "Expand stories"}
          >
            {storiesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            type="button"
            onClick={handleAddStoryClick}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-dashed border-[#6fa63a]/70 bg-[#eaf4e2] text-[#2f5b2f]"
            aria-label="Add story"
            title="Add story"
            disabled={storiesStatus === "loading"}
          >
            <Plus size={14} />
          </button>
          <input
            ref={addStoryInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleAddStoryChange}
          />
          {hasStories ? (
            orderedStories
              .slice(0, storiesExpanded ? orderedStories.length : 4)
              .map((story) => {
              const media = story?.media;
              const mediaType = story?.mediaType || "image";
              const authorName =
                `${story?.authorId?.identity?.firstName || ""} ${story?.authorId?.identity?.lastName || ""}`.trim() ||
                story?.authorId?.identity?.username ||
                "Story";
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
                  aria-label={`Open ${authorName} story`}
                  title={authorName}
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
              })
          ) : (
            <div className="pl-1">
              <h2 className="text-base font-semibold leading-none">WorldGram</h2>
            </div>
          )}
        </div>
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
