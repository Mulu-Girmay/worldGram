import { createSelector } from "@reduxjs/toolkit";

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

export const selectChatState = (state) => state.chat;

export const selectChats = createSelector(
  selectChatState,
  (s) => s?.chats || EMPTY_ARRAY,
);

export const selectChatById = (state, chatId) =>
  selectChats(state).find((chat) => chat._id === chatId);

export const selectChatsStatus = (state) => state.chat?.chatsStatus;
export const selectChatsNextCursor = (state) => state.chat?.nextCursor;
export const selectCurrentChat = (state) => state.chat?.currentChat;
export const selectCurrentChatStatus = (state) => state.chat?.currentChatStatus;

export const selectMessages = createSelector(
  selectChatState,
  (s) => s?.messages || EMPTY_ARRAY,
);

export const selectMessageById = (state, messageId) =>
  selectMessages(state).find((message) => message._id === messageId);

export const selectMessagesStatus = (state) => state.chat?.messagesStatus;
export const selectMessagesNextCursor = (state) => state.chat?.messagesNextCursor;

export const selectCreateChatStatus = (state) => state.chat?.createStatus;
export const selectSendStatus = (state) => state.chat?.sendStatus;
export const selectMediaSendStatus = (state) => state.chat?.mediaSendStatus;
export const selectEditMessageStatus = (state) => state.chat?.editStatus;
export const selectDeleteMessageStatus = (state) => state.chat?.deleteStatus;
export const selectReadStatus = (state) => state.chat?.readStatus;
export const selectUnreadStatus = (state) => state.chat?.unreadStatus;
export const selectSettingsStatus = (state) => state.chat?.settingsStatus;
export const selectReactStatus = (state) => state.chat?.reactStatus;
export const selectViewStatus = (state) => state.chat?.viewStatus;
export const selectForwardStatus = (state) => state.chat?.forwardStatus;

export const selectUnreadCountByChat = createSelector(
  selectChatState,
  (s) => s?.unreadCountByChat || EMPTY_OBJECT,
);

export const selectUnreadCountForChat = (state, chatId) =>
  selectUnreadCountByChat(state)?.[chatId] ?? 0;

export const selectChatError = (state) => state.chat?.error;
export const selectChatLastActionMessage = (state) => state.chat?.lastActionMessage;
