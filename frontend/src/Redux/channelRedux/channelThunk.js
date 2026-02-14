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
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await listChannelApi(token, params);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetching channels failed" },
      );
    }
  },
);
export const myChannel = createAsyncThunk(
  "myChannel",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await listMyChannelApi(token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetching your channel failed" },
      );
    }
  },
);
export const findChannel = createAsyncThunk(
  "findChannel",
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await specificChannelApi(id, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetching  channel failed" },
      );
    }
  },
);
export const subscribeChannel = createAsyncThunk(
  "subscribeChannel",
  async (id, { getState, rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue({ message: "channel id is required" });
      }
      const token = getState().auth?.accessToken;
      return await subscribeChannelApi(id, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "subscribing  channel failed" },
      );
    }
  },
);
export const unsubscribeChannel = createAsyncThunk(
  "unsubscribeChannel",
  async (id, { getState, rejectWithValue }) => {
    try {
      if (!id) {
        return rejectWithValue({ message: "channel id is required" });
      }
      const token = getState().auth?.accessToken;
      return await unsubscribeChannelApi(id, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "unsubscribing  channel failed" },
      );
    }
  },
);
export const createChannel = createAsyncThunk(
  "createChannel",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await addChannelApi(payload, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "adding channel failed" },
      );
    }
  },
);
export const updateChannel = createAsyncThunk(
  "updateChannel",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await updateChannelApi(id, payload, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "updating channel failed" },
      );
    }
  },
);
export const deleteChannel = createAsyncThunk(
  "deleteChannel",
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await deleteChannelApi(id, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "deleting channel failed" },
      );
    }
  },
);

export const addAdmin = createAsyncThunk(
  "addAdmin",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const username = payload?.newAdminUsername?.trim();
      if (!id || !username) {
        return rejectWithValue({
          message: "channel id and newAdminUsername are required",
        });
      }
      const token = getState().auth?.accessToken;
      return await addAdminApi(id, { newAdminUsername: username }, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "adding admin failed" },
      );
    }
  },
);

export const removeAdmin = createAsyncThunk(
  "removeAdmin",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const username = payload?.adminUsername?.trim();
      if (!id || !username) {
        return rejectWithValue({
          message: "channel id and adminUsername are required",
        });
      }
      const token = getState().auth?.accessToken;
      return await removeAdminApi(id, { adminUsername: username }, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "removing admin failed" },
      );
    }
  },
);
