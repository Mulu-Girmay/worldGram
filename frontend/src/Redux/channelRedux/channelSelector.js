import { createSelector } from "@reduxjs/toolkit";

const EMPTY_ARRAY = [];

export const selectChannelState = (state) => state.channel;

export const selectChannels = createSelector(
  selectChannelState,
  (s) => s?.channel || EMPTY_ARRAY,
);

export const selectChannelById = (state, id) =>
  selectChannels(state).find((c) => c._id === id);

export const selectChannelStatus = (state) => state.channel.channelStatus;
export const selectNextCursor = (state) => state.channel.nextCursor;
export const selectChannelInitialized = (state) => state.channel.initialized;
export const selectChannelError = (state) => state.channel.error;

export const selectMyChannels = createSelector(
  selectChannelState,
  (s) => s?.myChannels || EMPTY_ARRAY,
);
export const selectMyChannelsStatus = (state) => state.channel.myChannelStatus;
export const selectMyNextCursor = (state) => state.channel.myNextCursor;

export const selectCurrentChannel = (state) => state.channel.currentChannel;
export const selectFindStatus = (state) => state.channel.findStatus;

export const selectSubscribeStatus = (state) => state.channel.subscribeStatus;
export const selectUnsubscribeStatus = (state) =>
  state.channel.unsubscribeStatus;

export const selectCreateStatus = (state) => state.channel.createStatus;
export const selectUpdateStatus = (state) => state.channel.updateStatus;
export const selectDeleteStatus = (state) => state.channel.deleteStatus;
export const selectAdminStatus = (state) => state.channel.adminStatus;
export const selectAddAdminStatus = (state) => state.channel.addAdminStatus;
export const selectRemoveAdminStatus = (state) =>
  state.channel.removeAdminStatus;

export const selectLastMessage = (state) => state.channel.lastMessage;
export const selectUnreadCountByChannel = (state) =>
  state.channel.unreadCountByChannel || {};
export const selectUnreadStatus = (state) => state.channel.unreadStatus;
export const selectUnreadCountForChannel = (state, id) =>
  state.channel.unreadCountByChannel?.[id] || 0;
