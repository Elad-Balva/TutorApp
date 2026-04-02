import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";
import { createStudent } from "../api/studentsApi";

export function AddStudentPage() {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [baseHourlyPrice, setBaseHourlyPrice] = useState("120");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      createStudent({
        name: name.trim(),
        phoneNumber: phoneNumber.trim() || null,
        baseHourlyPrice: Number(baseHourlyPrice),
      }),
    onSuccess: () => {
      setName("");
      setPhoneNumber("");
      setBaseHourlyPrice("120");
      queryClient.invalidateQueries({ queryKey: ["studentOptions"] });
    },
  });

  const canSubmit = name.trim().length > 0 && !Number.isNaN(Number(baseHourlyPrice)) && Number(baseHourlyPrice) >= 0;

  return (
    <Box sx={{ p: 2, display: "grid", gap: 2 }}>
      <Typography variant="h5" fontWeight={600}>
        Add Student
      </Typography>

      {mutation.error ? <Alert severity="error">{mutation.error.message}</Alert> : null}
      {mutation.isSuccess ? <Alert severity="success">Student saved.</Alert> : null}

      <Card>
        <CardContent sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            inputProps={{ maxLength: 120 }}
          />
          <TextField
            label="Phone (optional)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            inputProps={{ maxLength: 30 }}
          />
          <TextField
            label="Base hourly price (₪)"
            type="number"
            value={baseHourlyPrice}
            onChange={(e) => setBaseHourlyPrice(e.target.value)}
            inputProps={{ min: 0, step: 1 }}
          />
          <Button
            variant="contained"
            size="large"
            disabled={!canSubmit || mutation.isPending}
            onClick={() => mutation.mutate()}
            sx={{ minHeight: 48 }}
          >
            Save Student
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
