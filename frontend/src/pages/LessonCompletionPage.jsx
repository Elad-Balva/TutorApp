import { useEffect, useMemo, useState } from "react";
import { Autocomplete, Box, Button, Card, CardContent, CircularProgress, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ParticipantEditorRow } from "../components/ParticipantEditorRow";
import { completeLesson, getReadyToCompleteLessons } from "../api/lessonsApi";

export function LessonCompletionPage() {
  const queryClient = useQueryClient();
  const readyQuery = useQuery({
    queryKey: ["readyToCompleteLessons"],
    queryFn: getReadyToCompleteLessons,
  });

  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const selectedLesson = useMemo(() => {
    return (readyQuery.data || []).find((l) => l.lessonId === selectedLessonId) || null;
  }, [readyQuery.data, selectedLessonId]);

  const [rows, setRows] = useState([]);

  // When selected lesson changes, replace editor rows.
  useEffect(() => {
    if (!selectedLesson) return;
    setRows(
      selectedLesson.participants.map((p) => ({
        studentId: p.studentId,
        studentName: p.studentName,
        hourlyPrice: p.hourlyPrice,
        durationInHours: p.durationInHours,
      }))
    );
  }, [selectedLesson?.lessonId]);

  const completeMutation = useMutation({
    mutationFn: ({ lessonId, participants }) => completeLesson(lessonId, participants),
    onSuccess: () => {
      setRows([]);
      setSelectedLessonId(null);
      queryClient.invalidateQueries({ queryKey: ["lessonsDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["readyToCompleteLessons"] });
    },
  });

  const canSubmit = useMemo(
    () =>
      rows.length > 0 &&
      rows.every((r) => r.hourlyPrice >= 0 && r.durationInHours > 0 && r.durationInHours <= 24),
    [rows]
  );

  return (
    <Box sx={{ p: 2, pb: 10, display: "grid", gap: 2 }} dir="rtl">
      <Typography variant="h5" fontWeight={800}>
        סיום שיעור
      </Typography>

      {readyQuery.isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {readyQuery.error ? (
        <Typography color="error.main">{readyQuery.error.message}</Typography>
      ) : null}

      <Card variant="outlined">
        <CardContent sx={{ display: "grid", gap: 1 }}>
          <Typography variant="body2" fontWeight={700}>
            בחר שיעור להשלים
          </Typography>
          <Autocomplete
            options={readyQuery.data || []}
            value={selectedLesson}
            onChange={(_, value) => {
              setSelectedLessonId(value?.lessonId || null);
              setRows([]);
            }}
            getOptionLabel={(o) => `${formatDate(o.startTime)} — ${o.subject}`}
            isOptionEqualToValue={(a, b) => a.lessonId === b.lessonId}
            renderInput={(params) => <TextField {...params} label="שיעורים" />}
          />
        </CardContent>
      </Card>

      {selectedLesson ? (
        <Card variant="outlined">
          <CardContent sx={{ display: "grid", gap: 2 }}>
            <Typography variant="subtitle1" fontWeight={800}>
              {selectedLesson.subject}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(selectedLesson.startTime)} | משך צפוי: {selectedLesson.expectedDurationInHours} שעות
            </Typography>

            {rows.map((row, idx) => (
              <ParticipantEditorRow
                key={row.studentId}
                row={row}
                onChange={(updated) => setRows((prev) => prev.map((x, i) => (i === idx ? updated : x)))}
              />
            ))}

            <Button
              variant="contained"
              size="large"
              sx={{ minHeight: 52 }}
              disabled={!canSubmit || completeMutation.isPending}
              onClick={() => {
                completeMutation.mutate({
                  lessonId: selectedLessonId,
                  participants: rows.map((row) => ({
                    studentId: row.studentId,
                    hourlyPrice: row.hourlyPrice,
                    durationInHours: row.durationInHours,
                  })),
                });
              }}
            >
              סמן כבוצע
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </Box>
  );
}

const formatDate = (utc) =>
  new Date(utc).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
