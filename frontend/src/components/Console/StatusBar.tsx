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
    lastTelemetryFrameUtc,
    showOrbitPath, setShowOrbitPath,
    showGroundTrack, setShowGroundTrack,
    showObserver, setShowObserver,
    enableEarthLighting, setEnableEarthLighting,
    enableEarthRotation, setEnableEarthRotation,
    followActiveObject, setFollowActiveObject
  } = useConsoleStore();

  const [cesiumTokenMissing, setCesiumTokenMissing] = useState(false);
  const [showGlobeControls, setShowGlobeControls] = useState(false);

  const GlobeControlsMenu = () => (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: '8px',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '12px',
      minWidth: '220px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
      zIndex: 100,
      color: 'var(--text-bright)'
    }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input 
          type="checkbox" 
          checked={showOrbitPath} 
          onChange={(e) => setShowOrbitPath(e.target.checked)}
          style={{ accentColor: 'var(--accent-cyan)' }}
        />
        Show Orbit Path
      </label>
      
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input 
          type="checkbox" 
          checked={showGroundTrack} 
          onChange={(e) => setShowGroundTrack(e.target.checked)}
          style={{ accentColor: 'var(--accent-cyan)' }}
        />
        Show Ground Track
      </label>
      
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input 
          type="checkbox" 
          checked={showObserver} 
          onChange={(e) => setShowObserver(e.target.checked)}
          style={{ accentColor: 'var(--accent-cyan)' }}
        />
        Show Observer Station
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px', marginTop: '2px' }}>
        <input 
          type="checkbox" 
          checked={enableEarthLighting} 
          onChange={(e) => setEnableEarthLighting(e.target.checked)}
          style={{ accentColor: 'var(--accent-orange)' }}
        />
        Earth Sun Lighting
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input 
          type="checkbox" 
          checked={enableEarthRotation} 
          onChange={(e) => setEnableEarthRotation(e.target.checked)}
          style={{ accentColor: 'var(--accent-orange)' }}
        />
        Real-Time Earth Rotation
      </label>

      <label style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        cursor: activeObject ? 'pointer' : 'not-allowed', 
        borderTop: '1px solid var(--border-color)', 
        paddingTop: '6px',
        opacity: activeObject ? 1 : 0.5
      }}>
        <input 
          type="checkbox" 
          checked={followActiveObject} 
          onChange={(e) => setFollowActiveObject(e.target.checked)}
          disabled={!activeObject}
          style={{ accentColor: 'var(--accent-cyan)', cursor: activeObject ? 'pointer' : 'not-allowed' }}
        />
        Camera Lock Follow
      </label>
    </div>
  );

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
      height: '50px',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      borderBottom: '1px solid var(--border-color)',
      borderRadius: '0',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 style={{ 
          fontSize: '16px', 
          fontWeight: 700, 
          letterSpacing: '0.05em', 
          textTransform: 'uppercase',
          color: 'var(--text-bright)',
          fontFamily: 'var(--font-mono)'
        }}>
          TR-SAT Mission Control
        </h1>
        
        <div style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Local-first orbital intelligence and mission analysis platform
        </div>

        {cesiumTokenMissing ? (
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowGlobeControls(!showGlobeControls)}
              className="mono-text" 
              style={{
                fontSize: '11px',
                color: 'var(--accent-orange)',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🛰️ Fallback Globe (No Ion Token) <span>{showGlobeControls ? '▼' : '►'}</span>
            </button>
            {showGlobeControls && (
              <GlobeControlsMenu />
            )}
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowGlobeControls(!showGlobeControls)}
              className="mono-text" 
              style={{
                fontSize: '11px',
                color: 'var(--accent-cyan)',
                backgroundColor: 'rgba(0, 216, 255, 0.1)',
                border: '1px solid rgba(0, 216, 255, 0.3)',
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🌍 Globe Controls <span>{showGlobeControls ? '▼' : '►'}</span>
            </button>
            {showGlobeControls && (
              <GlobeControlsMenu />
            )}
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
