import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Settings,
  MessageSquare,
  BarChart3,
  Users,
  Code,
  Sparkles,
  PlusCircle,
  Bell,
  Search,
  LogOut,
  ChevronRight,
  Building2,
  Car,
  Users2,
  ArrowRight,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const Home = () => {
  const [showDashboard, setShowDashboard] = React.useState(false);
  const navigate = useNavigate();

  if (!showDashboard) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <header className="bg-card border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Al Yalayis Business Hub</h1>
              </div>
              <div className="flex items-center gap-4">
                <nav className="hidden md:flex items-center gap-6">
                  <a
                    href="#services"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Services
                  </a>
                  <a
                    href="#divisions"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Business Divisions
                  </a>
                  <a
                    href="#contact"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Contact
                  </a>
                </nav>
                <ThemeToggle />
                <Button onClick={() => setShowDashboard(true)}>
                  Dashboard
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main>
          {/* Hero Banner */}
          <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="container mx-auto text-center max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                No-Code AI Chat Widget System
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                A highly customizable platform for deploying and managing AI
                chat widgets across any website or application
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline">
                  View Demo
                </Button>
              </div>
            </div>
          </section>

          {/* Business Divisions */}
          <section id="divisions" className="py-16 px-4 bg-background">
            <div className="container mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">
                  Al Yalayis Business Divisions
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Explore our comprehensive range of business services across
                  multiple sectors
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Government Transaction Center</CardTitle>
                    <CardDescription>
                      A to Z UAE government services
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Complete range of government services and transactions for
                      individuals and businesses in the UAE.
                    </p>
                    <Button variant="outline" className="w-full">
                      Learn More
                    </Button>
                  </CardContent>
                </Card>

                <Card className="transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Al Yalayis Property</CardTitle>
                    <CardDescription>
                      Real estate & land transactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comprehensive real estate services handling property and
                      land transactions across the UAE.
                    </p>
                    <Button variant="outline" className="w-full">
                      Learn More
                    </Button>
                  </CardContent>
                </Card>

                <Card className="transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Car className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Super Wheel</CardTitle>
                    <CardDescription>
                      Luxury VIP transport services
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Premium transportation solutions for executives and VIP
                      clients throughout the UAE.
                    </p>
                    <Button variant="outline" className="w-full">
                      Learn More
                    </Button>
                  </CardContent>
                </Card>

                <Card className="transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Users2 className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>Labor Supplier</CardTitle>
                    <CardDescription>
                      Workforce solutions for all industries
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Specialized workforce solutions providing skilled labor
                      across various industries in the UAE.
                    </p>
                    <Button variant="outline" className="w-full">
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="services" className="py-16 px-4 bg-muted/50">
            <div className="container mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">
                  AI Chat Widget Features
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Our platform offers a comprehensive suite of features to
                  create and manage AI-powered chat widgets
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-card p-6 rounded-lg border">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Widget Builder</h3>
                  <p className="text-muted-foreground">
                    Intuitive drag-and-drop interface for creating and
                    customizing chat widgets with live preview
                  </p>
                </div>

                <div className="bg-card p-6 rounded-lg border">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    AI Provider Integration
                  </h3>
                  <p className="text-muted-foreground">
                    Seamless connection to popular AI services (OpenAI, Gemini,
                    Claude, Mistral) with provider-specific settings
                  </p>
                </div>

                <div className="bg-card p-6 rounded-lg border">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Response Formatting
                  </h3>
                  <p className="text-muted-foreground">
                    Tools to control how AI responses are structured and
                    displayed (HTML, Markdown, JSON)
                  </p>
                </div>

                <div className="bg-card p-6 rounded-lg border">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Analytics Dashboard
                  </h3>
                  <p className="text-muted-foreground">
                    Visual reports on usage metrics, conversation quality, and
                    user engagement
                  </p>
                </div>

                <div className="bg-card p-6 rounded-lg border">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Multi-tenant Architecture
                  </h3>
                  <p className="text-muted-foreground">
                    SaaS-ready system with user role management and organization
                    isolation
                  </p>
                </div>

                <div className="bg-card p-6 rounded-lg border">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Settings className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Customization Options
                  </h3>
                  <p className="text-muted-foreground">
                    Extensive styling and behavior options to match your brand
                    and requirements
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section
            id="contact"
            className="py-16 px-4 bg-primary text-primary-foreground"
          >
            <div className="container mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                Create your first AI chat widget today and transform how you
                engage with your customers
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2"
                  onClick={() => setShowDashboard(true)}
                >
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Contact Sales
                </Button>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-card border-t py-12 px-4">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">
                  Al Yalayis Business Hub
                </span>
              </div>
              <div className="flex gap-8">
                <div>
                  <h3 className="font-semibold mb-2">Company</h3>
                  <ul className="space-y-1">
                    <li>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        About
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Careers
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Contact
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Resources</h3>
                  <ul className="space-y-1">
                    <li>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Documentation
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Pricing
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        API
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Legal</h3>
                  <ul className="space-y-1">
                    <li>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Privacy
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Terms
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
              <p>© 2023 Al Yalayis Business Hub. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">AI Chat Widget</h1>
        </div>

        <nav className="space-y-1 flex-1">
          <button
            onClick={() => {}}
            className="flex items-center gap-3 px-3 py-2 rounded-md bg-accent text-accent-foreground w-full text-left"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => navigate("/widget-builder")}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground w-full text-left"
          >
            <MessageSquare className="h-5 w-5" />
            <span>Widget Builder</span>
          </button>
          <button
            onClick={() => navigate("/ai-providers")}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground w-full text-left"
          >
            <Sparkles className="h-5 w-5" />
            <span>AI Providers</span>
          </button>
          <button
            onClick={() => navigate("/analytics")}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground w-full text-left"
          >
            <BarChart3 className="h-5 w-5" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => navigate("/users")}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground w-full text-left"
          >
            <Users className="h-5 w-5" />
            <span>User Management</span>
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground w-full text-left"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
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
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
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
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowDashboard(false)}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Widgets
                      </p>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Conversations
                      </p>
                      <p className="text-2xl font-bold">1,284</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Active Users
                      </p>
                      <p className="text-2xl font-bold">342</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        AI Providers
                      </p>
                      <p className="text-2xl font-bold">5</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with common tasks</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                  variant="outline"
                >
                  <PlusCircle className="h-6 w-6" />
                  <span>Create New Widget</span>
                </Button>
                <Button
                  className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                  variant="outline"
                >
                  <Sparkles className="h-6 w-6" />
                  <span>Connect AI Provider</span>
                </Button>
                <Button
                  className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                  variant="outline"
                >
                  <Code className="h-6 w-6" />
                  <span>Get Embed Code</span>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Support Widget Updated</p>
                        <p className="text-sm text-muted-foreground">
                          2 hours ago
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        You updated the appearance settings for the Support
                        Widget
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">New AI Provider Connected</p>
                        <p className="text-sm text-muted-foreground">
                          Yesterday
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        You connected Claude AI provider to your account
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">New Team Member Added</p>
                        <p className="text-sm text-muted-foreground">
                          2 days ago
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        You added Sarah Johnson as an Editor to your
                        organization
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Widgets Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Widgets</CardTitle>
                  <CardDescription>
                    All your active chat widgets
                  </CardDescription>
                </div>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Widget
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active">
                  <TabsList className="mb-4">
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="draft">Draft</TabsTrigger>
                    <TabsTrigger value="archived">Archived</TabsTrigger>
                  </TabsList>
                  <TabsContent value="active" className="space-y-4">
                    {/* Widget Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 bg-card">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-900">
                              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div>
                              <h3 className="font-medium">Support Widget</h3>
                              <p className="text-sm text-muted-foreground">
                                Customer support assistant
                              </p>
                            </div>
                          </div>
                          <Badge>Active</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <p className="text-muted-foreground">
                              Provider: OpenAI
                            </p>
                            <p className="text-muted-foreground">
                              Conversations: 842
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" className="gap-1">
                            Manage <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="border rounded-lg p-4 bg-card">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center dark:bg-purple-900">
                              <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                            </div>
                            <div>
                              <h3 className="font-medium">Sales Assistant</h3>
                              <p className="text-sm text-muted-foreground">
                                Product recommendations
                              </p>
                            </div>
                          </div>
                          <Badge>Active</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <p className="text-muted-foreground">
                              Provider: Claude
                            </p>
                            <p className="text-muted-foreground">
                              Conversations: 356
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" className="gap-1">
                            Manage <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="draft" className="space-y-4">
                    <div className="border rounded-lg p-4 bg-card">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center dark:bg-amber-900">
                            <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                          </div>
                          <div>
                            <h3 className="font-medium">
                              Knowledge Base Assistant
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Documentation helper
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">Draft</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            Provider: Gemini
                          </p>
                          <p className="text-muted-foreground">
                            Last edited: 3 days ago
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-1">
                          Edit <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="archived" className="space-y-4">
                    <div className="border rounded-lg p-4 bg-card">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center dark:bg-gray-800">
                            <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <h3 className="font-medium">
                              Beta Feedback Collector
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              User feedback tool
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">Archived</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            Provider: Mistral
                          </p>
                          <p className="text-muted-foreground">
                            Archived: 2 weeks ago
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-1">
                          Restore <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Home;
