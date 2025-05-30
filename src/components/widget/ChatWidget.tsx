import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { chatApi } from "@/lib/api";
import { X, Minimize2, MessageSquare, Send, Loader2 } from "lucide-react";

interface ChatWidgetProps {
  widgetId: string;
  config?: any;
  onMinimize?: () => void;
  onClose?: () => void;
}

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
  widgetId,
  config,
  onMinimize,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(
    localStorage.getItem(`chat_session_${widgetId}`) ||
      `session_${Math.random().toString(36).substring(2, 15)}`,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Default configuration if none is provided
  const defaultConfig = {
    design: {
      primaryColor: "#3b82f6",
      secondaryColor: "#f3f4f6",
      textColor: "#111827",
      fontFamily: "Inter",
      fontSize: 14,
      borderRadius: 8,
      headerText: "Chat with AI Assistant",
      buttonText: "Send",
      placeholderText: "Type your message here...",
    },
    behavior: {
      welcomeMessage: "Hello! How can I help you today?",
      typingIndicator: true,
      showTimestamp: true,
      responseDelay: 500,
    },
  };

  const widgetConfig = config || defaultConfig;

  useEffect(() => {
    // Save session ID to localStorage
    localStorage.setItem(`chat_session_${widgetId}`, sessionId);

    // Add welcome message if there are no messages
    if (messages.length === 0 && widgetConfig.behavior?.welcomeMessage) {
      setMessages([
        {
          id: "welcome",
          content: widgetConfig.behavior.welcomeMessage,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    }

    // Load previous messages if session exists
    const loadMessages = async () => {
      try {
        const response = await chatApi.getBySession(sessionId);
        if (response.data && response.data.length > 0) {
          const formattedMessages = response.data.map((msg: any) => ({
            id: msg.id,
            content: msg.sender_type === "user" ? msg.message : msg.response,
            sender: msg.sender_type,
            timestamp: new Date(msg.created_at),
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();
  }, [widgetId, sessionId, widgetConfig]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Send message to API
      const response = await chatApi.sendMessage({
        widget_id: widgetId,
        session_id: sessionId,
        message: userMessage.content,
      });

      // Add AI response after a small delay to simulate typing
      setTimeout(() => {
        const aiMessage: Message = {
          id: `ai_${Date.now()}`,
          content: response.data.response,
          sender: "ai",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
      }, widgetConfig.behavior?.responseDelay || 500);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);

      // Add error message
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        content:
          "Sorry, I couldn't process your request. Please try again later.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className="flex flex-col h-full rounded-lg overflow-hidden"
      style={{
        fontFamily: widgetConfig.design?.fontFamily || "Inter",
        fontSize: `${widgetConfig.design?.fontSize || 14}px`,
        color: widgetConfig.design?.textColor || "#111827",
        backgroundColor: widgetConfig.design?.secondaryColor || "#f3f4f6",
        borderRadius: `${widgetConfig.design?.borderRadius || 8}px`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 shadow-sm"
        style={{
          backgroundColor: widgetConfig.design?.primaryColor || "#3b82f6",
          color: "#ffffff",
        }}
      >
        <div className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          <h3 className="font-medium">
            {widgetConfig.design?.headerText || "Chat with AI Assistant"}
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          {onMinimize && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-white hover:bg-white/20"
              onClick={onMinimize}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="flex items-start">
                  {message.sender === "ai" && (
                    <Avatar className="h-6 w-6 mr-2">
                      <div className="h-full w-full rounded-full bg-primary flex items-center justify-center text-white text-xs">
                        AI
                      </div>
                    </Avatar>
                  )}
                  <div>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {widgetConfig.behavior?.showTimestamp && (
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === "user"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <div className="h-full w-full rounded-full bg-primary flex items-center justify-center text-white text-xs">
                      AI
                    </div>
                  </Avatar>
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {widgetConfig.behavior?.typingIndicator
                      ? "Typing..."
                      : "Loading..."}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* Input */}
      <div className="p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex space-x-2"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              widgetConfig.design?.placeholderText ||
              "Type your message here..."
            }
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            style={{
              backgroundColor: widgetConfig.design?.primaryColor || "#3b82f6",
            }}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {widgetConfig.design?.buttonText || "Send"}
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatWidget;
