import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTeacherProfile } from "../api/teacherApi";
import { getAnalytics } from "../api/analyticsApi";
import { loadSettings, saveSettings } from "../utils/settings";
import { PAYMENT_METHODS as ALL_PAYMENT_METHODS } from "../utils/paymentMethods";

// Settings only shows the 3 primary methods (no "אחר")
const PAYMENT_METHODS = ALL_PAYMENT_METHODS.filter((m) => m.id !== "אחר");

const DURATIONS = [45, 60, 90, 120];

/* ── Avatar initials ── */
function Avatar({ name, size = 96 }) {
  const initials = (name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 20, flexShrink: 0,
      background: "linear-gradient(135deg,#1a3a5c,#0d2340)",
      border: "3px solid rgba(20,147,255,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Manrope',sans-serif", fontWeight: 800,
      fontSize: size * 0.33, color: "#a3c9ff",
    }}>
      {initials}
    </div>
  );
}

/* ── Section heading ── */
function SectionTitle({ children }) {
  return (
    <h3 style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: "1.0625rem", color: "#1493ff", margin: "0 0 16px 8px" }}>
      {children}
    </h3>
  );
}

/* ── Card container ── */
const card = {
  background: "#1c1e22",
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.06)",
  padding: "24px 20px",
};

export function SettingsPage() {
  const [form, setForm] = useState(() => loadSettings());
  const [saved, setSaved] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["teacher-profile"],
    queryFn: getTeacherProfile,
    staleTime: Infinity,
  });

  const analyticsQuery = useQuery({
    queryKey: ["analytics", "month"],
    queryFn: () => getAnalytics("month"),
    staleTime: 60_000,
  });

  const teacher = profileQuery.data ?? { name: "—", email: "—" };
  const currentIncome = analyticsQuery.data?.totalIncome ?? 0;
  const goalPct = form.monthlyGoal > 0
    ? Math.min(Math.round((currentIncome / form.monthlyGoal) * 100), 100)
    : 0;

  const patch = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="page-container" style={{ paddingBottom: 110 }}>

      {/* ── Profile ─────────────────────────────────────────── */}
      <section style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Avatar name={teacher.name} />
          <button style={{
            position: "absolute", bottom: -8, right: -8,
            width: 32, height: 32, borderRadius: 10,
            background: "#1493ff", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(20,147,255,0.4)",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#fff" }}>edit</span>
          </button>
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "#fff", margin: "0 0 4px 0", lineHeight: 1.2 }}>
            {teacher.name}
          </h2>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.875rem", color: "rgba(192,199,213,0.55)", margin: 0, wordBreak: "break-all" }}>
            {teacher.email}
          </p>
        </div>
      </section>

      {/* ── Default lesson settings ──────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <SectionTitle>הגדרות שיעור ברירת מחדל</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

          {/* Price */}
          <div style={card}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(192,199,213,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              מחיר שיעור בסיסי
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.25rem", color: "#1493ff" }}>₪</span>
              <input
                type="number"
                value={form.defaultHourlyPrice}
                onChange={(e) => patch("defaultHourlyPrice", Number(e.target.value))}
                style={{
                  background: "transparent", border: "none", outline: "none", padding: 0,
                  fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#fff",
                  width: "100%", MozAppearance: "textfield",
                }}
              />
            </div>
          </div>

          {/* Duration */}
          <div style={card}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(192,199,213,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              משך שיעור (דקות)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#1493ff" }}>schedule</span>
              <select
                value={form.defaultDurationMinutes}
                onChange={(e) => patch("defaultDurationMinutes", Number(e.target.value))}
                style={{
                  background: "transparent", border: "none", outline: "none", padding: 0,
                  fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#fff",
                  width: "100%", appearance: "none", WebkitAppearance: "none", cursor: "pointer",
                }}
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d} style={{ background: "#1e2024", color: "#e2e2e8" }}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── Financial goal ───────────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ ...card, position: "relative", overflow: "hidden" }}>
          {/* subtle bg blob */}
          <div style={{ position: "absolute", top: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(20,147,255,0.04)", pointerEvents: "none" }} />
          <SectionTitle>יעדים פיננסיים</SectionTitle>
          <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(192,199,213,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            יעד הכנסה חודשי
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.2)", borderRadius: 14, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "#1493ff" }}>₪</span>
            <input
              type="number"
              value={form.monthlyGoal}
              onChange={(e) => patch("monthlyGoal", Number(e.target.value))}
              style={{
                background: "transparent", border: "none", outline: "none", padding: 0,
                fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "2.25rem", color: "#fff",
                width: "100%", MozAppearance: "textfield",
              }}
            />
          </div>
          {/* Progress bar */}
          <div style={{ width: "100%", height: 10, background: "rgba(0,0,0,0.4)", borderRadius: 99, overflow: "hidden", marginBottom: 10 }}>
            <div style={{
              height: "100%", borderRadius: 99,
              width: `${goalPct}%`,
              background: "linear-gradient(90deg,#6abf00,#9ffb00)",
              boxShadow: "0 0 14px rgba(159,251,0,0.35)",
              transition: "width 0.8s ease",
            }} />
          </div>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "rgba(192,199,213,0.45)", fontWeight: 500, textAlign: "left" }}>
            {goalPct}% מהיעד הושג החודש
          </p>
        </div>
      </section>

      {/* ── Payment preferences ──────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <SectionTitle>אמצעי תשלום מועדף</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {PAYMENT_METHODS.map((pm) => {
            const active = form.preferredPayment === pm.id;
            return (
              <button
                key={pm.id}
                onClick={() => patch("preferredPayment", pm.id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 10, padding: "24px 8px", borderRadius: 18, cursor: "pointer",
                  border: active ? "1px solid rgba(20,147,255,0.5)" : "1px solid rgba(255,255,255,0.06)",
                  background: active ? "linear-gradient(160deg,#1493ff,#0060ab)" : "#1c1e22",
                  color: active ? "#fff" : "rgba(192,199,213,0.7)",
                  fontFamily: "'Inter',sans-serif", fontWeight: active ? 700 : 500, fontSize: "0.8125rem",
                  boxShadow: active ? "0 8px 24px rgba(20,147,255,0.25)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span className="material-symbols-outlined" style={{
                  fontSize: 28,
                  fontVariationSettings: active ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400",
                }}>
                  {pm.icon}
                </span>
                {pm.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── App settings ─────────────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ background: "#1c1e22", borderRadius: 20, border: "1px solid rgba(255,255,255,0.06)", padding: "6px 8px" }}>

          {/* Notifications toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px", borderRadius: 14, cursor: "pointer" }}
            onClick={() => patch("notificationsEnabled", !form.notificationsEnabled)}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#282a2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "rgba(192,199,213,0.6)" }}>notifications</span>
              </div>
              <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: "0.9375rem", color: "#e2e2e8" }}>התראות דחיפה</span>
            </div>
            {/* Toggle pill */}
            <div style={{
              width: 44, height: 26, borderRadius: 99, position: "relative",
              background: form.notificationsEnabled ? "#9ffb00" : "rgba(255,255,255,0.12)",
              transition: "background 0.2s ease", flexShrink: 0,
            }}>
              <div style={{
                position: "absolute", top: 3,
                right: form.notificationsEnabled ? 3 : undefined,
                left: form.notificationsEnabled ? undefined : 3,
                width: 20, height: 20, borderRadius: "50%",
                background: form.notificationsEnabled ? "#102000" : "#8a919f",
                transition: "all 0.2s ease",
              }} />
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "0 12px" }} />

          {/* Dark mode — locked */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px", borderRadius: 14, opacity: 0.55 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#282a2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "rgba(192,199,213,0.6)" }}>dark_mode</span>
              </div>
              <div>
                <p style={{ fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: "0.9rem", color: "#e2e2e8", margin: 0 }}>מצב תצוגה</p>
                <p style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: "0.625rem", color: "#9ffb00", letterSpacing: "0.08em", textTransform: "uppercase", margin: "2px 0 0" }}>
                  נעול ל-Dark Mode
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "rgba(192,199,213,0.4)" }}>lock</span>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "0 12px" }} />

          {/* Language — locked */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 12px", borderRadius: 14, opacity: 0.55 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#282a2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "rgba(192,199,213,0.6)" }}>language</span>
              </div>
              <div>
                <p style={{ fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: "0.9rem", color: "#e2e2e8", margin: 0 }}>שפת האפליקציה</p>
                <p style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: "0.625rem", color: "#9ffb00", letterSpacing: "0.08em", textTransform: "uppercase", margin: "2px 0 0" }}>
                  עברית (נעול)
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "rgba(192,199,213,0.4)" }}>lock</span>
          </div>
        </div>
      </section>

      {/* ── Action buttons ───────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <button
          onClick={handleSave}
          style={{
            width: "100%", padding: "18px 0", borderRadius: 20, border: "none", cursor: "pointer",
            background: saved ? "linear-gradient(135deg,#3a8c00,#6abf00)" : "linear-gradient(135deg,#1493ff,#0060ab)",
            color: "#fff", fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.125rem",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: saved ? "0 8px 24px rgba(106,191,0,0.3)" : "0 8px 24px rgba(20,147,255,0.3)",
            transition: "all 0.3s ease",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>
            {saved ? "check_circle" : "save"}
          </span>
          {saved ? "השינויים נשמרו!" : "שמירת שינויים"}
        </button>

        <button
          style={{
            width: "100%", padding: "16px 0", borderRadius: 20, cursor: "pointer",
            background: "transparent", border: "1px solid rgba(255,180,171,0.25)",
            color: "#ffb4ab", fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1rem",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,180,171,0.06)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
          התנתקות מהמערכת
        </button>

        <p style={{ textAlign: "center", fontFamily: "'Inter',sans-serif", fontSize: 10, fontWeight: 700, color: "rgba(192,199,213,0.25)", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 4 }}>
          TUTORTALLY V2.4.0 · 2024
        </p>
      </div>
    </div>
  );
}
