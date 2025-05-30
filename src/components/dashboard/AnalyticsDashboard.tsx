import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  CalendarIcon,
  Download,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  MessageSquare,
  Clock,
  ThumbsUp,
} from "lucide-react";

interface AnalyticsDashboardProps {
  widgetId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

const AnalyticsDashboard = ({
  widgetId = "all",
  dateRange = {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  },
}: AnalyticsDashboardProps) => {
  const [date, setDate] = React.useState<{ from: Date; to: Date }>(dateRange);
  const [selectedWidget, setSelectedWidget] = React.useState<string>(widgetId);
  const [selectedTab, setSelectedTab] = React.useState<string>("usage");

  // Mock data for charts
  const usageData = [
    { date: "2023-05-01", conversations: 120 },
    { date: "2023-05-02", conversations: 145 },
    { date: "2023-05-03", conversations: 132 },
    { date: "2023-05-04", conversations: 167 },
    { date: "2023-05-05", conversations: 189 },
    { date: "2023-05-06", conversations: 156 },
    { date: "2023-05-07", conversations: 123 },
  ];

  const qualityData = {
    excellent: 45,
    good: 30,
    average: 15,
    poor: 10,
  };

  const engagementData = {
    averageSessionTime: "3m 24s",
    completionRate: "78%",
    returnRate: "42%",
    averageMessagesPerConversation: 6.3,
  };

  return (
    <div className="bg-background p-6 space-y-6 w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor and analyze your AI chat widget performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedWidget} onValueChange={setSelectedWidget}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Widget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Widgets</SelectItem>
              <SelectItem value="support-bot">Support Bot</SelectItem>
              <SelectItem value="sales-assistant">Sales Assistant</SelectItem>
              <SelectItem value="product-guide">Product Guide</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date.from}
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
          <TabsTrigger value="usage">
            <BarChart3 className="h-4 w-4 mr-2" />
            Usage Metrics
          </TabsTrigger>
          <TabsTrigger value="quality">
            <ThumbsUp className="h-4 w-4 mr-2" />
            Conversation Quality
          </TabsTrigger>
          <TabsTrigger value="engagement">
            <Users className="h-4 w-4 mr-2" />
            User Engagement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,248</div>
                <p className="text-xs text-muted-foreground">
                  +12.3% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7,842</div>
                <p className="text-xs text-muted-foreground">
                  +8.7% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">892</div>
                <p className="text-xs text-muted-foreground">
                  +15.6% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Conversations</CardTitle>
              <CardDescription>
                Number of conversations started per day
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                <div className="text-center">
                  <LineChart className="h-10 w-10 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Chart visualization would appear here
                  </p>
                  <p className="text-xs text-gray-400">
                    Showing data for selected date range
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Quality Ratings</CardTitle>
                <CardDescription>How users rate AI responses</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center">
                    <PieChart className="h-10 w-10 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Pie chart visualization would appear here
                    </p>
                    <p className="text-xs text-gray-400">
                      Showing quality distribution
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Common Topics</CardTitle>
                <CardDescription>
                  Most frequently discussed subjects
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-10 w-10 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Bar chart visualization would appear here
                    </p>
                    <p className="text-xs text-gray-400">
                      Showing topic distribution
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Response Accuracy Over Time</CardTitle>
              <CardDescription>
                Tracking improvement in AI response quality
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                <div className="text-center">
                  <LineChart className="h-10 w-10 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Line chart visualization would appear here
                  </p>
                  <p className="text-xs text-gray-400">
                    Showing accuracy trends over time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Session Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">3m 24s</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  +0.8% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78%</div>
                <p className="text-xs text-muted-foreground">
                  +2.4% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Return Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42%</div>
                <p className="text-xs text-muted-foreground">
                  +5.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Messages/Conversation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">6.3</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  +1.2 from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Retention</CardTitle>
                <CardDescription>
                  How many users return to use the chat widget
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center">
                    <LineChart className="h-10 w-10 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Line chart visualization would appear here
                    </p>
                    <p className="text-xs text-gray-400">
                      Showing retention over time
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>User Flow Analysis</CardTitle>
                <CardDescription>
                  How users navigate through conversations
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center">
                    <Users className="h-10 w-10 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Flow diagram would appear here
                    </p>
                    <p className="text-xs text-gray-400">
                      Showing conversation paths
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
