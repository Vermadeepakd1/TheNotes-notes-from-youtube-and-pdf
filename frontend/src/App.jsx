import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import { useAuth } from "./context/AuthContext";
import AccountPage from "./pages/AccountPage";
import ArchivePage from "./pages/ArchivePage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import LibraryPage from "./pages/LibraryPage";
import SharedNotePage from "./pages/SharedNotePage";
import StaticInfoPage from "./pages/StaticInfoPage";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="rounded-2xl bg-white px-6 py-4 text-sm font-medium text-on-surface shadow-curator">
        Loading Smart Notes...
      </div>
    </div>
  );
}

function ProtectedLayout() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/shared/:shareId" element={<SharedNotePage />} />
      <Route path="/privacy" element={<StaticInfoPage type="privacy" />} />
      <Route path="/terms" element={<StaticInfoPage type="terms" />} />
      <Route path="/help" element={<StaticInfoPage type="help" />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/account" element={<AccountPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
