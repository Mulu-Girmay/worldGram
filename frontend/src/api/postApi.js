import api from "./api";

export const addPostApi = async (channelId, formData, token) => {
  const { data } = await api.post(`/addPost/${channelId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const editPostApi = async (channelId, postId, formData, token) => {
  const { data } = await api.patch(
    `/editPost/${channelId}/${postId}`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return data;
};

export const reactToPostApi = async (channelId, postId, payload, token) => {
  const { data } = await api.post(
    `/reactToPost/${channelId}/${postId}`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return data;
};

export const addViewApi = async (channelId, postId, token) => {
  const { data } = await api.post(`/updateView/${channelId}/${postId}`, null, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

export const forwardPostApi = async (channelId, postId, destination, token) => {
  const { data } = await api.post(
    `/forwardPost/${channelId}/${postId}`,
    { destination },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return data;
};

export const addCommentApi = async (channelId, postId, payload, token) => {
  const { data } = await api.post(
    `/channels/${channelId}/posts/${postId}/comment`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return data;
};

export const replyToCommentApi = async (
  channelId,
  postId,
  commentId,
  payload,
  token,
) => {
  const { data } = await api.post(
    `/channels/${channelId}/posts/${postId}/comment/${commentId}/reply`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return data;
};

export const getChannelPostsApi = async (channelId, params = {}, token) => {
  const { data } = await api.get(`/channels/${channelId}/posts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params,
  });
  return data;
};

export const getChannelPostByIdApi = async (channelId, postId, token) => {
  const { data } = await api.get(`/channels/${channelId}/posts/${postId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

export const deletePostApi = async (channelId, postId, token) => {
  const { data } = await api.delete(`/channels/${channelId}/posts/${postId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

export const pinPostApi = async (channelId, postId, token) => {
  const { data } = await api.post(
    `/channels/${channelId}/posts/${postId}/pin`,
    null,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return data;
};

export const unpinPostApi = async (channelId, postId, token) => {
  const { data } = await api.post(
    `/channels/${channelId}/posts/${postId}/unpin`,
    null,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return data;
};
