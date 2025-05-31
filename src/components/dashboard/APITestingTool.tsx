import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/lib/api";
import { apiTestingService } from "@/lib/api";
import {
  Play,
  Plus,
  Minus,
  Code,
  FileJson,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Copy,
  Save,
  Download,
  Trash2,
  RefreshCw,
  History,
} from "lucide-react";

interface ApiEndpoint {
  method: string;
  uri: string;
  name: string;
  description?: string;
  parameters?: any[];
}

interface ApiHeader {
  key: string;
  value: string;
  enabled: boolean;
}

interface ApiResponse {
  status: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
  time: number;
  size: number;
}

interface SavedRequest {
  id: string;
  name: string;
  method: string;
  endpoint: string;
  headers: ApiHeader[];
  body: string;
  createdAt: string;
}

const defaultHeaders: ApiHeader[] = [
  { key: "Content-Type", value: "application/json", enabled: true },
  { key: "Accept", value: "application/json", enabled: true },
];

const APITestingTool: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(true);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("GET");
  const [customEndpoint, setCustomEndpoint] = useState<string>("");
  const [headers, setHeaders] = useState<ApiHeader[]>(defaultHeaders);
  const [requestBody, setRequestBody] = useState<string>("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [history, setHistory] = useState<SavedRequest[]>([]);
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [requestName, setRequestName] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Fetch available endpoints on component mount
  useEffect(() => {
    discoverEndpoints();
    loadSavedRequests();
  }, []);

  const discoverEndpoints = async () => {
    try {
      setDiscovering(true);
      const response = await apiTestingService.discoverEndpoints();
      setEndpoints(response.data.endpoints);
      setDiscovering(false);
    } catch (error) {
      console.error("Failed to discover endpoints:", error);
      toast({
        title: "Error",
        description: "Failed to discover API endpoints",
        variant: "destructive",
      });
      setDiscovering(false);
    }
  };

  const loadSavedRequests = () => {
    const savedRequestsJson = localStorage.getItem("api_saved_requests");
    if (savedRequestsJson) {
      try {
        const parsed = JSON.parse(savedRequestsJson);
        setSavedRequests(parsed);
      } catch (e) {
        console.error("Failed to parse saved requests", e);
      }
    }

    const historyJson = localStorage.getItem("api_request_history");
    if (historyJson) {
      try {
        const parsed = JSON.parse(historyJson);
        setHistory(parsed);
      } catch (e) {
        console.error("Failed to parse request history", e);
      }
    }
  };

  const handleEndpointChange = (value: string) => {
    setSelectedEndpoint(value);
    setCustomEndpoint(value);

    // Find the endpoint to get default data
    const endpoint = endpoints.find((e) => e.uri === value);
    if (endpoint) {
      setSelectedMethod(endpoint.method);
      generateDefaultRequestBody(endpoint);
    }
  };

  const handleMethodChange = (value: string) => {
    setSelectedMethod(value);
    // Adjust default body based on method
    if (value === "GET" || value === "DELETE") {
      setRequestBody("");
    } else if (requestBody === "") {
      const endpoint = endpoints.find((e) => e.uri === selectedEndpoint);
      if (endpoint) {
        generateDefaultRequestBody(endpoint);
      } else {
        setRequestBody(JSON.stringify({ data: "example" }, null, 2));
      }
    }
  };

  const generateDefaultRequestBody = (endpoint: ApiEndpoint) => {
    // Generate default request body based on endpoint
    let defaultBody = {};

    // Extract parameters from URI to create a default body
    const uriParams = endpoint.uri.match(/\{([^}]+)\}/g);
    if (uriParams) {
      uriParams.forEach((param) => {
        const paramName = param.replace(/\{|\}/g, "");
        defaultBody[paramName] = `example-${paramName}`;
      });
    }

    // Add some common fields based on endpoint name
    if (endpoint.uri.includes("users")) {
      defaultBody = {
        name: "John Doe",
        email: "john.doe@example.com",
        password: "password123",
        ...(endpoint.method !== "DELETE" && defaultBody),
      };
    } else if (endpoint.uri.includes("ai-providers")) {
      defaultBody = {
        provider_type: "openai",
        api_key: "sk_example_key",
        model: "gpt-4",
        ...(endpoint.method !== "DELETE" && defaultBody),
      };
    } else if (endpoint.uri.includes("ai-models")) {
      defaultBody = {
        name: "Example Model",
        model_id: "gpt-4",
        provider_type: "openai",
        ...(endpoint.method !== "DELETE" && defaultBody),
      };
    } else if (endpoint.uri.includes("widgets")) {
      defaultBody = {
        name: "Example Widget",
        description: "A sample widget for testing",
        ...(endpoint.method !== "DELETE" && defaultBody),
      };
    }

    // Don't set body for GET requests
    if (endpoint.method === "GET" || endpoint.method === "DELETE") {
      setRequestBody("");
    } else {
      setRequestBody(JSON.stringify(defaultBody, null, 2));
    }
  };

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "", enabled: true }]);
  };

  const removeHeader = (index: number) => {
    const newHeaders = [...headers];
    newHeaders.splice(index, 1);
    setHeaders(newHeaders);
  };

  const updateHeader = (
    index: number,
    field: "key" | "value" | "enabled",
    value: string | boolean,
  ) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  const formatJson = (json: string): string => {
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch (e) {
      return json;
    }
  };

  const handleSendRequest = async () => {
    if (!customEndpoint) {
      toast({
        title: "Error",
        description: "Please select or enter an API endpoint",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      // Prepare headers
      const requestHeaders = {};
      headers
        .filter((h) => h.enabled && h.key.trim() !== "")
        .forEach((h) => {
          requestHeaders[h.key] = h.value;
        });

      // Parse body if present and not GET/DELETE
      let parsedBody = null;
      if (
        requestBody &&
        selectedMethod !== "GET" &&
        selectedMethod !== "DELETE"
      ) {
        try {
          parsedBody = JSON.parse(requestBody);
        } catch (e) {
          toast({
            title: "Invalid JSON",
            description: "Please check your request body format",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const startTime = performance.now();
      const result = await apiTestingService.executeRequest({
        method: selectedMethod,
        endpoint: customEndpoint,
        headers: requestHeaders,
        body: parsedBody,
      });
      const endTime = performance.now();

      // Calculate response size
      const responseSize = new Blob([JSON.stringify(result.data)]).size;

      const responseData: ApiResponse = {
        status: result.status,
        statusText: result.statusText,
        data: result.data,
        headers: result.headers as Record<string, string>,
        time: Math.round(endTime - startTime),
        size: responseSize,
      };

      setResponse(responseData);

      // Add to history
      const historyItem: SavedRequest = {
        id: Date.now().toString(),
        name: `${selectedMethod} ${customEndpoint}`,
        method: selectedMethod,
        endpoint: customEndpoint,
        headers: headers,
        body: requestBody,
        createdAt: new Date().toISOString(),
      };

      const updatedHistory = [historyItem, ...history.slice(0, 19)]; // Keep last 20 items
      setHistory(updatedHistory);
      localStorage.setItem(
        "api_request_history",
        JSON.stringify(updatedHistory),
      );

      toast({
        title: "Request Completed",
        description: `Status: ${responseData.status} ${responseData.statusText}`,
        variant:
          responseData.status >= 200 && responseData.status < 300
            ? "default"
            : "destructive",
      });
    } catch (error: any) {
      console.error("Request failed:", error);

      // Handle error response
      if (error.response) {
        const responseData: ApiResponse = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          time: 0,
          size: new Blob([JSON.stringify(error.response.data)]).size,
        };
        setResponse(responseData);
      }

      toast({
        title: "Request Failed",
        description:
          error.message || "An error occurred while making the request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRequest = () => {
    if (!requestName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for this request",
        variant: "destructive",
      });
      return;
    }

    const savedRequest: SavedRequest = {
      id: Date.now().toString(),
      name: requestName,
      method: selectedMethod,
      endpoint: customEndpoint,
      headers: headers,
      body: requestBody,
      createdAt: new Date().toISOString(),
    };

    const updatedSavedRequests = [savedRequest, ...savedRequests];
    setSavedRequests(updatedSavedRequests);
    localStorage.setItem(
      "api_saved_requests",
      JSON.stringify(updatedSavedRequests),
    );

    setRequestName("");
    setIsSaving(false);

    toast({
      title: "Request Saved",
      description: `"${requestName}" has been saved to your collection`,
    });
  };

  const loadSavedRequest = (request: SavedRequest) => {
    setSelectedMethod(request.method);
    setCustomEndpoint(request.endpoint);
    setSelectedEndpoint(request.endpoint);
    setHeaders(request.headers);
    setRequestBody(request.body);
  };

  const deleteSavedRequest = (id: string) => {
    const updatedRequests = savedRequests.filter((req) => req.id !== id);
    setSavedRequests(updatedRequests);
    localStorage.setItem("api_saved_requests", JSON.stringify(updatedRequests));

    toast({
      title: "Request Deleted",
      description: "The saved request has been deleted",
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("api_request_history");
    toast({
      title: "History Cleared",
      description: "Your request history has been cleared",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard",
    });
  };

  const downloadResponse = () => {
    if (!response) return;

    const blob = new Blob([JSON.stringify(response.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `response-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500";
    if (status >= 300 && status < 400) return "bg-blue-500";
    if (status >= 400 && status < 500) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300)
      return <CheckCircle2 className="h-4 w-4" />;
    if (status >= 300 && status < 400)
      return <AlertCircle className="h-4 w-4" />;
    if (status >= 400) return <XCircle className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="space-y-6 bg-background">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">API Testing Tool</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={discoverEndpoints}
            disabled={discovering}
          >
            {discovering ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Endpoints
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Saved Requests & History */}
        <div className="lg:col-span-1">
          <Tabs defaultValue="saved">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="saved">Saved</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="saved" className="mt-4">
              <Card>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Saved Requests</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    {savedRequests.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No saved requests yet
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {savedRequests.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-3 hover:bg-accent cursor-pointer"
                            onClick={() => loadSavedRequest(request)}
                          >
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant="outline"
                                className={`${request.method === "GET" ? "bg-blue-500" : request.method === "POST" ? "bg-green-500" : request.method === "PUT" ? "bg-yellow-500" : request.method === "DELETE" ? "bg-red-500" : "bg-purple-500"} text-white`}
                              >
                                {request.method}
                              </Badge>
                              <div className="truncate max-w-[150px]">
                                {request.name}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSavedRequest(request.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Request History</CardTitle>
                    {history.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearHistory}>
                        Clear
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    {history.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No request history yet
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {history.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-3 hover:bg-accent cursor-pointer"
                            onClick={() => loadSavedRequest(request)}
                          >
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant="outline"
                                className={`${request.method === "GET" ? "bg-blue-500" : request.method === "POST" ? "bg-green-500" : request.method === "PUT" ? "bg-yellow-500" : request.method === "DELETE" ? "bg-red-500" : "bg-purple-500"} text-white`}
                              >
                                {request.method}
                              </Badge>
                              <div className="truncate max-w-[150px]">
                                {request.endpoint}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(request.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Content - Request Builder & Response */}
        <div className="lg:col-span-3 space-y-6">
          {/* Request Builder */}
          <Card>
            <CardHeader>
              <CardTitle>Request Builder</CardTitle>
              <CardDescription>
                Configure your API request parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Method & Endpoint */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-[150px]">
                  <Label htmlFor="method">Method</Label>
                  <Select
                    value={selectedMethod}
                    onValueChange={handleMethodChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label htmlFor="endpoint">Endpoint</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id="endpoint"
                        value={customEndpoint}
                        onChange={(e) => setCustomEndpoint(e.target.value)}
                        placeholder="Enter API endpoint or select from dropdown"
                      />
                    </div>
                    <Select
                      value={selectedEndpoint}
                      onValueChange={handleEndpointChange}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select endpoint" />
                      </SelectTrigger>
                      <SelectContent>
                        {discovering ? (
                          <div className="p-2 text-center">
                            <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                            <p className="text-sm mt-2">
                              Discovering endpoints...
                            </p>
                          </div>
                        ) : endpoints.length === 0 ? (
                          <div className="p-2 text-center text-muted-foreground">
                            No endpoints found
                          </div>
                        ) : (
                          endpoints.map((endpoint, index) => (
                            <SelectItem key={index} value={endpoint.uri}>
                              {endpoint.method} {endpoint.uri}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Headers */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Headers</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addHeader}
                    className="h-8"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Header
                  </Button>
                </div>
                <div className="space-y-2">
                  {headers.map((header, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Checkbox
                        id={`header-enabled-${index}`}
                        checked={header.enabled}
                        onCheckedChange={(checked) =>
                          updateHeader(index, "enabled", !!checked)
                        }
                      />
                      <Input
                        placeholder="Header name"
                        value={header.key}
                        onChange={(e) =>
                          updateHeader(index, "key", e.target.value)
                        }
                        className="flex-1"
                      />
                      <Input
                        placeholder="Value"
                        value={header.value}
                        onChange={(e) =>
                          updateHeader(index, "value", e.target.value)
                        }
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeHeader(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Request Body */}
              {selectedMethod !== "GET" && selectedMethod !== "DELETE" && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="body">Request Body</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRequestBody(formatJson(requestBody))}
                      className="h-8"
                    >
                      <Code className="h-3 w-3 mr-1" /> Format JSON
                    </Button>
                  </div>
                  <Textarea
                    id="body"
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder="Enter request body as JSON"
                    className="font-mono h-[200px]"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsSaving(true)}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Request
                </Button>
              </div>
              <Button onClick={handleSendRequest} disabled={loading}>
                {loading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Send Request
              </Button>
            </CardFooter>
          </Card>

          {/* Save Request Dialog */}
          {isSaving && (
            <Card>
              <CardHeader>
                <CardTitle>Save Request</CardTitle>
                <CardDescription>
                  Save this request for future use
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="requestName">Request Name</Label>
                  <Input
                    id="requestName"
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                    placeholder="Enter a name for this request"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsSaving(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveRequest}>Save</Button>
              </CardFooter>
            </Card>
          )}

          {/* Response Viewer */}
          {response && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    Response
                    <Badge
                      className={`${getStatusColor(response.status)} text-white`}
                    >
                      {getStatusIcon(response.status)}
                      <span className="ml-1">
                        {response.status} {response.statusText}
                      </span>
                    </Badge>
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadResponse}
                    >
                      <Download className="h-4 w-4 mr-1" /> Download
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Time: {response.time}ms</span>
                    </div>
                    <div className="flex items-center">
                      <FileJson className="h-4 w-4 mr-1" />
                      <span>Size: {(response.size / 1024).toFixed(2)} KB</span>
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pretty">
                  <TabsList>
                    <TabsTrigger value="pretty">Pretty</TabsTrigger>
                    <TabsTrigger value="raw">Raw</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="pretty" className="mt-4">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(response.data, null, 2),
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted/50">
                        <pre className="font-mono text-sm">
                          {JSON.stringify(response.data, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                  <TabsContent value="raw" className="mt-4">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() =>
                          copyToClipboard(JSON.stringify(response.data))
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted/50">
                        <pre className="font-mono text-sm whitespace-pre-wrap break-all">
                          {JSON.stringify(response.data)}
                        </pre>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                  <TabsContent value="headers" className="mt-4">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(response.headers, null, 2),
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted/50">
                        <div className="space-y-2">
                          {Object.entries(response.headers).map(
                            ([key, value], index) => (
                              <div
                                key={index}
                                className="grid grid-cols-3 gap-2"
                              >
                                <div className="font-medium">{key}:</div>
                                <div className="col-span-2 break-all">
                                  {value as string}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default APITestingTool;
