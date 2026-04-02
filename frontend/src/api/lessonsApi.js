import { axiosClient } from "./axiosClient";

export const completeLesson = async (lessonId, participants) => {
  await axiosClient.post(`/api/lessons/${lessonId}/complete`, { participants });
};

export const getLessonsDashboard = async () => {
  const response = await axiosClient.get("/api/lessons/dashboard");
  return response.data;
};

export const createLesson = async ({ startTime, subject, studentIds }) => {
  const response = await axiosClient.post("/api/lessons", {
    startTime,
    subject,
    studentIds,
  });
  return response.data;
};
