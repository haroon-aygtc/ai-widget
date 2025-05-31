import React, { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
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
  User,
  Menu,
  X,
  ChevronDown,
  Palette,
  Shield,
  Database,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navSections = [
    {
      title: "Main",
      items: [
        {
          path: "/dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
          badge: null,
        },
        {
          path: "/analytics",
          label: "Analytics",
          icon: <BarChart3 className="h-4 w-4" />,
          badge: null,
        },
      ],
    },
    {
      title: "Widgets",
      items: [
        {
          path: "/widget-builder",
          label: "Widget Builder",
          icon: <MessageSquare className="h-4 w-4" />,
          badge: null,
        },
        {
          path: "/widgets",
          label: "Widget List",
          icon: <MessageSquare className="h-4 w-4" />,
          badge: "3",
        },
      ],
    },
    {
      title: "AI Configuration",
      items: [
        {
          path: "/ai-providers",
          label: "AI Providers",
          icon: <Sparkles className="h-4 w-4" />,
          badge: null,
        },
        {
          path: "/ai-models",
          label: "AI Models",
          icon: <Database className="h-4 w-4" />,
          badge: "New",
        },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          path: "/users",
          label: "User Management",
          icon: <Users className="h-4 w-4" />,
          adminOnly: true,
          badge: null,
        },
        {
          path: "/settings",
          label: "Settings",
          icon: <Settings className="h-4 w-4" />,
          badge: null,
        },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-card border-r transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-semibold">AI Chat Widget</h1>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-4">
            <nav className="space-y-6">
              {navSections.map((section) => (
                <div key={section.title}>
                  <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      // Skip admin-only items for non-admin users
                      if (item.adminOnly && user?.role !== "admin") {
                        return null;
                      }

                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            setSidebarOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {item.icon}
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <Badge
                              variant={isActive ? "secondary" : "outline"}
                              className="h-5 px-1.5 text-xs"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* User Profile Section */}
          <div className="border-t p-4">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-sm hover:bg-accent transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border bg-popover p-1 shadow-lg">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setUserMenuOpen(false);
                      setSidebarOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  <Separator className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-0">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{title}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Manage your AI chat widgets and configurations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="h-9 w-[200px] rounded-md border border-input bg-background pl-8 pr-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <ThemeToggle />
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive"></span>
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <main className="p-6">{children}</main>
        </ScrollArea>
      </div>
      <Toaster />
    </div>
  );
};

export default AdminPanelWrapper;
