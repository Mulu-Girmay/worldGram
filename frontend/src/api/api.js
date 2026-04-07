import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15000,
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const isRefreshCall = String(originalRequest?.url || "").includes(
      "/refresh",
    );

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isRefreshCall
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = api.post("/refresh").finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default api;
