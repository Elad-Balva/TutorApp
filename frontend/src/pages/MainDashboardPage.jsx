import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { createLesson, getLessonsDashboard } from "../api/lessonsApi";
import { getStudentOptions } from "../api/studentsApi";

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
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const queryClient = useQueryClient();

  const dashboardQuery = useQuery({
    queryKey: ["lessonsDashboard"],
    queryFn: getLessonsDashboard,
  });

  const studentsQuery = useQuery({
    queryKey: ["studentOptions"],
    queryFn: getStudentOptions,
  });

  const createLessonMutation = useMutation({
    mutationFn: createLesson,
    onSuccess: () => {
      setOpen(false);
      setSubject("");
      setStartTime("");
      setSelectedStudentIds([]);
      queryClient.invalidateQueries({ queryKey: ["lessonsDashboard"] });
    },
  });

  const canSubmit = useMemo(
    () => subject.trim().length > 0 && startTime && selectedStudentIds.length > 0,
    [subject, startTime, selectedStudentIds]
  );

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
        onClick={() => setOpen(true)}
        sx={{ position: "fixed", right: 16, bottom: 16 }}
      >
        +
      </Fab>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
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
          <Typography variant="subtitle2">Participants</Typography>
          {(studentsQuery.data || []).map((student) => (
            <FormControlLabel
              key={student.id}
              control={
                <Checkbox
                  checked={selectedStudentIds.includes(student.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStudentIds((prev) => [...prev, student.id]);
                    } else {
                      setSelectedStudentIds((prev) => prev.filter((id) => id !== student.id));
                    }
                  }}
                />
              }
              label={student.name}
            />
          ))}
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
                studentIds: selectedStudentIds,
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
