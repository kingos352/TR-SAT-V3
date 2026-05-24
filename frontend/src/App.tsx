import React from 'react';
import { StatusBar } from './components/Console/StatusBar';
import { SidePanel } from './components/Console/SidePanel';
import { CesiumViewer } from './components/Globe/CesiumViewer';
import { useConsoleStore } from './store/useConsoleStore';

const App: React.FC = () => {
  const { activeObserver, activePanel } = useConsoleStore();

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

      {/* Left Navigation & Logs */}
      <SidePanel />

      {/* Center 3D Globe Visualizer */}
      <main style={{
        gridArea: 'main',
        position: 'relative',
        borderRight: '1px solid var(--border-color)',
        height: 'calc(100vh - 60px)'
      }}>
        <CesiumViewer />
      </main>

      {/* Right Telemetry & Configuration Panel */}
      <section className="glass-panel" style={{
        gridArea: 'telemetry',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        height: 'calc(100vh - 60px)',
        overflowY: 'auto',
        borderTop: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        zIndex: 10
      }}>
        <div>
          <h2 style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'var(--text-muted)',
            marginBottom: '4px'
          }}>
            Active Workspace
          </h2>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text-bright)',
            textTransform: 'capitalize'
          }}>
            {activePanel.replace('_', ' ')}
          </h3>
        </div>

        {/* Observer Information widget */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <h4 style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)'
          }}>
            Primary Ground Observer
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Station:</span>
              <span className="mono-text" style={{ color: 'var(--text-bright)' }}>{activeObserver.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Latitude:</span>
              <span className="mono-text" style={{ color: 'var(--accent-cyan)' }}>
                {activeObserver.latitude.toFixed(4)}° N
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Longitude:</span>
              <span className="mono-text" style={{ color: 'var(--accent-cyan)' }}>
                {activeObserver.longitude.toFixed(4)}° E
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Elevation:</span>
              <span className="mono-text" style={{ color: 'var(--text-bright)' }}>
                {activeObserver.elevation} m ASL
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry placeholder info */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flexGrow: 1
        }}>
          <h4 style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)'
          }}>
            Telemetry & Mechanics
          </h4>
          
          <div style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            lineHeight: '1.6',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <p>
              No objects selected in console. Select satellites from the <strong>Object Catalog</strong> workspace to initialize tracking datasets.
            </p>
            <p>
              Telemetry represents simulated orbital propagation computed via analytical <strong>SGP4 algorithms</strong> based on public <strong>CelesTrak GP/TLE</strong> databases.
            </p>
            <div style={{
              borderLeft: '2px solid var(--accent-cyan)',
              paddingLeft: '10px',
              fontStyle: 'italic',
              fontSize: '12px'
            }}>
              "Notice: Public tracking represents calculated ephemeris states, not active command telemetry download links."
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;
