import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, this could report to an error tracking service
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bkpk-danger/10 border border-bkpk-danger/20 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-bkpk-danger" />
          </div>
          <h2 className="text-xl font-black font-outfit text-bkpk-text-primary mb-2">
            Coś poszło nie tak
          </h2>
          <p className="text-sm text-bkpk-text-muted max-w-md mb-6">
            Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę lub kliknij przycisk poniżej.
          </p>
          {this.state.error && (
            <pre className="text-xs text-bkpk-text-muted bg-bkpk-surface-tint-1 border border-bkpk-border-subtle rounded-xl p-4 mb-6 max-w-lg overflow-x-auto">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleRetry}
            className="btn flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Spróbuj ponownie
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
