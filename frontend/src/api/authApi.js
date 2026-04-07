import api from "./api";

export const registerApi = async (payload) => {
  const { data } = await api.post("/register", payload);
  return data;
};
export const loginApi = async (payload) => {
  const { data } = await api.post("/login", payload);
  return data;
};
export const refreshApi = async () => {
  const { data } = await api.post("/refresh");
  return data;
};
export const logoutApi = async () => {
  const { data } = await api.post("/logout");
  return data;
};
export const meApi = async (token) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const { data } = await api.get("/me", { headers });
  return data;
};

export const updateMeApi = async (payload) => {
  const { data } = await api.patch("/me", payload);
  return data;
};

export const updatePrivacyApi = async (payload) => {
  const { data } = await api.patch("/me/privacy", payload);
  return data;
};

export const blockUserApi = async (userId) => {
  const { data } = await api.post("/users/block", { userId });
  return data;
};

export const unblockUserApi = async (userId) => {
  const { data } = await api.post("/users/unblock", { userId });
  return data;
};
