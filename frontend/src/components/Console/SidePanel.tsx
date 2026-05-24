import React, { useState } from 'react';
import { useConsoleStore } from '../../store/useConsoleStore';
import { 
  syncCatalogGroup, 
  searchCatalog, 
  getSpaceTrackStatus, 
  testSpaceTrackAuth, 
  syncSpaceTrackNorad 
} from '../../api/client';
import { MissionWorkflowCard } from './MissionWorkflowCard';

export const SidePanel: React.FC = () => {
  const {
    catalogResults,
    setCatalogResults,
    selectedObjects,
    selectObject,
    removeSelectedObject,
    activeObject,
    setActiveObject,
    logs,
    addLog,
    setApiStatus,
    lastApiError
  } = useConsoleStore();

  // Sync Form States
  const [syncGroup, setSyncGroup] = useState<string>('stations');
  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  // Space-Track States
  const [stStatus, setStStatus] = useState<string>('Unknown');
  const [stLoading, setStLoading] = useState<boolean>(false);
  const [stNoradId, setStNoradId] = useState<string>('');

  // Search Form States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchType, setSearchType] = useState<string>('ALL');
  const [searchCategory, setSearchCategory] = useState<string>('ALL');
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  // CelesTrak groups list
  const groupsList = [
    'active', 'stations', 'visual', 'geo', 'weather', 'noaa', 
    'gps-ops', 'galileo', 'starlink', 'oneweb', 'science', 'debris'
  ];

  // RSO Category filters
  const categoriesList = [
    'ALL', 'Space Station', 'Communication', 'Navigation', 'Weather', 
    'Earth Observation', 'Mega-constellation', 'Science', 'Debris', 'Rocket Body', 'Unknown'
  ];

  // Object Type filters
  const typesList = ['ALL', 'PAYLOAD', 'ROCKET_BODY', 'DEBRIS', 'UNKNOWN'];

  const handleSync = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    addLog(`Ingestion: Initiated synchronization for CelesTrak group '${syncGroup}'...`);
    try {
      const res = await syncCatalogGroup(syncGroup);
      setSyncResult(res);
      setApiStatus('connected');
      addLog(`Ingestion success: Synchronized '${syncGroup}' group. Fetched: ${res.fetched_count}, Inserted: ${res.inserted_objects} objects.`);
    } catch (err: any) {
      setApiStatus('disconnected', err.message);
      addLog(`Ingestion error: Synchronization failed for '${syncGroup}' (${err.message})`);
    } finally {
      setSyncLoading(false);
    }
  };

  const checkStStatus = async () => {
    setStLoading(true);
    addLog(`Space-Track: Checking configuration status...`);
    try {
      const res = await getSpaceTrackStatus();
      setStStatus(res.is_configured ? 'Configured' : 'Not Configured');
      addLog(`Space-Track Status: ${res.is_configured ? 'Configured' : 'Not Configured'} - ${res.message}`);
    } catch (err: any) {
      setStStatus('Error');
      addLog(`Space-Track Status Error: ${err.message}`);
    } finally {
      setStLoading(false);
    }
  };

  const testStAuth = async () => {
    setStLoading(true);
    addLog(`Space-Track: Testing authentication...`);
    try {
      const res = await testSpaceTrackAuth();
      addLog(`Space-Track Auth Test: ${res.success ? 'Success' : 'Failed'} - ${res.message}`);
    } catch (err: any) {
      addLog(`Space-Track Auth Test Error: ${err.message}`);
    } finally {
      setStLoading(false);
    }
  };

  const syncStNorad = async () => {
    if (!stNoradId) return;
    const norad = parseInt(stNoradId, 10);
    if (isNaN(norad)) {
      addLog(`Space-Track Sync Error: Invalid NORAD ID.`);
      return;
    }
    
    setStLoading(true);
    addLog(`Space-Track: Initiating sync for NORAD ID ${norad}...`);
    try {
      const res = await syncSpaceTrackNorad(norad);
      addLog(`Space-Track Sync Success: Fetched ${res.fetched_count}, Inserted TLEs ${res.inserted_tles}.`);
    } catch (err: any) {
      addLog(`Space-Track Sync Error: ${err.message}`);
    } finally {
      setStLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchLoading(true);
    addLog(`Catalog Query: Searching elements (Query: "${searchQuery}", Type: "${searchType}", Category: "${searchCategory}")...`);
    try {
      const res = await searchCatalog({
        q: searchQuery || undefined,
        object_type: searchType,
        category: searchCategory,
        limit: 100
      });
      setCatalogResults(res);
      setApiStatus('connected');
      addLog(`Catalog Query: Search returned ${res.length} matching Resident Space Objects.`);
    } catch (err: any) {
      setApiStatus('disconnected', err.message);
      addLog(`Catalog Query Error: Search failed (${err.message})`);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      <MissionWorkflowCard />

      {/* Catalog Search & Active Set (Always Open) */}
      <section className="glass-panel" style={{ padding: '12px', borderRadius: '4px' }}>
        <h2 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 600 }}>
          Catalog Intelligence
        </h2>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search by name or NORAD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(3, 7, 18, 0.7)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-bright)',
              fontSize: '12px',
              outline: 'none'
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              style={{ flex: 1, padding: '6px', borderRadius: '4px', backgroundColor: 'rgba(3, 7, 18, 0.7)', border: '1px solid var(--border-color)', color: 'var(--text-bright)', fontSize: '11px', outline: 'none' }}
            >
              {typesList.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              style={{ flex: 1, padding: '6px', borderRadius: '4px', backgroundColor: 'rgba(3, 7, 18, 0.7)', border: '1px solid var(--border-color)', color: 'var(--text-bright)', fontSize: '11px', outline: 'none' }}
            >
              {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--accent-cyan)', color: 'var(--text-bright)', fontSize: '12px', fontWeight: 600, cursor: searchLoading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', marginTop: '4px' }}
          >
            {searchLoading ? 'Searching...' : 'Search Catalog'}
          </button>
        </form>

        {catalogResults.length > 0 && (
          <div style={{ marginTop: '12px', maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Results ({catalogResults.length})</div>
            {catalogResults.map((obj) => (
              <div key={obj.norad_id} style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(75, 85, 99, 0.2)', borderRadius: '6px', padding: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{obj.name}</div>
                  <div className="mono-text" style={{ color: 'var(--accent-cyan)', fontSize: '9px' }}>{obj.norad_id} | {obj.category}</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => selectObject(obj)} style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid var(--accent-blue)', backgroundColor: 'transparent', color: 'var(--accent-blue)', fontSize: '9px', cursor: 'pointer' }}>Select</button>
                  <button onClick={() => setActiveObject(obj)} style={{ padding: '3px 6px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--accent-green)', color: 'var(--text-bright)', fontSize: '9px', cursor: 'pointer' }}>Focus</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedObjects.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Tracking Selected Set ({selectedObjects.length}/20)</div>
            {lastApiError && <div className="mono-text" style={{ color: 'var(--accent-red)', fontSize: '10px' }}>⚠️ {lastApiError}</div>}
            {selectedObjects.map((obj) => (
              <div key={obj.norad_id} style={{ backgroundColor: activeObject?.norad_id === obj.norad_id ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.01)', border: '1px solid', borderColor: activeObject?.norad_id === obj.norad_id ? 'var(--accent-green)' : 'rgba(75, 85, 99, 0.2)', borderRadius: '6px', padding: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{obj.name}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => setActiveObject(obj)} disabled={activeObject?.norad_id === obj.norad_id} style={{ padding: '2px 6px', borderRadius: '4px', border: 'none', backgroundColor: activeObject?.norad_id === obj.norad_id ? 'rgba(75, 85, 99, 0.3)' : 'var(--accent-green)', color: 'var(--text-bright)', fontSize: '9px', cursor: activeObject?.norad_id === obj.norad_id ? 'default' : 'pointer' }}>Focus</button>
                  <button onClick={() => removeSelectedObject(obj.norad_id)} style={{ padding: '2px 6px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--accent-red)', color: 'var(--text-bright)', fontSize: '9px', cursor: 'pointer' }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Data Sources (Collapsible) */}
      <details className="glass-panel" style={{ padding: '12px', borderRadius: '4px' }}>
        <summary style={{ cursor: 'pointer', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', fontWeight: 600 }}>
          Data Sources & Ingestion
        </summary>
        
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* CelesTrak */}
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-bright)', marginBottom: '6px' }}>CelesTrak Sync</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={syncGroup} onChange={(e) => setSyncGroup(e.target.value)} disabled={syncLoading} style={{ flexGrow: 1, padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(3, 7, 18, 0.7)', border: '1px solid var(--border-color)', color: 'var(--text-bright)', fontSize: '11px', outline: 'none' }}>
                {groupsList.map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
              </select>
              <button onClick={handleSync} disabled={syncLoading} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: syncLoading ? 'rgba(75, 85, 99, 0.5)' : 'var(--accent-blue)', color: 'var(--text-bright)', fontSize: '11px', fontWeight: 600, cursor: syncLoading ? 'not-allowed' : 'pointer' }}>
                {syncLoading ? 'Syncing...' : 'Sync'}
              </button>
            </div>
            {syncResult && (
              <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
                Inserted: <span style={{ color: 'var(--accent-green)' }}>{syncResult.inserted_objects}</span> | TLEs: <span style={{ color: 'var(--accent-cyan)' }}>{syncResult.inserted_tles}</span>
              </div>
            )}
          </div>

          {/* Space-Track */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-bright)' }}>Space-Track</span>
              <span style={{ color: stStatus === 'Configured' ? 'var(--accent-green)' : 'var(--text-muted)' }}>{stStatus}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <button onClick={checkStStatus} disabled={stLoading} style={{ flex: 1, padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-bright)', fontSize: '10px', cursor: 'pointer' }}>Check</button>
              <button onClick={testStAuth} disabled={stLoading} style={{ flex: 1, padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-bright)', fontSize: '10px', cursor: 'pointer' }}>Test Auth</button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" placeholder="NORAD ID" value={stNoradId} onChange={(e) => setStNoradId(e.target.value)} disabled={stLoading} style={{ flexGrow: 1, padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(3, 7, 18, 0.7)', border: '1px solid var(--border-color)', color: 'var(--text-bright)', fontSize: '11px', outline: 'none' }} />
              <button onClick={syncStNorad} disabled={stLoading || !stNoradId} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: stLoading || !stNoradId ? 'rgba(75, 85, 99, 0.5)' : 'var(--accent-blue)', color: 'var(--text-bright)', fontSize: '11px', fontWeight: 600, cursor: stLoading || !stNoradId ? 'not-allowed' : 'pointer' }}>Sync</button>
            </div>
          </div>
        </div>
      </details>

      {/* System Event Logs (Collapsible) */}
      <details className="glass-panel" style={{ padding: '12px', borderRadius: '4px' }}>
        <summary style={{ cursor: 'pointer', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', fontWeight: 600 }}>
          System Event Logs
        </summary>
        <div className="mono-text" style={{ marginTop: '10px', maxHeight: '120px', overflowY: 'auto', backgroundColor: 'rgba(3, 7, 18, 0.6)', border: '1px solid rgba(75, 85, 99, 0.2)', borderRadius: '6px', padding: '8px', fontSize: '10px', color: 'var(--accent-green)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {logs.slice(-30).map((log, index) => (
            <div key={index}>{`> ${log}`}</div>
          ))}
        </div>
      </details>

    </div>
  );
};
