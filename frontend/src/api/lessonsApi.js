import { axiosClient } from "./axiosClient";

export const completeLesson = async (lessonId, participants) => {
  await axiosClient.post(`/api/lessons/${lessonId}/complete`, { participants });
};

export const getLessonsDashboard = async () => {
  const response = await axiosClient.get("/api/lessons/dashboard");
  return response.data;
};

export const getReadyToCompleteLessons = async () => {
  const response = await axiosClient.get("/api/lessons/ready-to-complete");
  return response.data;
};

export const createLesson = async ({
  startTime,
  subject,
  expectedDurationInHours,
  studentIds,
  isInPerson,
}) => {
  const response = await axiosClient.post("/api/lessons", {
    startTime,
    subject,
    expectedDurationInHours,
    studentIds,
    isInPerson,
  });
  return response.data;
};

export const updateLesson = async (lessonId, { startTime, subject, expectedDurationInHours, studentIds, isInPerson }) => {
  await axiosClient.put(`/api/lessons/${lessonId}`, {
    startTime,
    subject,
    expectedDurationInHours,
    studentIds,
    isInPerson,
  });
};

export const cancelLesson = async (lessonId) => {
  await axiosClient.post(`/api/lessons/${lessonId}/cancel`);
};

export const markLessonParticipantPaid = async (lessonId, studentId, { paymentMethod, notes }) => {
  await axiosClient.post(`/api/lessons/${lessonId}/participants/${studentId}/mark-paid`, {
    paymentMethod,
    notes: notes?.trim() || null,
  });
};
