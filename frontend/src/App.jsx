import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, Divider } from "@mui/material";
import { StudentDashboardPage } from "./pages/StudentDashboardPage";
import { LessonCompletionPage } from "./pages/LessonCompletionPage";
import "./App.css";

const queryClient = new QueryClient();

const demoStudent = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  name: "Demo Student",
  phoneNumber: "050-123-4567",
  isActive: true,
};

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
  return (
    <QueryClientProvider client={queryClient}>
      <CssBaseline />
      <StudentDashboardPage student={demoStudent} />
      <Divider sx={{ my: 2 }} />
      <LessonCompletionPage
        lessonId="cccccccc-cccc-cccc-cccc-cccccccccccc"
        initialParticipants={demoParticipants}
      />
    </QueryClientProvider>
  );
}

export default App;
