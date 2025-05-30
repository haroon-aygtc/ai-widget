import { RouteObject } from "react-router-dom";
import Home from "@/components/home";
import WidgetBuilder from "@/components/dashboard/WidgetBuilder";
import AIProviderSetup from "@/components/dashboard/AIProviderSetup";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";
import DashboardPage from "@/components/dashboard/DashboardPage";
import AdminPanelWrapper from "@/components/dashboard/AdminPanelWrapper";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ProfilePage from "@/pages/ProfilePage";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: (
      <ProtectedRoute requireAuth={false}>
        <LoginPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <ProtectedRoute requireAuth={false}>
        <RegisterPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <AdminPanelWrapper title="Dashboard">
          <DashboardPage />
        </AdminPanelWrapper>
      </ProtectedRoute>
    ),
  },
  {
    path: "/widget-builder",
    element: (
      <ProtectedRoute>
        <AdminPanelWrapper title="Widget Builder">
          <WidgetBuilder />
        </AdminPanelWrapper>
      </ProtectedRoute>
    ),
  },
  {
    path: "/ai-providers",
    element: (
      <ProtectedRoute>
        <AdminPanelWrapper title="AI Provider Setup">
          <AIProviderSetup />
        </AdminPanelWrapper>
      </ProtectedRoute>
    ),
  },
  {
    path: "/analytics",
    element: (
      <ProtectedRoute>
        <AdminPanelWrapper title="Analytics Dashboard">
          <AnalyticsDashboard />
        </AdminPanelWrapper>
      </ProtectedRoute>
    ),
  },
  {
    path: "/users",
    element: (
      <ProtectedRoute requireAdmin={true}>
        <AdminPanelWrapper title="User Management">
          <div className="p-6">User Management Content</div>
        </AdminPanelWrapper>
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <AdminPanelWrapper title="Settings">
          <div className="p-6">Settings Content</div>
        </AdminPanelWrapper>
      </ProtectedRoute>
    ),
  },
];

export default routes;
