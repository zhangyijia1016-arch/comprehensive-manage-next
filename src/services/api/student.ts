import { api } from "@/services/api/client";

export async function getApplicationOverviewApi() {
  const response = await api.get("/student/getApplicationOverview");
  return response.data;
}

export async function verifiedScoreApi(academicYear: string) {
  const response = await api.get(`/student/verifiedScore/${academicYear}`);
  return response.data;
}
