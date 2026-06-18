import { Component, ErrorInfo, ReactNode } from 'react';

// Catches any runtime error thrown while rendering the app and shows it INLINE
// (with the real message + stack) instead of leaving a blank window. This makes
// render-time bugs visible the moment you run `npm run dev` / preview — no need to
// package the app or dig through DevTools to discover them.
interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
  componentStack: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Also log to the console so it shows up in terminals / CI output.
    console.error('[StardewMaxxing] render error:', error, info.componentStack);
    this.setState({ componentStack: info.componentStack ?? '' });
  }

  render() {
    if (!this.state.error) return this.props.children;

    // Intentionally plain inline styles (no Tailwind / theme) so this still renders
    // even if the failure is in styling or the i18n/theme layer.
    return (
      <div
        style={{
          padding: 24,
          minHeight: '100%',
          color: '#f4ecd8',
          background: '#3a2417',
          fontFamily: 'ui-monospace, Menlo, monospace',
          lineHeight: 1.5,
        }}
      >
        <h2 style={{ color: '#ffd866', margin: '0 0 8px' }}>⚠️ Something broke while rendering</h2>
        <p style={{ margin: '0 0 12px', opacity: 0.85 }}>
          A runtime error was caught and shown here instead of a blank screen. The message below is
          the actual error — fix it in the source and the app will hot-reload.
        </p>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            background: 'rgba(0,0,0,0.35)',
            padding: 12,
            borderRadius: 6,
            margin: 0,
          }}
        >
          {String(this.state.error.stack || this.state.error)}
        </pre>
        {this.state.componentStack && (
          <pre style={{ whiteSpace: 'pre-wrap', opacity: 0.6, fontSize: 12, marginTop: 8 }}>
            {this.state.componentStack}
          </pre>
        )}
      </div>
    );
  }
}
