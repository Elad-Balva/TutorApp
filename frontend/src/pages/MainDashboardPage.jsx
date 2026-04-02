import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControlLabel,
  List,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { createLesson, getLessonsDashboard, updateLesson } from "../api/lessonsApi";
import { getStudentOptions } from "../api/studentsApi";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { LessonCompleteDialog } from "../components/LessonCompleteDialog";
import { buildWazeUrl } from "../utils/waze";

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
  const [dashboardTab, setDashboardTab] = useState("future");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [editingLessonId, setEditingLessonId] = useState(null);

  const [subjectInput, setSubjectInput] = useState("");
  const [startTimeInput, setStartTimeInput] = useState("");
  const [expectedDurationInHours, setExpectedDurationInHours] = useState("1");
  const [isInPerson, setIsInPerson] = useState(true);
  const [participantSearch, setParticipantSearch] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  const [expandedFutureLessonId, setExpandedFutureLessonId] = useState(null);
  const [expandedAttentionLessonId, setExpandedAttentionLessonId] = useState(null);
  const [completeDialogLesson, setCompleteDialogLesson] = useState(null);

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

  const awaitingList = dashboardQuery.data?.awaitingCompletionLessons ?? [];
  const unpaidList = dashboardQuery.data?.unpaidLessons ?? [];

  const createLessonMutation = useMutation({
    mutationFn: createLesson,
    onSuccess: () => {
      setDialogOpen(false);
      setSubjectInput("");
      setStartTimeInput("");
      setExpectedDurationInHours("1");
      setIsInPerson(true);
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
    setIsInPerson(true);
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
    setIsInPerson(lesson.isInPerson !== false);
    setParticipantSearch("");
    setSelectedParticipants((lesson.participants || []).map((p) => ({ id: p.studentId, name: p.studentName })));
    setDialogOpen(true);
  };

  const renderParticipantChips = (lesson, { showWaze }) => {
    const participants = lesson.participants || [];
    return (
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
        {participants.map((p) => {
          const wazeUrl =
            showWaze && lesson.isInPerson ? buildWazeUrl(p.addressLine, p.locationNotes) : null;
          return (
            <Box key={p.studentId} sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
              <Chip label={p.studentName} size="small" />
              {wazeUrl ? (
                <Button
                  component="a"
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  variant="outlined"
                  sx={{ minWidth: "auto", py: 0.25, px: 1 }}
                >
                  Waze
                </Button>
              ) : null}
              {p.locationNotes && lesson.isInPerson ? (
                <Typography variant="caption" color="text.secondary" sx={{ width: "100%" }}>
                  {p.studentName}: {p.locationNotes}
                </Typography>
              ) : null}
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 2, pb: 10, display: "grid", gap: 2 }}>
      <Typography variant="h5" fontWeight={800}>
        לוח בקרה
      </Typography>

      {dashboardQuery.error ? <Alert severity="error">{dashboardQuery.error.message}</Alert> : null}

      <ToggleButtonGroup
        exclusive
        fullWidth
        value={dashboardTab}
        onChange={(_, v) => v && setDashboardTab(v)}
        color="primary"
        sx={{ "& .MuiToggleButton-root": { py: 1.25 } }}
      >
        <ToggleButton value="future">שיעורים עתידיים</ToggleButton>
        <ToggleButton value="attention">שיעורים שטרם שולמו / ממתינים</ToggleButton>
      </ToggleButtonGroup>

      {dashboardTab === "future" ? (
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
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mb: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight={800}>
                      {lesson.subject}
                    </Typography>
                    {lesson.isInPerson ? (
                      <Chip size="small" label="פרונטלי" variant="outlined" />
                    ) : (
                      <Chip size="small" label="מקוון" variant="outlined" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(lesson.startTime)} | משך צפוי: {lesson.expectedDurationInHours} שעות
                  </Typography>

                  <Collapse in={isExpanded} timeout={240} unmountOnExit>
                    <Box sx={{ mt: 1, display: "grid", gap: 1 }}>
                      <Typography variant="body2" fontWeight={700}>
                        תלמידים בשיעור
                      </Typography>
                      {renderParticipantChips(lesson, { showWaze: true })}

                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          color="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCompleteDialogLesson(lesson);
                          }}
                        >
                          סיים שיעור
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(lesson);
                          }}
                        >
                          ערוך
                        </Button>
                      </Box>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            );
          })}

          {!dashboardQuery.isLoading && (dashboardQuery.data?.futureLessons || []).length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              אין שיעורים עתידיים (לפי מועד ומשך צפוי)
            </Typography>
          ) : null}
        </List>
      ) : (
        <List disablePadding sx={{ display: "grid", gap: 1.5 }}>
          {awaitingList.length > 0 ? (
            <Typography variant="subtitle2" color="text.secondary">
              ממתינים לסיום (הזמן הצפוי של השיעור עבר)
            </Typography>
          ) : null}
          {awaitingList.map((lesson) => {
            const isExpanded = expandedAttentionLessonId === `a-${lesson.lessonId}`;
            return (
              <Card
                key={`a-${lesson.lessonId}`}
                variant="outlined"
                sx={{ borderColor: "warning.main", borderWidth: 1 }}
              >
                <CardContent
                  onClick={() =>
                    setExpandedAttentionLessonId((prev) => (prev === `a-${lesson.lessonId}` ? null : `a-${lesson.lessonId}`))
                  }
                  sx={{ cursor: "pointer" }}
                >
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                    <Chip size="small" color="warning" label="לסיום" />
                    <Typography variant="subtitle1" fontWeight={800}>
                      {lesson.subject}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(lesson.startTime)} | משך צפוי: {lesson.expectedDurationInHours} שעות
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }} onClick={(e) => e.stopPropagation()}>
                    <Button variant="contained" size="small" onClick={() => setCompleteDialogLesson(lesson)}>
                      סיים שיעור
                    </Button>
                    <Button variant="outlined" size="small" onClick={() => openEditDialog(lesson)}>
                      ערוך
                    </Button>
                  </Box>
                  <Collapse in={isExpanded} timeout={240} unmountOnExit>
                    <Box sx={{ mt: 1, display: "grid", gap: 1 }}>
                      <Typography variant="body2" fontWeight={700}>
                        תלמידים
                      </Typography>
                      {renderParticipantChips(lesson, { showWaze: true })}
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            );
          })}

          {unpaidList.length > 0 ? (
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
              שיעורים שבוצעו — יתרה לתשלום
            </Typography>
          ) : null}
          {unpaidList.map((lesson) => {
            const unpaidParticipants = (lesson.participants || []).filter((p) => !p.isPaid && p.outstandingAmount > 0);
            return (
              <Card key={lesson.lessonId} variant="outlined">
                <CardContent sx={{ animation: "fadeInUp 260ms ease both" }}>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                    <Chip size="small" color="error" label="יתרה" />
                    <Typography variant="subtitle1" fontWeight={800}>
                      {lesson.subject}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(lesson.startTime)} | יתרה: {formatIls(lesson.outstandingTotal)}
                  </Typography>

                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" fontWeight={700}>
                      תלמידים שלא שילמו
                    </Typography>
                    {lesson.isInPerson ? (
                      <Typography variant="caption" color="text.secondary" display="block">
                        ניווט (Waze) לפי כתובת שנשמרה אצל התלמיד
                      </Typography>
                    ) : null}
                    {unpaidParticipants.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        הכל שולם
                      </Typography>
                    ) : (
                      <Box sx={{ display: "grid", gap: 0.75, mt: 0.5 }}>
                        {unpaidParticipants.map((p) => {
                          const wazeUrl = lesson.isInPerson ? buildWazeUrl(p.addressLine, p.locationNotes) : null;
                          return (
                            <Box key={p.studentId} sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                              <Typography variant="body2">
                                {p.studentName}: {formatIls(p.outstandingAmount)}
                              </Typography>
                              {wazeUrl ? (
                                <Button
                                  component="a"
                                  href={wazeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="small"
                                  variant="text"
                                >
                                  Waze
                                </Button>
                              ) : null}
                              {p.locationNotes && lesson.isInPerson ? (
                                <Typography variant="caption" color="text.secondary" sx={{ width: "100%" }}>
                                  {p.locationNotes}
                                </Typography>
                              ) : null}
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}

          {!dashboardQuery.isLoading && awaitingList.length === 0 && unpaidList.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              אין פריטים בקטגוריה זו
            </Typography>
          ) : null}
        </List>
      )}

      <Fab
        color="primary"
        aria-label="add lesson"
        onClick={openCreateDialog}
        sx={{ position: "fixed", bottom: 16, left: 16 }}
      >
        +
      </Fab>

      <LessonCompleteDialog
        open={Boolean(completeDialogLesson)}
        lesson={completeDialogLesson}
        onClose={() => setCompleteDialogLesson(null)}
      />

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

          <FormControlLabel
            control={<Checkbox checked={isInPerson} onChange={(e) => setIsInPerson(e.target.checked)} />}
            label="שיעור פרונטלי (הצגת ניווט Waze לפי כתובת תלמידים)"
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
                isInPerson,
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
