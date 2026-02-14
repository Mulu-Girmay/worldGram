import { Plus } from "lucide-react";
import React, { useState, useMemo, useRef, useEffect } from "react";

const Reaction = ({
  onSelect,
  initial = null,
  triggerClassName = "",
  popupClassName = "",
}) => {
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

  const [open, setOpen] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(initial);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  function handleSelect(reaction) {
    setSelectedReaction(reaction);
    setOpen(false);
    if (typeof onSelect === "function") onSelect(reaction);
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        size={25}
        type="button"
        className={`px-2 py-1 rounded-md hover:shadow-sm transition ${triggerClassName}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title={
          selectedReaction ? `Your reaction: ${selectedReaction}` : "React"
        }
      >
        {selectedReaction || "➕"}
      </button>
      {open && (
        <div
          className={`absolute z-50 mt-2 left-0 w-max bg-white border rounded-lg shadow-md p-2 ${popupClassName}`}
          role="menu"
          aria-label="Select reaction"
        >
          <div className="grid grid-cols-6 gap-1">
            {reactions.map((r) => (
              <p
                key={r}
                type="button"
                onClick={() => handleSelect(r)}
                className={`text-lg leading-none w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100 transition ${
                  selectedReaction === r
                    ? "ring-2 ring-offset-1 ring-indigo-300"
                    : ""
                }`}
                aria-label={`React with ${r}`}
              >
                {r}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reaction;
