import React from 'react';
import { useConsoleStore } from '../../store/useConsoleStore';

export const SidePanel: React.FC = () => {
  const { activePanel, setActivePanel, systemLogs } = useConsoleStore();

  const navItems = [
    { id: 'mission_control', label: 'Mission Control', icon: '📡' },
    { id: 'catalog', label: 'Object Catalog', icon: '🛰️' },
    { id: 'globe_config', label: '3D Globe Config', icon: '🌍' },
    { id: 'data_sources', label: 'Data Sources', icon: '🗄️' },
  ] as const;

  return (
    <aside className="glass-panel" style={{
      gridArea: 'sidebar',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '20px',
      borderTop: 'none',
      borderLeft: 'none',
      borderBottom: 'none',
      zIndex: 10,
      width: '320px',
      height: 'calc(100vh - 60px)',
      overflowY: 'hidden'
    }}>
      {/* Navigation section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'var(--text-muted)',
            marginBottom: '12px',
            fontWeight: 600
          }}>
            Orbital Intelligence
          </h2>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navItems.map((item) => {
              const isActive = activePanel === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePanel(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isActive ? 'rgba(6, 182, 212, 0.4)' : 'transparent',
                    background: isActive ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    color: isActive ? 'var(--text-bright)' : 'var(--text-muted)',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 400,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 0 15px rgba(6, 182, 212, 0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.color = 'var(--text-bright)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Selected Objects Tracker Indicator */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h3 style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            marginBottom: '8px'
          }}>
            Active Tracking Set
          </h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="mono-text" style={{ fontSize: '24px', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
              0
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 20 satellites</span>
          </div>
        </div>
      </div>

      {/* Terminal Logs section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        height: '40%',
        minHeight: '200px',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '16px'
      }}>
        <h3 style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text-muted)'
        }}>
          System Event Logs
        </h3>
        <div className="mono-text" style={{
          flexGrow: 1,
          backgroundColor: 'rgba(3, 7, 18, 0.6)',
          border: '1px solid rgba(75, 85, 99, 0.2)',
          borderRadius: '6px',
          padding: '12px',
          fontSize: '11px',
          color: 'var(--accent-green)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          lineHeight: '1.4'
        }}>
          {systemLogs.map((log, index) => (
            <div key={index} style={{ wordBreak: 'break-all' }}>
              {`> ${log}`}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
