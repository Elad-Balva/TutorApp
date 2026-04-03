import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Autocomplete,
  Checkbox,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
} from "@mui/material";
import {
  cancelLesson,
  createLesson,
  getLessonsDashboard,
  markLessonParticipantPaid,
  updateLesson,
} from "../api/lessonsApi";
import { getStudentOptions } from "../api/studentsApi";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { LessonCompleteDialog } from "../components/LessonCompleteDialog";
import { buildWazeUrl } from "../utils/waze";
import { formatLessonScheduleBadge } from "../utils/lessonRelativeTime";
import { loadSettings } from "../utils/settings";
import { PAYMENT_METHODS } from "../utils/paymentMethods";

const SUBJECT_SUGGESTIONS = ["c#", "java", "פרויקט תכנות", "מתמטיקה", "אנגלית", "פיזיקה"];

/** Date only — e.g. "9.4.2026" */
const formatDateOnly = (utc) =>
  new Date(utc).toLocaleDateString("he-IL", { dateStyle: "short" });

/** Date + time — e.g. "9.4.2026, 20:00" */
const formatDateTime = (utc) =>
  new Date(utc).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });

/**
 * Split the relative time badge into { number, unit, prefix }.
 * e.g. "לפני 6 ימים" → { prefix:"לפני", number:"6", unit:"ימים" }
 *      "אתמול" → { prefix:null, number:null, unit:"אתמול" }
 */
function splitRelativeTime(badge) {
  const m = badge.match(/^(לפני|בעוד)\s+(\d+)\s+(.+)$/);
  if (m) return { prefix: m[1], number: m[2], unit: m[3] };
  return { prefix: null, number: null, unit: badge };
}

/** Full date + time — used inside dialogs where context is needed */
const formatDate = (utc) =>
  new Date(utc).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });

const formatTime = (utc) =>
  new Date(utc).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });

const formatIls = (value) => `₪${Number(value || 0).toFixed(2)}`;

