import { createSlice } from "@reduxjs/toolkit";
import {
  addStory,
  deleteStory,
  getStoryById,
  listHighlights,
  listStories,
  listUserStories,
  reactStory,
  updateStory,
  viewStory,
} from "./storyThunk";

const initialState = {
  stories: [],
  userStories: [],
  highlights: [],
  currentStory: null,
  error: null,
  lastMessage: null,
  initialized: false,
  nextCursor: null,
  userNextCursor: null,
  storiesStatus: "idle",
  userStoriesStatus: "idle",
  highlightsStatus: "idle",
  currentStoryStatus: "idle",
  addStatus: "idle",
  reactStatus: "idle",
  viewStatus: "idle",
  deleteStatus: "idle",
  updateStatus: "idle",
};

const storySlice = createSlice({
  name: "story",
  initialState,
  reducers: {
    clearStoryError(state) {
      state.error = null;
    },
    setCurrentStory(state, action) {
      state.currentStory = action.payload || null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listStories.pending, (state) => {
        state.storiesStatus = "loading";
        state.error = null;
      })
      .addCase(listStories.fulfilled, (state, action) => {
        state.storiesStatus = "succeeded";
        const items = Array.isArray(action.payload?.items)
          ? action.payload.items
          : [];
        if (action.meta?.arg?.cursor) {
          state.stories = [...(state.stories || []), ...items];
        } else {
          state.stories = items;
        }
        state.nextCursor = action.payload?.nextCursor || null;
        state.initialized = true;
      })
      .addCase(listStories.rejected, (state, action) => {
        state.storiesStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "failed to list stories";
        state.initialized = true;
      })
      .addCase(listUserStories.pending, (state) => {
        state.userStoriesStatus = "loading";
        state.error = null;
      })
      .addCase(listUserStories.fulfilled, (state, action) => {
        state.userStoriesStatus = "succeeded";
        const items = Array.isArray(action.payload?.items)
          ? action.payload.items
          : [];
        if (action.meta?.arg?.params?.cursor) {
          state.userStories = [...(state.userStories || []), ...items];
        } else {
          state.userStories = items;
        }
        state.userNextCursor = action.payload?.nextCursor || null;
      })
      .addCase(listUserStories.rejected, (state, action) => {
        state.userStoriesStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "failed to list user stories";
      })
      .addCase(listHighlights.pending, (state) => {
        state.highlightsStatus = "loading";
        state.error = null;
      })
      .addCase(listHighlights.fulfilled, (state, action) => {
        state.highlightsStatus = "succeeded";
        state.highlights = Array.isArray(action.payload?.items)
          ? action.payload.items
          : [];
      })
      .addCase(listHighlights.rejected, (state, action) => {
        state.highlightsStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "failed to list highlights";
      })
      .addCase(getStoryById.pending, (state) => {
        state.currentStoryStatus = "loading";
        state.error = null;
      })
      .addCase(getStoryById.fulfilled, (state, action) => {
        state.currentStoryStatus = "succeeded";
        state.currentStory = action.payload || null;
      })
      .addCase(getStoryById.rejected, (state, action) => {
        state.currentStoryStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "failed to fetch story";
      })
      .addCase(addStory.pending, (state) => {
        state.addStatus = "loading";
        state.error = null;
      })
      .addCase(addStory.fulfilled, (state, action) => {
        state.addStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
        const story = action.payload?.story;
        if (story?._id) {
          state.userStories = [story, ...(state.userStories || [])];
          state.stories = [story, ...(state.stories || [])];
        }
      })
      .addCase(addStory.rejected, (state, action) => {
        state.addStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "failed to add story";
      })
      .addCase(reactStory.pending, (state) => {
        state.reactStatus = "loading";
        state.error = null;
      })
      .addCase(reactStory.fulfilled, (state, action) => {
        state.reactStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
      })
      .addCase(reactStory.rejected, (state, action) => {
        state.reactStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "failed to react story";
      })
      .addCase(viewStory.pending, (state) => {
        state.viewStatus = "loading";
        state.error = null;
      })
      .addCase(viewStory.fulfilled, (state, action) => {
        state.viewStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
      })
      .addCase(viewStory.rejected, (state, action) => {
        state.viewStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "failed to mark story view";
      })
      .addCase(deleteStory.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deleteStory.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
        const id = action.meta?.arg;
        if (id) {
          state.stories = (state.stories || []).filter((s) => s._id !== id);
          state.userStories = (state.userStories || []).filter(
            (s) => s._id !== id,
          );
          if (state.currentStory?._id === id) state.currentStory = null;
        }
      })
      .addCase(deleteStory.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "failed to delete story";
      })
      .addCase(updateStory.pending, (state) => {
        state.updateStatus = "loading";
        state.error = null;
      })
      .addCase(updateStory.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
        const updated = action.payload?.story;
        if (!updated?._id) return;
        state.stories = (state.stories || []).map((story) =>
          story._id === updated._id ? updated : story,
        );
        state.userStories = (state.userStories || []).map((story) =>
          story._id === updated._id ? updated : story,
        );
        state.highlights = (state.highlights || []).map((story) =>
          story._id === updated._id ? updated : story,
        );
        if (state.currentStory?._id === updated._id) {
          state.currentStory = updated;
        }
      })
      .addCase(updateStory.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "failed to update story";
      });
  },
});

export const { clearStoryError, setCurrentStory } = storySlice.actions;
export default storySlice.reducer;
