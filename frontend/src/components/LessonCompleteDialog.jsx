import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { ParticipantEditorRow } from "./ParticipantEditorRow";
import { completeLesson } from "../api/lessonsApi";

const formatDate = (utc) =>
  new Date(utc).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });

export function LessonCompleteDialog({ open, lesson, onClose }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!open || !lesson) return;
    setRows(
      (lesson.participants || []).map((p) => ({
        studentId: p.studentId,
        studentName: p.studentName,
        hourlyPrice: p.hourlyPrice,
        durationInHours: p.durationInHours,
      }))
    );
  }, [open, lesson?.lessonId]);

  const completeMutation = useMutation({
    mutationFn: ({ lessonId, participants }) => completeLesson(lessonId, participants),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessonsDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["readyToCompleteLessons"] });
      onClose();
    },
  });

  const canSubmit = useMemo(
    () =>
      rows.length > 0 &&
      rows.every((r) => r.hourlyPrice >= 0 && r.durationInHours > 0 && r.durationInHours <= 24),
    [rows]
  );

  if (!lesson) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>סיום שיעור</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
        <Typography variant="subtitle1" sx={{ fontSize: "1.125rem", fontWeight: 800 }}>
          {(lesson.participants || []).map((p) => p.studentName).join(" · ") || "—"}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: "1.0625rem", lineHeight: 1.55 }}>
          {formatDate(lesson.startTime)} | משך צפוי: {lesson.expectedDurationInHours} שעות
        </Typography>
        {lesson.subject ? (
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: "1.0625rem", lineHeight: 1.55 }}>
            נושא: {lesson.subject}
          </Typography>
        ) : null}

        {rows.map((row, idx) => (
          <ParticipantEditorRow
            key={row.studentId}
            row={row}
            onChange={(updated) => setRows((prev) => prev.map((x, i) => (i === idx ? updated : x)))}
          />
        ))}

        {completeMutation.error ? (
          <Typography color="error" variant="body2">
            {completeMutation.error.message}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ביטול</Button>
        <Button
          variant="contained"
          disabled={!canSubmit || completeMutation.isPending}
          onClick={() =>
            completeMutation.mutate({
              lessonId: lesson.lessonId,
              participants: rows.map((row) => ({
                studentId: row.studentId,
                hourlyPrice: row.hourlyPrice,
                durationInHours: row.durationInHours,
              })),
            })
          }
        >
          סמן כבוצע
        </Button>
      </DialogActions>
    </Dialog>
  );
}
