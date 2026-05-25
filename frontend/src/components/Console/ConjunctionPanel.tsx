import React, { useState } from 'react';
import { useConsoleStore } from '../../store/useConsoleStore';
import { screenConjunction, ConjunctionScreenRequest } from '../../api/client';

export const ConjunctionPanel: React.FC = () => {
  const { selectedObjects, activeObject, setConjunctionResults, conjunctionResults, setActiveConjunctionResult, addLog } = useConsoleStore();
  
  const [mode, setMode] = useState<'selected_vs_selected' | 'primary_vs_catalog'>('selected_vs_selected');
  const [horizonDays, setHorizonDays] = useState(3);
  const [coarseStep, setCoarseStep] = useState(60);
  const [refineStep, setRefineStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const handleScreen = async () => {
    if (!activeObject) {
      addLog('Conjunction: No active primary object selected.');
      return;
    }
    
    setLoading(true);
    setConjunctionResults([]);
    setActiveConjunctionResult(null);
    
    const now = new Date();
    const end = new Date(now.getTime() + horizonDays * 86400 * 1000);
    
    const req: ConjunctionScreenRequest = {
      mode,
      primary_norad_ids: [activeObject.norad_id],
      start_time: now.toISOString(),
      end_time: end.toISOString(),
      coarse_step_seconds: coarseStep,
      refine_step_seconds: refineStep,
      max_candidates: 100,
    };
    
    if (mode === 'selected_vs_selected') {
      const secondaryIds = selectedObjects
        .map(o => o.norad_id)
        .filter(id => id !== activeObject.norad_id);
        
      if (secondaryIds.length === 0) {
        addLog('Conjunction: No secondary objects available in selected list.');
        setLoading(false);
        return;
      }
      req.secondary_norad_ids = secondaryIds;
    }
    
    try {
      addLog(`Conjunction: Initiating screening for NORAD ${activeObject.norad_id} over ${horizonDays} days...`);
      const res = await screenConjunction(req);
      setConjunctionResults(res.results);
      addLog(`Conjunction: Screening completed in ${res.computation_time_ms.toFixed(0)}ms. Found ${res.results.length} events.`);
    } catch (err: any) {
      addLog(`ERROR Conjunction: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-bright)', margin: 0 }}>
          Conjunction Screening
        </h2>
      </div>
      
      <details style={{
        fontSize: '10px',
        color: 'var(--text-muted)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        padding: '6px 8px'
      }}>
        <summary style={{ cursor: 'pointer', outline: 'none', fontWeight: 600 }}>
          ⓘ Geometric miss-distance screening — not collision probability.
        </summary>
        <div style={{ marginTop: '6px', lineHeight: '1.4' }}>
          <strong>Scientific note:</strong> Conjunction Screening uses TLE/GP-based SGP4 propagation and geometric miss-distance evaluation. It does not compute collision probability because public TLE/GP data does not include covariance.
        </div>
      </details>
      
      <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
        <div 
          onClick={() => setSettingsOpen(!settingsOpen)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Screening Parameters</span>
          <span style={{ color: 'var(--text-muted)' }}>{settingsOpen ? '▼' : '▶'}</span>
        </div>
        {settingsOpen && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', marginTop: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ color: 'var(--text-muted)' }}>Mode</label>
              <select 
                value={mode} 
                onChange={e => setMode(e.target.value as any)}
                style={{ 
                  backgroundColor: 'rgba(0,0,0,0.3)', 
                  color: 'var(--text-bright)', 
                  border: '1px solid var(--border-color)', 
                  padding: '4px', 
                  borderRadius: '4px' 
                }}
              >
                <option value="selected_vs_selected">Selected vs Selected</option>
                <option value="primary_vs_catalog">Primary vs Catalog</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ color: 'var(--text-muted)' }}>Horizon (Days)</label>
              <input 
                type="number" 
                value={horizonDays} 
                onChange={e => setHorizonDays(Number(e.target.value))}
                min={1} max={7}
                style={{ 
                  backgroundColor: 'rgba(0,0,0,0.3)', 
                  color: 'var(--text-bright)', 
                  border: '1px solid var(--border-color)', 
                  padding: '4px', 
                  borderRadius: '4px' 
                }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ color: 'var(--text-muted)' }}>Coarse Step (s)</label>
              <input 
                type="number" 
                value={coarseStep} 
                onChange={e => setCoarseStep(Number(e.target.value))}
                min={10} max={300}
                style={{ 
                  backgroundColor: 'rgba(0,0,0,0.3)', 
                  color: 'var(--text-bright)', 
                  border: '1px solid var(--border-color)', 
                  padding: '4px', 
                  borderRadius: '4px' 
                }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ color: 'var(--text-muted)' }}>Refine Step (s)</label>
              <input 
                type="number" 
                value={refineStep} 
                onChange={e => setRefineStep(Number(e.target.value))}
                min={0.1} max={5} step={0.1}
                style={{ 
                  backgroundColor: 'rgba(0,0,0,0.3)', 
                  color: 'var(--text-bright)', 
                  border: '1px solid var(--border-color)', 
                  padding: '4px', 
                  borderRadius: '4px' 
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      <button 
        onClick={handleScreen}
        disabled={loading || !activeObject}
        style={{
          width: '100%',
          padding: '8px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: !activeObject ? 'rgba(75, 85, 99, 0.5)' : 'var(--accent-cyan)',
          color: 'var(--text-bright)',
          fontSize: '12px',
          fontWeight: 600,
          cursor: (!activeObject || loading) ? 'not-allowed' : 'pointer',
          marginTop: '4px'
        }}
      >
        {loading ? 'Screening...' : 'Run Screen'}
      </button>

      {conjunctionResults.length > 0 && (
        <div style={{ marginTop: '8px', maxHeight: '180px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Results ({conjunctionResults.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {conjunctionResults.map((res, idx) => {
              const speedPrimary = res.primary_velocity_km_per_s ? Math.sqrt(res.primary_velocity_km_per_s.reduce((acc, v) => acc + v*v, 0)) : 0;
              const speedSec = res.secondary_velocity_km_per_s ? Math.sqrt(res.secondary_velocity_km_per_s.reduce((acc, v) => acc + v*v, 0)) : 0;
              const relSpeed = Math.abs(speedPrimary - speedSec); // Approximation, ideally we want vector difference
              
              let severityColor = 'var(--text-muted)';
              if (res.severity === 'CRITICAL_CANDIDATE') severityColor = 'var(--accent-red)';
              else if (res.severity === 'CLOSE') severityColor = 'var(--accent-orange)';
              else if (res.severity === 'WATCH') severityColor = 'var(--accent-cyan)';
              
              return (
                <div 
                  key={idx}
                  onClick={() => setActiveConjunctionResult(res)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid',
                    borderColor: severityColor,
                    borderRadius: '4px',
                    padding: '6px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                  className="mono-text"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: severityColor, fontWeight: 600, marginBottom: '2px' }}>
                    <span>{res.severity}</span>
                    <span>{res.miss_distance_km.toFixed(2)} km</span>
                  </div>
                  <div style={{ color: 'var(--text-bright)' }}>TCA: {res.tca_time.replace('T', ' ').substring(0, 19)}</div>
                  <div style={{ color: 'var(--text-muted)' }}>P: {res.primary_norad_id} | S: {res.secondary_norad_id}</div>
                  <div style={{ color: 'var(--text-muted)' }}>Rel. Speed ~ {(relSpeed).toFixed(2)} km/s</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
