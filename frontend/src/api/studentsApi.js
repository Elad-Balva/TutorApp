import { axiosClient } from "./axiosClient";

export const getStudentDebt = async (studentId) => {
  const response = await axiosClient.get(`/api/students/${studentId}/debt`);
  return response.data;
};

export const getStudentOptions = async () => {
  const response = await axiosClient.get("/api/students/options");
  return response.data;
};
