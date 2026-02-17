const EMPTY_ARRAY = [];

export const selectStoryState = (state) => state.story;

export const selectStories = (state) => state.story?.stories || EMPTY_ARRAY;
export const selectUserStories = (state) =>
  state.story?.userStories || EMPTY_ARRAY;
export const selectCurrentStory = (state) => state.story?.currentStory || null;

export const selectStoriesStatus = (state) => state.story?.storiesStatus;
export const selectUserStoriesStatus = (state) => state.story?.userStoriesStatus;
export const selectCurrentStoryStatus = (state) =>
  state.story?.currentStoryStatus;
export const selectAddStoryStatus = (state) => state.story?.addStatus;
export const selectReactStoryStatus = (state) => state.story?.reactStatus;
export const selectViewStoryStatus = (state) => state.story?.viewStatus;
export const selectDeleteStoryStatus = (state) => state.story?.deleteStatus;

export const selectStoriesNextCursor = (state) => state.story?.nextCursor;
export const selectUserStoriesNextCursor = (state) => state.story?.userNextCursor;

export const selectStoryError = (state) => state.story?.error;
export const selectStoryLastMessage = (state) => state.story?.lastMessage;
export const selectStoryInitialized = (state) => state.story?.initialized;
