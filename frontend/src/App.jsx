import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import { MainDashboardPage } from "./pages/MainDashboardPage";
import { StudentsPage } from "./pages/StudentsPage";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  const [openMenu, setOpenMenu] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <QueryClientProvider client={queryClient}>
      <CssBaseline />
      <AppBar position="sticky">
        <Toolbar sx={{ justifyContent: "space-between", gap: 1 }}>
          <IconButton color="inherit" edge="start" onClick={() => setOpenMenu(true)} aria-label="תפריט">
            ☰
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: "end" }}>
            TutorApp
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={openMenu} onClose={() => setOpenMenu(false)}>
        <Box sx={{ width: 260, pt: 2 }}>
          <List>
            <ListItemButton
              selected={activePage === "dashboard"}
              onClick={() => {
                setActivePage("dashboard");
                setOpenMenu(false);
              }}
            >
              <ListItemText primary="לוח בקרה" />
            </ListItemButton>
            <ListItemButton
              selected={activePage === "students"}
              onClick={() => {
                setActivePage("students");
                setOpenMenu(false);
              }}
            >
              <ListItemText primary="תלמידים" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ textAlign: "start" }}>
        {activePage === "dashboard" ? <MainDashboardPage /> : <StudentsPage />}
      </Box>
    </QueryClientProvider>
  );
}

export default App;
