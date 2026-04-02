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
import { LessonCompletionPage } from "./pages/LessonCompletionPage";
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
        <Toolbar>
          <IconButton color="inherit" onClick={() => setOpenMenu(true)} sx={{ mr: 1 }}>
            ☰
          </IconButton>
          <Typography variant="h6">TutorApp</Typography>
        </Toolbar>
      </AppBar>

      <Drawer open={openMenu} onClose={() => setOpenMenu(false)}>
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
              selected={activePage === "completeLesson"}
              onClick={() => {
                setActivePage("completeLesson");
                setOpenMenu(false);
              }}
            >
              <ListItemText primary="סיום שיעור" />
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

      <Box dir="rtl">
        {activePage === "dashboard" ? (
          <MainDashboardPage />
        ) : activePage === "students" ? (
          <StudentsPage />
        ) : (
          <LessonCompletionPage />
        )}
      </Box>
    </QueryClientProvider>
  );
}

export default App;
