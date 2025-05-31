import React, { useState, useEffect } from "react";
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
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

interface AnalyticsData {
  usage?: {
    daily_stats: Array<{
      date: string;
      conversations: number;
      total_messages: number;
      user_messages: number;
      ai_messages: number;
    }>;
    summary: {
      total_conversations: number;
      total_messages: number;
      average_messages_per_conversation: number;
      average_response_time: number | null;
    };
  };
  engagement?: {
    average_session_duration: string;
    completion_rate: string;
    return_rate: string;
    average_messages_per_session: number;
    total_sessions: number;
  };
  quality?: {
    average_rating: number | null;
    rating_distribution: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
    };
    total_ratings: number;
  };
}

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
  const [date, setDate] = useState<{ from: Date; to: Date }>(dateRange);
  const [selectedWidget, setSelectedWidget] = useState<string>(widgetId);
  const [selectedTab, setSelectedTab] = useState<string>("usage");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        start_date: date.from.toISOString().split('T')[0],
        end_date: date.to.toISOString().split('T')[0],
        include: 'usage,engagement,quality'
      });

      if (selectedWidget !== "all") {
        params.append('widget_id', selectedWidget);
      }

      const response = await apiClient.get(`/analytics/report?${params}`);

      if (response.data.success) {
        setAnalyticsData(response.data.data);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Failed to load analytics data');
      // Fallback to mock data for development
      setAnalyticsData({
        usage: {
          daily_stats: [
            { date: "2023-05-01", conversations: 120, total_messages: 240, user_messages: 120, ai_messages: 120 },
            { date: "2023-05-02", conversations: 145, total_messages: 290, user_messages: 145, ai_messages: 145 },
            { date: "2023-05-03", conversations: 132, total_messages: 264, user_messages: 132, ai_messages: 132 },
          ],
          summary: {
            total_conversations: 1248,
            total_messages: 7842,
            average_messages_per_conversation: 6.3,
            average_response_time: 1.2
          }
        },
        engagement: {
          average_session_duration: "3m 24s",
          completion_rate: "78%",
          return_rate: "42%",
          average_messages_per_session: 6.3,
          total_sessions: 1248
        },
        quality: {
          average_rating: 4.2,
          rating_distribution: {
            excellent: 45,
            good: 30,
            average: 15,
            poor: 10,
          },
          total_ratings: 892
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchAnalytics();
  }, [selectedWidget, date.from, date.to]);

  const handleRefresh = () => {
    fetchAnalytics();
  };

  return (
    <div className="space-y-6 w-full">
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
                onSelect={(newDate) => newDate && setDate(newDate as { from: Date; to: Date })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

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
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 w-full max-w-md mx-auto gap-2 sm:gap-0">
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
          {loading && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2">Loading analytics data...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.usage?.summary.total_conversations?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  For selected period
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
                <div className="text-2xl font-bold">
                  {analyticsData.usage?.summary.total_messages?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg: {analyticsData.usage?.summary.average_messages_per_conversation || '0'} per conversation
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.usage?.summary.average_response_time
                    ? `${analyticsData.usage.summary.average_response_time.toFixed(2)}s`
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  AI response latency
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
                  <div className="text-2xl font-bold">
                    {analyticsData.engagement?.average_session_duration || 'N/A'}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Per conversation session
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
                <div className="text-2xl font-bold">
                  {analyticsData.engagement?.completion_rate || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sessions with 3+ messages
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
                <div className="text-2xl font-bold">
                  {analyticsData.engagement?.return_rate || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Users who came back
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Messages/Session
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">
                    {analyticsData.engagement?.average_messages_per_session || 'N/A'}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Messages per session
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
