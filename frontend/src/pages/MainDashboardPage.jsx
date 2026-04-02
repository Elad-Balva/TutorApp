import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  List,
  TextField,
  Typography,
} from "@mui/material";
import { createLesson, getLessonsDashboard, updateLesson } from "../api/lessonsApi";
import { getStudentOptions } from "../api/studentsApi";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const SUBJECT_SUGGESTIONS = ["c#", "java", "פרויקט תכנות", "מתמטיקה", "אנגלית", "פיזיקה"];

const formatDate = (utc) =>
  new Date(utc).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });

const formatIls = (value) => `₪${Number(value || 0).toFixed(2)}`;

const toDateTimeLocal = (utcIso) => {
  const d = new Date(utcIso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function MainDashboardPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create"); // create | edit
  const [editingLessonId, setEditingLessonId] = useState(null);

  const [subjectInput, setSubjectInput] = useState("");
  const [startTimeInput, setStartTimeInput] = useState("");
  const [expectedDurationInHours, setExpectedDurationInHours] = useState("1");
  const [participantSearch, setParticipantSearch] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]); // [{id,name}]

  const [expandedFutureLessonId, setExpandedFutureLessonId] = useState(null);

  const queryClient = useQueryClient();

  const dashboardQuery = useQuery({
    queryKey: ["lessonsDashboard"],
    queryFn: getLessonsDashboard,
  });

  const debouncedParticipantSearch = useDebouncedValue(participantSearch, 300);
  const studentOptionsQuery = useQuery({
    queryKey: ["studentOptions", debouncedParticipantSearch],
    queryFn: () => getStudentOptions(debouncedParticipantSearch),
    enabled: dialogOpen,
  });

  const mergedParticipantOptions = useMemo(() => {
    const map = new Map();
    for (const s of selectedParticipants) map.set(s.id, s);
    for (const s of studentOptionsQuery.data || []) map.set(s.id, s);
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "he"));
  }, [selectedParticipants, studentOptionsQuery.data]);

  const createLessonMutation = useMutation({
    mutationFn: createLesson,
    onSuccess: () => {
      setDialogOpen(false);
      setSubjectInput("");
      setStartTimeInput("");
      setExpectedDurationInHours("1");
      setParticipantSearch("");
      setSelectedParticipants([]);
      setExpandedFutureLessonId(null);
      queryClient.invalidateQueries({ queryKey: ["lessonsDashboard"] });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: ({ lessonId, payload }) => updateLesson(lessonId, payload),
    onSuccess: () => {
      setDialogOpen(false);
      setEditingLessonId(null);
      setExpandedFutureLessonId(null);
      queryClient.invalidateQueries({ queryKey: ["lessonsDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["readyToCompleteLessons"] });
    },
  });

  const canSubmit = useMemo(() => {
    const expected = Number(expectedDurationInHours);
    return (
      subjectInput.trim().length > 0 &&
      Boolean(startTimeInput) &&
      selectedParticipants.length > 0 &&
      !Number.isNaN(expected) &&
      expected > 0 &&
      expected <= 24
    );
  }, [subjectInput, startTimeInput, selectedParticipants, expectedDurationInHours]);

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditingLessonId(null);
    setSubjectInput("");
    setStartTimeInput(toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000).toISOString()));
    setExpectedDurationInHours("1");
    setParticipantSearch("");
    setSelectedParticipants([]);
    setDialogOpen(true);
  };

  const openEditDialog = (lesson) => {
    setDialogMode("edit");
    setEditingLessonId(lesson.lessonId);
    setSubjectInput(lesson.subject || "");
    setStartTimeInput(toDateTimeLocal(lesson.startTime));
    setExpectedDurationInHours(String(lesson.expectedDurationInHours || 1));
    setParticipantSearch("");
    setSelectedParticipants((lesson.participants || []).map((p) => ({ id: p.studentId, name: p.studentName })));
    setDialogOpen(true);
  };

  return (
    <Box sx={{ p: 2, pb: 10, display: "grid", gap: 2 }} dir="rtl">
      <Typography variant="h5" fontWeight={800}>
        לוח בקרה
      </Typography>

      {dashboardQuery.error ? <Alert severity="error">{dashboardQuery.error.message}</Alert> : null}

      <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
        שיעורים עתידיים
      </Typography>
      <List disablePadding sx={{ display: "grid", gap: 1 }}>
        {(dashboardQuery.data?.futureLessons || []).map((lesson) => {
          const isExpanded = expandedFutureLessonId === lesson.lessonId;
          return (
            <Card
              key={lesson.lessonId}
              variant="outlined"
              sx={{
                cursor: "pointer",
                transition: "transform 180ms ease, box-shadow 180ms ease",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 2 },
              }}
              onClick={() => setExpandedFutureLessonId((prev) => (prev === lesson.lessonId ? null : lesson.lessonId))}
            >
              <CardContent>
                <Typography variant="subtitle1" fontWeight={800}>
                  {lesson.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(lesson.startTime)} | משך צפוי: {lesson.expectedDurationInHours} שעות
                </Typography>

                <Collapse in={isExpanded} timeout={240} unmountOnExit>
                  <Box sx={{ mt: 1, display: "grid", gap: 1 }}>
                    <Typography variant="body2" fontWeight={700}>
                      תלמידים בשיעור
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {(lesson.participants || []).map((p) => (
                        <Chip key={p.studentId} label={p.studentName} size="small" sx={{ direction: "rtl" }} />
                      ))}
                    </Box>

                    <Button
                      variant="contained"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(lesson);
                      }}
                    >
                      ערוך
                    </Button>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          );
        })}

        {!dashboardQuery.isLoading && (dashboardQuery.data?.futureLessons || []).length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            אין שיעורים עתידיים
          </Typography>
        ) : null}
      </List>

      <Typography variant="h6" fontWeight={700} sx={{ mt: 2 }}>
        שיעורים שטרם שולמו
      </Typography>
      <List disablePadding sx={{ display: "grid", gap: 1 }}>
        {(dashboardQuery.data?.unpaidLessons || []).map((lesson) => {
          const unpaidParticipants = (lesson.participants || []).filter((p) => !p.isPaid && p.outstandingAmount > 0);
          return (
            <Card key={lesson.lessonId} variant="outlined">
              <CardContent sx={{ animation: "fadeInUp 260ms ease both" }}>
                <Typography variant="subtitle1" fontWeight={800}>
                  {lesson.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(lesson.startTime)} | יתרה: {formatIls(lesson.outstandingTotal)}
                </Typography>

                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" fontWeight={700}>
                    תלמידים שלא שילמו
                  </Typography>
                  {unpaidParticipants.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      הכל שולם
                    </Typography>
                  ) : (
                    <Box sx={{ display: "grid", gap: 0.5, mt: 0.5 }}>
                      {unpaidParticipants.map((p) => (
                        <Typography key={p.studentId} variant="body2">
                          {p.studentName}: {formatIls(p.outstandingAmount)}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}

        {!dashboardQuery.isLoading && (dashboardQuery.data?.unpaidLessons || []).length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            אין יתרות לתשלום
          </Typography>
        ) : null}
      </List>

      <Fab color="primary" aria-label="add lesson" onClick={openCreateDialog} sx={{ position: "fixed", right: 16, bottom: 16 }}>
        +
      </Fab>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{dialogMode === "create" ? "הוספת שיעור" : "עריכת שיעור"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
          <Autocomplete
            freeSolo
            options={SUBJECT_SUGGESTIONS}
            value={subjectInput}
            onInputChange={(_, value) => setSubjectInput(value || "")}
            renderInput={(params) => <TextField {...params} label="נושא" inputProps={{ maxLength: 120 }} />}
          />

          <TextField
            label="תאריך ושעה"
            type="datetime-local"
            value={startTimeInput}
            onChange={(e) => setStartTimeInput(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="משך צפוי (שעות)"
            type="number"
            value={expectedDurationInHours}
            onChange={(e) => setExpectedDurationInHours(e.target.value)}
            inputProps={{ min: 0.01, max: 24, step: 0.25 }}
          />

          <Autocomplete
            multiple
            options={mergedParticipantOptions}
            value={selectedParticipants}
            onChange={(_, value) => setSelectedParticipants(value)}
            inputValue={participantSearch}
            onInputChange={(_, value, reason) => {
              if (reason === "input" || reason === "clear") setParticipantSearch(value);
            }}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            filterOptions={(options) => options}
            loading={studentOptionsQuery.isFetching}
            noOptionsText={studentOptionsQuery.isFetching ? "מחפש..." : "אין התאמות"}
            renderInput={(params) => (
              <TextField
                {...params}
                label="תלמידים"
                placeholder="חיפוש תלמידים"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {studentOptionsQuery.isFetching ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>ביטול</Button>
          <Button
            variant="contained"
            disabled={!canSubmit || createLessonMutation.isPending || updateLessonMutation.isPending}
            onClick={() => {
              const payload = {
                subject: subjectInput.trim(),
                startTime: new Date(startTimeInput).toISOString(),
                expectedDurationInHours: Number(expectedDurationInHours),
                studentIds: selectedParticipants.map((s) => s.id),
              };

              if (dialogMode === "create") {
                createLessonMutation.mutate(payload);
              } else {
                updateLessonMutation.mutate({ lessonId: editingLessonId, payload });
              }
            }}
          >
            {dialogMode === "create" ? "צור שיעור" : "שמור שינויים"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
