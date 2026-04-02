import { Box, TextField, Typography } from "@mui/material";

export function ParticipantEditorRow({ row, onChange }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
      <Typography sx={{ alignSelf: "center", minHeight: 44 }}>{row.studentName}</Typography>
      <TextField
        label="Price / hour"
        type="number"
        value={row.hourlyPrice}
        inputProps={{ min: 0, step: 0.5 }}
        onChange={(e) => onChange({ ...row, hourlyPrice: Number(e.target.value) })}
      />
      <TextField
        label="Duration (hours)"
        type="number"
        value={row.durationInHours}
        inputProps={{ min: 0.25, max: 24, step: 0.25 }}
        onChange={(e) => onChange({ ...row, durationInHours: Number(e.target.value) })}
      />
    </Box>
  );
}
