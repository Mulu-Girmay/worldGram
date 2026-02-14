import { createSlice } from "@reduxjs/toolkit";
import {
  addPost,
  editPost,
  reactToPost,
  addView,
  addCommentToPost,
  replyToPostComment,
  forwardPost,
  getChannelPosts,
  getChannelPostById,
  deletePost,
  pinPost,
  unpinPost,
} from "./postThunk";

const initialState = {
  posts: [],
  postsStatus: "idle",
  nextCursor: null,
  currentPost: null,
  createStatus: "idle",
  editStatus: "idle",
  reactStatus: "idle",
  viewStatus: "idle",
  commentStatus: "idle",
  replyStatus: "idle",
  forwardStatus: "idle",
  deleteStatus: "idle",
  pinStatus: "idle",
  error: null,
};

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    clearPostError(state) {
      state.error = null;
    },
    clearPosts(state) {
      state.posts = [];
      state.nextCursor = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getChannelPosts.pending, (state) => {
        state.postsStatus = "loading";
        state.error = null;
      })
      .addCase(getChannelPosts.fulfilled, (state, action) => {
        state.postsStatus = "succeeded";
        const items =
          action.payload?.items ||
          (Array.isArray(action.payload) ? action.payload : []);
        if (
          action.meta?.arg &&
          action.meta.arg.params &&
          action.meta.arg.params.cursor
        ) {
          state.posts = [...(state.posts || []), ...items];
        } else {
          state.posts = items;
        }
        state.nextCursor = action.payload?.nextCursor || null;
      })
      .addCase(getChannelPosts.rejected, (state, action) => {
        state.postsStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "Fetching posts failed";

        console.error(
          "getChannelPosts rejected:",
          action.payload || action.error,
        );
      })

      .addCase(getChannelPostById.pending, (state) => {
        state.postsStatus = "loading";
        state.error = null;
      })
      .addCase(getChannelPostById.fulfilled, (state, action) => {
        state.postsStatus = "succeeded";
        state.currentPost = action.payload || null;
      })
      .addCase(getChannelPostById.rejected, (state, action) => {
        state.postsStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "Fetching post failed";
        console.error(
          "getChannelPostById rejected:",
          action.payload || action.error,
        );
      })

      .addCase(addPost.pending, (state) => {
        state.createStatus = "loading";
        state.error = null;
      })
      .addCase(addPost.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.error = null;
      })
      .addCase(addPost.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "Create post failed";
        console.error("addPost rejected:", action.payload || action.error);
      })

      .addCase(editPost.pending, (state) => {
        state.editStatus = "loading";
        state.error = null;
      })
      .addCase(editPost.fulfilled, (state, action) => {
        state.editStatus = "succeeded";
        state.error = null;
      })
      .addCase(editPost.rejected, (state, action) => {
        state.editStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "Edit post failed";
        console.error("editPost rejected:", action.payload || action.error);
      })

      .addCase(reactToPost.pending, (state) => {
        state.reactStatus = "loading";
        state.error = null;
      })
      .addCase(reactToPost.fulfilled, (state, action) => {
        state.reactStatus = "succeeded";
        state.error = null;
      })
      .addCase(reactToPost.rejected, (state, action) => {
        state.reactStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "React failed";
        console.error("reactToPost rejected:", action.payload || action.error);
      })

      .addCase(addView.pending, (state) => {
        state.viewStatus = "loading";
        state.error = null;
      })
      .addCase(addView.fulfilled, (state, action) => {
        state.viewStatus = "succeeded";
        state.error = null;
      })
      .addCase(addView.rejected, (state, action) => {
        state.viewStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "Add view failed";
        console.error("addView rejected:", action.payload || action.error);
      })

      .addCase(addCommentToPost.pending, (state) => {
        state.commentStatus = "loading";
        state.error = null;
      })
      .addCase(addCommentToPost.fulfilled, (state) => {
        state.commentStatus = "succeeded";
        state.error = null;
      })
      .addCase(addCommentToPost.rejected, (state, action) => {
        state.commentStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Add comment failed";
        console.error(
          "addCommentToPost rejected:",
          action.payload || action.error,
        );
      })

      .addCase(replyToPostComment.pending, (state) => {
        state.replyStatus = "loading";
        state.error = null;
      })
      .addCase(replyToPostComment.fulfilled, (state) => {
        state.replyStatus = "succeeded";
        state.error = null;
      })
      .addCase(replyToPostComment.rejected, (state, action) => {
        state.replyStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.payload?.message ||
          action.error?.message ||
          "Reply failed";
        console.error(
          "replyToPostComment rejected:",
          action.payload || action.error,
        );
      })

      .addCase(forwardPost.pending, (state) => {
        state.forwardStatus = "loading";
        state.error = null;
      })
      .addCase(forwardPost.fulfilled, (state, action) => {
        state.forwardStatus = "succeeded";
        state.error = null;
      })
      .addCase(forwardPost.rejected, (state, action) => {
        state.forwardStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "Forward failed";
        console.error("forwardPost rejected:", action.payload || action.error);
      })

      .addCase(deletePost.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        const arg = action.meta?.arg || {};
        const channelId = arg.channelId;
        const postId = arg.postId;
        if (postId) {
          state.posts = (state.posts || []).filter((p) => p._id !== postId);
        }
        state.error = null;
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "Delete failed";
        console.error("deletePost rejected:", action.payload || action.error);
      })

      .addCase(pinPost.pending, (state) => {
        state.pinStatus = "loading";
        state.error = null;
      })
      .addCase(pinPost.fulfilled, (state, action) => {
        state.pinStatus = "succeeded";
        state.error = null;
      })
      .addCase(pinPost.rejected, (state, action) => {
        state.pinStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "Pin failed";
        console.error("pinPost rejected:", action.payload || action.error);
      })

      .addCase(unpinPost.pending, (state) => {
        state.pinStatus = "loading";
        state.error = null;
      })
      .addCase(unpinPost.fulfilled, (state, action) => {
        state.pinStatus = "succeeded";
        state.error = null;
      })
      .addCase(unpinPost.rejected, (state, action) => {
        state.pinStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "Unpin failed";
        console.error("unpinPost rejected:", action.payload || action.error);
      });
  },
});

export const { clearPostError, clearPosts } = postSlice.actions;
export default postSlice.reducer;
