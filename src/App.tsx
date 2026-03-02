import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "@/contexts/UserContext";
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
import Login from "@/pages/Login";
import Onboarding from "@/pages/Onboarding";
import Profile from "@/pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, profile } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If profile exists but onboarding not completed, redirect to onboarding
  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function OnboardingRoute() {
  const { isAuthenticated, loading, profile } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (profile?.onboarding_completed) return <Navigate to="/" replace />;

  return <Onboarding />;
}

function LoginRoute() {
  const { isAuthenticated, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/" replace />;

  return <Login />;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginRoute />} />
    <Route path="/onboarding" element={<OnboardingRoute />} />
    <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
    <Route path="/session/start" element={<ProtectedRoute><AppLayout><StartSession /></AppLayout></ProtectedRoute>} />
    <Route path="/session/debrief/:sessionId" element={<ProtectedRoute><AppLayout><SessionDebrief /></AppLayout></ProtectedRoute>} />
    <Route path="/session/quiz/:sessionId" element={<ProtectedRoute><AppLayout><MicroCheck /></AppLayout></ProtectedRoute>} />
    <Route path="/history" element={<ProtectedRoute><AppLayout><SessionHistory /></AppLayout></ProtectedRoute>} />
    <Route path="/history/:sessionId" element={<ProtectedRoute><AppLayout><SessionHistory /></AppLayout></ProtectedRoute>} />
    <Route path="/config" element={<ProtectedRoute><AppLayout><ConfigPage /></AppLayout></ProtectedRoute>} />
    <Route path="/subject/:subjectId" element={<ProtectedRoute><AppLayout><SubjectDetail /></AppLayout></ProtectedRoute>} />
    <Route path="/manage/subjects" element={<ProtectedRoute><AppLayout><ManageSubjects /></AppLayout></ProtectedRoute>} />
    <Route path="/log/manual" element={<ProtectedRoute><AppLayout><ManualLog /></AppLayout></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UserProvider>
          <AppRoutes />
        </UserProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
