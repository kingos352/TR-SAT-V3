import React, { useEffect, useState } from 'react';
import { useConsoleStore } from '../../store/useConsoleStore';
import { getHealth } from '../../api/client';

export const StatusBar: React.FC = () => {
  const [utcTime, setUtcTime] = useState<string>('');
  const { backendStatus, setBackendStatus, addSystemLog, cesiumTokenMissing } = useConsoleStore();

  // Dynamic UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const isoStr = now.toISOString(); // format: YYYY-MM-DDTHH:mm:ss.sssZ
      setUtcTime(isoStr.replace('T', ' ').substring(0, 19) + ' UTC');
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll backend health status
  useEffect(() => {
    let active = true;
    const checkConnection = async () => {
      try {
        await getHealth();
        if (active) {
          if (backendStatus !== 'connected') {
            setBackendStatus('connected');
            addSystemLog('System: Backend API connected successfully.');
          }
        }
      } catch (err) {
        if (active) {
          if (backendStatus !== 'disconnected') {
            setBackendStatus('disconnected');
            addSystemLog('CRITICAL: Backend API disconnected. Retrying connection...');
          }
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [backendStatus, setBackendStatus, addSystemLog]);

  return (
    <header className="glass-panel" style={{
      gridArea: 'header',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: '60px',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 style={{ 
          fontSize: '18px', 
          fontWeight: 700, 
          letterSpacing: '0.05em', 
          textTransform: 'uppercase',
          background: 'linear-gradient(to right, #00f2fe, #4facfe)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: 'var(--font-mono)'
        }}>
          TR-SAT Mission Control V3
        </h1>
        
        {cesiumTokenMissing && (
          <div className="mono-text" style={{
            fontSize: '11px',
            color: 'var(--accent-orange)',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            padding: '2px 8px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            animation: 'pulse-glow 2s infinite'
          }}>
            🛰️ Fallback Globe (No Ion Token)
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '14px' }}>
        {/* UTC Clock */}
        <div className="mono-text" style={{ color: 'var(--text-bright)', letterSpacing: '0.1em' }}>
          {utcTime}
        </div>

        {/* API connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`status-indicator ${
            backendStatus === 'connected' ? 'status-ok' : 
            backendStatus === 'checking' ? 'status-warning' : 'status-error'
          }`} />
          <span className="mono-text" style={{ 
            fontSize: '12px', 
            textTransform: 'uppercase',
            color: backendStatus === 'connected' ? 'var(--accent-green)' : 
                   backendStatus === 'checking' ? 'var(--accent-orange)' : 'var(--accent-red)'
          }}>
            API: {backendStatus}
          </span>
        </div>
      </div>
    </header>
  );
};
