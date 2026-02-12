import { createSlice } from "@reduxjs/toolkit";
import {
  listChannel,
  myChannel,
  findChannel,
  subscribeChannel,
  unsubscribeChannel,
  createChannel,
  updateChannel,
  deleteChannel,
  addAdmin,
  removeAdmin,
} from "./channelThunk";
const initialState = {
  channel: [],
  status: "idle",
  accessToken: null,
  error: null,
  channelStatus: "idle",
  myChannelStatus: "idle",
  findStatus: "idle",
  subscribeStatus: "idle",
  unsubscribeStatus: "idle",
  createStatus: "idle",
  updateStatus: "idle",
  deleteStatus: "idle",
  adminStatus: "idle",
  initialized: false,
  nextCursor: null,
  myChannels: [],
  myNextCursor: null,
  currentChannel: null,
  lastMessage: null,
};
const channelSlice = createSlice({
  name: "channel",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    setAccessToken(state, action) {
      state.accessToken = action.payload;
    },
    setCurrentChannel(state, action) {
      state.currentChannel = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listChannel.pending, (state) => {
        state.channelStatus = "loading";
        state.error = null;
      })
      .addCase(listChannel.fulfilled, (state, action) => {
        state.channelStatus = "succeeded";

        const payloadData = action.payload?.data;

        const items =
          payloadData?.items || (Array.isArray(payloadData) ? payloadData : []);

        if (action.meta?.arg && action.meta.arg.cursor) {
          state.channel = [...(state.channel || []), ...items];
        } else {
          state.channel = items;
        }

        state.nextCursor = payloadData?.nextCursor || null;
        state.initialized = true;
      })
      .addCase(listChannel.rejected, (state, action) => {
        state.channelStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "fetching failed";
        state.initialized = true;
      })

      // myChannel (user-owned/admin channels)
      .addCase(myChannel.pending, (state) => {
        state.myChannelStatus = "loading";
        state.error = null;
      })
      .addCase(myChannel.fulfilled, (state, action) => {
        state.myChannelStatus = "succeeded";
        const items =
          action.payload?.items ||
          (Array.isArray(action.payload) ? action.payload : []);
        if (action.meta?.arg && action.meta.arg.cursor) {
          state.myChannels = [...(state.myChannels || []), ...items];
        } else {
          state.myChannels = items;
        }
        state.myNextCursor = action.payload?.nextCursor || null;
      })
      .addCase(myChannel.rejected, (state, action) => {
        state.myChannelStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "fetching failed";
      })

      // findChannel (fetch single channel)
      .addCase(findChannel.pending, (state) => {
        state.findStatus = "loading";
        state.error = null;
      })
      .addCase(findChannel.fulfilled, (state, action) => {
        state.findStatus = "succeeded";
        state.currentChannel = action.payload || null;
      })
      .addCase(findChannel.rejected, (state, action) => {
        state.findStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "fetching failed";
      })

      // subscribe / unsubscribe (no channel object returned by backend, store message/status)
      .addCase(subscribeChannel.pending, (state) => {
        state.subscribeStatus = "loading";
        state.error = null;
      })
      .addCase(subscribeChannel.fulfilled, (state, action) => {
        state.subscribeStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
      })
      .addCase(subscribeChannel.rejected, (state, action) => {
        state.subscribeStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "subscribe failed";
      })

      .addCase(unsubscribeChannel.pending, (state) => {
        state.unsubscribeStatus = "loading";
        state.error = null;
      })
      .addCase(unsubscribeChannel.fulfilled, (state, action) => {
        state.unsubscribeStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
      })
      .addCase(unsubscribeChannel.rejected, (state, action) => {
        state.unsubscribeStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "unsubscribe failed";
      })

      // createChannel
      .addCase(createChannel.pending, (state) => {
        state.createStatus = "loading";
        state.error = null;
      })
      .addCase(createChannel.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
      })
      .addCase(createChannel.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "create failed";
      })

      // updateChannel
      .addCase(updateChannel.pending, (state) => {
        state.updateStatus = "loading";
        state.error = null;
      })
      .addCase(updateChannel.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
        if (action.payload?.updatedChannel) {
          // reflect update in currentChannel if it's the same
          if (
            state.currentChannel &&
            state.currentChannel._id === action.payload.updatedChannel._id
          ) {
            state.currentChannel = action.payload.updatedChannel;
          }
          // also update in channel list
          if (state.channel) {
            state.channel = state.channel.map((c) =>
              c._id === action.payload.updatedChannel._id
                ? action.payload.updatedChannel
                : c,
            );
          }
          if (state.myChannels) {
            state.myChannels = state.myChannels.map((c) =>
              c._id === action.payload.updatedChannel._id
                ? action.payload.updatedChannel
                : c,
            );
          }
        }
      })
      .addCase(updateChannel.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "update failed";
      })

      // deleteChannel
      .addCase(deleteChannel.pending, (state) => {
        state.deleteStatus = "loading";
        state.error = null;
      })
      .addCase(deleteChannel.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
        // remove from lists if id provided in meta arg
        const id = action.meta?.arg;
        if (id) {
          if (state.channel)
            state.channel = state.channel.filter((c) => c._id !== id);
          if (state.myChannels)
            state.myChannels = state.myChannels.filter((c) => c._id !== id);
          if (state.currentChannel && state.currentChannel._id === id)
            state.currentChannel = null;
        }
      })
      .addCase(deleteChannel.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "delete failed";
      })

      // addAdmin / removeAdmin
      .addCase(addAdmin.pending, (state) => {
        state.adminStatus = "loading";
        state.error = null;
      })
      .addCase(addAdmin.fulfilled, (state, action) => {
        state.adminStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
      })
      .addCase(addAdmin.rejected, (state, action) => {
        state.adminStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "admin action failed";
      })

      .addCase(removeAdmin.pending, (state) => {
        state.adminStatus = "loading";
        state.error = null;
      })
      .addCase(removeAdmin.fulfilled, (state, action) => {
        state.adminStatus = "succeeded";
        state.lastMessage = action.payload?.message || null;
      })
      .addCase(removeAdmin.rejected, (state, action) => {
        state.adminStatus = "failed";
        state.error =
          action.payload?.err ||
          action.payload?.error ||
          action.error?.message ||
          "admin action failed";
      });
  },
});

export const { clearAuthError, setAccessToken, setCurrentChannel } =
  channelSlice.actions;
export default channelSlice.reducer;
