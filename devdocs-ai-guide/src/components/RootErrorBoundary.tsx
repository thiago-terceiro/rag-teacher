import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('RootErrorBoundary caught unhandled error:', {
      timestamp: new Date().toISOString(),
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 selection:bg-primary/20 selection:text-primary"
        >
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-card border border-border/80 shadow-2xl text-center space-y-5 animate-in fade-in duration-200">
            <div className="w-12 h-12 mx-auto rounded-xl bg-destructive/10 border border-destructive/25 text-destructive flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Something went wrong
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                An unexpected runtime error occurred while rendering this view. Your progress and study notes are saved locally.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/60 text-left font-mono text-[11px] text-muted-foreground break-all max-h-32 overflow-y-auto custom-scrollbar">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs border border-border/70 transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Home className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default RootErrorBoundary;
