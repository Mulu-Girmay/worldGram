import { createSlice } from "@reduxjs/toolkit";
import {
  addViewToMessage,
  createChat,
  createGroupChat,
  deleteMessage,
  editMessage,
  forwardMessage,
  getChatById,
  getMessages,
  getMessagesPaged,
  getUnreadCount,
  listChats,
  markChatRead,
  reactToMessage,
  sendMediaMessage,
  sendMessage,
  updateChatSettings,
} from "./chatThunk";

const initialState = {
  chats: [],
  chatsStatus: "idle",
  nextCursor: null,
  currentChat: null,
  currentChatStatus: "idle",
  messages: [],
  messagesStatus: "idle",
  messagesNextCursor: null,
  createStatus: "idle",
  sendStatus: "idle",
  mediaSendStatus: "idle",
  editStatus: "idle",
  deleteStatus: "idle",
  readStatus: "idle",
  unreadStatus: "idle",
  settingsStatus: "idle",
  reactStatus: "idle",
  viewStatus: "idle",
  forwardStatus: "idle",
  error: null,
  lastActionMessage: null,
  unreadCountByChat: {},
};

const upsertMessage = (messages, incoming) => {
  if (!incoming?._id) return messages || [];
  const index = (messages || []).findIndex((m) => m._id === incoming._id);
  if (index === -1) return [...(messages || []), incoming];
  const next = [...messages];
  next[index] = incoming;
  return next;
};

