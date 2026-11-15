import { TextField } from "@mui/material";

export function ParticipantEditorRow({ row, onChange }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: "14px 16px",
    }}>
      {/* Student header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "#282a2e", border: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "rgba(192,199,213,0.35)" }}>person</span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#e2e2e8" }}>
            {row.studentName}
          </p>
          <p style={{ fontSize: "0.6875rem", color: "rgba(192,199,213,0.45)" }}>תלמיד פעיל</p>
        </div>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
      </div>

      {/* Fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <TextField
          label="מחיר לשעה (₪)"
          type="number"
          value={row.hourlyPrice}
          size="small"
          inputProps={{ min: 0, step: 0.5 }}
          onChange={(e) => onChange({ ...row, hourlyPrice: Number(e.target.value) })}
        />
        <TextField
          label="משך (שעות)"
          type="number"
          value={row.durationInHours}
          size="small"
          inputProps={{ min: 0.25, max: 24, step: 0.25 }}
          onChange={(e) => onChange({ ...row, durationInHours: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}
