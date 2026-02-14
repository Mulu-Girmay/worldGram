import React, { useEffect, useId, useMemo, useRef, useState } from "react";

const Reaction = ({
  onSelect,
  initial = null,
  triggerClassName = "",
  popupClassName = "",
}) => {
  const reactions = useMemo(
    () => [
      "\u{1F44D}",
      "\u{2764}\u{FE0F}",
      "\u{1F602}",
      "\u{1F923}",
      "\u{1F60D}",
      "\u{1F525}",
      "\u{1F62E}",
      "\u{1F622}",
      "\u{1F620}",
      "\u{1F44F}",
      "\u{1F64C}",
      "\u{1F44C}",
      "\u{1F389}",
      "\u{1F680}",
      "\u{1F44E}",
      "\u{1F44A}",
      "\u{1F914}",
      "\u{1F60E}",
      "\u{1F60A}",
      "\u{1F62D}",
      "\u{1F631}",
      "\u{1F970}",
      "\u{1F917}",
      "\u{2705}",
      "\u{274C}",
      "\u{1F4AF}",
      "\u{1F973}",
      "\u{1F60F}",
      "\u{1F972}",
      "\u{1F634}",
      "\u{1F928}",
      "\u{1F92F}",
      "\u{1F929}",
      "\u{1F44B}",
      "\u{1F31F}",
      "\u{1F4A5}",
    ],
    [],
  );

  const [open, setOpen] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(initial);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const reactionRefs = useRef([]);
  const popupId = useId();

  useEffect(() => {
    function handleOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setSelectedReaction(initial || null);
  }, [initial]);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = reactions.findIndex((reaction) => reaction === selectedReaction);
    const nextIndex = selectedIndex >= 0 ? selectedIndex : 0;
    setActiveIndex(nextIndex);
    reactionRefs.current[nextIndex]?.focus();
  }, [open, reactions, selectedReaction]);

  function closePopupAndReturnFocus() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleSelect(reaction) {
    setSelectedReaction(reaction);
    setOpen(false);
    if (typeof onSelect === "function") onSelect(reaction);
  }

  function focusByIndex(index) {
    const bounded = (index + reactions.length) % reactions.length;
    setActiveIndex(bounded);
    reactionRefs.current[bounded]?.focus();
  }

  function handleMenuKeyDown(event) {
    if (!open) return;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusByIndex(activeIndex + 1);
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusByIndex(activeIndex - 1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusByIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      focusByIndex(reactions.length - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect(reactions[activeIndex]);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closePopupAndReturnFocus();
    }
  }

  function handleTriggerKeyDown(event) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        className={`rounded-md px-2 py-1 transition hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a7f4a] ${triggerClassName}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? popupId : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={handleTriggerKeyDown}
        title={selectedReaction ? `Your reaction: ${selectedReaction}` : "React"}
      >
        {selectedReaction || "\u2795"}
      </button>

      {open && (
        <div
          id={popupId}
          className={`absolute left-0 z-50 mt-2 w-max rounded-lg border bg-white p-2 shadow-md ${popupClassName}`}
          role="listbox"
          aria-label="Select reaction"
          onKeyDown={handleMenuKeyDown}
        >
          <div className="grid grid-cols-6 gap-1">
            {reactions.map((reaction, index) => (
              <button
                key={reaction}
                ref={(element) => {
                  reactionRefs.current[index] = element;
                }}
                type="button"
                role="option"
                aria-selected={selectedReaction === reaction}
                tabIndex={activeIndex === index ? 0 : -1}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => handleSelect(reaction)}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-lg leading-none transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a7f4a] ${
                  selectedReaction === reaction ? "ring-2 ring-[#6fa63a]" : ""
                }`}
                aria-label={`React with ${reaction}`}
              >
                {reaction}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reaction;
