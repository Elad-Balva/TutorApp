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
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { createStudent, getStudents, updateStudent } from "../api/studentsApi";

const formatIls = (value) => `₪${Number(value || 0).toFixed(2)}`;

export function StudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [baseHourlyPrice, setBaseHourlyPrice] = useState("120");
  const [addressLine, setAddressLine] = useState("");
  const [locationNotes, setLocationNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  const studentsQuery = useQuery({
    queryKey: ["students", search],
    queryFn: () => getStudents({ search, page: 1, pageSize: 50 }),
  });

  const addMutation = useMutation({
    mutationFn: ({ name, phoneNumber, baseHourlyPrice, addressLine, locationNotes }) =>
      createStudent({ name, phoneNumber, baseHourlyPrice, addressLine, locationNotes }),
    onSuccess: () => {
      setAddOpen(false);
      setName("");
      setPhoneNumber("");
      setBaseHourlyPrice("120");
      setAddressLine("");
      setLocationNotes("");
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ studentId, payload }) => updateStudent(studentId, payload),
    onSuccess: () => {
      setEditOpen(false);
      setEditingStudentId(null);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["studentOptions"] });
      queryClient.invalidateQueries({ queryKey: ["lessonsDashboard"] });
    },
  });

  const canAdd = useMemo(() => name.trim().length > 0 && !Number.isNaN(Number(baseHourlyPrice)) && Number(baseHourlyPrice) >= 0, [name, baseHourlyPrice]);

  const canSaveEdit = useMemo(
    () => name.trim().length > 0 && !Number.isNaN(Number(baseHourlyPrice)) && Number(baseHourlyPrice) >= 0 && Boolean(editingStudentId),
    [name, baseHourlyPrice, editingStudentId]
  );

  const openEdit = (student) => {
    setEditingStudentId(student.id);
    setName(student.name);
    setPhoneNumber(student.phoneNumber || "");
    setBaseHourlyPrice(String(student.baseHourlyPrice));
    setAddressLine(student.addressLine || "");
    setLocationNotes(student.locationNotes || "");
    setIsActive(student.isActive);
    setEditOpen(true);
  };

  return (
    <Box sx={{ p: 2, pb: 10, display: "grid", gap: 2 }}>
      <Typography variant="h5" fontWeight={800}>
        תלמידים
      </Typography>

      <Alert
        severity="info"
        sx={{ display: "none" }}
      >
        עדכון נתונים משפיע גם על מחירי בסיס לשיעורים חדשים.
      </Alert>

      <Box sx={{ display: "grid", gap: 1 }}>
        <TextField label="חיפוש" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button variant="contained" size="large" onClick={() => setAddOpen(true)} sx={{ minHeight: 48 }}>
          + הוספת תלמיד
        </Button>
      </Box>

      {studentsQuery.error ? <Alert severity="error">{studentsQuery.error.message}</Alert> : null}

      <List sx={{ display: "grid", gap: 1 }}>
        {(studentsQuery.data?.items || []).map((s) => (
          <Card key={s.id} variant="outlined">
            <CardContent sx={{ display: "grid", gap: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={800}>
                {s.name} {s.isActive ? "" : "(לא פעיל)"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {s.phoneNumber || "ללא טלפון"} | מחיר בסיס: {formatIls(s.baseHourlyPrice)}
              </Typography>
              {s.addressLine ? (
                <Typography variant="body2" color="text.secondary">
                  כתובת: {s.addressLine}
                  {s.locationNotes ? ` · ${s.locationNotes}` : ""}
                </Typography>
              ) : null}
              <Button variant="outlined" size="small" onClick={() => openEdit(s)} sx={{ mt: 0.5, justifySelf: "start" }}>
                ערוך
              </Button>
            </CardContent>
          </Card>
        ))}
        {studentsQuery.isLoading ? <Typography color="text.secondary">טוען...</Typography> : null}
      </List>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>הוספת תלמיד</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2 }}>
          <TextField label="שם" value={name} onChange={(e) => setName(e.target.value)} inputProps={{ maxLength: 120 }} />
          <TextField label="טלפון (אופציונלי)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} inputProps={{ maxLength: 30 }} />
          <TextField
            label="מחיר בסיס לשעה (₪)"
            type="number"
            value={baseHourlyPrice}
            onChange={(e) => setBaseHourlyPrice(e.target.value)}
            inputProps={{ min: 0, step: 1 }}
          />
          <TextField
            label="כתובת לניווט (אופציונלי)"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText="משמש לפתיחת Waze משיעורים פרונטליים"
          />
          <TextField
            label="הערות הגעה (קומה, דירה, קוד שער…)"
            value={locationNotes}
            onChange={(e) => setLocationNotes(e.target.value)}
            inputProps={{ maxLength: 300 }}
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>ביטול</Button>
          <Button
            variant="contained"
            disabled={!canAdd || addMutation.isPending}
            onClick={() =>
              addMutation.mutate({
                name: name.trim(),
                phoneNumber: phoneNumber.trim() || null,
                baseHourlyPrice: Number(baseHourlyPrice),
                addressLine: addressLine.trim() || null,
                locationNotes: locationNotes.trim() || null,
              })
            }
          >
            שמור
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>עריכת תלמיד</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2 }}>
          <TextField label="שם" value={name} onChange={(e) => setName(e.target.value)} inputProps={{ maxLength: 120 }} />
          <TextField label="טלפון (אופציונלי)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} inputProps={{ maxLength: 30 }} />
          <TextField
            label="מחיר בסיס לשעה (₪)"
            type="number"
            value={baseHourlyPrice}
            onChange={(e) => setBaseHourlyPrice(e.target.value)}
            inputProps={{ min: 0, step: 1 }}
          />
          <TextField
            label="כתובת לניווט (אופציונלי)"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText="משמש לפתיחת Waze משיעורים פרונטליים"
          />
          <TextField
            label="הערות הגעה (קומה, דירה, קוד שער…)"
            value={locationNotes}
            onChange={(e) => setLocationNotes(e.target.value)}
            inputProps={{ maxLength: 300 }}
            multiline
            minRows={2}
          />
          <FormControlLabel control={<Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />} label="פעיל" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>ביטול</Button>
          <Button
            variant="contained"
            disabled={!canSaveEdit || editMutation.isPending}
            onClick={() =>
              editMutation.mutate({
                studentId: editingStudentId,
                payload: {
                  name: name.trim(),
                  phoneNumber: phoneNumber.trim() || null,
                  baseHourlyPrice: Number(baseHourlyPrice),
                  addressLine: addressLine.trim() || null,
                  locationNotes: locationNotes.trim() || null,
                  isActive,
                },
              })
            }
          >
            שמור שינויים
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

