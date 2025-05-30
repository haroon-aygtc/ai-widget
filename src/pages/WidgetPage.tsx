import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ChatWidget from "@/components/widget/ChatWidget";

const WidgetPage: React.FC = () => {
  const { widgetId } = useParams<{ widgetId: string }>();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Listen for messages from parent window
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      const allowedOrigins = [
        'http://localhost:5173',
        'https://widget.alyalayis.com'
      ];
      
      if (!allowedOrigins.includes(event.origin) && event.origin !== window.location.origin) return;
      
      const { action, widgetId: messageWidgetId } = event.data;
      
      if (action === 'widget:config' && messageWidgetId) {
        // Load widget configuration
        loadWidgetConfig(messageWidgetId);
      }
    };

    window.addEventListener('message', handleMessage);

    // Notify parent that widget is ready
    if (window !== window.parent) {
      window.parent.postMessage({ action: 'widget:ready' }, '*');
    } else {
      // If opened directly, load config using URL param
      if (widgetId) {
        loadWidgetConfig(widgetId);
      }
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [widgetId]);

  const loadWidgetConfig = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/widgets/${id}/config`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load widget configuration');
      }
      
      const data = await response.json();
      setConfig(data);
    } catch (err) {
      console.error('Error loading widget configuration:', err);
      setError('Failed to load widget configuration');
      
      // Use default configuration
      setConfig({
        design: {
          primaryColor: '#3b82f6',
          secondaryColor: '#f3f4f6',
          textColor: '#111827',
          fontFamily: 'Inter',
          fontSize: 14,
          borderRadius: 8,
          headerText: 'Chat with AI Assistant',
          buttonText: 'Send',
          placeholderText: 'Type your message here...',
        },
        behavior: {
          welcomeMessage: 'Hello! How can I help you today?',
          typingIndicator: true,
          showTimestamp: true,
          responseDelay: 500,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMinimize = () => {
    setIsExpanded(false);
    // Notify parent window to collapse the iframe
    if (window !== window.parent) {
      window.parent.postMessage({ action: 'widget:collapse' }, '*');
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
    // Notify parent window to expand the iframe
    if (window !== window.parent) {
      window.parent.postMessage({
        action: 'widget:expand',
        data: {
          width: 350,
          height: 500,
          borderRadius: config?.design?.borderRadius || 8
        }
      }, '*');
    }
  };

  const handleClose = () => {
    handleMinimize();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center p-4">
          <p className="text-red-500">{error}</p>
          <button
            className="mt-2 px-4 py-2 bg-primary text-white rounded-md"
            onClick={() => widgetId && loadWidgetConfig(widgetId)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isExpanded) {
    return (
      <div className="h-full bg-background">
        <ChatWidget
          widgetId={widgetId || 'demo'}
          config={config}
          onMinimize={handleMinimize}
          onClose={handleClose}
        />
      </div>
    );
  }

  return (
    <div
      className="h-full w-full flex items-center justify-center cursor-pointer rounded-full"
      style={{ backgroundColor: config?.design?.primaryColor || '#3b82f6' }}
      onClick={handleExpand}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6 text-white"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </div>
  );
};

export default WidgetPage;
