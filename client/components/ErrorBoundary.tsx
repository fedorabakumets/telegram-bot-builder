import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

interface FallbackProps {
  error: Error;
}

const DefaultFallback: React.FC<FallbackProps> = ({ error }) => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <h2 className="text-xl font-bold text-destructive mb-2">Произошла ошибка</h2>
      <p className="text-muted-foreground mb-4">
        {error.message || 'Произошла непредвиденная ошибка. Пожалуйста, обновите страницу.'}
      </p>
      <button
        className="inline-flex items-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        onClick={() => window.location.reload()}
      >
        Обновить страницу
      </button>
    </div>
  </div>
);

export default ErrorBoundary;