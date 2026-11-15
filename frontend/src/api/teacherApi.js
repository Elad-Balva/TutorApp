import { axiosClient } from "./axiosClient";

export const getTeacherProfile = async () => {
  const response = await axiosClient.get("/api/teacher");
  return response.data;
};
