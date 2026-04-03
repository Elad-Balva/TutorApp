import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { CssBaseline } from "@mui/material";
import { MainDashboardPage } from "./pages/MainDashboardPage";
import { StudentsPage } from "./pages/StudentsPage";
import { InsightsPage } from "./pages/InsightsPage";
import { SettingsPage } from "./pages/SettingsPage";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

const TABS = [
  { id: "settings",  label: "הגדרות",  icon: "settings"    },
  { id: "insights",  label: "תובנות",  icon: "leaderboard" },
  { id: "students",  label: "תלמידים", icon: "group"       },
  { id: "dashboard", label: "שיעורים", icon: "dashboard"   },
];

/* Nav item tab button — fully inline-styled to avoid preflight/Tailwind conflicts */
function NavTab({ tab, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        padding: "6px 16px",
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        background: isActive ? "rgba(20,147,255,0.12)" : "transparent",
        color: isActive ? "#1493ff" : "rgba(192,199,213,0.35)",
        transition: "all 0.15s ease",
        WebkitTapHighlightColor: "transparent",
        minWidth: 56,
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: 24,
          lineHeight: 1,
          display: "block",
          fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400",
          color: "inherit",
        }}
      >
        {tab.icon}
      </span>
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.05em",
        lineHeight: 1,
        color: "inherit",
        direction: "rtl",
      }}>
        {tab.label}
      </span>
    </button>
  );
}

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <QueryClientProvider client={queryClient}>
      <CssBaseline />

      {/* ── Top App Bar ─────────────────────────────────────── */}
      <header style={{
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 50,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        background: "rgba(17,19,23,0.75)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        {/* Logo only — no text */}
        <img
          src="/logo.png"
          alt="TutorTally"
          style={{ height: 32, width: 32, borderRadius: 8, objectFit: "contain" }}
        />

        {/* Right side controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button style={{
            padding: 8, borderRadius: 10, border: "none", background: "none",
            cursor: "pointer", color: "rgba(192,199,213,0.4)",
            transition: "color 0.15s ease",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, display: "block" }}>notifications</span>
          </button>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "#282a2e", border: "1px solid rgba(255,255,255,0.08)",
          }} />
        </div>
      </header>

      {/* ── Page Content ────────────────────────────────────── */}
      <main style={{ flex: 1 }}>
        {activePage === "dashboard" && <MainDashboardPage />}
        {activePage === "insights"  && <InsightsPage />}
        {activePage === "students"  && <StudentsPage />}
        {activePage === "settings"  && <SettingsPage />}
      </main>

      {/* ── Bottom Navigation ───────────────────────────────── */}
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "8px 8px max(20px, env(safe-area-inset-bottom))",
        background: "rgba(17,19,23,0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
        zIndex: 50,
      }}>
        {TABS.map((tab) => (
          <NavTab
            key={tab.id}
            tab={tab}
            isActive={activePage === tab.id}
            onClick={() => setActivePage(tab.id)}
          />
        ))}
      </nav>
    </QueryClientProvider>
  );
}

export default App;
