import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  loginApi,
  logoutApi,
  meApi,
  refreshApi,
  registerApi,
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
export const fetchMe = createAsyncThunk(
  "fetchMe",
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      return await meApi(token);
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
