// Catches render-time errors so a crash shows a recoverable screen instead of
// a blank page, and reports the error to the console.
import React from 'react';
import { logError } from '../utils/errors';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    logError(`Unhandled render error${info?.componentStack ? ` in${info.componentStack.split('\n')[1] || ''}` : ''}`, error);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-xl shadow-md max-w-md w-full p-8 text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-600 mb-6">
            The page could not be displayed. You can reload and try again.
          </p>
          <p className="text-xs text-red-600 break-words mb-6">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
