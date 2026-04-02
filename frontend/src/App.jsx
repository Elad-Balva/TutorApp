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
import "./App.css";

const queryClient = new QueryClient();

const demoParticipants = [
  {
    studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    studentName: "Demo Student",
    hourlyPrice: 50,
    durationInHours: 1,
  },
  {
    studentId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    studentName: "Second Student",
    hourlyPrice: 45,
    durationInHours: 1.5,
  },
];

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
              <ListItemText primary="Dashboard" />
            </ListItemButton>
            <ListItemButton
              selected={activePage === "completeLesson"}
              onClick={() => {
                setActivePage("completeLesson");
                setOpenMenu(false);
              }}
            >
              <ListItemText primary="Complete Lesson" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {activePage === "dashboard" ? (
        <MainDashboardPage />
      ) : (
        <LessonCompletionPage
          lessonId="cccccccc-cccc-cccc-cccc-cccccccccccc"
          initialParticipants={demoParticipants}
        />
      )}
    </QueryClientProvider>
  );
}

export default App;
