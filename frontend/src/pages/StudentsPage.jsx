import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
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
      setName(""); setPhoneNumber(""); setBaseHourlyPrice("120"); setAddressLine(""); setLocationNotes("");
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

  const canAdd = useMemo(
    () => name.trim().length > 0 && !Number.isNaN(Number(baseHourlyPrice)) && Number(baseHourlyPrice) >= 0,
    [name, baseHourlyPrice]
  );
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

  const resetForm = () => {
    setName(""); setPhoneNumber(""); setBaseHourlyPrice("120"); setAddressLine(""); setLocationNotes("");
  };

  return (
    <div className="page-container">

      {/* Page header */}
      <div>
        <h1 className="page-title">מדריך תלמידים</h1>
        <p className="page-subtitle">ניהול ומעקב אחר בסיס התלמידים הפעיל שלך</p>
      </div>

      {/* Add + Search */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          className="btn-primary"
          style={{ padding: "0.875rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          onClick={() => { resetForm(); setAddOpen(true); }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#002a51" }}>person_add</span>
          + הוספת תלמיד
        </button>

        {/* Search input */}
        <div style={{ position: "relative" }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: "absolute", top: "50%", right: 14, transform: "translateY(-50%)",
              fontSize: 20, color: "rgba(192,199,213,0.35)", pointerEvents: "none"
            }}
          >
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש תלמידים..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#0c0e12",
              border: "1px solid rgba(64,71,83,0.6)",
              borderRadius: 14,
              padding: "12px 44px 12px 14px",
              color: "#e2e2e8",
              fontSize: "0.875rem",
              fontFamily: "'Inter',sans-serif",
              outline: "none",
              transition: "border-color 0.15s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(163,201,255,0.4)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(64,71,83,0.6)")}
          />
        </div>
      </div>

      {studentsQuery.error ? <Alert severity="error">{studentsQuery.error.message}</Alert> : null}

      {/* Student cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(studentsQuery.data?.items || []).map((s) => (
          <div
            key={s.id}
            style={{
              background: "#1c1e24",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16,
              padding: "1rem",
              animation: "fadeInUp 220ms ease both",
            }}
          >
            {/* Top row: avatar + info + menu */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "#282a2e", border: "1px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: "rgba(192,199,213,0.35)" }}>person</span>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1rem", color: "#e2e2e8" }}>
                    {s.name}
                  </span>
                  <span
                    className={s.isActive ? "badge-success" : "badge-neutral"}
                    style={{
                      display: "inline-flex", alignItems: "center",
                      fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: "0.6875rem",
                      padding: "2px 8px", borderRadius: 99,
                      background: s.isActive ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)",
                      color: s.isActive ? "#4ade80" : "#8a919f",
                      border: s.isActive ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    {s.isActive ? "פעיל" : "לא פעיל"}
                  </span>
                </div>

                {/* Contact rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {s.phoneNumber ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: "rgba(192,199,213,0.4)" }}>call</span>
                      <span style={{ fontSize: "0.8125rem", color: "rgba(192,199,213,0.6)" }}>{s.phoneNumber}</span>
                    </div>
                  ) : null}
                  {s.addressLine ? (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: "rgba(192,199,213,0.4)", marginTop: 1 }}>location_on</span>
                      <span style={{ fontSize: "0.8125rem", color: "rgba(192,199,213,0.6)" }}>
                        {s.addressLine}{s.locationNotes ? ` · ${s.locationNotes}` : ""}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Menu button */}
              <button
                onClick={() => openEdit(s)}
                style={{
                  flexShrink: 0, padding: 6, borderRadius: 10,
                  color: "rgba(192,199,213,0.35)", background: "none", border: "none",
                  cursor: "pointer", transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#e2e2e8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(192,199,213,0.35)"; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>more_vert</span>
              </button>
            </div>

            {/* Price row */}
            <div style={{
              marginTop: 12, paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.25rem", color: "#9ffb00" }}>
                {formatIls(s.baseHourlyPrice)}
              </span>
              <span style={{ fontSize: "0.75rem", color: "rgba(192,199,213,0.4)", fontFamily: "'Inter',sans-serif" }}>
                מחיר לשיעור
              </span>
            </div>
          </div>
        ))}

        {/* Loading */}
        {studentsQuery.isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(163,201,255,0.2)", borderTopColor: "#1493ff", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : null}

        {/* Empty state */}
        {!studentsQuery.isLoading && (studentsQuery.data?.items || []).length === 0 ? (
          <div style={{
            background: "#1c1e24", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "2.5rem", display: "flex",
            flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 44, color: "#404753" }}>group_add</span>
            <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#e2e2e8" }}>
              הוסף תלמיד חדש מאחר
            </p>
            <button
              onClick={() => { resetForm(); setAddOpen(true); }}
              style={{ color: "#a3c9ff", fontSize: "0.875rem", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
            >
              לחץ כאן להתחלה
            </button>
          </div>
        ) : null}
      </div>

      {/* ── Add Student Dialog ─────────────────────────────────── */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>הוספת תלמיד</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          {addMutation.error ? <Alert severity="error">{addMutation.error.message}</Alert> : null}
          <TextField label="שם" value={name} onChange={(e) => setName(e.target.value)} required inputProps={{ maxLength: 120 }} />
          <TextField label="טלפון (אופציונלי)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} inputProps={{ maxLength: 30 }} />
          <TextField label="מחיר בסיס לשעה (₪)" type="number" value={baseHourlyPrice} onChange={(e) => setBaseHourlyPrice(e.target.value)} inputProps={{ min: 0, step: 1 }} />
          <TextField label="כתובת לניווט (אופציונלי)" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} inputProps={{ maxLength: 500 }} helperText="משמש לפתיחת Waze משיעורים פרונטליים" />
          <TextField label="הערות הגעה (קומה, דירה, קוד שער…)" value={locationNotes} onChange={(e) => setLocationNotes(e.target.value)} inputProps={{ maxLength: 300 }} multiline minRows={2} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <button className="btn-outline-sm" style={{ padding: "0.6rem 1.25rem" }} onClick={() => setAddOpen(false)}>ביטול</button>
          <button
            className="btn-primary-sm"
            style={{ flex: 1, padding: "0.6rem 1rem" }}
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
            {addMutation.isPending ? "שומר..." : "שמור"}
          </button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Student Dialog ────────────────────────────────── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>עריכת תלמיד</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          {editMutation.error ? <Alert severity="error">{editMutation.error.message}</Alert> : null}
          <TextField label="שם" value={name} onChange={(e) => setName(e.target.value)} required inputProps={{ maxLength: 120 }} />
          <TextField label="טלפון (אופציונלי)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} inputProps={{ maxLength: 30 }} />
          <TextField label="מחיר בסיס לשעה (₪)" type="number" value={baseHourlyPrice} onChange={(e) => setBaseHourlyPrice(e.target.value)} inputProps={{ min: 0, step: 1 }} />
          <TextField label="כתובת לניווט (אופציונלי)" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} inputProps={{ maxLength: 500 }} helperText="משמש לפתיחת Waze משיעורים פרונטליים" />
          <TextField label="הערות הגעה (קומה, דירה, קוד שער…)" value={locationNotes} onChange={(e) => setLocationNotes(e.target.value)} inputProps={{ maxLength: 300 }} multiline minRows={2} />
          <FormControlLabel control={<Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />} label="פעיל" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <button className="btn-outline-sm" style={{ padding: "0.6rem 1.25rem" }} onClick={() => setEditOpen(false)}>ביטול</button>
          <button
            className="btn-primary-sm"
            style={{ flex: 1, padding: "0.6rem 1rem" }}
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
            {editMutation.isPending ? "שומר..." : "שמור שינויים"}
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
