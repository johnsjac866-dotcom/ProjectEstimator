import React from 'react';

export default class ChunkErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
          <p className="text-muted-foreground text-sm">
            This page couldn't load — you may be offline or the page hasn't been cached yet.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm underline text-primary"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}