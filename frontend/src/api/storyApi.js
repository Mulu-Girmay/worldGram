import api from "./api";

const authHeaders = (token) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const addStoryApi = async (formData, token) => {
  const { data } = await api.post("/addStory", formData, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};

export const reactStoryApi = async (storyId, payload, token) => {
  const { data } = await api.post(`/reactStory/${storyId}`, payload, {
    headers: authHeaders(token),
  });
  return data;
};

export const viewStoryApi = async (storyId, token) => {
  const { data } = await api.post(`/viewStory/${storyId}`, null, {
    headers: authHeaders(token),
  });
  return data;
};

export const getStoryByIdApi = async (storyId, token) => {
  const { data } = await api.get(`/stories/${storyId}`, {
    headers: authHeaders(token),
  });
  return data;
};

export const listStoriesApi = async (params = {}, token) => {
  const { data } = await api.get("/stories", {
    headers: authHeaders(token),
    params,
  });
  return data;
};

export const listUserStoriesApi = async (userId, params = {}, token) => {
  const { data } = await api.get(`/users/${userId}/stories`, {
    headers: authHeaders(token),
    params,
  });
  return data;
};

export const listHighlightsApi = async (userId, token) => {
  const { data } = await api.get(`/users/${userId}/highlights`, {
    headers: authHeaders(token),
  });
  return data;
};

export const updateStoryApi = async (storyId, payload, token) => {
  const { data } = await api.patch(`/stories/${storyId}`, payload, {
    headers: authHeaders(token),
  });
  return data;
};

export const deleteStoryApi = async (storyId, token) => {
  const { data } = await api.delete(`/stories/${storyId}`, {
    headers: authHeaders(token),
  });
  return data;
};
