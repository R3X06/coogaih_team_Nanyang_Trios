import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import StartSession from "@/pages/StartSession";
import SessionDebrief from "@/pages/SessionDebrief";
import MicroCheck from "@/pages/MicroCheck";
import SessionHistory from "@/pages/SessionHistory";
import ConfigPage from "@/pages/ConfigPage";
import SubjectDetail from "@/pages/SubjectDetail";
import ManageSubjects from "@/pages/ManageSubjects";
import ManualLog from "@/pages/ManualLog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UserProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/session/start" element={<StartSession />} />
              <Route path="/session/debrief/:sessionId" element={<SessionDebrief />} />
              <Route path="/session/quiz/:sessionId" element={<MicroCheck />} />
              <Route path="/history" element={<SessionHistory />} />
              <Route path="/history/:sessionId" element={<SessionHistory />} />
              <Route path="/config" element={<ConfigPage />} />
              <Route path="/subject/:subjectId" element={<SubjectDetail />} />
              <Route path="/manage/subjects" element={<ManageSubjects />} />
              <Route path="/log/manual" element={<ManualLog />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </UserProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
