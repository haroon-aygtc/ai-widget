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
    <Button
      onClick={() => navigate("/dashboard")}
      className="fixed bottom-4 right-4 z-50"
    >
      Go to Dashboard
    </Button>
  );
};

export default Home;
