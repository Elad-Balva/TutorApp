import { useMemo, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { ParticipantEditorRow } from "../components/ParticipantEditorRow";
import { useCompleteLesson } from "../hooks/useCompleteLesson";

export function LessonCompletionPage({ lessonId, initialParticipants }) {
  const [rows, setRows] = useState(initialParticipants);
  const completeMutation = useCompleteLesson();

  const canSubmit = useMemo(
    () => rows.every((r) => r.hourlyPrice >= 0 && r.durationInHours > 0 && r.durationInHours <= 24),
    [rows]
  );

  const onSubmit = () => {
    completeMutation.mutate({
      lessonId,
      participants: rows.map((row) => ({
        studentId: row.studentId,
        hourlyPrice: row.hourlyPrice,
        durationInHours: row.durationInHours,
      })),
    });
  };

  return (
    <Box sx={{ p: 2, display: "grid", gap: 2 }}>
      <Typography variant="h6">Complete Lesson</Typography>

      {rows.map((row, idx) => (
        <ParticipantEditorRow
          key={row.studentId}
          row={row}
          onChange={(updated) =>
            setRows((prev) => prev.map((x, i) => (i === idx ? updated : x)))
          }
        />
      ))}

      <Button
        variant="contained"
        size="large"
        sx={{ minHeight: 52 }}
        disabled={!canSubmit || completeMutation.isPending}
        onClick={onSubmit}
      >
        Mark as Completed
      </Button>
    </Box>
  );
}
