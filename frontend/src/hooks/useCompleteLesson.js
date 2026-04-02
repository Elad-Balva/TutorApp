import { useMutation } from "@tanstack/react-query";
import { completeLesson } from "../api/lessonsApi";

export const useCompleteLesson = () =>
  useMutation({
    mutationFn: ({ lessonId, participants }) => completeLesson(lessonId, participants),
  });
