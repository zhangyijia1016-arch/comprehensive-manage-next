import { api } from "@/services/api/client";

export async function getUserReportApi() {
  const response = await api.get("/DeepSeek/getUserReport");
  return response.data;
}
