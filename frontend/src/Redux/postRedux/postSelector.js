import { createSelector } from "@reduxjs/toolkit";

const EMPTY_ARRAY = [];

export const selectPostState = (state) => state.post;

export const selectPosts = createSelector(
  selectPostState,
  (s) => s?.posts || EMPTY_ARRAY,
);

export const selectPostById = (state, id) =>
  selectPosts(state).find((p) => p._id === id);

export const selectPostsStatus = (state) => state.post.postsStatus;
export const selectPostsNextCursor = (state) => state.post.nextCursor;
export const selectCurrentPost = (state) => state.post.currentPost;

export const selectCreateStatus = (state) => state.post.createStatus;
export const selectEditStatus = (state) => state.post.editStatus;
export const selectReactStatus = (state) => state.post.reactStatus;
export const selectViewStatus = (state) => state.post.viewStatus;
export const selectForwardStatus = (state) => state.post.forwardStatus;
export const selectDeleteStatus = (state) => state.post.deleteStatus;
export const selectPinStatus = (state) => state.post.pinStatus;

export const selectPostError = (state) => state.post.error;
export const selectChannelPostSettings = (state) =>
  state.post.channelPostSettings || {};
