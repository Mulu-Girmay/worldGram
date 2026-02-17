export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthInitialized = (state) => state.auth.initialized;
export const selectAuthError = (state) => state.auth.error;
export const selectLoginStatus = (state) => state.auth.loginStatus;
export const selectRegisterStatus = (state) => state.auth.registerStatus;
export const selectUpdateProfileStatus = (state) =>
  state.auth.updateProfileStatus;
