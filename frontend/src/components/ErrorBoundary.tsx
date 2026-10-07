import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import BkpkButton from '../shared/ui/BkpkButton';

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
        <div className="flex items-center justify-center min-h-[60dvh] px-4 py-8 sm:p-8">
          <div
            className="w-full max-w-xl bg-bkpk-surface border border-bkpk-border-subtle border-l-4 border-l-bkpk-danger p-5 sm:p-8 flex flex-col gap-4"
          >
            <div className="w-10 h-10 border border-bkpk-border-strong flex items-center justify-center text-bkpk-text-danger shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="font-display text-[28px] sm:text-[32px] leading-none text-bkpk-text-primary">
              Coś poszło nie tak
            </h2>
            <p className="text-base text-bkpk-text-secondary leading-relaxed">
              Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę lub kliknij przycisk poniżej.
            </p>
            {this.state.error && (
              <pre className="text-xs text-bkpk-text-muted bg-bkpk-bg border border-bkpk-border-subtle p-4 overflow-x-auto whitespace-pre-wrap break-words">
                {this.state.error.message}
              </pre>
            )}
            <div className="pt-2">
              <BkpkButton variant="primary" onClick={this.handleRetry}>
                <RotateCcw className="w-4 h-4" />
                Spróbuj ponownie
              </BkpkButton>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
