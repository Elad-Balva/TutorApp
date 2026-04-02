import { axiosClient } from "./axiosClient";

export const completeLesson = async (lessonId, participants) => {
  await axiosClient.post(`/api/lessons/${lessonId}/complete`, { participants });
};
