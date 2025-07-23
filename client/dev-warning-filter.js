// Development warning filter to suppress useLayoutEffect SSR warnings
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  const filterWarnings = (originalMethod, message, ...args) => {
    if (typeof message === 'string') {
      // Filter out useLayoutEffect server warnings
      if (message.includes('useLayoutEffect does nothing on the server')) {
        return;
      }
      // Filter out ShadowPortal related warnings
      if (message.includes('ShadowPortal') || message.includes('ReactDevOverlay')) {
        return;
      }
      // Filter out Next.js dev overlay warnings
      if (message.includes('react-dev-overlay')) {
        return;
      }
    }
    
    originalMethod.apply(console, [message, ...args]);
  };

  console.warn = (message, ...args) => filterWarnings(originalConsoleWarn, message, ...args);
  console.error = (message, ...args) => filterWarnings(originalConsoleError, message, ...args);
}