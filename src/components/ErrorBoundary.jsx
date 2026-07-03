import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("App render error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
          <div className="max-w-md text-center space-y-3">
            <h1 className="font-heading text-xl font-bold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground break-words">{this.state.error?.message || "Unexpected error"}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium">Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}