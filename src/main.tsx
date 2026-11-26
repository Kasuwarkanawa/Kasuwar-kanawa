import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

type BoundaryState = { error: Error | null };

class AppErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Kasuwar Kanawa render error]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ minHeight: '100vh', padding: '32px 20px', background: '#06381C', color: '#F4F7F5', fontFamily: 'Arial, sans-serif' }}>
          <section style={{ maxWidth: 720, margin: '8vh auto', padding: 24, background: '#0A4A26', border: '1px solid rgba(255,255,255,.14)', borderRadius: 16 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF' }}>Kasuwar Kanawa — An samu matsalar bude shafin</h1>
            <p style={{ marginTop: 12, color: '#B8D1C2' }}>An kama kuskuren da ya hana shafin nunawa. Aika wannan bayanin ga mai kula da website domin gyara.</p>
            <pre style={{ marginTop: 16, padding: 14, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', background: '#042914', color: '#F4F7F5', borderRadius: 8, fontSize: 12 }}>{this.state.error.message}{'\n'}{this.state.error.stack || ''}</pre>
            <button onClick={() => window.location.reload()} style={{ marginTop: 18, padding: '12px 18px', border: 0, borderRadius: 8, background: '#FCF8E8', color: '#06381C', fontWeight: 700 }}>Sake bude website</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.textContent = 'Kasuwar Kanawa: ba a samu root element ba (missing #root).';
} else {
  createRoot(rootElement).render(
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}