const replaceChatIfExists = (chats, updatedChat) =>
  (chats || []).map((chat) => (chat._id === updatedChat._id ? updatedChat : chat));

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    clearChatError(state) {
      state.error = null;
    },
    clearMessages(state) {
      state.messages = [];
      state.messagesNextCursor = null;
    },
    setCurrentChat(state, action) {
      state.currentChat = action.payload || null;
    },
    pushIncomingMessage(state, action) {
      state.messages = upsertMessage(state.messages, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createChat.pending, (state) => {
        state.createStatus = "loading";
        state.error = null;
      })
      .addCase(createChat.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.lastActionMessage = action.payload?.message || null;
      })
      .addCase(createChat.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Create chat failed";
      })

      .addCase(createGroupChat.pending, (state) => {
        state.createStatus = "loading";
        state.error = null;
      })
      .addCase(createGroupChat.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.lastActionMessage = action.payload?.message || null;
      })
      .addCase(createGroupChat.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Create group chat failed";
      })

      .addCase(listChats.pending, (state) => {
        state.chatsStatus = "loading";
        state.error = null;
      })
      .addCase(listChats.fulfilled, (state, action) => {
        state.chatsStatus = "succeeded";
        const items =
          action.payload?.items ||
          (Array.isArray(action.payload) ? action.payload : []);
        if (action.meta?.arg?.cursor) {
          state.chats = [...(state.chats || []), ...items];
        } else {
          state.chats = items;
        }
        state.nextCursor = action.payload?.nextCursor || null;
      })
      .addCase(listChats.rejected, (state, action) => {
        state.chatsStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Fetch chats failed";
      })

      .addCase(getChatById.pending, (state) => {
        state.currentChatStatus = "loading";
        state.error = null;
      })
      .addCase(getChatById.fulfilled, (state, action) => {
        state.currentChatStatus = "succeeded";
        state.currentChat = action.payload || null;
        if (action.payload?._id) {
          state.chats = replaceChatIfExists(state.chats, action.payload);
        }
      })
      .addCase(getChatById.rejected, (state, action) => {
        state.currentChatStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Fetch chat failed";
      })

      .addCase(getMessages.pending, (state) => {
        state.messagesStatus = "loading";
        state.error = null;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.messagesStatus = "succeeded";
        state.messages = Array.isArray(action.payload) ? action.payload : [];
        state.messagesNextCursor = null;
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.messagesStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Fetch messages failed";
      })

      .addCase(getMessagesPaged.pending, (state) => {
        state.messagesStatus = "loading";
        state.error = null;
      })
      .addCase(getMessagesPaged.fulfilled, (state, action) => {
        state.messagesStatus = "succeeded";
        const items =
          action.payload?.items ||
          (Array.isArray(action.payload) ? action.payload : []);
        if (action.meta?.arg?.params?.cursor) {
          state.messages = [...(state.messages || []), ...items];
        } else {
          state.messages = items;
        }
        state.messagesNextCursor = action.payload?.nextCursor || null;
      })
      .addCase(getMessagesPaged.rejected, (state, action) => {
        state.messagesStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Fetch paged messages failed";
      })

      .addCase(sendMessage.pending, (state) => {
        state.sendStatus = "loading";
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendStatus = "succeeded";
        state.messages = upsertMessage(state.messages, action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Send message failed";
      })

      .addCase(sendMediaMessage.pending, (state) => {
        state.mediaSendStatus = "loading";
        state.error = null;
      })
      .addCase(sendMediaMessage.fulfilled, (state, action) => {
        state.mediaSendStatus = "succeeded";
        state.messages = upsertMessage(state.messages, action.payload);
      })
      .addCase(sendMediaMessage.rejected, (state, action) => {
        state.mediaSendStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Send media message failed";
      })

      .addCase(editMessage.pending, (state) => {
        state.editStatus = "loading";
        state.error = null;
      })
      .addCase(editMessage.fulfilled, (state, action) => {
        state.editStatus = "succeeded";
        const message = action.payload?.data;
        if (message) {
          state.messages = upsertMessage(state.messages, message);
        }
        state.lastActionMessage = action.payload?.message || null;
      })
      .addCase(editMessage.rejected, (state, action) => {
        state.editStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Edit message failed";
      })

      .addCase(deleteMessage.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        state.lastActionMessage = action.payload?.message || null;
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Delete message failed";
      })

      .addCase(markChatRead.pending, (state) => {
        state.readStatus = "loading";
        state.error = null;
      })
      .addCase(markChatRead.fulfilled, (state, action) => {
        state.readStatus = "succeeded";
        state.lastActionMessage = action.payload?.message || null;
      })
      .addCase(markChatRead.rejected, (state, action) => {
        state.readStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Mark chat read failed";
      })

      .addCase(getUnreadCount.pending, (state) => {
        state.unreadStatus = "loading";
        state.error = null;
      })
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadStatus = "succeeded";
        state.unreadCountByChat[action.payload.chatId] = action.payload.count;
      })
      .addCase(getUnreadCount.rejected, (state, action) => {
        state.unreadStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Fetch unread count failed";
      })

      .addCase(updateChatSettings.pending, (state) => {
        state.settingsStatus = "loading";
        state.error = null;
      })
      .addCase(updateChatSettings.fulfilled, (state, action) => {
        state.settingsStatus = "succeeded";
        const updatedChat = action.payload?.chat;
        state.lastActionMessage = action.payload?.message || null;
        if (updatedChat?._id) {
          state.chats = replaceChatIfExists(state.chats, updatedChat);
          if (state.currentChat?._id === updatedChat._id) {
            state.currentChat = updatedChat;
          }
        }
      })
      .addCase(updateChatSettings.rejected, (state, action) => {
        state.settingsStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Update chat settings failed";
      })

      .addCase(reactToMessage.pending, (state) => {
        state.reactStatus = "loading";
        state.error = null;
      })
      .addCase(reactToMessage.fulfilled, (state, action) => {
        state.reactStatus = "succeeded";
        state.lastActionMessage = action.payload?.message || null;
      })
      .addCase(reactToMessage.rejected, (state, action) => {
        state.reactStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "React to message failed";
      })

      .addCase(addViewToMessage.pending, (state) => {
        state.viewStatus = "loading";
        state.error = null;
      })
      .addCase(addViewToMessage.fulfilled, (state, action) => {
        state.viewStatus = "succeeded";
        state.lastActionMessage = action.payload?.message || null;
      })
      .addCase(addViewToMessage.rejected, (state, action) => {
        state.viewStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Add view to message failed";
      })

      .addCase(forwardMessage.pending, (state) => {
        state.forwardStatus = "loading";
        state.error = null;
      })
      .addCase(forwardMessage.fulfilled, (state, action) => {
        state.forwardStatus = "succeeded";
        state.lastActionMessage = action.payload?.message || null;
      })
      .addCase(forwardMessage.rejected, (state, action) => {
        state.forwardStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Forward message failed";
      });
  },
});

export const { clearChatError, clearMessages, setCurrentChat, pushIncomingMessage } =
  chatSlice.actions;
export default chatSlice.reducer;
