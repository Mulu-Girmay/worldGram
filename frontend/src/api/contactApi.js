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
