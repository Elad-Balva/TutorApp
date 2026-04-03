import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAnalytics } from "../api/analyticsApi";

const MONTHLY_GOAL = 18000;

const PERIODS = [
  { id: "week",  label: "שבוע" },
  { id: "month", label: "חודש" },
  { id: "year",  label: "שנה"  },
  { id: "all",   label: "הכל"  },
];

const formatIls = (v) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(v ?? 0);

/* ── Thin section heading with vertical accent bar ── */
function SectionHeading({ label, color = "#a3c9ff" }) {
  return (
    <h3 style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: "1.0625rem", color: "#e2e2e8", margin: 0 }}>
      <span style={{ width: 5, height: 24, borderRadius: 99, background: color, flexShrink: 0 }} />
      {label}
    </h3>
  );
}

/* ── Avatar initials circle ── */
function Avatar({ name, size = 44 }) {
  const initials = (name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const hue = ((name ?? "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 37) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: 12, flexShrink: 0,
      background: `hsl(${hue},35%,22%)`,
      border: `1px solid hsl(${hue},40%,35%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Manrope',sans-serif", fontWeight: 800,
      fontSize: size * 0.35, color: `hsl(${hue},65%,75%)`,
    }}>
      {initials}
    </div>
  );
}

/* ── Bar chart (pure CSS) ── */
function BarChart({ data }) {
  const maxVal = Math.max(...data.map((d) => d.amount), 1);
  const lastIdx = data.length - 1;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
        {data.map((d, i) => {
          const pct = Math.max((d.amount / maxVal) * 100, d.amount > 0 ? 6 : 2);
          const isLast = i === lastIdx;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
              <div style={{
                width: "100%", borderRadius: "6px 6px 0 0",
                height: `${pct}%`,
                background: isLast
                  ? "linear-gradient(180deg,#1493ff 0%,#0060ab 100%)"
                  : "rgba(163,201,255,0.15)",
                boxShadow: isLast ? "0 0 18px rgba(20,147,255,0.35)" : "none",
                transition: "height 0.6s ease",
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        {data.map((d, i) => (
          <span key={i} style={{
            flex: 1, textAlign: "center",
            fontFamily: "'Inter',sans-serif", fontSize: 9, fontWeight: 700,
            color: i === lastIdx ? "rgba(163,201,255,0.7)" : "rgba(192,199,213,0.3)",
            letterSpacing: "0.06em",
          }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Skeleton pulse loader ── */
function Skeleton({ width = "100%", height = 18, radius = 8 }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: "rgba(255,255,255,0.06)",
      animation: "pulse 1.6s ease-in-out infinite",
    }} />
  );
}

/* ── Main page ── */
export function InsightsPage() {
  const [period, setPeriod] = useState("month");
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", period],
    queryFn: () => getAnalytics(period),
    staleTime: 60_000,
  });

  const goalPct = data ? Math.min(Math.round((data.totalIncome / MONTHLY_GOAL) * 100), 100) : 0;
  const changePositive = (data?.incomeChangePercent ?? 0) >= 0;

  return (
    <div className="page-container" style={{ paddingBottom: 100 }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes barIn { from{height:0} to{height:var(--h)} }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.875rem", color: "#c6c6c6", lineHeight: 1.15, marginBottom: 6 }}>
          תובנות וביצועים
        </h1>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.875rem", color: "rgba(192,199,213,0.5)", margin: 0 }}>
          סקירה של הפעילות העסקית שלך
        </p>
      </div>

      {/* ── Period filter ── */}
      <div style={{ display: "flex", padding: 4, background: "#0c0e12", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 28 }}>
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            style={{
              flex: 1, padding: "8px 4px", borderRadius: 12, border: "none", cursor: "pointer",
              fontFamily: "'Inter',sans-serif", fontSize: "0.8125rem", fontWeight: 700,
              background: period === p.id ? "#1493ff" : "transparent",
              color: period === p.id ? "#fff" : "rgba(192,199,213,0.45)",
              transition: "all 0.15s ease",
              boxShadow: period === p.id ? "0 2px 12px rgba(20,147,255,0.35)" : "none",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Monthly goal (only shown for "month") ── */}
      {period === "month" && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ marginBottom: 14 }}>
            <SectionHeading label="יעד חודשי" color="#a3c9ff" />
          </div>
          <div style={{
            background: "rgba(28,30,36,0.9)", backdropFilter: "blur(20px)",
            borderRadius: 24, padding: "24px 20px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
              <div>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(192,199,213,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                  הכנסה נוכחית
                </p>
                {isLoading
                  ? <Skeleton width={120} height={28} />
                  : <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "#fff", margin: 0 }}>{formatIls(data?.totalIncome)}</p>
                }
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(192,199,213,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                  יעד: {formatIls(MONTHLY_GOAL)}
                </p>
                {isLoading
                  ? <Skeleton width={70} height={16} />
                  : <p style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: "0.875rem", color: "#a3c9ff", margin: 0 }}>{goalPct}% הושלמו</p>
                }
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ width: "100%", height: 10, background: "#333539", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 99,
                width: isLoading ? "0%" : `${goalPct}%`,
                background: "linear-gradient(90deg, #0060ab, #1493ff)",
                boxShadow: "0 0 14px rgba(163,201,255,0.4)",
                transition: "width 1s ease",
              }} />
            </div>
          </div>
        </section>
      )}

      {/* ── Financial overview ── */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ marginBottom: 14 }}>
          <SectionHeading label="סקירה פיננסית" color="#1493ff" />
        </div>
        <div style={{
          background: "rgba(28,30,36,0.9)", backdropFilter: "blur(20px)",
          borderRadius: 24, padding: "24px 20px",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          {/* Total + change badge */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.6875rem", fontWeight: 600, color: "rgba(192,199,213,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              סה״כ הכנסות
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {isLoading
                ? <Skeleton width={150} height={40} />
                : (
                  <>
                    <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "2.5rem", color: "#fff", lineHeight: 1 }}>
                      {formatIls(data?.totalIncome)}
                    </span>
                    {data?.incomeChangePercent != null && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 3,
                        fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: "0.8125rem",
                        padding: "4px 10px", borderRadius: 8,
                        background: changePositive ? "rgba(159,251,0,0.1)" : "rgba(255,75,75,0.1)",
                        color: changePositive ? "#9ffb00" : "#ff4b4b",
                        border: changePositive ? "1px solid rgba(159,251,0,0.2)" : "1px solid rgba(255,75,75,0.2)",
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          {changePositive ? "trending_up" : "trending_down"}
                        </span>
                        {Math.abs(data.incomeChangePercent)}%
                      </span>
                    )}
                  </>
                )
              }
            </div>
          </div>

          {/* Bar chart */}
          {isLoading
            ? (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: `${[40, 55, 45, 70, 85, 100][i]}%`, background: "rgba(255,255,255,0.05)", borderRadius: "6px 6px 0 0" }} />
                ))}
              </div>
            )
            : <BarChart data={data?.monthlyBreakdown ?? []} />
          }
        </div>
      </section>

      {/* ── Student performance stats ── */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ marginBottom: 14 }}>
          <SectionHeading label="ביצועי תלמידים" color="#9ffb00" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* New students */}
          <div style={{ background: "#1a1c20", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "rgba(159,251,0,0.08)", border: "1px solid rgba(159,251,0,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#9ffb00" }}>person_add</span>
            </div>
            <div>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.625rem", fontWeight: 600, color: "rgba(192,199,213,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                תלמידים חדשים
              </p>
              {isLoading
                ? <Skeleton width={50} height={28} />
                : <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "#fff", margin: 0 }}>{data?.newStudentsCount ?? 0}+</p>
              }
            </div>
          </div>

          {/* Cancelled lessons */}
          <div style={{ background: "#1a1c20", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "rgba(255,180,171,0.08)", border: "1px solid rgba(255,180,171,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#ffb4ab" }}>event_busy</span>
            </div>
            <div>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.625rem", fontWeight: 600, color: "rgba(192,199,213,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                שיעורים שבוטלו
              </p>
              {isLoading
                ? <Skeleton width={50} height={28} />
                : (() => {
                  const total = (data?.totalCompletedLessons ?? 0) + (data?.cancelledLessonsCount ?? 0);
                  const pct = total > 0 ? Math.round((data.cancelledLessonsCount / total) * 100) : 0;
                  return (
                    <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "#fff", margin: 0 }}>
                      {pct}%
                    </p>
                  );
                })()
              }
            </div>
          </div>
        </div>
      </section>

      {/* ── Top students ── */}
      <section>
        <div style={{ marginBottom: 14 }}>
          <SectionHeading label="תלמידים מובילים" color="#a3c9ff" />
        </div>
        <div style={{ background: "#1a1c20", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, overflow: "hidden" }}>
          {isLoading ? (
            <div style={{ padding: "20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Skeleton width={44} height={44} radius={12} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <Skeleton width="60%" height={14} />
                    <Skeleton width="40%" height={11} />
                  </div>
                  <Skeleton width={70} height={20} />
                </div>
              ))}
            </div>
          ) : !data?.topStudents?.length ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#404753", display: "block", marginBottom: 10 }}>group</span>
              <p style={{ color: "rgba(192,199,213,0.45)", fontSize: "0.875rem", fontFamily: "'Inter',sans-serif" }}>
                אין נתוני תשלומים לתקופה זו
              </p>
            </div>
          ) : (
            <div>
              {data.topStudents.map((student, idx) => (
                <div
                  key={student.studentId}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 16px", gap: 12,
                    borderBottom: idx < data.topStudents.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    transition: "background 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={student.name} />
                    <div>
                      <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#e2e2e8", margin: 0, marginBottom: 3 }}>
                        {student.name}
                      </p>
                      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.75rem", color: "rgba(192,199,213,0.45)", margin: 0 }}>
                        {student.lessonCount} שיעורים
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "left", flexShrink: 0 }}>
                    <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1rem", color: "#fff", margin: 0, marginBottom: 3 }}>
                      {formatIls(student.totalPaid)}
                    </p>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "0.6875rem", fontWeight: 700, margin: 0, color: student.isFullyPaid ? "#9ffb00" : "rgba(255,160,100,0.8)" }}>
                      {student.isFullyPaid ? "שולם במלואו" : "יתרה לתשלום"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
