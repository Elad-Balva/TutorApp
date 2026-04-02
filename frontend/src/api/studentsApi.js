import { axiosClient } from "./axiosClient";

export const getStudentDebt = async (studentId) => {
  const response = await axiosClient.get(`/api/students/${studentId}/debt`);
  return response.data;
};

export const getStudentOptions = async (search) => {
  const params = {};
  if (search && search.trim()) params.search = search.trim();
  const response = await axiosClient.get("/api/students/options", { params });
  return response.data;
};

export const createStudent = async ({ name, phoneNumber, baseHourlyPrice }) => {
  const response = await axiosClient.post("/api/students", {
    name,
    phoneNumber,
    baseHourlyPrice,
  });
  return response.data;
};
