import React from 'react';
import { StatusBar } from './components/Console/StatusBar';
import { SidePanel } from './components/Console/SidePanel';
import { CesiumViewer } from './components/Globe/CesiumViewer';
import { TelemetryPanel } from './components/Console/TelemetryPanel';
import { ObserverPanel } from './components/Console/ObserverPanel';
import { LiveTrackingPanel } from './components/Console/LiveTrackingPanel';
import { ConjunctionPanel } from './components/Console/ConjunctionPanel';
import { CatalogLayerPanel } from './components/Console/CatalogLayerPanel';

import { ExportPanel } from './components/Console/ExportPanel';

const App: React.FC = () => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateAreas: `
        "header header header"
        "left-dock main right-dock"
      `,
      gridTemplateRows: '50px 1fr',
      gridTemplateColumns: '350px 1fr 350px',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'var(--bg-space-dark)',
      color: 'var(--text-bright)',
      overflow: 'hidden'
    }}>
      {/* Top Status Bar & Header */}
      <StatusBar />

      {/* Left Dock */}
      <aside style={{
        gridArea: 'left-dock',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '12px',
        height: 'calc(100vh - 50px)',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-console-panel)',
        borderRight: '1px solid var(--border-color)',
        zIndex: 10
      }}>
        <SidePanel />
        <CatalogLayerPanel />
      </aside>

      {/* Center 3D Globe Visualizer */}
      <main style={{
        gridArea: 'main',
        position: 'relative',
        height: 'calc(100vh - 50px)',
        overflow: 'hidden'
      }}>
        <CesiumViewer />
        
        {/* Overlay Title */}
        <div className="mono-text" style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'rgba(11, 25, 44, 0.85)',
          backdropFilter: 'blur(4px)',
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid var(--accent-primary)',
          color: 'var(--accent-primary)',
          fontSize: '11px',
          zIndex: 5,
          pointerEvents: 'none',
          boxShadow: '0 0 10px rgba(56, 189, 248, 0.1)'
        }}>
          ACTIVE ORBIT VISUALIZATION [SGP4]
        </div>
      </main>

      {/* Right Dock */}
      <aside style={{
        gridArea: 'right-dock',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '12px',
        height: 'calc(100vh - 50px)',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-console-panel)',
        borderLeft: '1px solid var(--border-color)',
        zIndex: 10
      }}>
        <LiveTrackingPanel />
        <TelemetryPanel />
        <ObserverPanel />
        <ConjunctionPanel />
        <ExportPanel />
      </aside>
    </div>
  );
};

export default App;
