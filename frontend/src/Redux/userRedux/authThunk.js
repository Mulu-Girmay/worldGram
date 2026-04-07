import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  blockUserApi,
  loginApi,
  logoutApi,
  meApi,
  refreshApi,
  registerApi,
  unblockUserApi,
  updateMeApi,
  updatePrivacyApi,
} from "../../api/authApi";

export const registerUser = createAsyncThunk(
  "registerUser",
  async (payload, { rejectWithValue }) => {
    try {
      return await registerApi(payload);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "registration failed" },
      );
    }
  },
);
export const loginUser = createAsyncThunk(
  "loginUser",
  async (payload, { rejectWithValue }) => {
    try {
      return await loginApi(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "login failed" });
    }
  },
);
export const refreshSession = createAsyncThunk(
  "refreshSession",
  async (_, { rejectWithValue }) => {
    try {
      return await refreshApi();
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "refresh session failed" },
      );
    }
  },
);
export const checkAuth = createAsyncThunk(
  "checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      // call /me which will rely on cookie (api.withCredentials = true)
      return await meApi();
    } catch (err) {
      // if /me failed, try refreshing session and call /me again
      try {
        await refreshApi();
        return await meApi();
      } catch (err2) {
        return rejectWithValue(
          err2.response?.data || { message: "not authenticated" },
        );
      }
    }
  },
);
export const fetchMe = createAsyncThunk(
  "fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      return await meApi();
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetching user failed" },
      );
    }
  },
);
export const logoutUser = createAsyncThunk(
  "logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await logoutApi();
      return { success: true };
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "logout failed" },
      );
    }
  },
);

export const updateProfile = createAsyncThunk(
  "updateProfile",
  async (payload, { rejectWithValue }) => {
    try {
      return await updateMeApi(payload);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "profile update failed" },
      );
    }
  },
);

export const updatePrivacySettings = createAsyncThunk(
  "updatePrivacySettings",
  async (payload, { rejectWithValue }) => {
    try {
      return await updatePrivacyApi(payload);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "privacy settings update failed" },
      );
    }
  },
);

export const blockUserSetting = createAsyncThunk(
  "blockUserSetting",
  async (userId, { rejectWithValue }) => {
    try {
      await blockUserApi(userId);
      return { userId };
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "failed to block user" },
      );
    }
  },
);

export const unblockUserSetting = createAsyncThunk(
  "unblockUserSetting",
  async (userId, { rejectWithValue }) => {
    try {
      await unblockUserApi(userId);
      return { userId };
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "failed to unblock user" },
      );
    }
  },
);