const toDateTimeLocal = (utcIso) => {
  const d = new Date(utcIso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const participantNamesLine = (lesson) =>
  (lesson.participants || []).map((p) => p.studentName).join(" · ") || "—";

const unpaidNamesLine = (lesson) => {
  const unpaid = (lesson.participants || []).filter((p) => !p.isPaid && p.outstandingAmount > 0);
  return unpaid.map((p) => p.studentName).join(" · ") || "—";
};


/* ─── Lesson card ──────────────────────────────────────────────── */
function LessonCard({ lesson, isExpanded, onToggle, onComplete, onEdit, onCancel, accentColor }) {
  const participants = lesson.participants || [];

  return (
    <div
      className="lesson-card"
      style={accentColor ? { borderColor: accentColor } : undefined}
      onClick={onToggle}
    >
      {/* ── Row 1: name + time ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.0625rem", color: "#e2e2e8", lineHeight: 1.25, flex: 1, minWidth: 0 }}>
          {participantNamesLine(lesson)}
        </span>
        <div style={{ flexShrink: 0, textAlign: "center", minWidth: 58 }}>
          <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.625rem", color: "#1493ff", lineHeight: 1 }}>
            {formatTime(lesson.startTime)}
          </p>
          <p style={{ fontSize: "0.6875rem", color: "rgba(192,199,213,0.4)", marginTop: 2 }}>
            {lesson.expectedDurationInHours} שע&apos;
          </p>
        </div>
      </div>

      {/* ── Row 2: schedule badge · mode · subject · date ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
        <span className="badge-primary" style={{ flexShrink: 0 }}>
          {formatLessonScheduleBadge(lesson)}
        </span>
        <span
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: "0.6875rem", fontWeight: 600, padding: "2px 8px",
            borderRadius: 99, fontFamily: "'Inter',sans-serif",
            background: lesson.isInPerson ? "rgba(163,201,255,0.08)" : "rgba(159,251,0,0.08)",
            color: lesson.isInPerson ? "rgba(163,201,255,0.75)" : "rgba(159,251,0,0.75)",
            border: lesson.isInPerson ? "1px solid rgba(163,201,255,0.15)" : "1px solid rgba(159,251,0,0.15)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
            {lesson.isInPerson ? "home" : "videocam"}
          </span>
          {lesson.isInPerson ? "פרונטלי" : "זום"}
        </span>
        {lesson.subject ? (
          <span style={{ fontSize: "0.75rem", color: "rgba(192,199,213,0.5)", fontFamily: "'Inter',sans-serif" }}>
            {lesson.subject}
          </span>
        ) : null}
        <span style={{ marginInlineStart: "auto", fontSize: "0.6875rem", color: "rgba(192,199,213,0.3)", fontFamily: "'Inter',sans-serif" }}>
          {formatDateOnly(lesson.startTime)}
        </span>
      </div>

      {/* ── Expanded section ── */}
      <Collapse in={isExpanded} timeout={220} unmountOnExit>
        <div
          style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Waze links — in-person with address only */}
          {lesson.isInPerson && participants.some((p) => p.addressLine) ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {participants.map((p) => {
                const wazeUrl = buildWazeUrl(p.addressLine, p.locationNotes);
                if (!wazeUrl) return null;
                return (
                  <div key={p.studentId} style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                    <a
                      href={wazeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "#a3c9ff", border: "1px solid rgba(163,201,255,0.25)", borderRadius: 99, padding: "3px 10px", textDecoration: "none" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>navigation</span>
                      {participants.length > 1 ? `Waze · ${p.studentName}` : "Waze"}
                    </a>
                    {p.locationNotes ? (
                      <span style={{ width: "100%", fontSize: "0.7rem", color: "rgba(192,199,213,0.45)" }}>
                        {p.locationNotes}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Action buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <button className="btn-primary-sm" onClick={onComplete}>
              התחלה / סיים
            </button>
            <button className="btn-outline-sm" onClick={onEdit}>
              ערוך
            </button>
            <button
              onClick={onCancel}
              style={{
                marginInlineStart: "auto",
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "0.45rem 0.75rem",
                borderRadius: 10,
                border: "1px solid rgba(255,100,80,0.2)",
                background: "transparent",
                color: "rgba(255,130,110,0.7)",
                fontSize: "0.8125rem",
                fontFamily: "'Manrope',sans-serif",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,100,80,0.45)"; e.currentTarget.style.color = "#ff8070"; e.currentTarget.style.background = "rgba(255,100,80,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,100,80,0.2)"; e.currentTarget.style.color = "rgba(255,130,110,0.7)"; e.currentTarget.style.background = "transparent"; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>cancel</span>
              ביטול
            </button>
          </div>
        </div>
      </Collapse>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────── */
export function MainDashboardPage({ defaultTab = "future" }) {
  const [dashboardTab, setDashboardTab] = useState(defaultTab);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [formError, setFormError] = useState(null);

  const [subjectInput, setSubjectInput] = useState("");
  const [startTimeInput, setStartTimeInput] = useState("");
  const [expectedDurationInHours, setExpectedDurationInHours] = useState("1");
  const [isInPerson, setIsInPerson] = useState(true);
  const [participantSearch, setParticipantSearch] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  const [expandedFutureLessonId, setExpandedFutureLessonId] = useState(null);
  const [expandedAttentionLessonId, setExpandedAttentionLessonId] = useState(null);
  const [completeDialogLesson, setCompleteDialogLesson] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(() => loadSettings().preferredPayment);
  const [paymentNotes, setPaymentNotes] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!paymentTarget) return;
    setPaymentMethod(loadSettings().preferredPayment);
    setPaymentNotes("");
    markPaidMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentTarget?.lessonId, paymentTarget?.studentId]);

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
      const s = loadSettings();
      setFormError(null);
      setDialogOpen(false);
      setSubjectInput("");
      setStartTimeInput("");
      setExpectedDurationInHours(String(s.defaultDurationMinutes / 60));
      setIsInPerson(true);
      setParticipantSearch("");
      setSelectedParticipants([]);
      setExpandedFutureLessonId(null);
      queryClient.invalidateQueries({ queryKey: ["lessonsDashboard"] });
    },
    onError: (err) => setFormError(err?.message || "שגיאה ביצירת השיעור"),
  });

  const updateLessonMutation = useMutation({
    mutationFn: ({ lessonId, payload }) => updateLesson(lessonId, payload),
    onSuccess: () => {
      setFormError(null);
      setDialogOpen(false);
      setEditingLessonId(null);
      setExpandedFutureLessonId(null);
      queryClient.invalidateQueries({ queryKey: ["lessonsDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["readyToCompleteLessons"] });
    },
    onError: (err) => setFormError(err?.message || "שגיאה בשמירה"),
  });

  const cancelLessonMutation = useMutation({
    mutationFn: (lessonId) => cancelLesson(lessonId),
    onSuccess: () => {
      setCancelTarget(null);
      setExpandedFutureLessonId(null);
      setExpandedAttentionLessonId(null);
      queryClient.invalidateQueries({ queryKey: ["lessonsDashboard"] });
    },
    onError: (err) => setFormError(err?.message || "שגיאה בביטול השיעור"),
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ lessonId, studentId, paymentMethod: method, notes }) =>
      markLessonParticipantPaid(lessonId, studentId, { paymentMethod: method, notes }),
    onSuccess: () => {
      setFormError(null);
      setPaymentTarget(null);
      queryClient.invalidateQueries({ queryKey: ["lessonsDashboard"] });
    },
    onError: (err) => setFormError(err?.message || "שגיאה בסימון תשלום"),
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
    const s = loadSettings();
    const defaultHours = String(s.defaultDurationMinutes / 60);
    setFormError(null);
    setDialogMode("create");
    setEditingLessonId(null);
    setSubjectInput("");
    setStartTimeInput(toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000).toISOString()));
    setExpectedDurationInHours(defaultHours);
    setIsInPerson(false);
    setParticipantSearch("");
    setSelectedParticipants([]);
    setDialogOpen(true);
  };

  const openEditDialog = (lesson) => {
    setFormError(null);
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

  return (
    <div className="page-container">

      {/* Page header */}
      <div>
        <h1 className="page-title">לוח שיעורים</h1>
        <p className="page-subtitle">ניהול שיעורים ותשלומים</p>
      </div>

      {dashboardQuery.error ? <Alert severity="error">{dashboardQuery.error.message}</Alert> : null}
      {formError && !dialogOpen ? <Alert severity="error">{formError}</Alert> : null}

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 4, padding: 4, background: "#0c0e12", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { id: "future", label: "שיעורים עתידיים" },
          { id: "attention", label: "טרם שולמו" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setDashboardTab(tab.id)}
            style={{
              flex: 1,
              padding: "0.625rem 0.5rem",
              borderRadius: 12,
              fontFamily: "'Manrope', sans-serif",
              fontSize: "0.8125rem",
              fontWeight: 700,
              transition: "all 0.2s ease",
              background: dashboardTab === tab.id ? "#1c1e24" : "transparent",
              color: dashboardTab === tab.id ? "#a3c9ff" : "rgba(192,199,213,0.5)",
              boxShadow: dashboardTab === tab.id ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lessons list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {dashboardTab === "future" ? (
          <>
            {(dashboardQuery.data?.futureLessons || []).map((lesson) => (
              <LessonCard
                key={lesson.lessonId}
                lesson={lesson}
                isExpanded={expandedFutureLessonId === lesson.lessonId}
                onToggle={() => setExpandedFutureLessonId((prev) => (prev === lesson.lessonId ? null : lesson.lessonId))}
                onComplete={() => setCompleteDialogLesson(lesson)}
                onEdit={() => openEditDialog(lesson)}
                onCancel={() => setCancelTarget(lesson)}
              />
            ))}
            {!dashboardQuery.isLoading && (dashboardQuery.data?.futureLessons || []).length === 0 ? (
              <div style={{ background: "#1c1e24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "2rem", textAlign: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#404753", display: "block", margin: "0 auto 12px" }}>calendar_today</span>
                <p style={{ color: "rgba(192,199,213,0.5)", fontSize: "0.875rem" }}>אין שיעורים עתידיים</p>
              </div>
            ) : null}
          </>
        ) : (
          <>
            {awaitingList.length > 0 ? (
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "rgba(192,199,213,0.45)", letterSpacing: "0.08em", textTransform: "uppercase", paddingRight: 4 }}>
                ממתינים לסיום
              </p>
            ) : null}

            {awaitingList.map((lesson) => (
              <LessonCard
                key={`a-${lesson.lessonId}`}
                lesson={lesson}
                isExpanded={expandedAttentionLessonId === `a-${lesson.lessonId}`}
                accentColor="rgba(255,196,0,0.25)"
                onToggle={() =>
                  setExpandedAttentionLessonId((prev) =>
                    prev === `a-${lesson.lessonId}` ? null : `a-${lesson.lessonId}`
                  )
                }
                onComplete={() => setCompleteDialogLesson(lesson)}
                onEdit={() => openEditDialog(lesson)}
                onCancel={() => setCancelTarget(lesson)}
              />
            ))}

            {unpaidList.length > 0 ? (
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "rgba(192,199,213,0.45)", letterSpacing: "0.08em", textTransform: "uppercase", paddingRight: 4, marginTop: 4 }}>
                יתרה לתשלום
              </p>
            ) : null}

            {unpaidList.map((lesson) => {
              const unpaidParticipants = (lesson.participants || []).filter(
                (p) => !p.isPaid && p.outstandingAmount > 0
              );
              return (
                <div key={lesson.lessonId} className="lesson-card" style={{ cursor: "default" }}>

                  {/* ── Row 1: names + relative time (how long ago) ── */}
                  {(() => {
                    const badge = formatLessonScheduleBadge(lesson);
                    const rt = splitRelativeTime(badge);
                    return (
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.0625rem", color: "#e2e2e8", lineHeight: 1.25, flex: 1, minWidth: 0 }}>
                          {unpaidNamesLine(lesson)}
                        </span>
                        <div style={{ flexShrink: 0, textAlign: "center", minWidth: 58 }}>
                          {rt.number ? (
                            <>
                              <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.625rem", color: "rgba(255,160,100,0.85)", lineHeight: 1 }}>
                                {rt.number} {rt.unit}
                              </p>
                              <p style={{ fontSize: "0.6875rem", color: "rgba(255,160,100,0.5)", marginTop: 2 }}>
                                {rt.prefix}
                              </p>
                            </>
                          ) : (
                            <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.0rem", color: "rgba(255,160,100,0.85)", lineHeight: 1.2 }}>
                              {rt.unit}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Row 2: mode · subject · date+time ── */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 12 }}>
                    <span style={{ display: "none" }}>{/* badge hidden — relative time is shown large in row 1 */}</span>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: "0.6875rem", fontWeight: 600, padding: "2px 8px",
                      borderRadius: 99, fontFamily: "'Inter',sans-serif",
                      background: lesson.isInPerson ? "rgba(163,201,255,0.08)" : "rgba(159,251,0,0.08)",
                      color: lesson.isInPerson ? "rgba(163,201,255,0.75)" : "rgba(159,251,0,0.75)",
                      border: lesson.isInPerson ? "1px solid rgba(163,201,255,0.15)" : "1px solid rgba(159,251,0,0.15)",
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
                        {lesson.isInPerson ? "home" : "videocam"}
                      </span>
                      {lesson.isInPerson ? "פרונטלי" : "זום"}
                    </span>
                    {lesson.subject ? (
                      <span style={{ fontSize: "0.75rem", color: "rgba(192,199,213,0.5)", fontFamily: "'Inter',sans-serif" }}>
                        {lesson.subject}
                      </span>
                    ) : null}
                    <span style={{ marginInlineStart: "auto", fontSize: "0.6875rem", color: "rgba(192,199,213,0.3)", fontFamily: "'Inter',sans-serif" }}>
                      {formatDateTime(lesson.startTime)}
                    </span>
                  </div>

                  {/* ── Participants: amount + pay button ── */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    {unpaidParticipants.map((p) => (
                      <div key={p.studentId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "rgba(192,199,213,0.8)", marginBottom: 2 }}>{p.studentName}</p>
                          <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.25rem", color: "#9ffb00", lineHeight: 1.1 }}>
                            {formatIls(p.outstandingAmount)}
                          </p>
                        </div>
                        <button
                          className="btn-primary-sm"
                          disabled={markPaidMutation.isPending}
                          onClick={() =>
                            setPaymentTarget({
                              lessonId: lesson.lessonId,
                              studentId: p.studentId,
                              studentName: p.studentName,
                              amount: p.outstandingAmount,
                            })
                          }
                        >
                          תשלום בוצע
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {!dashboardQuery.isLoading && awaitingList.length === 0 && unpaidList.length === 0 ? (
              <div style={{ background: "#1c1e24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "2rem", textAlign: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#404753", display: "block", margin: "0 auto 12px" }}>check_circle</span>
                <p style={{ color: "rgba(192,199,213,0.5)", fontSize: "0.875rem" }}>הכל מעודכן — אין פריטים הממתינים לטיפול</p>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openCreateDialog}
        aria-label="הוסף שיעור"
        style={{
          position: "fixed",
          bottom: "6.5rem",
          left: "1.25rem",
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #a3c9ff, #1493ff)",
          boxShadow: "0 8px 30px rgba(20,147,255,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 40,
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(20,147,255,0.45)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(20,147,255,0.35)"; }}
      >
        <span className="material-symbols-outlined" style={{ color: "#002a51", fontSize: 28 }}>add</span>
      </button>

      {/* ── Lesson Complete Dialog ──────────────────────────────── */}
      <LessonCompleteDialog
        open={Boolean(completeDialogLesson)}
        lesson={completeDialogLesson}
        onClose={() => setCompleteDialogLesson(null)}
      />

      {/* ── Cancel Lesson Confirmation Dialog ─────────────────── */}
      <Dialog
        open={Boolean(cancelTarget)}
        onClose={() => { if (!cancelLessonMutation.isPending) setCancelTarget(null); }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ pb: 0.5 }}>
          <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "#c6c6c6", letterSpacing: "-0.02em", margin: 0 }}>
            ביטול שיעור
          </p>
          <p style={{ fontFamily: "'Inter',sans-serif", fontWeight: 400, fontSize: "0.8125rem", color: "rgba(192,199,213,0.65)", marginTop: 4 }}>
            האם אתה בטוח שברצונך לבטל את השיעור?
          </p>
        </DialogTitle>
        <DialogContent>
          {cancelTarget ? (
            <div style={{
              background: "rgba(255,100,80,0.06)",
              border: "1px solid rgba(255,100,80,0.15)",
              borderRadius: 14,
              padding: "14px 16px",
              marginTop: 4,
            }}>
              <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: "1rem", color: "#e2e2e8", marginBottom: 4 }}>
                {participantNamesLine(cancelTarget)}
              </p>
              <p style={{ fontSize: "0.75rem", color: "rgba(192,199,213,0.5)" }}>
                {formatTime(cancelTarget.startTime)} · {formatDateOnly(cancelTarget.startTime)}
                {cancelTarget.subject ? ` · ${cancelTarget.subject}` : ""}
              </p>
            </div>
          ) : null}
          {cancelLessonMutation.isError ? (
            <Alert severity="error" sx={{ mt: 2 }}>{cancelLessonMutation.error?.message}</Alert>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 0.5, gap: 1.5 }}>
          <button
            className="btn-outline-sm"
            style={{ flex: 1, padding: "0.65rem 1rem" }}
            disabled={cancelLessonMutation.isPending}
            onClick={() => setCancelTarget(null)}
          >
            חזרה
          </button>
          <button
            disabled={cancelLessonMutation.isPending}
            onClick={() => cancelLessonMutation.mutate(cancelTarget.lessonId)}
            style={{
              flex: 1,
              padding: "0.65rem 1rem",
              border: "1px solid rgba(255,100,80,0.35)",
              borderRadius: 10,
              background: "rgba(255,100,80,0.1)",
              color: "#ff8070",
              fontFamily: "'Manrope',sans-serif",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
              opacity: cancelLessonMutation.isPending ? 0.5 : 1,
            }}
          >
            {cancelLessonMutation.isPending ? "מבטל..." : "כן, בטל שיעור"}
          </button>
        </DialogActions>
      </Dialog>

      {/* ── Payment Dialog ─────────────────────────────────────── */}
      <Dialog
        open={Boolean(paymentTarget)}
        onClose={() => { if (!markPaidMutation.isPending) setPaymentTarget(null); }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ pb: 0.5 }}>
          <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "#c6c6c6", letterSpacing: "-0.02em", margin: 0 }}>
            תשלום בוצע
          </p>
          <p style={{ fontFamily: "'Inter',sans-serif", fontWeight: 400, fontSize: "0.8125rem", color: "rgba(192,199,213,0.65)", marginTop: 4 }}>
            עדכון יתרת התלמיד לאחר קבלת תשלום
          </p>
        </DialogTitle>

        <DialogContent>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {markPaidMutation.isError ? (
              <Alert severity="error">{markPaidMutation.error?.message}</Alert>
            ) : null}

            {/* Amount card */}
            <div style={{
              background: "rgba(28,30,36,0.95)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20,
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(163,201,255,0.05)", filter: "blur(20px)" }} />
              <span style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(192,199,213,0.6)", marginBottom: 8 }}>
                {paymentTarget?.studentName} · סכום לתשלום
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "2.75rem", color: "#9ffb00", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {Number(paymentTarget?.amount || 0).toFixed(2)}
                </span>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "rgba(159,251,0,0.75)" }}>₪</span>
              </div>
            </div>

            {/* Payment methods — 2×2 grid using flex-wrap */}
            <div>
              <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#e2e2e8", marginBottom: 12 }}>
                אמצעי תשלום
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {PAYMENT_METHODS.map((opt) => {
                  const isSelected = paymentMethod === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setPaymentMethod(opt.id)}
                      style={{
                        width: "calc(50% - 5px)",
                        padding: "14px 8px",
                        borderRadius: 14,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        background: isSelected ? "rgba(20,147,255,0.1)" : "rgba(28,30,36,0.8)",
                        border: isSelected ? "2px solid rgba(20,147,255,0.45)" : "1px solid rgba(255,255,255,0.07)",
                        transition: "all 0.15s ease",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 26,
                          color: isSelected ? "#a3c9ff" : "rgba(192,199,213,0.5)",
                          fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0",
                        }}
                      >
                        {opt.icon}
                      </span>
                      <span style={{
                        fontFamily: "'Manrope',sans-serif",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: isSelected ? "#a3c9ff" : "rgba(192,199,213,0.6)",
                      }}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note */}
            <div>
              <label style={{ display: "block", fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#e2e2e8", marginBottom: 8 }}>
                הערה (אופציונלי)
              </label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="הוסף הערה לגבי התשלום..."
                rows={3}
                maxLength={500}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#0c0e12",
                  border: "1px solid rgba(64,71,83,0.6)",
                  borderRadius: 14,
                  padding: "12px 14px",
                  color: "#e2e2e8",
                  fontSize: "0.875rem",
                  fontFamily: "'Inter',sans-serif",
                  resize: "none",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(163,201,255,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(64,71,83,0.6)")}
              />
            </div>
          </div>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 0.5, flexDirection: "column", gap: 1 }}>
          <button
            className="btn-primary"
            disabled={markPaidMutation.isPending || !paymentTarget}
            onClick={() => {
              if (!paymentTarget) return;
              markPaidMutation.mutate({
                lessonId: paymentTarget.lessonId,
                studentId: paymentTarget.studentId,
                paymentMethod,
                notes: paymentNotes,
              });
            }}
          >
            {markPaidMutation.isPending ? "מעדכן..." : "אישור"}
          </button>
          <button
            disabled={markPaidMutation.isPending}
            onClick={() => setPaymentTarget(null)}
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

      {/* ── Create / Edit Lesson Dialog ────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{dialogMode === "create" ? "הוספת שיעור" : "עריכת שיעור"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          {formError && dialogOpen ? <Alert severity="error">{formError}</Alert> : null}

          <Autocomplete
            multiple
            disableCloseOnSelect
            filterSelectedOptions
            options={mergedParticipantOptions}
            value={selectedParticipants}
            onChange={(_, value) => { setSelectedParticipants(value); setParticipantSearch(""); }}
            inputValue={participantSearch}
            onInputChange={(_, value, reason) => {
              if (reason === "input" || reason === "clear") setParticipantSearch(value);
            }}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            filterOptions={(options) => options}
            loading={studentOptionsQuery.isFetching}
            noOptionsText={studentOptionsQuery.isFetching ? "מחפש..." : "אין התאמות — נסו חיפוש אחר"}
            renderInput={(params) => (
              <TextField
                {...params}
                label="תלמידים (חובה)"
                placeholder="הקלידו לחיפוש ובחרו מהרשימה"
                helperText="בחרו תלמיד אחד או יותר"
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

          <Autocomplete
            freeSolo
            options={SUBJECT_SUGGESTIONS}
            inputValue={subjectInput}
            onInputChange={(_, value, reason) => {
              if (reason === "input" || reason === "clear" || reason === "reset") setSubjectInput(value ?? "");
            }}
            renderInput={(params) => (
              <TextField {...params} label="נושא" inputProps={{ ...params.inputProps, maxLength: 120 }} />
            )}
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
            label="שיעור פרונטלי (ניווט Waze)"
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <button className="btn-outline-sm" style={{ padding: "0.6rem 1.25rem" }} onClick={() => setDialogOpen(false)}>
            ביטול
          </button>
          <button
            className="btn-primary-sm"
            style={{ flex: 1, padding: "0.6rem 1rem" }}
            disabled={!canSubmit || createLessonMutation.isPending || updateLessonMutation.isPending}
            onClick={() => {
              setFormError(null);
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
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
