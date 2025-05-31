import { Routes, Route, useRoutes } from "react-router-dom";
import routes from "tempo-routes";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardPage from "./components/dashboard/DashboardPage";
import AdminPanelWrapper from "./components/dashboard/AdminPanelWrapper";
import WidgetBuilder from "./components/dashboard/WidgetBuilder";
import AIProviderSetup from "./components/dashboard/AIProviderSetup";
import AnalyticsDashboard from "./components/dashboard/AnalyticsDashboard";
import AIModelManagement from "./components/dashboard/AIModelManagement";
import WidgetList from "./components/dashboard/WidgetList";
import UserManagement from "./components/dashboard/UserManagement";
import Settings from "./components/dashboard/Settings";
import ProfilePage from "./pages/ProfilePage";
import WidgetPage from "./pages/WidgetPage";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/toaster";
import { useEffect } from "react";

function App() {
  // For the tempo routes
  const tempoRoutes = import.meta.env.VITE_TEMPO && useRoutes(routes);

  // Enhanced theme persistence and initialization
  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme-preference");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const initialTheme = savedTheme || "system";

    // Apply theme to document root
    document.documentElement.setAttribute("data-theme", initialTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const currentTheme = localStorage.getItem("theme-preference");
      if (currentTheme === "system" || !currentTheme) {
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    // Listen for custom theme change events
    const handleThemeChange = (e: CustomEvent) => {
      document.documentElement.setAttribute("data-theme", e.detail);
    };

    window.addEventListener("themeChange", handleThemeChange as EventListener);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
      window.removeEventListener(
        "themeChange",
        handleThemeChange as EventListener,
      );
    };
  }, []);

  return (
    <ThemeProvider
      defaultTheme="system"
      storageKey="ui-theme"
      enableSystem
      disableTransitionOnChange={false}
    >
      {tempoRoutes}
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminPanelWrapper title="Dashboard">
                <DashboardPage />
              </AdminPanelWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/widget-builder"
          element={
            <ProtectedRoute>
              <AdminPanelWrapper title="Widget Builder">
                <WidgetBuilder />
              </AdminPanelWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/widgets"
          element={
            <ProtectedRoute>
              <AdminPanelWrapper title="Widget Library">
                <WidgetList />
              </AdminPanelWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-providers"
          element={
            <ProtectedRoute>
              <AdminPanelWrapper title="AI Provider Setup">
                <AIProviderSetup />
              </AdminPanelWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-models"
          element={
            <ProtectedRoute>
              <AdminPanelWrapper title="AI Model Management">
                <AIModelManagement />
              </AdminPanelWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AdminPanelWrapper title="Analytics Dashboard">
                <AnalyticsDashboard />
              </AdminPanelWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminPanelWrapper title="User Management">
                <UserManagement />
              </AdminPanelWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AdminPanelWrapper title="Settings">
                <Settings />
              </AdminPanelWrapper>
            </ProtectedRoute>
          }
        />

        {/* Other Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/widget/:id" element={<WidgetPage />} />
        {/* Add this before any catchall route */}
        {import.meta.env.VITE_TEMPO && <Route path="/tempobook/*" />}
      </Routes>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
