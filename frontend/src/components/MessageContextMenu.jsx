import React from "react";
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
  if (!isOpen) return null;

  const handleAction = (action) => {
    action();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>

          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Message Options
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => handleAction(onReply)}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-gray-100"
              >
                <Reply size={20} className="text-blue-600" />
                <span className="text-gray-700">Reply</span>
              </button>

              <button
                onClick={() => handleAction(onCopy)}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-gray-100"
              >
                <Copy size={20} className="text-green-600" />
                <span className="text-gray-700">Copy Text</span>
              </button>

              <button
                onClick={() => handleAction(onForward)}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-gray-100"
              >
                <Forward size={20} className="text-purple-600" />
                <span className="text-gray-700">Forward</span>
              </button>

              {canPin && (
                <button
                  onClick={() => handleAction(onPin)}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-gray-100"
                >
                  <Pin size={20} className="text-orange-600" />
                  <span className="text-gray-700">Pin Message</span>
                </button>
              )}

              <button
               
                onClick={() => handleAction(onShare)}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-gray-100"
              >
                <Share2 size={20} className="text-indigo-600" />
                <span className="text-gray-700">Share</span>
              </button>

              {canEdit && (
                <button
                  onClick={() => handleAction(onEdit)}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-gray-100"
                >
                  <Edit size={20} className="text-blue-600" />
                  <span className="text-gray-700">Edit</span>
                </button>
              )}

              {canDelete && (
                <button
                  onClick={() => handleAction(onDelete)}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition hover:bg-red-50"
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
