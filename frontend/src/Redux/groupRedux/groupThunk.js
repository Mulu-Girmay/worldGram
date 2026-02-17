import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  addGroupAdminApi,
  addGroupApi,
  addMemberApi,
  deleteGroupApi,
  joinGroupApi,
  leaveGroupApi,
  listGroupMembersApi,
  listGroupsApi,
  listMyGroupsApi,
  removeGroupAdminApi,
  removeMemberApi,
  specificGroupApi,
  updateGroupApi,
  updateGroupPermissionsApi,
} from "../../api/groupApi";

export const listGroups = createAsyncThunk(
  "group/listGroups",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await listGroupsApi(params, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetching groups failed" },
      );
    }
  },
);

export const listMyGroups = createAsyncThunk(
  "group/listMyGroups",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await listMyGroupsApi(params, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetching my groups failed" },
      );
    }
  },
);

export const findGroup = createAsyncThunk(
  "group/findGroup",
  async (id, { getState, rejectWithValue }) => {
    try {
      if (!id) return rejectWithValue({ message: "group id is required" });
      const token = getState().auth?.accessToken;
      return await specificGroupApi(id, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetching group failed" },
      );
    }
  },
);

export const listMembers = createAsyncThunk(
  "group/listMembers",
  async (id, { getState, rejectWithValue }) => {
    try {
      if (!id) return rejectWithValue({ message: "group id is required" });
      const token = getState().auth?.accessToken;
      return await listGroupMembersApi(id, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetching group members failed" },
      );
    }
  },
);

export const createGroup = createAsyncThunk(
  "group/createGroup",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await addGroupApi(payload, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "creating group failed" },
      );
    }
  },
);

export const updateGroup = createAsyncThunk(
  "group/updateGroup",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      if (!id) return rejectWithValue({ message: "group id is required" });
      const token = getState().auth?.accessToken;
      return await updateGroupApi(id, payload, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "updating group failed" },
      );
    }
  },
);

export const deleteGroup = createAsyncThunk(
  "group/deleteGroup",
  async (id, { getState, rejectWithValue }) => {
    try {
      if (!id) return rejectWithValue({ message: "group id is required" });
      const token = getState().auth?.accessToken;
      return await deleteGroupApi(id, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "deleting group failed" },
      );
    }
  },
);

export const joinGroup = createAsyncThunk(
  "group/joinGroup",
  async (id, { getState, rejectWithValue }) => {
    try {
      if (!id) return rejectWithValue({ message: "group id is required" });
      const token = getState().auth?.accessToken;
      return await joinGroupApi(id, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "joining group failed" },
      );
    }
  },
);

export const leaveGroup = createAsyncThunk(
  "group/leaveGroup",
  async (id, { getState, rejectWithValue }) => {
    try {
      if (!id) return rejectWithValue({ message: "group id is required" });
      const token = getState().auth?.accessToken;
      return await leaveGroupApi(id, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "leaving group failed" },
      );
    }
  },
);

export const addMember = createAsyncThunk(
  "group/addMember",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const username = payload?.newMemberUsername?.trim();
      if (!id || !username) {
        return rejectWithValue({
          message: "group id and newMemberUsername are required",
        });
      }
      const token = getState().auth?.accessToken;
      return await addMemberApi(id, { newMemberUsername: username }, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "adding member failed" },
      );
    }
  },
);

export const removeMember = createAsyncThunk(
  "group/removeMember",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const memberId = payload?.memberId;
      if (!id || !memberId) {
        return rejectWithValue({
          message: "group id and memberId are required",
        });
      }
      const token = getState().auth?.accessToken;
      return await removeMemberApi(id, { memberId }, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "removing member failed" },
      );
    }
  },
);

export const addAdmin = createAsyncThunk(
  "group/addAdmin",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const username = payload?.newAdminUsername?.trim();
      if (!id || !username) {
        return rejectWithValue({
          message: "group id and newAdminUsername are required",
        });
      }
      const token = getState().auth?.accessToken;
      return await addGroupAdminApi(id, { newAdminUsername: username }, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "adding admin failed" },
      );
    }
  },
);

export const removeAdmin = createAsyncThunk(
  "group/removeAdmin",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const username = payload?.adminUsername?.trim();
      if (!id || !username) {
        return rejectWithValue({
          message: "group id and adminUsername are required",
        });
      }
      const token = getState().auth?.accessToken;
      return await removeGroupAdminApi(id, { adminUsername: username }, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "removing admin failed" },
      );
    }
  },
);

export const updatePermissions = createAsyncThunk(
  "group/updatePermissions",
  async ({ id, permissions }, { getState, rejectWithValue }) => {
    try {
      if (!id || !permissions || typeof permissions !== "object") {
        return rejectWithValue({
          message: "group id and permissions payload are required",
        });
      }
      const token = getState().auth?.accessToken;
      return await updateGroupPermissionsApi(id, { permissions }, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "updating permissions failed" },
      );
    }
  },
);
