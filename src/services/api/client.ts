import axios from "axios";
import { refreshApi } from "@/services/api/auth";
import { storage } from "@/utils/storage";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://8.137.101.41:8088",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if ((config as any).skipAuth) return config;
  const token = storage.get("token");
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const msg = error.response?.data?.msg || "";

    if (originalRequest?.skipAuth) {
      return Promise.reject(error);
    }

    if ((status === 401 || code === 401) && !originalRequest?._retry) {
      originalRequest._retry = true;
      const refreshToken = storage.get("refreshToken");
      if (!refreshToken) return Promise.reject(error);
      const result = await refreshApi(refreshToken);
      const nextToken = result?.data?.token && typeof result.data.token === "object"
        ? result.data.token.accessToken
        : result?.data?.accessToken || result?.data?.token;
      if (nextToken) {
        storage.set("token", nextToken);
        originalRequest.headers.Authorization = nextToken;
        return api(originalRequest);
      }
    }

    if (code === 400 && msg.includes("token过期")) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
