import api from "./api";

const authHeaders = (token) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const listRegisteredUsersApi = async (params = {}, token) => {
  const { data } = await api.get("/users", {
    headers: authHeaders(token),
    params,
  });
  return data;
};

export const listContactsApi = async (params = {}, token) => {
  const { data } = await api.get("/contacts", {
    headers: authHeaders(token),
    params,
  });
  return data;
};

export const addContactApi = async (payload, token) => {
  const { data } = await api.post("/contacts", payload, {
    headers: authHeaders(token),
  });
  return data;
};

export const removeContactApi = async (contactId, token) => {
  const { data } = await api.delete(`/contacts/${contactId}`, {
    headers: authHeaders(token),
  });
  return data;
};

export const updateContactApi = async (contactId, payload, token) => {
  const { data } = await api.patch(`/contacts/${contactId}`, payload, {
    headers: authHeaders(token),
  });
  return data;
};
