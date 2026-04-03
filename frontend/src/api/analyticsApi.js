import { axiosClient } from "./axiosClient";

export const getAnalytics = async (period = "month") => {
  const response = await axiosClient.get("/api/analytics", { params: { period } });
  return response.data;
};
