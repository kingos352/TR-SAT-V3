import React, { useEffect, useState } from 'react';
import { useConsoleStore } from '../../store/useConsoleStore';
import { getHealth } from '../../api/client';

export const StatusBar: React.FC = () => {
  const [utcTime, setUtcTime] = useState<string>('');
  const { 
    apiStatus, 
    setApiStatus, 
    selectedObjects, 
    activeObject, 
    observer, 
    addLog,
    liveTrackingEnabled,
    liveConnectionStatus,
    liveRateHz,
    lastTelemetryFrameUtc
  } = useConsoleStore();

  const [cesiumTokenMissing, setCesiumTokenMissing] = useState(false);

  // Dynamic ticking UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
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
          if (apiStatus !== 'connected') {
            setApiStatus('connected');
            addLog('System: Backend API connected successfully.');
          }
        }
      } catch (err: any) {
        if (active) {
          if (apiStatus !== 'disconnected') {
            setApiStatus('disconnected', err.message);
            addLog(`CRITICAL: Backend API disconnected. Retrying... (${err.message})`);
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
  }, [apiStatus, setApiStatus, addLog]);

  // Check if cesium token exists in environmental variables
  useEffect(() => {
    const token = import.meta.env.VITE_CESIUM_ION_TOKEN || '';
    setCesiumTokenMissing(!token || token.trim().length === 0);
  }, []);

  return (
    <header className="glass-panel" style={{
      gridArea: 'header',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
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
        
        <div className="mono-text" style={{
          fontSize: '11px',
          color: 'var(--accent-cyan)',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          padding: '2px 8px',
          borderRadius: '4px',
          textTransform: 'uppercase'
        }}>
          LOCAL-FIRST CONSOLE
        </div>

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

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '13px' }}>
        {/* Dynamic UTC clock */}
        <div className="mono-text" style={{ color: 'var(--text-bright)', letterSpacing: '0.1em' }}>
          {utcTime}
        </div>

        {/* Selected satellites count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Selected:</span>
          <span className="mono-text" style={{ 
            color: selectedObjects.length > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontWeight: 600
          }}>
            {selectedObjects.length}/20
          </span>
        </div>

        {/* Active tracking satellite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Active:</span>
          <span className="mono-text" style={{ 
            color: activeObject ? 'var(--accent-green)' : 'var(--accent-red)',
            fontWeight: 600
          }}>
            {activeObject ? `${activeObject.name} (${activeObject.norad_id})` : 'NONE'}
          </span>
        </div>

        {/* Observer Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Station:</span>
          <span className="mono-text" style={{ color: 'var(--text-bright)' }}>
            {observer.name}
          </span>
        </div>

        {/* Live tracking status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid var(--border-color)', paddingRight: '16px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Live Tracking:</span>
          <span className={`status-indicator ${
            !liveTrackingEnabled ? 'status-muted' :
            liveConnectionStatus === 'LIVE' ? 'status-ok' : 
            liveConnectionStatus === 'PAUSED' ? 'status-warning' : 'status-error'
          }`} style={!liveTrackingEnabled ? { backgroundColor: 'rgba(75, 85, 99, 0.5)', boxShadow: 'none' } : undefined} />
          <span className="mono-text" style={{ 
            fontSize: '11px', 
            textTransform: 'uppercase',
            color: !liveTrackingEnabled ? 'var(--text-muted)' :
                   liveConnectionStatus === 'LIVE' ? 'var(--accent-green)' : 
                   liveConnectionStatus === 'PAUSED' ? 'var(--accent-orange)' : 'var(--accent-red)',
            fontWeight: 600
          }}>
            {!liveTrackingEnabled ? 'OFFLINE' : liveConnectionStatus === 'LIVE' ? `LIVE (${liveRateHz}Hz)` : liveConnectionStatus}
          </span>
          {liveTrackingEnabled && lastTelemetryFrameUtc && (
            <span className="mono-text" style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '4px' }}>
              [{lastTelemetryFrameUtc.substring(11, 19)}]
            </span>
          )}
        </div>

        {/* Connection status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`status-indicator ${
            apiStatus === 'connected' ? 'status-ok' : 
            apiStatus === 'checking' ? 'status-warning' : 'status-error'
          }`} />
          <span className="mono-text" style={{ 
            fontSize: '11px', 
            textTransform: 'uppercase',
            color: apiStatus === 'connected' ? 'var(--accent-green)' : 
                   apiStatus === 'checking' ? 'var(--accent-orange)' : 'var(--accent-red)',
            fontWeight: 600
          }}>
            {apiStatus === 'connected' ? 'ONLINE' : apiStatus === 'checking' ? 'CHECKING' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </header>
  );
};
