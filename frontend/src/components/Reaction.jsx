import React from "react";

const Reaction = () => {
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
  const [selectedReaction, setSelectedReaction] = useState(null);

  return (
    <div>
      <div className="mt-4">
        <p className="text-xs font-semibold text-[rgba(23,3,3,0.6)]">
          Reactions
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {reactions.map((reaction) => (
            <button
              key={reaction}
              type="button"
              onClick={() => setSelectedReaction(reaction)}
              className={`rounded-full border px-2 py-1 text-lg leading-none transition ${
                selectedReaction === reaction
                  ? "border-[var(--secondary-color)]"
                  : "border-[var(--secondary-color)]/25"
              }`}
              aria-label={`React with ${reaction}`}
            >
              {reaction}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm text-[rgba(23,3,3,0.7)]">
          <span className="text-xs text-[rgba(23,3,3,0.6)]">Selected:</span>
          <span className="text-xl">{selectedReaction ?? "—"}</span>
        </div>
      </div>
    </div>
  );
};

export default Reaction;
