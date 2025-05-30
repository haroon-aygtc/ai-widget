import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Settings,
  MessageSquare,
  BarChart3,
  Users,
  Code,
  Sparkles,
  PlusCircle,
  ChevronRight,
} from "lucide-react";
import WidgetList from "./WidgetList";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
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
            onClick={() => navigate("/widget-builder")}
          >
            <PlusCircle className="h-6 w-6" />
            <span>Create New Widget</span>
          </Button>
          <Button
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
            variant="outline"
            onClick={() => navigate("/ai-providers")}
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
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  You updated the appearance settings for the Support Widget
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
                  <p className="text-sm text-muted-foreground">Yesterday</p>
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
                  <p className="text-sm text-muted-foreground">2 days ago</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  You added Sarah Johnson as an Editor to your organization
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
            <CardDescription>All your active chat widgets</CardDescription>
          </div>
          <Button onClick={() => navigate("/widget-builder")}>
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
                      <p className="text-muted-foreground">Provider: OpenAI</p>
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
                      <p className="text-muted-foreground">Provider: Claude</p>
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
                      <h3 className="font-medium">Knowledge Base Assistant</h3>
                      <p className="text-sm text-muted-foreground">
                        Documentation helper
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Draft</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">Provider: Gemini</p>
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
                      <h3 className="font-medium">Beta Feedback Collector</h3>
                      <p className="text-sm text-muted-foreground">
                        User feedback tool
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Archived</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">Provider: Mistral</p>
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
  );
};

export default DashboardPage;
