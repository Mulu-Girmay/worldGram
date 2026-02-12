import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  addPostApi,
  editPostApi,
  reactToPostApi,
  addViewApi,
  forwardPostApi,
  getChannelPostsApi,
  getChannelPostByIdApi,
  deletePostApi,
  pinPostApi,
  unpinPostApi,
} from "../../api/postApi";

export const addPost = createAsyncThunk(
  "addPost",
  async ({ channelId, formData }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      return await addPostApi(channelId, formData, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "adding post failed" },
      );
    }
  },
);

export const editPost = createAsyncThunk(
  "editPost",
  async ({ channelId, postId, formData }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      return await editPostApi(channelId, postId, formData, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "editing post failed" },
      );
    }
  },
);

export const reactToPost = createAsyncThunk(
  "reactToPost",
  async ({ channelId, postId, emoji }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      return await reactToPostApi(channelId, postId, { emoji }, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "reacting failed" },
      );
    }
  },
);

export const addView = createAsyncThunk(
  "post/addView",
  async ({ channelId, postId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      return await addViewApi(channelId, postId, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "add view failed" },
      );
    }
  },
);

export const forwardPost = createAsyncThunk(
  "forwardPost",
  async ({ channelId, postId, destination }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      return await forwardPostApi(channelId, postId, destination, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "forward failed" },
      );
    }
  },
);

export const getChannelPosts = createAsyncThunk(
  "getChannelPosts",
  async ({ channelId, params = {} }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      return await getChannelPostsApi(channelId, token, params);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetch posts failed" },
      );
    }
  },
);

export const getChannelPostById = createAsyncThunk(
  "getChannelPostById",
  async ({ channelId, postId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      return await getChannelPostByIdApi(channelId, postId, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetch post failed" },
      );
    }
  },
);

export const deletePost = createAsyncThunk(
  "deletePost",
  async ({ channelId, postId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      return await deletePostApi(channelId, postId, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "delete post failed" },
      );
    }
  },
);

export const pinPost = createAsyncThunk(
  "pinPost",
  async ({ channelId, postId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      return await pinPostApi(channelId, postId, token);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "pin failed" });
    }
  },
);

export const unpinPost = createAsyncThunk(
  "unpinPost",
  async ({ channelId, postId }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.accessToken;
      return await unpinPostApi(channelId, postId, token);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "unpin failed" });
    }
  },
);
