import React, { useState } from 'react';
import { useConsoleStore } from '../../store/useConsoleStore';
import { SkyViewChart } from './SkyViewChart';
import { ElevationProfileChart } from './ElevationProfileChart';


export const PassTimelinePanel: React.FC = () => {
  const { 
    activeObject, 
    detailedPasses, 
    selectedDetailedPass,
    isComputingDetailedPasses, 
    fetchDetailedPasses,
    setSelectedDetailedPass
  } = useConsoleStore();
  const [isOpen, setIsOpen] = useState(false);
  const [horizonHours, setHorizonHours] = useState(24);
  const [minElev, setMinElev] = useState(10);

  const handleCompute = () => {
    const startUtc = new Date().toISOString();
    const endUtc = new Date(Date.now() + horizonHours * 3600 * 1000).toISOString();
    fetchDetailedPasses(startUtc, endUtc, minElev, 30);
  };

  const getQualityColor = (quality: string) => {
    switch(quality) {
      case 'OVERHEAD': return '#9c27b0';
      case 'EXCELLENT': return '#4caf50';
      case 'GOOD': return '#ffeb3b';
      case 'LOW': return '#f44336';
      default: return '#888';
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div style={{ background: 'var(--bg-space-dark)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ padding: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isOpen ? 'rgba(0, 216, 255, 0.1)' : 'transparent' }}
      >
        <h3 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Advanced Pass Prediction</h3>
        <span style={{ fontSize: '10px' }}>{isOpen ? '▼' : '►'}</span>
      </div>
      
      {isOpen && (
         <div style={{
           position: 'fixed',
           top: '60px',
           left: '370px',
           width: '750px',
           height: '80vh',
           background: 'rgba(15, 23, 42, 0.95)',
           backdropFilter: 'blur(10px)',
           border: '1px solid var(--accent-primary)',
           borderRadius: '8px',
           zIndex: 1000,
           padding: '20px',
           boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 15px rgba(0, 216, 255, 0.2)',
           display: 'flex',
           flexDirection: 'column'
         }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
               <h2 style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '18px' }}>Advanced Pass Prediction Timeline & Sky View</h2>
               <button 
                 onClick={() => setIsOpen(false)} 
                 style={{ background: 'transparent', color: '#aaa', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                 title="Close"
               >
                 ✖
               </button>
            </div>
            
            {!activeObject ? (
              <div style={{ padding: '20px', color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>
                Select an active object from the catalog to compute passes.
              </div>
            ) : (
              <>
                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '15px', background: 'rgba(0, 0, 0, 0.3)', padding: '10px', borderLeft: '3px solid #00d8ff' }}>
                  ⓘ Pass prediction uses TLE/GP-based SGP4 propagation and observer topocentric geometry. It does not guarantee optical visibility.
                </div>

                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: '#888' }}>Horizon</label>
                    <select 
                      value={horizonHours} 
                      onChange={e => setHorizonHours(Number(e.target.value))}
                      style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '6px', fontSize: '12px', borderRadius: '4px' }}
                    >
                      <option value={6}>Next 6 Hours</option>
                      <option value={24}>Next 24 Hours</option>
                      <option value={72}>Next 3 Days</option>
                      <option value={168}>Next 7 Days</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: '#888' }}>Min Elevation</label>
                    <select 
                      value={minElev} 
                      onChange={e => setMinElev(Number(e.target.value))}
                      style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '6px', fontSize: '12px', borderRadius: '4px' }}
                    >
                      <option value={5}>5°</option>
                      <option value={10}>10°</option>
                      <option value={20}>20°</option>
                      <option value={30}>30°</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={handleCompute} 
                      disabled={isComputingDetailedPasses}
                      style={{ 
                        background: isComputingDetailedPasses ? '#555' : 'var(--accent-primary)', 
                        color: isComputingDetailedPasses ? '#ccc' : '#000', 
                        border: 'none', 
                        padding: '8px 16px', 
                        cursor: isComputingDetailedPasses ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        borderRadius: '4px'
                      }}
                    >
                      {isComputingDetailedPasses ? 'Computing...' : 'Compute Pass Timeline'}
                    </button>
                    
                    {detailedPasses.length > 0 && (
                      <button
                        onClick={async () => {
                          const { exportDetailedPassesCSV } = await import('../../utils/exportSystem');
                          exportDetailedPassesCSV(detailedPasses, activeObject.norad_id);
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          color: '#fff',
                          border: '1px solid #555',
                          padding: '8px 16px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          borderRadius: '4px'
                        }}
                      >
                        Export CSV
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', gap: '20px', overflow: 'hidden' }}>
                  {/* Pass List */}
                  <div style={{ width: '260px', overflowY: 'auto', borderRight: '1px solid #333', paddingRight: '15px' }}>
                    {detailedPasses.length === 0 && !isComputingDetailedPasses && (
                      <div style={{ color: '#888', fontSize: '12px', textAlign: 'center', marginTop: '30px' }}>
                        No passes found for this observer and elevation threshold.
                      </div>
                    )}
                    {detailedPasses.map((pass, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedDetailedPass(pass)}
                        style={{
                          background: selectedDetailedPass === pass ? 'rgba(0, 216, 255, 0.1)' : 'rgba(0,0,0,0.4)',
                          border: `1px solid ${selectedDetailedPass === pass ? 'var(--accent-primary)' : '#333'}`,
                          padding: '12px',
                          marginBottom: '10px',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#fff' }}>
                            {new Date(pass.aos_time_utc).toLocaleDateString()}
                          </span>
                          <span style={{ 
                            background: getQualityColor(pass.quality_label), 
                            color: pass.quality_label === 'GOOD' || pass.quality_label === 'LOW' ? '#000' : '#fff', 
                            padding: '3px 8px', 
                            borderRadius: '12px', 
                            fontSize: '10px', 
                            fontWeight: 'bold' 
                          }}>
                            {pass.quality_label}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#ddd', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>Rise: {formatTime(pass.aos_time_utc)}</span>
                          <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>Max: {pass.max_elevation_deg.toFixed(1)}°</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Dur: {Math.round(pass.duration_seconds / 60)}m {Math.round(pass.duration_seconds % 60)}s</span>
                          <span>R: {pass.range_at_max_km?.toFixed(0)} km</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Selected Pass Details & Charts */}
                  <div style={{ flex: 1, overflowY: 'auto', paddingLeft: '5px' }}>
                    {selectedDetailedPass ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', background: 'rgba(0,0,0,0.3)', padding: '15px', border: '1px solid #333', borderRadius: '6px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Rise Azimuth</div>
                            <div style={{ fontSize: '16px', color: '#4caf50', fontWeight: 'bold' }}>{selectedDetailedPass.azimuth_aos_deg?.toFixed(1)}°</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Max Azimuth</div>
                            <div style={{ fontSize: '16px', color: '#ffeb3b', fontWeight: 'bold' }}>{selectedDetailedPass.azimuth_max_deg?.toFixed(1)}°</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Set Azimuth</div>
                            <div style={{ fontSize: '16px', color: '#f44336', fontWeight: 'bold' }}>{selectedDetailedPass.azimuth_los_deg?.toFixed(1)}°</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '25px', justifyContent: 'center' }}>
                          <SkyViewChart 
                            profile={selectedDetailedPass.elevation_profile} 
                            maxElevation={selectedDetailedPass.max_elevation_deg} 
                            width={260} 
                            height={260} 
                          />
                          <ElevationProfileChart 
                            profile={selectedDetailedPass.elevation_profile} 
                            minElevationThreshold={minElev} 
                            width={360} 
                            height={260} 
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#666', fontStyle: 'italic', fontSize: '14px' }}>
                        {detailedPasses.length > 0 ? 'Select a pass from the timeline to view detailed charts.' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
         </div>
      )}
    </div>
  );
};
