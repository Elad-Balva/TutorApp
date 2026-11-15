import { useQuery } from "@tanstack/react-query";
import { getStudentDebt } from "../api/studentsApi";

export const useStudentDebt = (studentId) =>
  useQuery({
    queryKey: ["studentDebt", studentId],
    queryFn: () => getStudentDebt(studentId),
    enabled: Boolean(studentId),
  });
