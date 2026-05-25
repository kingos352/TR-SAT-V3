import React from 'react';
import { useConsoleStore } from '../../store/useConsoleStore';
import { useTelemetrySocket } from '../../hooks/useTelemetrySocket';

const WS_ENDPOINT = "/api/v1/ws/telemetry";

function buildWsUrl() {
  const explicit = import.meta.env.VITE_WS_BASE_URL;
  if (explicit) {
    return `${explicit.replace(/\/$/, "")}${WS_ENDPOINT}`;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
  const wsBase = apiBase
    .replace(/^https:\/\//, "wss://")
    .replace(/^http:\/\//, "ws://")
    .replace(/\/$/, "");

  return `${wsBase}${WS_ENDPOINT}`;
}

const WS_URL = buildWsUrl();

export const LiveTrackingPanel: React.FC = () => {
  const {
    selectedObjects,
    liveTrackingEnabled,
    liveConnectionStatus,
    liveRateHz,
    lastTelemetryFrameUtc,
    liveErrors,
    liveObjectStates,
    setLiveTrackingEnabled,
    setLiveRateHz
  } = useConsoleStore();

  const { pause, resume, stop, connect, disconnect } = useTelemetrySocket();

  const handleStop = () => {
    stop();
    disconnect();
  };

  const handleToggleTracking = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setLiveTrackingEnabled(enabled);
    if (!enabled) {
      stop();
      disconnect();
    }
  };

  const rates = [0.2, 0.5, 1, 2, 5];

  return (
    <section className="glass-panel" style={{
      padding: '16px',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)' }}>
          Live TLE-Based Tracking
        </h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={liveTrackingEnabled}
            onChange={handleToggleTracking}
            style={{ accentColor: 'var(--accent-green)' }}
          />
          Enable Live Tracking
        </label>
      </div>

      {liveTrackingEnabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
          {selectedObjects.length === 0 ? (
            <div style={{ fontSize: '11px', color: 'var(--accent-orange)', fontStyle: 'italic', backgroundColor: 'rgba(249, 115, 22, 0.05)', border: '1px solid rgba(249, 115, 22, 0.2)', padding: '8px', borderRadius: '6px' }}>
              ⚠️ Select at least one object in the catalog to start live tracking.
            </div>
          ) : (
            <>
              {/* Connection stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '6px 8px', borderRadius: '4px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Socket Status</div>
                  <div className="mono-text" style={{ 
                    fontWeight: 'bold', 
                    marginTop: '2px',
                    color: liveConnectionStatus === 'LIVE' ? 'var(--accent-green)' : 
                           liveConnectionStatus === 'PAUSED' ? 'var(--accent-orange)' : 'var(--accent-red)'
                  }}>{liveConnectionStatus}</div>
                </div>
                
                <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '6px 8px', borderRadius: '4px' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Last Frame</div>
                  <div className="mono-text" style={{ fontWeight: 'bold', marginTop: '2px', color: 'var(--text-bright)' }}>
                    {lastTelemetryFrameUtc ? lastTelemetryFrameUtc.substring(11, 19) + ' UTC' : 'WAITING'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {liveConnectionStatus === 'DISCONNECTED' && (
                  <button
                    onClick={connect}
                    disabled={selectedObjects.length === 0}
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: selectedObjects.length === 0 ? 'rgba(75, 85, 99, 0.2)' : 'var(--accent-green)',
                      color: 'var(--text-bright)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: selectedObjects.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Start Live
                  </button>
                )}

                {liveConnectionStatus === 'CONNECTING' && (
                  <button
                    disabled
                    style={{
                      flex: 1,
                      padding: '6px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: 'rgba(75, 85, 99, 0.2)',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'not-allowed'
                    }}
                  >
                    Connecting...
                  </button>
                )}

                {liveConnectionStatus === 'LIVE' && (
                  <>
                    <button
                      onClick={pause}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'var(--accent-orange)',
                        color: 'var(--text-bright)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Pause
                    </button>
                    <button
                      onClick={handleStop}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'var(--accent-red)',
                        color: 'var(--text-bright)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Stop
                    </button>
                  </>
                )}

                {liveConnectionStatus === 'PAUSED' && (
                  <>
                    <button
                      onClick={resume}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'var(--accent-green)',
                        color: 'var(--text-bright)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Resume
                    </button>
                    <button
                      onClick={handleStop}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'var(--accent-red)',
                        color: 'var(--text-bright)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Stop
                    </button>
                  </>
                )}

                {liveConnectionStatus === 'ERROR' && (
                  <>
                    <button
                      onClick={connect}
                      style={{
                        flex: 2,
                        padding: '6px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'var(--accent-green)',
                        color: 'var(--text-bright)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      🔄 Retry Connection
                    </button>
                    <button
                      onClick={handleStop}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'var(--accent-red)',
                        color: 'var(--text-bright)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Stop
                    </button>
                  </>
                )}
              </div>

              {/* Rate Hz selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Rate:</span>
                <div style={{ display: 'flex', gap: '4px', flexGrow: 1 }}>
                  {rates.map(r => (
                    <button
                      key={r}
                      onClick={() => setLiveRateHz(r)}
                      style={{
                        flex: 1,
                        padding: '3px 0',
                        borderRadius: '3px',
                        border: '1px solid',
                        borderColor: liveRateHz === r ? 'var(--accent-cyan)' : 'var(--border-color)',
                        backgroundColor: liveRateHz === r ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                        color: liveRateHz === r ? 'var(--text-bright)' : 'var(--text-muted)',
                        fontSize: '10px',
                        fontWeight: liveRateHz === r ? 600 : 400,
                        cursor: 'pointer'
                      }}
                    >
                      {r}Hz
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* WS Diagnostic Details */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-color)',
            padding: '8px 10px',
            borderRadius: '4px',
            fontSize: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>WS URL:</span>
              <span className="mono-text" style={{ color: 'var(--text-bright)' }}>{WS_URL}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Target IDs:</span>
              <span className="mono-text" style={{ color: 'var(--text-bright)' }}>
                {selectedObjects.map(o => o.norad_id).join(', ') || 'None'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Object Count in Last Frame:</span>
              <span className="mono-text" style={{ color: 'var(--text-bright)' }}>
                {Object.keys(liveObjectStates || {}).length}
              </span>
            </div>
            {liveErrors.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px solid var(--border-color)', paddingTop: '4px', marginTop: '2px' }}>
                <span style={{ color: 'var(--accent-red)' }}>Active Session Errors:</span>
                {liveErrors.map((err, i) => (
                  <span key={i} className="mono-text" style={{ color: 'var(--accent-red)' }}>• {err}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <details style={{
        fontSize: '10px',
        color: 'var(--text-muted)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        padding: '6px 8px',
        marginTop: '8px'
      }}>
        <summary style={{ cursor: 'pointer', outline: 'none', fontWeight: 600 }}>
          ⓘ TLE/GP-based SGP4 estimate — not direct telemetry.
        </summary>
        <div style={{ marginTop: '6px', lineHeight: '1.4' }}>
          <strong>Scientific note:</strong> Live tracking is based on the latest available TLE/GP elements and UTC-time SGP4 propagation. It is not direct spacecraft telemetry.
        </div>
      </details>
    </section>
  );
};
