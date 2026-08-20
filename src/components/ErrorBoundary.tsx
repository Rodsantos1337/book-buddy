import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg-0 p-4">
          <div className="flex max-w-md flex-col items-center rounded-xl border border-bg-3 bg-bg-1 px-8 py-12 text-center shadow-lg">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red/10">
              <AlertTriangle className="h-7 w-7 text-red" />
            </div>
            <h2 className="text-xl font-bold text-fg">Something went wrong</h2>
            <p className="mt-2 text-sm text-grey-0">An unexpected error occurred. Please try again.</p>
            <button
              onClick={this.handleReset}
              className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full border border-bg-3 bg-bg-1 px-5 py-2 text-sm text-grey-0 hover:border-green/40 hover:text-fg"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
