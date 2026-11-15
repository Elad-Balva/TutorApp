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

export const createStudent = async ({ name, phoneNumber, baseHourlyPrice, addressLine, locationNotes }) => {
  const response = await axiosClient.post("/api/students", {
    name,
    phoneNumber,
    baseHourlyPrice,
    addressLine: addressLine?.trim() || null,
    locationNotes: locationNotes?.trim() || null,
  });
  return response.data;
};

export const getStudents = async ({ search, page = 1, pageSize = 20 }) => {
  const params = { page, pageSize };
  if (search && search.trim()) params.search = search.trim();
  const response = await axiosClient.get("/api/students", { params });
  return response.data;
};

export const updateStudent = async (studentId, { name, phoneNumber, baseHourlyPrice, addressLine, locationNotes, isActive }) => {
  await axiosClient.put(`/api/students/${studentId}`, {
    name,
    phoneNumber,
    baseHourlyPrice,
    addressLine: addressLine?.trim() || null,
    locationNotes: locationNotes?.trim() || null,
    isActive,
  });
};
