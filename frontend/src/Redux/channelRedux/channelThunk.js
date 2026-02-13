import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  addAdminApi,
  addChannelApi,
  deleteChannelApi,
  listChannelApi,
  listMyChannelApi,
  removeAdminApi,
  specificChannelApi,
  subscribeChannelApi,
  unsubscribeChannelApi,
  updateChannelApi,
} from "../../api/channelApi";

export const listChannel = createAsyncThunk(
  "listChannel",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await listChannelApi(params);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetching channels failed" },
      );
    }
  },
);
export const myChannel = createAsyncThunk(
  "myChannel",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await listMyChannelApi();
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetching your channel failed" },
      );
    }
  },
);
export const findChannel = createAsyncThunk(
  "findChannel",
  async (id, { rejectWithValue }) => {
    try {
      return await specificChannelApi(id);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetching  channel failed" },
      );
    }
  },
);
export const subscribeChannel = createAsyncThunk(
  "subscribeChannel",
  async (id, { rejectWithValue }) => {
    try {
      return await subscribeChannelApi(id);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "subscribing  channel failed" },
      );
    }
  },
);
export const unsubscribeChannel = createAsyncThunk(
  "unsubscribeChannel",
  async (id, { rejectWithValue }) => {
    try {
      return await unsubscribeChannelApi(id);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "unsubscribing  channel failed" },
      );
    }
  },
);
export const createChannel = createAsyncThunk(
  "createChannel",
  async (payload, { rejectWithValue }) => {
    try {
      return await addChannelApi(payload);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "adding channel failed" },
      );
    }
  },
);
export const updateChannel = createAsyncThunk(
  "updateChannel",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await updateChannelApi(id, payload);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "updating channel failed" },
      );
    }
  },
);
export const deleteChannel = createAsyncThunk(
  "deleteChannel",
  async (id, { rejectWithValue }) => {
    try {
      return await deleteChannelApi(id);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "deleting channel failed" },
      );
    }
  },
);

export const addAdmin = createAsyncThunk(
  "addAdmin",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await addAdminApi(id, payload);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "adding admin failed" },
      );
    }
  },
);

export const removeAdmin = createAsyncThunk(
  "removeAdmin",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await removeAdminApi(id, payload);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "removing admin failed" },
      );
    }
  },
);
