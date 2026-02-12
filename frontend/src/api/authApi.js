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
  const { data } = await api.get("/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};
