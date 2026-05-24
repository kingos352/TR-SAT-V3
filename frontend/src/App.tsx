import React from 'react';
import { StatusBar } from './components/Console/StatusBar';
import { SidePanel } from './components/Console/SidePanel';
import { CesiumViewer } from './components/Globe/CesiumViewer';
import { TelemetryPanel } from './components/Console/TelemetryPanel';
import { ObserverPanel } from './components/Console/ObserverPanel';

const App: React.FC = () => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateAreas: `
        "header header header"
        "sidebar main telemetry"
      `,
      gridTemplateRows: '60px 1fr',
      gridTemplateColumns: '320px 1fr 340px',
      width: '100%',
      height: '100vh',
      backgroundColor: 'var(--bg-space-dark)',
      color: '#e2e8f0',
      overflow: 'hidden'
    }}>
      {/* Top Status Bar */}
      <StatusBar />

      {/* Left Ingestion, Search and Logs */}
      <SidePanel />

      {/* Center 3D Globe Visualizer */}
      <main style={{
        gridArea: 'main',
        position: 'relative',
        borderRight: '1px solid var(--border-color)',
        height: 'calc(100vh - 60px)'
      }}>
        <CesiumViewer />
        
        {/* Overlay Note */}
        <div className="mono-text" style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(4px)',
          padding: '10px 16px',
          borderRadius: '6px',
          border: '1px solid var(--accent-cyan)',
          color: 'var(--text-bright)',
          fontSize: '11px',
          zIndex: 5,
          pointerEvents: 'none',
          boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)'
        }}>
          🛰️ Cesium selected-object rendering will be implemented in Phase 6.
        </div>
      </main>

      {/* Right Tracking Controls and Observers */}
      <section style={{
        gridArea: 'telemetry',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: 'calc(100vh - 60px)',
        overflowY: 'auto',
        padding: '16px',
        borderLeft: 'none',
        backgroundColor: 'rgba(17, 24, 39, 0.3)'
      }}>
        <TelemetryPanel />
        <ObserverPanel />
      </section>
    </div>
  );
};

export default App;
