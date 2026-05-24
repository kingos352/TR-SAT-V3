import React, { useState } from 'react';
import { useConsoleStore } from '../../store/useConsoleStore';
import { syncCatalogGroup, searchCatalog } from '../../api/client';

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
    <aside className="glass-panel" style={{
      gridArea: 'sidebar',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      borderTop: 'none',
      borderLeft: 'none',
      borderBottom: 'none',
      zIndex: 10,
      width: '320px',
      height: 'calc(100vh - 60px)',
      overflowY: 'hidden'
    }}>
      
      {/* Scrollable upper wrapper to keep event logs pinned at the bottom */}
      <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '4px', marginBottom: '12px' }}>
        
        {/* 1. Catalog Sync Section */}
        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <h2 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 600 }}>
            Catalog Ingestion
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select 
              value={syncGroup} 
              onChange={(e) => setSyncGroup(e.target.value)}
              disabled={syncLoading}
              style={{
                flexGrow: 1,
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(3, 7, 18, 0.7)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-bright)',
                fontSize: '12px',
                outline: 'none'
              }}
            >
              {groupsList.map(g => (
                <option key={g} value={g}>{g.toUpperCase()}</option>
              ))}
            </select>
            <button
              onClick={handleSync}
              disabled={syncLoading}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: syncLoading ? 'rgba(75, 85, 99, 0.5)' : 'var(--accent-blue)',
                color: 'var(--text-bright)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: syncLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              {syncLoading ? 'Syncing...' : 'Sync Group'}
            </button>
          </div>
          
          {syncResult && (
            <div style={{
              marginTop: '10px',
              backgroundColor: 'rgba(6, 182, 212, 0.05)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: '6px',
              padding: '8px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Fetched:</span> <strong className="mono-text" style={{ color: 'var(--text-bright)' }}>{syncResult.fetched_count}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Inserted Objects:</span> <strong className="mono-text" style={{ color: 'var(--accent-green)' }}>{syncResult.inserted_objects}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Inserted TLEs:</span> <strong className="mono-text" style={{ color: 'var(--accent-cyan)' }}>{syncResult.inserted_tles}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Skipped:</span> <strong className="mono-text" style={{ color: 'var(--accent-orange)' }}>{syncResult.skipped_count}</strong>
              </div>
            </div>
          )}
        </section>

        {/* 2. Catalog Search Section */}
        <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
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
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Type</label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(3, 7, 18, 0.7)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-bright)',
                    fontSize: '11px',
                    outline: 'none'
                  }}
                >
                  {typesList.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Category</label>
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(3, 7, 18, 0.7)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-bright)',
                    fontSize: '11px',
                    outline: 'none'
                  }}
                >
                  {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={searchLoading}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--accent-cyan)',
                color: 'var(--text-bright)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: searchLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                marginTop: '4px'
              }}
            >
              {searchLoading ? 'Searching...' : 'Search Catalog'}
            </button>
          </form>
        </section>

        {/* 3. Search Results */}
        {catalogResults.length > 0 && (
          <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Search Results ({catalogResults.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {catalogResults.map((obj) => (
                <div key={obj.norad_id} style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(75, 85, 99, 0.2)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{obj.name}</div>
                    <div className="mono-text" style={{ color: 'var(--accent-cyan)', fontSize: '10px' }}>
                      NORAD: {obj.norad_id} | {obj.category}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => selectObject(obj)}
                      style={{
                        padding: '3px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--accent-blue)',
                        backgroundColor: 'transparent',
                        color: 'var(--accent-blue)',
                        fontSize: '9px',
                        cursor: 'pointer'
                      }}
                    >
                      Select
                    </button>
                    <button
                      onClick={() => setActiveObject(obj)}
                      style={{
                        padding: '3px 6px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'var(--accent-green)',
                        color: 'var(--text-bright)',
                        fontSize: '9px',
                        cursor: 'pointer'
                      }}
                    >
                      Focus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Selected Tracking Objects (Max 20) */}
        <section>
          <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Tracking Selected Set ({selectedObjects.length}/20)
          </h3>
          {lastApiError && (
            <div className="mono-text" style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--accent-red)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '11px',
              color: 'var(--accent-red)',
              marginBottom: '10px',
              fontWeight: 600
            }}>
              ⚠️ {lastApiError}
            </div>
          )}
          {selectedObjects.length === 0 ? (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
              No objects selected. Run a search to populate tracking list.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              {selectedObjects.map((obj) => (
                <div key={obj.norad_id} style={{
                  backgroundColor: activeObject?.norad_id === obj.norad_id ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                  border: '1px solid',
                  borderColor: activeObject?.norad_id === obj.norad_id ? 'var(--accent-green)' : 'rgba(75, 85, 99, 0.2)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{obj.name}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => setActiveObject(obj)}
                      disabled={activeObject?.norad_id === obj.norad_id}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: activeObject?.norad_id === obj.norad_id ? 'rgba(75, 85, 99, 0.3)' : 'var(--accent-green)',
                        color: 'var(--text-bright)',
                        fontSize: '9px',
                        cursor: activeObject?.norad_id === obj.norad_id ? 'default' : 'pointer'
                      }}
                    >
                      Focus
                    </button>
                    <button
                      onClick={() => removeSelectedObject(obj.norad_id)}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'var(--accent-red)',
                        color: 'var(--text-bright)',
                        fontSize: '9px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* 5. Pin Event Logs at the bottom */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        height: '180px',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '12px'
      }}>
        <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          System Event Logs
        </h3>
        <div className="mono-text" style={{
          flexGrow: 1,
          backgroundColor: 'rgba(3, 7, 18, 0.6)',
          border: '1px solid rgba(75, 85, 99, 0.2)',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '11px',
          color: 'var(--accent-green)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          lineHeight: '1.4'
        }}>
          {logs.slice(-30).map((log, index) => (
            <div key={index}>{`> ${log}`}</div>
          ))}
        </div>
      </div>
      
    </aside>
  );
};
