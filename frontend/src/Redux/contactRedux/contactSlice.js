import { createSlice } from "@reduxjs/toolkit";
import { listRegisteredUsers } from "./contactThunk";

const initialState = {
  users: [],
  usersStatus: "idle",
  error: null,
};

const contactSlice = createSlice({
  name: "contact",
  initialState,
  reducers: {
    clearContactError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listRegisteredUsers.pending, (state) => {
        state.usersStatus = "loading";
        state.error = null;
      })
      .addCase(listRegisteredUsers.fulfilled, (state, action) => {
        state.usersStatus = "succeeded";
        state.users = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(listRegisteredUsers.rejected, (state, action) => {
        state.usersStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Fetching users failed";
      });
  },
});

export const { clearContactError } = contactSlice.actions;
export default contactSlice.reducer;
