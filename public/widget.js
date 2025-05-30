/**
 * AI Chat Widget Loader
 * Lightweight script to load and initialize the AI chat widget
 */
(function() {
    // Configuration
    const config = {
      apiUrl: window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : 'https://api.alyalayis.com/api',
      widgetUrl: window.location.hostname === 'localhost' ? 'http://localhost:5173/widget/' : 'https://widget.alyalayis.com/widget/',
      defaultPosition: 'bottom-right',
      defaultOffsetX: 20,
      defaultOffsetY: 20,
    };
  
    // Get the current script tag
    const currentScript = document.currentScript;
    const widgetId = currentScript.getAttribute('data-widget-id') || 'demo';
    
    // Create widget container
    function createWidgetContainer() {
      const container = document.createElement('div');
      container.id = 'ai-chat-widget-container';
      container.style.position = 'fixed';
      container.style.zIndex = '9999';
      container.style.overflow = 'hidden';
      document.body.appendChild(container);
      return container;
    }
  
    // Load widget configuration from API
    async function loadWidgetConfig() {
      try {
        const response = await fetch(`${config.apiUrl}/widgets/${widgetId}/config`);
        if (!response.ok) throw new Error('Failed to load widget configuration');
        return await response.json();
      } catch (error) {
        console.error('Error loading widget configuration:', error);
        return {
          design: {
            primaryColor: '#3b82f6',
            position: config.defaultPosition,
          },
          placement: {
            position: config.defaultPosition,
            offsetX: config.defaultOffsetX,
            offsetY: config.defaultOffsetY,
            triggerType: 'button',
          }
        };
      }
    }
  
    // Position the widget based on configuration
    function positionWidget(container, widgetConfig) {
      const position = widgetConfig.placement?.position || config.defaultPosition;
      const offsetX = widgetConfig.placement?.offsetX || config.defaultOffsetX;
      const offsetY = widgetConfig.placement?.offsetY || config.defaultOffsetY;
      
      // Reset all positions
      container.style.top = 'auto';
      container.style.right = 'auto';
      container.style.bottom = 'auto';
      container.style.left = 'auto';
      
      // Set position based on configuration
      switch (position) {
        case 'bottom-right':
          container.style.bottom = `${offsetY}px`;
          container.style.right = `${offsetX}px`;
          break;
        case 'bottom-left':
          container.style.bottom = `${offsetY}px`;
          container.style.left = `${offsetX}px`;
          break;
        case 'top-right':
          container.style.top = `${offsetY}px`;
          container.style.right = `${offsetX}px`;
          break;
        case 'top-left':
          container.style.top = `${offsetY}px`;
          container.style.left = `${offsetX}px`;
          break;
        default:
          container.style.bottom = `${offsetY}px`;
          container.style.right = `${offsetX}px`;
      }
    }
  
    // Create iframe for the widget
    function createWidgetIframe(container, widgetConfig) {
      const iframe = document.createElement('iframe');
      iframe.id = 'ai-chat-widget-iframe';
      iframe.src = `${config.widgetUrl}${widgetId}`;
      iframe.style.border = 'none';
      iframe.style.width = '60px';
      iframe.style.height = '60px';
      iframe.style.borderRadius = '50%';
      iframe.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      iframe.style.transition = 'all 0.3s ease';
      iframe.style.backgroundColor = widgetConfig.design?.primaryColor || '#3b82f6';
      
      // Add iframe to container
      container.appendChild(iframe);
      return iframe;
    }
  
    // Setup message communication with iframe
    function setupMessageHandling(iframe) {
      window.addEventListener('message', (event) => {
        // Verify origin for security
        const allowedOrigins = [
          'http://localhost:5173',
          'https://widget.alyalayis.com'
        ];
        
        if (!allowedOrigins.includes(event.origin)) return;
        
        const { action, data } = event.data;
        
        switch (action) {
          case 'widget:expand':
            iframe.style.width = `${data.width || 350}px`;
            iframe.style.height = `${data.height || 500}px`;
            iframe.style.borderRadius = `${data.borderRadius || 12}px`;
            break;
            
          case 'widget:collapse':
            iframe.style.width = '60px';
            iframe.style.height = '60px';
            iframe.style.borderRadius = '50%';
            break;
            
          case 'widget:ready':
            // Send configuration to the widget
            iframe.contentWindow.postMessage({
              action: 'widget:config',
              widgetId: widgetId
            }, '*');
            break;
        }
      });
    }
  
    // Initialize the widget
    async function initWidget() {
      const widgetConfig = await loadWidgetConfig();
      const container = createWidgetContainer();
      positionWidget(container, widgetConfig);
      const iframe = createWidgetIframe(container, widgetConfig);
      setupMessageHandling(iframe);
    }
  
    // Initialize when DOM is fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initWidget);
    } else {
      initWidget();
    }
  })();
  