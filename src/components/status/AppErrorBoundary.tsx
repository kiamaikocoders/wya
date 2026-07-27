import React from 'react';
import { StatusScreen } from '@/components/status/StatusScreen';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

/**
 * Catches render errors and shows Figma Status · 500.
 */
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('AppErrorBoundary', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <StatusScreen
          variant="server_error"
          onRetry={this.reset}
          onPrimary={() => {
            this.reset();
            window.location.reload();
          }}
        />
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;
