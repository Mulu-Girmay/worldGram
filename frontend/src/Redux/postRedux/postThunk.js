import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  addPostApi,
  editPostApi,
  reactToPostApi,
  addViewApi,
  forwardPostApi,
  addCommentApi,
  replyToCommentApi,
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
      const state = getState();
      const token = state.auth?.accessToken;
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
      const state = getState();
      const token = state.auth?.accessToken;
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
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { channelId, postId, emoji } = payload || {};
      if (!channelId || !postId || !emoji) {
        return rejectWithValue({
          message: "channelId, postId and emoji are required",
        });
      }

      const state = getState();
      const token = state.auth?.accessToken;
      const response = await reactToPostApi(channelId, postId, { emoji }, token);
      return response?.data ?? response;
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
      const state = getState();
      const token = state.auth?.accessToken;
      return await addViewApi(channelId, postId, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "add view failed" },
      );
    }
  },
);

export const addCommentToPost = createAsyncThunk(
  "post/addCommentToPost",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { channelId, postId, text } = payload || {};
      if (!channelId || !postId || !text?.trim()) {
        return rejectWithValue({
          message: "channelId, postId and text are required",
        });
      }

      const state = getState();
      const token = state.auth?.accessToken;
      return await addCommentApi(
        channelId,
        postId,
        { text: text.trim() },
        token,
      );
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "adding comment failed" },
      );
    }
  },
);

export const replyToPostComment = createAsyncThunk(
  "post/replyToPostComment",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { channelId, postId, commentId, text } = payload || {};
      if (!channelId || !postId || !commentId || !text?.trim()) {
        return rejectWithValue({
          message: "channelId, postId, commentId and text are required",
        });
      }

      const state = getState();
      const token = state.auth?.accessToken;
      return await replyToCommentApi(
        channelId,
        postId,
        commentId,
        { text: text.trim() },
        token,
      );
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "replying to comment failed" },
      );
    }
  },
);

export const forwardPost = createAsyncThunk(
  "forwardPost",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { channelId, postId, destination, type, id } = payload || {};
      const target = destination || { type, id };

      if (!channelId || !postId || !target?.type || !target?.id) {
        return rejectWithValue({
          message: "channelId, postId and destination(type,id) are required",
        });
      }

      const state = getState();
      const token = state.auth?.accessToken;
      const response = await forwardPostApi(channelId, postId, target, token);
      return response?.data ?? response;
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
      const state = getState();
      const token = state.auth?.accessToken;
      return await getChannelPostsApi(channelId, params, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetch posts failed" },
      );
    }
  },
);

export const getChannelPostById = createAsyncThunk(
  "getChannelPostById",
  async ({ channelId, postId }, { rejectWithValue }) => {
    try {
      return await getChannelPostByIdApi(channelId, postId);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "fetch post failed" },
      );
    }
  },
);

export const deletePost = createAsyncThunk(
  "deletePost",
  async ({ channelId, postId }, { rejectWithValue }) => {
    try {
      return await deletePostApi(channelId, postId);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "delete post failed" },
      );
    }
  },
);

export const pinPost = createAsyncThunk(
  "pinPost",
  async ({ channelId, postId }, { rejectWithValue }) => {
    try {
      return await pinPostApi(channelId, postId);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "pin failed" });
    }
  },
);

export const unpinPost = createAsyncThunk(
  "unpinPost",
  async ({ channelId, postId }, { rejectWithValue }) => {
    try {
      return await unpinPostApi(channelId, postId);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "unpin failed" });
    }
  },
);
