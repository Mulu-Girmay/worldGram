import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  addContactApi,
  listContactsApi,
  listRegisteredUsersApi,
  removeContactApi,
} from "../../api/contactApi";

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

export const listContacts = createAsyncThunk(
  "contact/listContacts",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await listContactsApi(params, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetching contacts failed" },
      );
    }
  },
);

export const addContact = createAsyncThunk(
  "contact/addContact",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await addContactApi(payload, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "adding contact failed" },
      );
    }
  },
);

export const removeContact = createAsyncThunk(
  "contact/removeContact",
  async (contactId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      await removeContactApi(contactId, token);
      return { contactId };
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "removing contact failed" },
      );
    }
  },
);
