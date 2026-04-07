import { createSlice } from "@reduxjs/toolkit";
import {
  addContact,
  listContacts,
  listRegisteredUsers,
  removeContact,
  updateContact,
} from "./contactThunk";

const initialState = {
  users: [],
  contacts: [],
  usersStatus: "idle",
  contactsStatus: "idle",
  mutateStatus: "idle",
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
      })

      .addCase(listContacts.pending, (state) => {
        state.contactsStatus = "loading";
        state.error = null;
      })
      .addCase(listContacts.fulfilled, (state, action) => {
        state.contactsStatus = "succeeded";
        state.contacts = Array.isArray(action.payload?.items)
          ? action.payload.items
          : [];
      })
      .addCase(listContacts.rejected, (state, action) => {
        state.contactsStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Fetching contacts failed";
      })

      .addCase(addContact.pending, (state) => {
        state.mutateStatus = "loading";
        state.error = null;
      })
      .addCase(addContact.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        if (action.payload?._id) {
          state.contacts = [action.payload, ...state.contacts];
        }
      })
      .addCase(addContact.rejected, (state, action) => {
        state.mutateStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Adding contact failed";
      })

      .addCase(removeContact.pending, (state) => {
        state.mutateStatus = "loading";
        state.error = null;
      })
      .addCase(removeContact.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        const id = String(action.payload?.contactId || "");
        state.contacts = state.contacts.filter(
          (contact) => String(contact?._id || "") !== id,
        );
      })
      .addCase(removeContact.rejected, (state, action) => {
        state.mutateStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Removing contact failed";
      })

      .addCase(updateContact.pending, (state) => {
        state.mutateStatus = "loading";
        state.error = null;
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        const updated = action.payload?.contact;
        const id = String(updated?._id || "");
        if (!id) return;
        state.contacts = state.contacts.map((contact) =>
          String(contact?._id || "") === id
            ? {
                ...contact,
                ...updated,
              }
            : contact,
        );
      })
      .addCase(updateContact.rejected, (state, action) => {
        state.mutateStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Updating contact failed";
      });
  },
});

export const { clearContactError } = contactSlice.actions;
export default contactSlice.reducer;
