import api from "./api";

const authHeaders = (token) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const listChannelApi = async (token, params = {}) => {
  const { data } = await api.get("/channels", {
    headers: authHeaders(token),
    params,
  });
  return data;
};
export const listMyChannelApi = async (token) => {
  const { data } = await api.get("/channels/me", {
    headers: authHeaders(token),
  });
  return data;
};
export const specificChannelApi = async (id, token) => {
  const { data } = await api.get(`/channels/${id}`, {
    headers: authHeaders(token),
  });
  return data;
};
export const channelUnreadCountApi = async (id, token) => {
  const { data } = await api.get(`/channels/${id}/unread-count`, {
    headers: authHeaders(token),
  });
  return data;
};
export const subscribeChannelApi = async (id, token) => {
  const { data } = await api.post(`/channels/${id}/subscribe`, null, {
    headers: authHeaders(token),
  });
  return data;
};
export const unsubscribeChannelApi = async (id, token) => {
  const { data } = await api.post(`/channels/${id}/unsubscribe`, null, {
    headers: authHeaders(token),
  });
  return data;
};
export const addChannelApi = async (payload, token) => {
  const { data } = await api.post(`/addChannel`, payload, {
    headers: authHeaders(token),
  });
  return data;
};
export const updateChannelApi = async (id, payload, token) => {
  const { data } = await api.patch(`/updateChannel/${id}`, payload, {
    headers: authHeaders(token),
  });
  return data;
};
export const deleteChannelApi = async (id, token) => {
  const { data } = await api.delete(`/deleteChannel/${id}`, {
    headers: authHeaders(token),
  });
  return data;
};
export const addAdminApi = async (id, payload, token) => {
  const { data } = await api.post(`/addAdmin/${id}`, payload, {
    headers: authHeaders(token),
  });
  return data;
};
export const removeAdminApi = async (id, payload, token) => {
  const { data } = await api.delete(`/removeAdmin/${id}`, {
    data: payload,
    headers: authHeaders(token),
  });
  return data;
};
