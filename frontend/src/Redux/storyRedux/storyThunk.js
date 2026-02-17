import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  addStoryApi,
  deleteStoryApi,
  getStoryByIdApi,
  listStoriesApi,
  listUserStoriesApi,
  reactStoryApi,
  viewStoryApi,
} from "../../api/storyApi";

export const addStory = createAsyncThunk(
  "story/addStory",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await addStoryApi(payload, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "failed to post story" },
      );
    }
  },
);

export const reactStory = createAsyncThunk(
  "story/reactStory",
  async ({ storyId, emoji }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await reactStoryApi(storyId, { emoji }, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "failed to react story" },
      );
    }
  },
);

export const viewStory = createAsyncThunk(
  "story/viewStory",
  async (storyId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      const res = await viewStoryApi(storyId, token);
      return { ...res, storyId };
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "failed to view story" },
      );
    }
  },
);

export const getStoryById = createAsyncThunk(
  "story/getStoryById",
  async (storyId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await getStoryByIdApi(storyId, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "failed to fetch story" },
      );
    }
  },
);

export const listStories = createAsyncThunk(
  "story/listStories",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await listStoriesApi(params, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "failed to list stories" },
      );
    }
  },
);

export const listUserStories = createAsyncThunk(
  "story/listUserStories",
  async ({ userId, params = {} }, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await listUserStoriesApi(userId, params, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "failed to list user stories" },
      );
    }
  },
);

export const deleteStory = createAsyncThunk(
  "story/deleteStory",
  async (storyId, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth?.accessToken;
      return await deleteStoryApi(storyId, token);
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "failed to delete story" },
      );
    }
  },
);
