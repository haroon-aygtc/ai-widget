import React, { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ChevronRight,
  Home,
  Palette,
  Zap,
  Shield,
  HelpCircle,
  Plus,
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      description: "Overview and analytics",
    },
    {
      path: "/widget-builder",
      label: "Widget Builder",
      icon: <Palette className="h-5 w-5" />,
      description: "Create and customize widgets",
    },
    {
      path: "/widgets",
      label: "Widget Library",
      icon: <MessageSquare className="h-5 w-5" />,
      description: "Manage your widgets",
    },
    {
      path: "/ai-providers",
      label: "AI Providers",
      icon: <Sparkles className="h-5 w-5" />,
      description: "Connect AI services",
    },
    {
      path: "/ai-models",
      label: "AI Models",
      icon: <Zap className="h-5 w-5" />,
      description: "Configure AI models",
    },
    {
      path: "/analytics",
      label: "Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      description: "Performance insights",
    },
    {
      path: "/users",
      label: "User Management",
      icon: <Users className="h-5 w-5" />,
      description: "Manage team members",
      adminOnly: true,
    },
    {
      path: "/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      description: "System configuration",
    },
  ];

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', path: '/dashboard' }];

    let currentPath = '';
    pathSegments.forEach(segment => {
      currentPath += `/${segment}`;
      const navItem = navItems.find(item => item.path === currentPath);
      if (navItem) {
        breadcrumbs.push({ label: navItem.label, path: currentPath });
      }
    });

    return breadcrumbs;
  };

  const SidebarContent = () => (
    <>
      {/* Logo and Brand */}
      <div className={`flex items-center gap-3 px-4 py-6 ${sidebarCollapsed ? 'justify-center' : ''}`}>
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI Widget Pro
            </h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        )}
      </div>

      <Separator className="mx-4" />

      {/* Quick Actions */}
      {!sidebarCollapsed && (
        <div className="px-4 py-4">
          <Button
            onClick={() => navigate("/widget-builder")}
            className="w-full justify-start gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Plus className="h-4 w-4" />
            Create Widget
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2">
        <ScrollArea className="h-full">
          <div className="space-y-1">
            {navItems.map((item) => {
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
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 group ${isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "hover:bg-accent hover:text-accent-foreground"
                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className={`${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'}`}>
                    {item.icon}
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.label}</div>
                      <div className={`text-xs truncate ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        }`}>
                        {item.description}
                      </div>
                    </div>
                  )}
                  {!sidebarCollapsed && isActive && (
                    <ChevronRight className="h-4 w-4 text-primary-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t bg-card/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full ${sidebarCollapsed ? 'p-2' : 'justify-start gap-3 p-3'} h-auto`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    {user?.role === 'admin' && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              Help & Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex flex-col border-r bg-card/50 backdrop-blur-sm transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-72'
        }`}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-72 bg-card border-r shadow-xl">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-lg font-bold">AI Widget Pro</h1>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 flex flex-col">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Desktop Sidebar Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Breadcrumbs */}
              <div className="hidden md:flex items-center space-x-2 text-sm">
                {getBreadcrumbs().map((crumb, index) => (
                  <React.Fragment key={crumb.path}>
                    {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <button
                      onClick={() => navigate(crumb.path)}
                      className={`hover:text-primary transition-colors ${index === getBreadcrumbs().length - 1
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground'
                        }`}
                    >
                      {crumb.label}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Page Title for Mobile */}
              <h1 className="text-xl font-semibold md:hidden">{title}</h1>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="h-9 w-[200px] xl:w-[300px] rounded-lg border border-input bg-background/50 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                  3
                </span>
              </Button>

              {/* Quick Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/widget-builder")}>
                    <Palette className="mr-2 h-4 w-4" />
                    New Widget
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/ai-providers")}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Add AI Provider
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/users")}>
                    <Users className="mr-2 h-4 w-4" />
                    Invite User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  );
};

export default AdminPanelWrapper;
