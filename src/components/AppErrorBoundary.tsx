import React from 'react';

type AppErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
};

class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown render error',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AppErrorBoundary caught render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-[#0a0e14] text-white flex items-center justify-center p-8">
          <div className="max-w-2xl w-full rounded-3xl border border-rose-500/20 bg-rose-500/10 p-8 shadow-2xl">
            <div className="text-[11px] uppercase tracking-[0.28em] text-rose-300 font-black mb-3">Dashboard runtime error</div>
            <h1 className="text-3xl font-black mb-3">The app hit a frontend error while rendering.</h1>
            <p className="text-slate-200 mb-5 leading-relaxed">
              This is better than a blank screen: the latest render error is shown below so it can be fixed directly.
            </p>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-sm text-rose-100 break-words">
              {this.state.errorMessage}
            </div>
            <div className="text-sm text-slate-300 mt-5">
              Try reloading after the code is patched, or report the exact message above.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
