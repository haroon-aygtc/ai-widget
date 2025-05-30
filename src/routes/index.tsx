import { RouteObject } from "react-router-dom";
import Home from "@/components/home";
import WidgetBuilder from "@/components/dashboard/WidgetBuilder";
import AIProviderSetup from "@/components/dashboard/AIProviderSetup";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/widget-builder",
    element: <WidgetBuilder />,
  },
  {
    path: "/ai-providers",
    element: <AIProviderSetup />,
  },
  {
    path: "/analytics",
    element: <AnalyticsDashboard />,
  },
  // Add more routes as needed
];

export default routes;
