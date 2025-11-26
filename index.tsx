import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Error Boundary to catch crashes (like missing API keys) and show a UI instead of a white screen
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center', marginTop: '50px' }}>
          <h1 style={{ color: '#ef4444' }}>Application Error</h1>
          <p style={{ color: '#374151' }}>Something went wrong. Please check the console for details.</p>
          <pre style={{ 
            textAlign: 'left', 
            background: '#f3f4f6', 
            padding: '15px', 
            borderRadius: '8px', 
            overflow: 'auto',
            maxWidth: '600px',
            margin: '20px auto',
            fontSize: '12px'
          }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    // Explicitly cast 'this' to any to bypass the TypeScript error "Property 'props' does not exist on type 'ErrorBoundary'"
    return (this as any).props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);