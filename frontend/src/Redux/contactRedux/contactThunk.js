import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  addContactApi,
  listContactsApi,
  listRegisteredUsersApi,
  removeContactApi,
  updateContactApi,
} from "../../api/contactApi";
import { shouldFetchWithCache } from "../../utils/cache";

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
  {
    condition: (params = {}, { getState }) => {
      if (params?.cursor || params?.force) return true;
      const { usersStatus, usersFetchedAt } = getState().contact || {};
      return shouldFetchWithCache({
        status: usersStatus,
        fetchedAt: usersFetchedAt,
        force: params?.force,
      });
    },
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
  {
    condition: (params = {}, { getState }) => {
      if (params?.cursor || params?.force) return true;
      const { contactsStatus, contactsFetchedAt } = getState().contact || {};
      return shouldFetchWithCache({
        status: contactsStatus,
        fetchedAt: contactsFetchedAt,
        force: params?.force,
      });
    },
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

export const updateContact = createAsyncThunk(
  "contact/updateContact",
  async ({ contactId, payload }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await updateContactApi(contactId, payload, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "updating contact failed" },
      );
    }
  },
);
