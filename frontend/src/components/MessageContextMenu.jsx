import React, { useEffect, useRef, useState } from "react";
import {
  Edit,
  Trash2,
  Forward,
  Pin,
  Copy,
  Reply,
  Share2,
  X,
} from "lucide-react";

const MessageContextMenu = ({
  isOpen,
  onClose,
  message,
  onEdit,
  onDelete,
  onForward,
  onPin,
  onCopy,
  onReply,
  onShare,
  canEdit = false,
  canDelete = false,
  canPin = false,
}) => {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      setIsClosing(false);
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      return;
    }

    if (isMounted) {
      setIsClosing(true);
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = window.setTimeout(() => {
        setIsMounted(false);
        setIsClosing(false);
        closeTimerRef.current = null;
      }, 160);
    }
  }, [isOpen, isMounted]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!isMounted || isClosing) return;
    const firstButton = menuRef.current?.querySelector("button");
    firstButton?.focus?.();
  }, [isMounted, isClosing]);

  const handleDialogKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = Array.from(
      menuRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) || [],
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!isMounted) return null;

  const handleAction = (action) => {
    action();
    onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-150 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="message-options-title"
          onKeyDown={handleDialogKeyDown}
          className={`relative w-full max-w-sm rounded-2xl bg-white shadow-2xl transition-all duration-150 ease-out ${
            isClosing
              ? "pointer-events-none translate-y-2 scale-95 opacity-0"
              : "micro-pop-in"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-all duration-150 hover:-translate-y-0.5 hover:scale-105 hover:text-gray-600 active:scale-95"
          >
            <X size={20} />
          </button>

          <div className="p-6">
            <h3 id="message-options-title" className="mb-4 text-lg font-semibold text-gray-800">
              Message Options
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleAction(onReply)}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:bg-gray-100 active:scale-[0.99]"
              >
                <Reply size={20} className="text-blue-600" />
                <span className="text-gray-700">Reply</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onCopy)}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:bg-gray-100 active:scale-[0.99]"
              >
                <Copy size={20} className="text-green-600" />
                <span className="text-gray-700">Copy Text</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onForward)}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:bg-gray-100 active:scale-[0.99]"
              >
                <Forward size={20} className="text-purple-600" />
                <span className="text-gray-700">Forward</span>
              </button>

              {canPin && (
                <button
                  type="button"
                  onClick={() => handleAction(onPin)}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:bg-gray-100 active:scale-[0.99]"
                >
                  <Pin size={20} className="text-orange-600" />
                  <span className="text-gray-700">Pin Message</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleAction(onShare)}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:bg-gray-100 active:scale-[0.99]"
              >
                <Share2 size={20} className="text-indigo-600" />
                <span className="text-gray-700">Share</span>
              </button>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleAction(onEdit)}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:bg-gray-100 active:scale-[0.99]"
                >
                  <Edit size={20} className="text-blue-600" />
                  <span className="text-gray-700">Edit</span>
                </button>
              )}

              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleAction(onDelete)}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:bg-red-50 active:scale-[0.99]"
                >
                  <Trash2 size={20} className="text-red-600" />
                  <span className="text-red-600">Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MessageContextMenu;
