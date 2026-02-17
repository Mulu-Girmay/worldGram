import { createSelector } from "@reduxjs/toolkit";

const EMPTY_ARRAY = [];

export const selectGroupState = (state) => state.group;

export const selectGroups = createSelector(
  selectGroupState,
  (s) => s?.groups || EMPTY_ARRAY,
);

export const selectGroupById = (state, id) =>
  selectGroups(state).find((group) => group._id === id);

export const selectGroupsStatus = (state) => state.group?.groupsStatus;
export const selectGroupsNextCursor = (state) => state.group?.nextCursor;
export const selectGroupInitialized = (state) => state.group?.initialized;
export const selectGroupError = (state) => state.group?.error;

export const selectMyGroups = createSelector(
  selectGroupState,
  (s) => s?.myGroups || EMPTY_ARRAY,
);

export const selectMyGroupsStatus = (state) => state.group?.myGroupsStatus;
export const selectMyGroupsNextCursor = (state) => state.group?.myNextCursor;

export const selectCurrentGroup = (state) => state.group?.currentGroup;
export const selectCurrentGroupStatus = (state) =>
  state.group?.currentGroupStatus;

export const selectGroupMembers = createSelector(
  selectGroupState,
  (s) => s?.members || EMPTY_ARRAY,
);

export const selectGroupMembersStatus = (state) => state.group?.membersStatus;

export const selectJoinGroupStatus = (state) => state.group?.joinStatus;
export const selectLeaveGroupStatus = (state) => state.group?.leaveStatus;
export const selectCreateGroupStatus = (state) => state.group?.createStatus;
export const selectUpdateGroupStatus = (state) => state.group?.updateStatus;
export const selectDeleteGroupStatus = (state) => state.group?.deleteStatus;
export const selectMemberStatus = (state) => state.group?.memberStatus;
export const selectAddMemberStatus = (state) => state.group?.addMemberStatus;
export const selectRemoveMemberStatus = (state) =>
  state.group?.removeMemberStatus;
export const selectAdminStatus = (state) => state.group?.adminStatus;
export const selectAddAdminStatus = (state) => state.group?.addAdminStatus;
export const selectRemoveAdminStatus = (state) => state.group?.removeAdminStatus;
export const selectPermissionStatus = (state) => state.group?.permissionStatus;
export const selectGroupLastMessage = (state) => state.group?.lastMessage;
