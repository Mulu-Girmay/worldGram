// features/auth/authSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchMe,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  checkAuth,
  updateProfile,
} from "./authThunk";

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  status: "idle",
  error: null,
  registerStatus: "idle",
  loginStatus: "idle",
  refreshStatus: "idle",
  updateProfileStatus: "idle",
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    setAccessToken(state, action) {
      state.accessToken = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.registerStatus = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.registerStatus = "succeeded";
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.registerStatus = "failed";
        state.error = action.payload?.message || "Registration failed";
      })

      .addCase(loginUser.pending, (state) => {
        state.loginStatus = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loginStatus = "succeeded";
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loginStatus = "failed";
        state.error = action.payload?.message || "Login failed";
      })

      .addCase(refreshSession.pending, (state) => {
        state.refreshStatus = "loading";
      })
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.refreshStatus = "succeeded";
        state.accessToken = action.payload.accessToken;
      })
      .addCase(refreshSession.rejected, (state) => {
        state.refreshStatus = "failed";
        state.accessToken = null;
        state.user = null;
        state.isAuthenticated = false;
      })

      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.initialized = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
      })

      // bootstrap check
      .addCase(checkAuth.pending, (state) => {
        state.status = "loading";
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user || null;
        if (action.payload?.accessToken)
          state.accessToken = action.payload.accessToken;
        state.isAuthenticated = !!action.payload?.user;
        state.initialized = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.status = "failed";
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.initialized = true;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        Object.assign(state, initialState, { initialized: true });
      })

      .addCase(updateProfile.pending, (state) => {
        state.updateProfileStatus = "loading";
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateProfileStatus = "succeeded";
        state.user = action.payload?.user || state.user;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateProfileStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.message ||
          "Profile update failed";
      });
  },
});

export const { clearAuthError, setAccessToken } = authSlice.actions;
export default authSlice.reducer;
