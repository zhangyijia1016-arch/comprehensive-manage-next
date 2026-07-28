import { api } from "@/services/api/client";

export type LoginResponse = {
  code: number;
  msg?: string;
  data?: {
    identity?: string;
    user?: {
      userName?: string;
      userNumber?: string;
      userClass?: string;
    };
    token?: string | { accessToken?: string; refreshToken?: string };
    accessToken?: string;
    refreshToken?: string;
  };
};

export async function loginApi(userNumber: string, password: string) {
  const { data } = await api.post<LoginResponse>("/user/login", { userNumber, password }, { skipAuth: true } as any);
  return data;
}

export async function logoutApi(token: string) {
  const { data } = await api.post("/user/logout", {}, { headers: { Authorization: token } });
  return data;
}

export async function refreshApi(refreshToken: string) {
  const { data } = await api.post("/user/refresh", { refreshToken }, { skipAuth: true } as any);
  return data;
}
