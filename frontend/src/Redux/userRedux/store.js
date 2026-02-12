import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import channelReducer from "../channelRedux/channelSlice";
import postReducer from "../postRedux/postSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    channel: channelReducer,
    post: postReducer,
  },
});

// Expose store to window for debugging in development
if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-undef
  window.__STORE__ = store;
}
