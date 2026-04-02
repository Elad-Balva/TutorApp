import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import { useStudentDebt } from "../hooks/useStudentDebt";

export function StudentDashboardPage({ student }) {
  const debtQuery = useStudentDebt(student.id);

  return (
    <Box sx={{ p: 2, display: "grid", gap: 2 }}>
      <Card>
        <CardContent>
          <Typography variant="h6">{student.name}</Typography>
          <Typography variant="body2">{student.phoneNumber || "No phone"}</Typography>
          <Chip
            label={student.isActive ? "Active" : "Inactive"}
            color={student.isActive ? "success" : "default"}
            sx={{ mt: 1, minHeight: 36 }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1">Current Debt</Typography>
          <Typography variant="h4">
            {debtQuery.isLoading ? "..." : `${Number(debtQuery.data?.debt || 0).toFixed(2)} USD`}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
