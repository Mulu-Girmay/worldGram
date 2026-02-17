import api from "./api";

const authHeaders = (token, extra = {}) => ({
  ...extra,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const createChatApi = async (payload, token) => {
  const { data } = await api.post("/chats/create", payload, {
    headers: authHeaders(token),
  });
  return data;
};

export const createGroupChatApi = async (groupId, payload, token) => {
  const { data } = await api.post(`/chats/create/${groupId}`, payload, {
    headers: authHeaders(token),
  });
  return data;
};

export const listChatsApi = async (params = {}, token) => {
  const { data } = await api.get("/chats", {
    headers: authHeaders(token),
    params,
  });
  return data;
};

export const getChatByIdApi = async (chatId, token) => {
  const { data } = await api.get(`/chats/${chatId}`, {
    headers: authHeaders(token),
  });
  return data;
};

export const getMessagesApi = async (chatId, token, params = {}) => {
  const { data } = await api.get(`/chats/${chatId}/messages`, {
    headers: authHeaders(token),
    params,
  });
  return data;
};

export const getMessagesPagedApi = async (chatId, params = {}, token) => {
  const { data } = await api.get(`/chats/${chatId}/messages/paged`, {
    headers: authHeaders(token),
    params,
  });
  return data;
};

export const sendMessageApi = async (chatId, payload, token) => {
  const { data } = await api.post(`/chats/${chatId}/message`, payload, {
    headers: authHeaders(token),
  });
  return data;
};

export const sendMediaMessageApi = async (chatId, formData, token) => {
  const { data } = await api.post(`/chats/${chatId}/message/media`, formData, {
    headers: authHeaders(token, { "Content-Type": "multipart/form-data" }),
  });
  return data;
};

export const editMessageApi = async (chatId, messageId, payload, token) => {
  const { data } = await api.patch(
    `/chats/${chatId}/message/${messageId}`,
    payload,
    {
      headers: authHeaders(token),
    },
  );
  return data;
};

export const deleteMessageApi = async (chatId, messageId, token) => {
  const { data } = await api.delete(`/chats/${chatId}/message/${messageId}`, {
    headers: authHeaders(token),
  });
  return data;
};

export const markChatReadApi = async (chatId, token) => {
  const { data } = await api.post(`/chats/${chatId}/read`, null, {
    headers: authHeaders(token),
  });
  return data;
};

export const getUnreadCountApi = async (chatId, token) => {
  const { data } = await api.get(`/chats/${chatId}/unread-count`, {
    headers: authHeaders(token),
  });
  return data;
};

export const updateChatSettingsApi = async (chatId, payload, token) => {
  const { data } = await api.patch(`/chats/${chatId}/settings`, payload, {
    headers: authHeaders(token),
  });
  return data;
};

export const reactToMessageApi = async (chatId, messageId, payload, token) => {
  const { data } = await api.post(
    `/chats/reactMessage/${chatId}/${messageId}`,
    payload,
    {
      headers: authHeaders(token),
    },
  );
  return data;
};

export const addViewToMessageApi = async (chatId, messageId, token) => {
  const { data } = await api.post(`/chats/${chatId}/messages/${messageId}/view`, null, {
    headers: authHeaders(token),
  });
  return data;
};

export const forwardMessageApi = async (
  chatId,
  messageId,
  destination,
  token,
) => {
  const { data } = await api.post(
    `/chats/forwardMessage/${chatId}/${messageId}`,
    destination,
    {
      headers: authHeaders(token),
    },
  );
  return data;
};
