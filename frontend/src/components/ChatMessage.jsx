import React, { useState } from "react";
import { MoreVertical } from "lucide-react";
import MessageContextMenu from "./MessageContextMenu";

const ChatMessage = ({ message, isOwn, isGroupAdmin = false }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleEdit = () => {
    // Implement edit logic
  };

  const handleDelete = () => {
    // Implement delete logic
  };

  const handleForward = () => {
    // Implement forward logic
  };

  const handlePin = () => {
    // Implement pin logic
  };

  const handleCopy = () => {
    if (message?.text) {
      navigator.clipboard.writeText(message.text);
      alert("Text copied!");
    }
  };

  const handleReply = () => {
    // Implement reply logic
  };

  const handleShare = () => {
    // Implement share logic
  };

  return (
    <>
      <div
        className={`flex items-start gap-2 mb-3 ${
          isOwn ? "flex-row-reverse" : ""
        }`}
      >
        {!isOwn && (
          <div className="h-8 w-8 rounded-full bg-blue-500 text-white grid place-items-center text-xs font-bold flex-shrink-0">
            {(message?.sender?.name || "U").charAt(0)}
          </div>
        )}

        <div
          className={`group relative max-w-[70%] rounded-2xl px-4 py-2 ${
            isOwn
              ? "bg-[#6fa63a] text-white"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {!isOwn && message?.sender?.name && (
            <p className="text-xs font-semibold mb-1 text-blue-600">
              {message.sender.name}
            </p>
          )}
          
          <p className="text-sm break-words">{message?.text}</p>
          
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className={`text-xs ${isOwn ? "text-white/70" : "text-gray-500"}`}>
              {message?.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            
            <button
              onClick={() => setShowMenu(true)}
              className={`opacity-0 group-hover:opacity-100 transition p-1 rounded-full ${
                isOwn ? "hover:bg-white/20" : "hover:bg-gray-200"
              }`}
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </div>
      </div>

      <MessageContextMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        message={message}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onForward={handleForward}
        onPin={handlePin}
        onCopy={handleCopy}
        onReply={handleReply}
        onShare={handleShare}
        canEdit={isOwn}
        canDelete={isOwn || isGroupAdmin}
        canPin={isGroupAdmin}
      />
    </>
  );
};

export default ChatMessage;
