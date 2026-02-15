import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import channelReducer from "../channelRedux/channelSlice";
import postReducer from "../postRedux/postSlice";
import contactReducer from "../contactRedux/contactSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    channel: channelReducer,
    post: postReducer,
    contact: contactReducer,
  },
});

// Expose store to window for debugging in development
if (import.meta.env.MODE !== "production") {
  window.__STORE__ = store;
}
