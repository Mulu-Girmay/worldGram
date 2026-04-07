import { createSelector } from "@reduxjs/toolkit";

const EMPTY_ARRAY = [];

export const selectContactState = (state) => state.contact;

export const selectRegisteredUsers = createSelector(
  selectContactState,
  (s) => s?.users || EMPTY_ARRAY,
);

export const selectContacts = createSelector(
  selectContactState,
  (s) => s?.contacts || EMPTY_ARRAY,
);

export const selectRegisteredUsersStatus = (state) =>
  state.contact?.usersStatus;
export const selectContactsStatus = (state) => state.contact?.contactsStatus;
export const selectContactMutateStatus = (state) => state.contact?.mutateStatus;
export const selectContactError = (state) => state.contact?.error;
