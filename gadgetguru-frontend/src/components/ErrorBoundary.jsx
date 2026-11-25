import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error?.message || "Unexpected error" };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-8 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8">
          <div className="text-lg font-bold text-rose-700">Something went wrong</div>
          <div className="mt-2 text-sm text-rose-600">{this.state.error}</div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
