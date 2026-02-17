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
