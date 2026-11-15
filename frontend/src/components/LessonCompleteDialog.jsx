import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
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

  const totalAmount = useMemo(
    () => rows.reduce((sum, r) => sum + r.hourlyPrice * r.durationInHours, 0),
    [rows]
  );

  const canSubmit = useMemo(
    () =>
      rows.length > 0 &&
      rows.every((r) => r.hourlyPrice >= 0 && r.durationInHours > 0 && r.durationInHours <= 24),
    [rows]
  );

  if (!lesson) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 0.5 }}>
        <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "#c6c6c6", letterSpacing: "-0.02em", margin: 0 }}>
          פרטי שיעור סופיים
        </p>
        <p style={{ fontFamily: "'Inter',sans-serif", fontWeight: 400, fontSize: "0.8125rem", color: "rgba(192,199,213,0.65)", marginTop: 4 }}>
          אנא ודא את פרטי המפגש לפני סיום
        </p>
      </DialogTitle>

      <DialogContent sx={{ pt: "12px !important" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Lesson meta */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "14px 16px",
          }}>
            <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: "1rem", color: "#e2e2e8", marginBottom: 4 }}>
              {(lesson.participants || []).map((p) => p.studentName).join(" · ") || "—"}
            </p>
            <p style={{ fontSize: "0.75rem", color: "rgba(192,199,213,0.5)" }}>
              {formatDate(lesson.startTime)} · משך צפוי: {lesson.expectedDurationInHours} שעות
            </p>
            {lesson.subject ? (
              <p style={{ fontSize: "0.75rem", color: "rgba(192,199,213,0.5)", marginTop: 2 }}>נושא: {lesson.subject}</p>
            ) : null}
          </div>

          {/* Participant rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map((row, idx) => (
              <ParticipantEditorRow
                key={row.studentId}
                row={row}
                onChange={(updated) => setRows((prev) => prev.map((x, i) => (i === idx ? updated : x)))}
              />
            ))}
          </div>

          {/* Total */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 24, color: "#9ffb00", fontVariationSettings: "'FILL' 1" }}
              >
                payments
              </span>
              <div>
                <p style={{ fontSize: "0.75rem", color: "rgba(192,199,213,0.5)", marginBottom: 2 }}>סה&quot;כ לתשלום</p>
                <p style={{ fontSize: "0.6875rem", color: "rgba(192,199,213,0.35)" }}>
                  עבור {rows.reduce((s, r) => s + r.durationInHours, 0)} שעות לימוד
                </p>
              </div>
            </div>
            <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "2rem", color: "#9ffb00", letterSpacing: "-0.02em" }}>
              ₪{totalAmount.toFixed(0)}
            </p>
          </div>

          {completeMutation.error ? (
            <Alert severity="error">{completeMutation.error.message}</Alert>
          ) : null}
        </div>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 0.5, flexDirection: "column", gap: 1 }}>
        <button
          className="btn-primary"
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
          {completeMutation.isPending ? "מעדכן..." : "סמן כבוצע"}
        </button>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "0.75rem",
            fontFamily: "'Manrope',sans-serif",
            fontWeight: 600,
            fontSize: "0.875rem",
            color: "rgba(192,199,213,0.6)",
            background: "none",
            border: "none",
            cursor: "pointer",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e2e2e8")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(192,199,213,0.6)")}
        >
          ביטול
        </button>
      </DialogActions>
    </Dialog>
  );
}
