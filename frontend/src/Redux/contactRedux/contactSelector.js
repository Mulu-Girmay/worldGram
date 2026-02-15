import { createSelector } from "@reduxjs/toolkit";

const EMPTY_ARRAY = [];

export const selectContactState = (state) => state.contact;

export const selectRegisteredUsers = createSelector(
  selectContactState,
  (s) => s?.users || EMPTY_ARRAY,
);

export const selectRegisteredUsersStatus = (state) => state.contact?.usersStatus;
export const selectContactError = (state) => state.contact?.error;
