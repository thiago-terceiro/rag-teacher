import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface WidgetErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  public override state: WidgetErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.warn('WidgetErrorBoundary caught isolated error:', {
      message: error?.message,
      componentStack: errorInfo?.componentStack,
    });
  }

  private handleReset = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="polite"
          className="my-6 p-5 rounded-xl border border-destructive/30 bg-destructive/5 text-foreground text-xs space-y-3"
        >
          <div className="flex items-center space-x-2 text-destructive font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>{this.props.fallbackTitle || 'Widget failed to render'}</span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            {this.state.error?.message || 'An error occurred while loading this interactive component.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium border border-border/70 transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Widget</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WidgetErrorBoundary;
