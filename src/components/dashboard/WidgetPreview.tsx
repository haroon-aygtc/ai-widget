import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Minimize2, X, Settings } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface WidgetConfig {
  design: {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    fontFamily: string;
    fontSize: number;
    borderRadius: number;
    headerText: string;
    buttonText: string;
    placeholderText: string;
    position: string;
  };
  behavior: {
    initialMessage: string;
    typingIndicator: boolean;
    showTimestamp: boolean;
    autoResponse: boolean;
    responseDelay: number;
    maxMessages: number;
    aiProvider: string;
    welcomeMessage: string;
  };
  placement: {
    position: string;
    offsetX: number;
    offsetY: number;
    mobilePosition: string;
    showOnPages: string;
    excludePages: string;
    triggerType: string;
    triggerText: string;
    triggerIcon: string;
  };
}

interface WidgetPreviewProps {
  config?: WidgetConfig;
  headerText?: string;
  headerColor?: string;
  chatBgColor?: string;
  botName?: string;
  botAvatar?: string;
  userAvatar?: string;
  primaryColor?: string;
  welcomeMessage?: string;
  inputPlaceholder?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  width?: number;
  height?: number;
}

const WidgetPreview = ({
  config,
  headerText = "Chat with AI Assistant",
  headerColor = "#4f46e5",
  chatBgColor = "#ffffff",
  botName = "AI Assistant",
  botAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=assistant",
  userAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
  primaryColor = "#4f46e5",
  welcomeMessage = "Hello! How can I help you today?",
  inputPlaceholder = "Type your message...",
  position = "bottom-right",
  width = 350,
  height = 500,
}: WidgetPreviewProps) => {
  // Use config values if provided, otherwise use default props
  const effectiveHeaderText = config?.design?.headerText || headerText;
  const effectivePrimaryColor = config?.design?.primaryColor || primaryColor;
  const effectiveSecondaryColor = config?.design?.secondaryColor || chatBgColor;
  const effectiveWelcomeMessage =
    config?.behavior?.welcomeMessage || welcomeMessage;
  const effectivePlaceholderText =
    config?.design?.placeholderText || inputPlaceholder;
  const effectivePosition = (config?.placement?.position || position) as
    | "bottom-right"
    | "bottom-left"
    | "top-right"
    | "top-left";
  const effectiveButtonText = config?.design?.buttonText || "Send";

  const [isExpanded, setIsExpanded] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: effectiveWelcomeMessage,
      sender: "ai",
      timestamp: new Date(),
    },
  ]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputValue("");

    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "This is a simulated response from the AI assistant. In a real implementation, this would be the response from your selected AI provider.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    }, config?.behavior?.responseDelay || 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const positionStyles = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  return (
    <div className="relative bg-background h-full w-full flex items-center justify-center">
      <Card
        className={`shadow-lg overflow-hidden ${isExpanded ? "" : "h-auto w-auto"}`}
        style={{
          width: isExpanded ? `${width}px` : "60px",
          height: isExpanded ? `${height}px` : "60px",
          position: "absolute",
          borderRadius: isExpanded
            ? `${config?.design?.borderRadius || 12}px`
            : "50%",
          transition: "all 0.3s ease",
        }}
      >
        {isExpanded ? (
          <>
            {/* Chat Header */}
            <div
              className="p-3 flex justify-between items-center"
              style={{
                backgroundColor: effectivePrimaryColor,
                color: "#ffffff",
              }}
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={botAvatar} alt={botName} />
                  <AvatarFallback>{botName.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{effectiveHeaderText}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/20"
                  onClick={() => setIsExpanded(false)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{
                backgroundColor: effectiveSecondaryColor,
                height: `${height - 120}px`,
                fontSize: `${config?.design?.fontSize || 14}px`,
              }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex gap-2 max-w-[80%]">
                    {message.sender === "ai" && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={botAvatar} alt={botName} />
                        <AvatarFallback>
                          {botName.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg p-3 ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                      style={{
                        backgroundColor:
                          message.sender === "user"
                            ? effectivePrimaryColor
                            : undefined,
                        color:
                          message.sender === "user"
                            ? "#ffffff"
                            : config?.design?.textColor,
                        borderRadius: `${config?.design?.borderRadius || 8}px`,
                      }}
                    >
                      <p className="text-sm">{message.content}</p>
                      {config?.behavior?.showTimestamp && (
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                    {message.sender === "user" && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userAvatar} alt="User" />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={effectivePlaceholderText}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                style={{ backgroundColor: effectivePrimaryColor }}
              >
                {effectiveButtonText === "Send" ? (
                  <Send className="h-4 w-4" />
                ) : (
                  effectiveButtonText
                )}
              </Button>
            </div>
          </>
        ) : (
          <Button
            variant="ghost"
            className="h-full w-full rounded-full p-0"
            style={{ backgroundColor: effectivePrimaryColor }}
            onClick={() => setIsExpanded(true)}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={botAvatar} alt={botName} />
              <AvatarFallback>{botName.substring(0, 2)}</AvatarFallback>
            </Avatar>
          </Button>
        )}
      </Card>

      {/* Position indicator (for demo purposes) */}
      <div className="absolute top-4 left-4 bg-muted p-2 rounded text-xs">
        Position: {effectivePosition}
      </div>
    </div>
  );
};

export default WidgetPreview;
