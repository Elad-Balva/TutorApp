import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { createLesson, getLessonsDashboard } from "../api/lessonsApi";
import { getStudentOptions } from "../api/studentsApi";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const formatDate = (utc) =>
  new Date(utc).toLocaleString("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  });

const formatIls = (value) => `₪${Number(value || 0).toFixed(2)}`;

export function MainDashboardPage() {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [startTime, setStartTime] = useState("");
  const [participantSearch, setParticipantSearch] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  const debouncedParticipantSearch = useDebouncedValue(participantSearch, 300);
  const queryClient = useQueryClient();

  const dashboardQuery = useQuery({
    queryKey: ["lessonsDashboard"],
    queryFn: getLessonsDashboard,
  });

  const studentOptionsQuery = useQuery({
    queryKey: ["studentOptions", debouncedParticipantSearch],
    queryFn: () => getStudentOptions(debouncedParticipantSearch),
    enabled: open,
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
      setOpen(false);
      setSubject("");
      setStartTime("");
      setParticipantSearch("");
      setSelectedParticipants([]);
      queryClient.invalidateQueries({ queryKey: ["lessonsDashboard"] });
    },
  });

  const canSubmit = useMemo(
    () => subject.trim().length > 0 && startTime && selectedParticipants.length > 0,
    [subject, startTime, selectedParticipants]
  );

  const openDialog = () => {
    setParticipantSearch("");
    setOpen(true);
  };

  return (
    <Box sx={{ p: 2, pb: 10, display: "grid", gap: 2 }}>
      <Typography variant="h5" fontWeight={600}>
        Dashboard
      </Typography>

      {dashboardQuery.error ? <Alert severity="error">{dashboardQuery.error.message}</Alert> : null}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Future Lessons
          </Typography>
          <List dense disablePadding>
            {(dashboardQuery.data?.futureLessons || []).map((lesson) => (
              <ListItem key={lesson.lessonId} disableGutters>
                <ListItemText
                  primary={lesson.subject}
                  secondary={`${formatDate(lesson.startTime)} | ${lesson.participantCount} students`}
                />
              </ListItem>
            ))}
            {!dashboardQuery.isLoading && (dashboardQuery.data?.futureLessons || []).length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No future lessons.
              </Typography>
            ) : null}
          </List>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Currently Unpaid Lessons
          </Typography>
          <List dense disablePadding>
            {(dashboardQuery.data?.unpaidLessons || []).map((lesson) => (
              <ListItem key={lesson.lessonId} disableGutters>
                <ListItemText
                  primary={lesson.subject}
                  secondary={`${formatDate(lesson.startTime)} | Outstanding: ${formatIls(lesson.totalPrice)}`}
                />
              </ListItem>
            ))}
            {!dashboardQuery.isLoading && (dashboardQuery.data?.unpaidLessons || []).length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No unpaid lessons.
              </Typography>
            ) : null}
          </List>
        </CardContent>
      </Card>

      <Fab
        color="primary"
        aria-label="add lesson"
        onClick={openDialog}
        sx={{ position: "fixed", right: 16, bottom: 16 }}
      >
        +
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Lesson</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            inputProps={{ maxLength: 120 }}
          />
          <TextField
            label="Date and time"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
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
            noOptionsText={studentOptionsQuery.isFetching ? "Searching…" : "No students match"}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Participants"
                placeholder="Type to search students"
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
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!canSubmit || createLessonMutation.isPending}
            onClick={() =>
              createLessonMutation.mutate({
                subject: subject.trim(),
                startTime: new Date(startTime).toISOString(),
                studentIds: selectedParticipants.map((s) => s.id),
              })
            }
          >
            Create Lesson
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
