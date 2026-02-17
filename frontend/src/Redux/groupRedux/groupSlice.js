import { createSlice } from "@reduxjs/toolkit";
import {
  addAdmin,
  addMember,
  createGroup,
  deleteGroup,
  findGroup,
  joinGroup,
  leaveGroup,
  listGroups,
  listMembers,
  listMyGroups,
  removeAdmin,
  removeMember,
  updateGroup,
  updatePermissions,
} from "./groupThunk";

const initialState = {
  groups: [],
  myGroups: [],
  members: [],
  currentGroup: null,
  error: null,
  initialized: false,
  nextCursor: null,
  myNextCursor: null,
  lastMessage: null,
  groupsStatus: "idle",
  myGroupsStatus: "idle",
  currentGroupStatus: "idle",
  membersStatus: "idle",
  joinStatus: "idle",
  leaveStatus: "idle",
  createStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  memberStatus: "idle",
  addMemberStatus: "idle",
  removeMemberStatus: "idle",
  adminStatus: "idle",
  addAdminStatus: "idle",
  removeAdminStatus: "idle",
  permissionStatus: "idle",
};

const groupSlice = createSlice({
  name: "group",
  initialState,
  reducers: {
    clearGroupError(state) {
      state.error = null;
    },
    setCurrentGroup(state, action) {
      state.currentGroup = action.payload || null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listGroups.pending, (state) => {
        state.groupsStatus = "loading";
        state.error = null;
      })
      .addCase(listGroups.fulfilled, (state, action) => {
        state.groupsStatus = "succeeded";
        const items =
          action.payload?.items ||
          (Array.isArray(action.payload) ? action.payload : []);
        if (action.meta?.arg?.cursor) {
          state.groups = [...(state.groups || []), ...items];
        } else {
          state.groups = items;
        }
        state.nextCursor = action.payload?.nextCursor || null;
        state.initialized = true;
      })
      .addCase(listGroups.rejected, (state, action) => {
        state.groupsStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "fetching groups failed";
        state.initialized = true;
      })
      .addCase(listMyGroups.pending, (state) => {
        state.myGroupsStatus = "loading";
        state.error = null;
      })
      .addCase(listMyGroups.fulfilled, (state, action) => {
        state.myGroupsStatus = "succeeded";
        const items =
          action.payload?.items ||
          (Array.isArray(action.payload) ? action.payload : []);
        if (action.meta?.arg?.cursor) {
          state.myGroups = [...(state.myGroups || []), ...items];
        } else {
          state.myGroups = items;
        }
        state.myNextCursor = action.payload?.nextCursor || null;
      })
      .addCase(listMyGroups.rejected, (state, action) => {
        state.myGroupsStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "fetching my groups failed";
      })
      .addCase(findGroup.pending, (state) => {
        state.currentGroupStatus = "loading";
        state.error = null;
      })
      .addCase(findGroup.fulfilled, (state, action) => {
        state.currentGroupStatus = "succeeded";
        state.currentGroup = action.payload || null;
      })
      .addCase(findGroup.rejected, (state, action) => {
        state.currentGroupStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "fetching group failed";
      })
      .addCase(listMembers.pending, (state) => {
        state.membersStatus = "loading";
        state.error = null;
      })
      .addCase(listMembers.fulfilled, (state, action) => {
        state.membersStatus = "succeeded";
        state.members = Array.isArray(action.payload?.members)
          ? action.payload.members
          : [];
      })
      .addCase(listMembers.rejected, (state, action) => {
        state.membersStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "fetching members failed";
      })
      .addCase(createGroup.pending, (state) => {
        state.createStatus = "loading";
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "creating group failed";
      })
      .addCase(updateGroup.pending, (state) => {
        state.updateStatus = "loading";
        state.error = null;
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
        if (action.payload?.updatedGroup) {
          const updated = action.payload.updatedGroup;
          if (state.currentGroup?._id === updated._id) {
            state.currentGroup = updated;
          }
          state.groups = (state.groups || []).map((g) =>
            g._id === updated._id ? updated : g,
          );
          state.myGroups = (state.myGroups || []).map((g) =>
            g._id === updated._id ? updated : g,
          );
        }
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "updating group failed";
      })
      .addCase(deleteGroup.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
        const id = action.meta?.arg;
        if (id) {
          state.groups = (state.groups || []).filter((g) => g._id !== id);
          state.myGroups = (state.myGroups || []).filter((g) => g._id !== id);
          if (state.currentGroup?._id === id) {
            state.currentGroup = null;
          }
        }
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "deleting group failed";
      })
      .addCase(joinGroup.pending, (state) => {
        state.joinStatus = "loading";
        state.error = null;
      })
      .addCase(joinGroup.fulfilled, (state, action) => {
        state.joinStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
      })
      .addCase(joinGroup.rejected, (state, action) => {
        state.joinStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "joining group failed";
      })
      .addCase(leaveGroup.pending, (state) => {
        state.leaveStatus = "loading";
        state.error = null;
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.leaveStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
      })
      .addCase(leaveGroup.rejected, (state, action) => {
        state.leaveStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "leaving group failed";
      })
      .addCase(addMember.pending, (state) => {
        state.memberStatus = "loading";
        state.addMemberStatus = "loading";
        state.error = null;
      })
      .addCase(addMember.fulfilled, (state, action) => {
        state.memberStatus = "succeeded";
        state.addMemberStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
      })
      .addCase(addMember.rejected, (state, action) => {
        state.memberStatus = "failed";
        state.addMemberStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "adding member failed";
      })
      .addCase(removeMember.pending, (state) => {
        state.memberStatus = "loading";
        state.removeMemberStatus = "loading";
        state.error = null;
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.memberStatus = "succeeded";
        state.removeMemberStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
      })
      .addCase(removeMember.rejected, (state, action) => {
        state.memberStatus = "failed";
        state.removeMemberStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "removing member failed";
      })
      .addCase(addAdmin.pending, (state) => {
        state.adminStatus = "loading";
        state.addAdminStatus = "loading";
        state.error = null;
      })
      .addCase(addAdmin.fulfilled, (state, action) => {
        state.adminStatus = "succeeded";
        state.addAdminStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
      })
      .addCase(addAdmin.rejected, (state, action) => {
        state.adminStatus = "failed";
        state.addAdminStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "adding admin failed";
      })
      .addCase(removeAdmin.pending, (state) => {
        state.adminStatus = "loading";
        state.removeAdminStatus = "loading";
        state.error = null;
      })
      .addCase(removeAdmin.fulfilled, (state, action) => {
        state.adminStatus = "succeeded";
        state.removeAdminStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
      })
      .addCase(removeAdmin.rejected, (state, action) => {
        state.adminStatus = "failed";
        state.removeAdminStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "removing admin failed";
      })
      .addCase(updatePermissions.pending, (state) => {
        state.permissionStatus = "loading";
        state.error = null;
      })
      .addCase(updatePermissions.fulfilled, (state, action) => {
        state.permissionStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
        if (state.currentGroup?.permissions && action.payload?.permissions) {
          state.currentGroup.permissions = {
            ...state.currentGroup.permissions,
            ...action.payload.permissions,
          };
        }
      })
      .addCase(updatePermissions.rejected, (state, action) => {
        state.permissionStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "updating permissions failed";
      });
  },
});

export const { clearGroupError, setCurrentGroup } = groupSlice.actions;
export default groupSlice.reducer;
