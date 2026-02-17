import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  addViewToMessageApi,
  createChatApi,
  createGroupChatApi,
  deleteMessageApi,
  editMessageApi,
  forwardMessageApi,
  getChatByIdApi,
  getMessagesApi,
  getMessagesPagedApi,
  getUnreadCountApi,
  listChatsApi,
  markChatReadApi,
  reactToMessageApi,
  sendMediaMessageApi,
  sendMessageApi,
  updateChatSettingsApi,
} from "../../api/chatApi";

export const createChat = createAsyncThunk(
  "chat/createChat",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await createChatApi(payload, token);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "create chat failed" });
    }
  },
);

export const createGroupChat = createAsyncThunk(
  "chat/createGroupChat",
  async ({ groupId, payload = {} }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await createGroupChatApi(
        groupId,
        { type: "group", ...payload },
        token,
      );
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "create group chat failed" },
      );
    }
  },
);

export const listChats = createAsyncThunk(
  "chat/listChats",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await listChatsApi(params, token);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "fetch chats failed" });
    }
  },
);

export const getChatById = createAsyncThunk(
  "chat/getChatById",
  async (chatId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await getChatByIdApi(chatId, token);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "fetch chat failed" });
    }
  },
);

export const getMessages = createAsyncThunk(
  "chat/getMessages",
  async ({ chatId, params = {} }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await getMessagesApi(chatId, token, params);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "fetch messages failed" });
    }
  },
);

export const getMessagesPaged = createAsyncThunk(
  "chat/getMessagesPaged",
  async ({ chatId, params = {} }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await getMessagesPagedApi(chatId, params, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetch paged messages failed" },
      );
    }
  },
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ chatId, payload }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await sendMessageApi(chatId, payload, token);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "send message failed" });
    }
  },
);

export const sendMediaMessage = createAsyncThunk(
  "chat/sendMediaMessage",
  async ({ chatId, formData }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await sendMediaMessageApi(chatId, formData, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "send media message failed" },
      );
    }
  },
);

export const editMessage = createAsyncThunk(
  "chat/editMessage",
  async ({ chatId, messageId, payload }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await editMessageApi(chatId, messageId, payload, token);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "edit message failed" });
    }
  },
);

export const deleteMessage = createAsyncThunk(
  "chat/deleteMessage",
  async ({ chatId, messageId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await deleteMessageApi(chatId, messageId, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "delete message failed" },
      );
    }
  },
);

export const markChatRead = createAsyncThunk(
  "chat/markChatRead",
  async (chatId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await markChatReadApi(chatId, token);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "mark read failed" });
    }
  },
);

export const getUnreadCount = createAsyncThunk(
  "chat/getUnreadCount",
  async (chatId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      const data = await getUnreadCountApi(chatId, token);
      return { chatId, count: data?.count ?? 0 };
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetch unread count failed" },
      );
    }
  },
);

export const updateChatSettings = createAsyncThunk(
  "chat/updateChatSettings",
  async ({ chatId, payload }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await updateChatSettingsApi(chatId, payload, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "update settings failed" },
      );
    }
  },
);

export const reactToMessage = createAsyncThunk(
  "chat/reactToMessage",
  async ({ chatId, messageId, payload }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await reactToMessageApi(chatId, messageId, payload, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "react to message failed" },
      );
    }
  },
);

export const addViewToMessage = createAsyncThunk(
  "chat/addViewToMessage",
  async ({ chatId, messageId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await addViewToMessageApi(chatId, messageId, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "add view to message failed" },
      );
    }
  },
);

export const forwardMessage = createAsyncThunk(
  "chat/forwardMessage",
  async ({ chatId, messageId, destination }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await forwardMessageApi(chatId, messageId, destination, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "forward message failed" },
      );
    }
  },
);
