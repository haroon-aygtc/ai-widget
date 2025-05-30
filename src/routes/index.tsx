import { RouteObject } from "react-router-dom";
import Home from "@/components/home";
import WidgetBuilder from "@/components/dashboard/WidgetBuilder";
import AIProviderSetup from "@/components/dashboard/AIProviderSetup";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";
import DashboardPage from "@/components/dashboard/DashboardPage";
import AdminPanelWrapper from "@/components/dashboard/AdminPanelWrapper";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/dashboard",
    element: <AdminPanelWrapper title="Dashboard"><DashboardPage /></AdminPanelWrapper>,
  },
  {
    path: "/widget-builder",
    element: <AdminPanelWrapper title="Widget Builder"><WidgetBuilder /></AdminPanelWrapper>,
  },
  {
    path: "/ai-providers",
    element: <AdminPanelWrapper title="AI Provider Setup"><AIProviderSetup /></AdminPanelWrapper>,
  },
  {
    path: "/analytics",
    element: <AdminPanelWrapper title="Analytics Dashboard"><AnalyticsDashboard /></AdminPanelWrapper>,
  },
  {
    path: "/users",
    element: <AdminPanelWrapper title="User Management"><div className="p-6">User Management Content</div></AdminPanelWrapper>,
  },
  {
    path: "/settings",
    element: <AdminPanelWrapper title="Settings"><div className="p-6">Settings Content</div></AdminPanelWrapper>,
  },
];

export default routes;
