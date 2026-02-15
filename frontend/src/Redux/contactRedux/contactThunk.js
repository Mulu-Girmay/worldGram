import { createAsyncThunk } from "@reduxjs/toolkit";
import { listRegisteredUsersApi } from "../../api/contactApi";

export const listRegisteredUsers = createAsyncThunk(
  "contact/listRegisteredUsers",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await listRegisteredUsersApi(params, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetching users failed" },
      );
    }
  },
);
