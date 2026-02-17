import api from "./api";

const authHeaders = (token) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const listGroupsApi = async (params = {}, token) => {
  const { data } = await api.get("/groups", {
    headers: authHeaders(token),
    params,
  });
  return data;
};

export const listMyGroupsApi = async (params = {}, token) => {
  const { data } = await api.get("/groups/me", {
    headers: authHeaders(token),
    params,
  });
  return data;
};

export const specificGroupApi = async (id, token) => {
  const { data } = await api.get(`/groups/${id}`, {
    headers: authHeaders(token),
  });
  return data;
};

export const listGroupMembersApi = async (id, token) => {
  const { data } = await api.get(`/groups/${id}/members`, {
    headers: authHeaders(token),
  });
  return data;
};

export const joinGroupApi = async (id, token) => {
  const { data } = await api.post(`/groups/${id}/join`, null, {
    headers: authHeaders(token),
  });
  return data;
};

export const leaveGroupApi = async (id, token) => {
  const { data } = await api.post(`/groups/${id}/leave`, null, {
    headers: authHeaders(token),
  });
  return data;
};

export const removeMemberApi = async (id, payload, token) => {
  const { data } = await api.post(`/groups/${id}/removeMember`, payload, {
    headers: authHeaders(token),
  });
  return data;
};

export const updateGroupPermissionsApi = async (id, payload, token) => {
  const { data } = await api.patch(`/groups/${id}/permissions`, payload, {
    headers: authHeaders(token),
  });
  return data;
};
export const updateMemberExceptionApi = async (id, payload, token) => {
  const { data } = await api.patch(`/groups/${id}/member-exception`, payload, {
    headers: authHeaders(token),
  });
  return data;
};
export const listTopicsApi = async (id, token) => {
  const { data } = await api.get(`/groups/${id}/topics`, {
    headers: authHeaders(token),
  });
  return data;
};
export const createTopicApi = async (id, payload, token) => {
  const { data } = await api.post(`/groups/${id}/topics`, payload, {
    headers: authHeaders(token),
  });
  return data;
};
export const updateTopicApi = async (id, topicId, payload, token) => {
  const { data } = await api.patch(`/groups/${id}/topics/${topicId}`, payload, {
    headers: authHeaders(token),
  });
  return data;
};
export const deleteTopicApi = async (id, topicId, token) => {
  const { data } = await api.delete(`/groups/${id}/topics/${topicId}`, {
    headers: authHeaders(token),
  });
  return data;
};
export const setGroupViewModeApi = async (id, payload, token) => {
  const { data } = await api.patch(`/groups/${id}/view-mode`, payload, {
    headers: authHeaders(token),
  });
  return data;
};
export const convertToBroadcastApi = async (id, token) => {
  const { data } = await api.post(`/groups/${id}/convert-broadcast`, null, {
    headers: authHeaders(token),
  });
  return data;
};
export const updateSlowModeApi = async (id, payload, token) => {
  const { data } = await api.patch(`/groups/${id}/slow-mode`, payload, {
    headers: authHeaders(token),
  });
  return data;
};
export const updateGroupAdminProfileApi = async (id, payload, token) => {
  const { data } = await api.patch(`/groups/${id}/admin-profile`, payload, {
    headers: authHeaders(token),
  });
  return data;
};
export const updateAutoOwnershipTransferApi = async (id, payload, token) => {
  const { data } = await api.patch(`/groups/${id}/auto-ownership-transfer`, payload, {
    headers: authHeaders(token),
  });
  return data;
};
export const getGroupRecentActionsApi = async (id, params = {}, token) => {
  const { data } = await api.get(`/groups/${id}/recent-actions`, {
    headers: authHeaders(token),
    params,
  });
  return data;
};
export const boostGroupApi = async (id, token) => {
  const { data } = await api.post(`/groups/${id}/boost`, null, {
    headers: authHeaders(token),
  });
  return data;
};
export const startGroupLiveStreamApi = async (id, token) => {
  const { data } = await api.post(`/groups/${id}/livestream/start`, null, {
    headers: authHeaders(token),
  });
  return data;
};
export const endGroupLiveStreamApi = async (id, token) => {
  const { data } = await api.post(`/groups/${id}/livestream/end`, null, {
    headers: authHeaders(token),
  });
  return data;
};
export const raiseGroupHandApi = async (id, token) => {
  const { data } = await api.post(`/groups/${id}/livestream/raise-hand`, null, {
    headers: authHeaders(token),
  });
  return data;
};
export const addGroupMiniAppApi = async (id, payload, token) => {
  const { data } = await api.post(`/groups/${id}/mini-app`, payload, {
    headers: authHeaders(token),
  });
  return data;
};
export const removeGroupMiniAppApi = async (id, appId, token) => {
  const { data } = await api.delete(`/groups/${id}/mini-app/${appId}`, {
    headers: authHeaders(token),
  });
  return data;
};

export const addGroupApi = async (payload, token) => {
  const { data } = await api.post("/addGroup", payload, {
    headers: authHeaders(token),
  });
  return data;
};

export const updateGroupApi = async (id, payload, token) => {
  const { data } = await api.patch(`/updateGroup/${id}`, payload, {
    headers: authHeaders(token),
  });
  return data;
};

export const deleteGroupApi = async (id, token) => {
  const { data } = await api.delete(`/deleteGroup/${id}`, {
    headers: authHeaders(token),
  });
  return data;
};

export const addMemberApi = async (id, payload, token) => {
  const { data } = await api.post(`/addMember/${id}`, payload, {
    headers: authHeaders(token),
  });
  return data;
};

export const addGroupAdminApi = async (id, payload, token) => {
  const { data } = await api.post(`/addGroupAdmin/${id}`, payload, {
    headers: authHeaders(token),
  });
  return data;
};

export const removeGroupAdminApi = async (id, payload, token) => {
  const { data } = await api.post(`/removeAdmin/${id}`, payload, {
    headers: authHeaders(token),
  });
  return data;
};
