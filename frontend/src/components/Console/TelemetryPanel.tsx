import React, { useState } from 'react';
import { useConsoleStore } from '../../store/useConsoleStore';
import { getCatalogState, getCatalogEphemeris } from '../../api/client';

export const TelemetryPanel: React.FC = () => {
  const {
    activeObject,
    activeState,
    setActiveState,
    setActiveEphemeris,
    addLog,
    setApiStatus
  } = useConsoleStore();

  const [loading, setLoading] = useState(false);
  const [orbitLoading, setOrbitLoading] = useState(false);

  const handleUpdateState = async () => {
    if (!activeObject) return;
    setLoading(true);
    const nowUtc = new Date().toISOString();
    addLog(`Propagation: Querying state for ${activeObject.name} at ${nowUtc.substring(11, 19)} UTC...`);
    try {
      const state = await getCatalogState({
        norad_id: activeObject.norad_id,
        timestamp_utc: nowUtc
      });
      setActiveState(state);
      setApiStatus('connected');
      addLog(`Propagation success: Position computed. Alt: ${state.altitude_km.toFixed(1)} km, Lat/Lon: ${state.latitude_deg.toFixed(4)}°N, ${state.longitude_deg.toFixed(4)}°E.`);
    } catch (err: any) {
      setApiStatus('disconnected', err.message);
      addLog(`Propagation error: State query failed (${err.message})`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrbit = async () => {
    if (!activeObject) {
      addLog('WARNING: No active object selected.');
      return;
    }
    setOrbitLoading(true);
    addLog(`Ephemeris: Generating orbit ephemeris for ${activeObject.name} (NORAD: ${activeObject.norad_id})...`);
    try {
      const now = new Date();
      // start = now - 45 mins, end = now + 45 mins, step = 60s
      const startTime = new Date(now.getTime() - 45 * 60 * 1000).toISOString();
      const endTime = new Date(now.getTime() + 45 * 60 * 1000).toISOString();

      const ephemeris = await getCatalogEphemeris({
        norad_id: activeObject.norad_id,
        start_time_utc: startTime,
        end_time_utc: endTime,
        step_seconds: 60
      });

      setActiveEphemeris(ephemeris);
      setApiStatus('connected');
      addLog(`Ephemeris success: Generated ${ephemeris.length} points for 90-minute window.`);
    } catch (err: any) {
      setApiStatus('disconnected', err.message);
      addLog(`Ephemeris error: Failed to generate ephemeris (${err.message})`);
    } finally {
      setOrbitLoading(false);
    }
  };

  if (!activeObject) {
    return (
      <section className="glass-panel" style={{
        padding: '20px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: '200px',
        color: 'var(--text-muted)'
      }}>
        <div style={{
          border: '1px dashed rgba(75, 85, 99, 0.5)',
          borderRadius: '8px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(0,0,0,0.2)'
        }}>
          <span style={{ fontSize: '32px' }}>🛰️</span>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-bright)' }}>
            No Active Object Selected
          </div>
          <div style={{ fontSize: '11px', textAlign: 'center', maxWidth: '200px' }}>
            Search the catalog and set an object as active to propagate its coordinates.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="glass-panel" style={{
      padding: '16px',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '2px' }}>
            RSO Operational State
          </h2>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-bright)' }}>
            {activeObject.name}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleUpdateState}
            disabled={loading}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: loading ? 'rgba(75, 85, 99, 0.5)' : 'var(--accent-cyan)',
              color: 'var(--text-bright)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'Propagating...' : 'Update State'}
          </button>
          <button
            onClick={handleUpdateOrbit}
            disabled={orbitLoading}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: orbitLoading ? 'rgba(75, 85, 99, 0.5)' : 'var(--accent-blue)',
              color: 'var(--text-bright)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: orbitLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {orbitLoading ? 'Computing...' : 'Update Orbit'}
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px'
      }}>
        {/* NORAD ID Card */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 10px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>NORAD Catalog ID</div>
          <div className="mono-text" style={{ fontSize: '16px', color: 'var(--text-bright)', fontWeight: 'bold', marginTop: '2px' }}>
            {activeObject.norad_id}
          </div>
        </div>

        {/* COSPAR ID Card */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 10px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>COSPAR Launch ID</div>
          <div className="mono-text" style={{ fontSize: '16px', color: 'var(--text-bright)', fontWeight: 'bold', marginTop: '2px' }}>
            {activeObject.cospar_id || 'UNKNOWN'}
          </div>
        </div>

        {/* Type Card */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 10px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Object Type</div>
          <div className="mono-text" style={{ fontSize: '14px', color: 'var(--accent-cyan)', fontWeight: 'bold', marginTop: '4px' }}>
            {activeObject.object_type}
          </div>
        </div>

        {/* Category Card */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 10px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Category</div>
          <div className="mono-text" style={{ fontSize: '14px', color: 'var(--text-bright)', fontWeight: 'bold', marginTop: '4px' }}>
            {activeObject.category}
          </div>
        </div>
      </div>

      {activeState ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px'
          }}>
            {/* Latitude Card */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Latitude</div>
              <div className="mono-text" style={{ fontSize: '13px', color: 'var(--accent-cyan)', fontWeight: 'bold', marginTop: '2px' }}>
                {activeState.latitude_deg.toFixed(4)}° N
              </div>
            </div>

            {/* Longitude Card */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Longitude</div>
              <div className="mono-text" style={{ fontSize: '13px', color: 'var(--accent-cyan)', fontWeight: 'bold', marginTop: '2px' }}>
                {activeState.longitude_deg.toFixed(4)}° E
              </div>
            </div>

            {/* Altitude Card */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Altitude</div>
              <div className="mono-text" style={{ fontSize: '13px', color: 'var(--text-bright)', fontWeight: 'bold', marginTop: '2px' }}>
                {activeState.altitude_km.toFixed(1)} km
              </div>
            </div>
          </div>

          {/* ECEF Coordinates */}
          <div style={{
            backgroundColor: 'rgba(3, 7, 18, 0.4)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '10px 12px'
          }}>
            <h4 style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
              ECEF Coordinates (spherical approx)
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <div>X: <strong className="mono-text" style={{ color: 'var(--text-bright)' }}>{activeState.ecef.x_km.toFixed(3)} km</strong></div>
              <div>Y: <strong className="mono-text" style={{ color: 'var(--text-bright)' }}>{activeState.ecef.y_km.toFixed(3)} km</strong></div>
              <div>Z: <strong className="mono-text" style={{ color: 'var(--text-bright)' }}>{activeState.ecef.z_km.toFixed(3)} km</strong></div>
            </div>
          </div>

          {/* Reliability and Metadata */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginTop: '4px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>TLE Age: </span>
              <strong className="mono-text" style={{ color: 'var(--text-bright)' }}>
                {activeState.tle_age_days ? `${activeState.tle_age_days.toFixed(2)} days` : 'N/A'}
              </strong>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Reliability:</span>
              <span className="mono-text" style={{
                backgroundColor: activeState.reliability_status === 'FRESH' ? 'rgba(16, 185, 129, 0.15)' :
                                 activeState.reliability_status === 'AGING' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: activeState.reliability_status === 'FRESH' ? 'var(--accent-green)' :
                       activeState.reliability_status === 'AGING' ? 'var(--accent-orange)' : 'var(--accent-red)',
                border: `1px solid ${
                       activeState.reliability_status === 'FRESH' ? 'var(--accent-green)' :
                       activeState.reliability_status === 'AGING' ? 'var(--accent-orange)' : 'var(--accent-red)'}`,
                padding: '2px 6px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {activeState.reliability_status}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '2px' }}>
            Epoch: <span className="mono-text">{activeState.timestamp_utc.replace('T', ' ').substring(0, 19)} UTC</span>
          </div>

        </div>
      ) : (
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '16px',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)',
          fontStyle: 'italic'
        }}>
          Coordinates not calculated. Click 'Update State' to run SGP4 propagation.
        </div>
      )}

    </section>
  );
};
