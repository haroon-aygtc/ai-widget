import React, { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import {
  LayoutDashboard,
  Settings,
  MessageSquare,
  BarChart3,
  Users,
  Sparkles,
  Bell,
  Search,
  LogOut,
} from "lucide-react";

interface AdminPanelWrapperProps {
  children: ReactNode;
  title?: string;
}

const AdminPanelWrapper: React.FC<AdminPanelWrapperProps> = ({
  children,
  title = "Dashboard",
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // In a real app, this would handle logout logic
    navigate("/");
  };

  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      path: "/widget-builder",
      label: "Widget Builder",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      path: "/ai-providers",
      label: "AI Providers",
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      path: "/analytics",
      label: "Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      path: "/users",
      label: "User Management",
      icon: <Users className="h-5 w-5" />,
    },
    {
      path: "/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">AI Chat Widget</h1>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md w-full text-left transition-colors ${location.pathname === item.path ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-muted-foreground">admin@example.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">{title}</h1>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="h-9 w-[200px] rounded-md border border-input bg-background pl-8 pr-3 text-sm"
                />
              </div>
              <ThemeToggle />
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1 p-6">{children}</ScrollArea>
      </div>
      <Toaster />
    </div>
  );
};

export default AdminPanelWrapper;
