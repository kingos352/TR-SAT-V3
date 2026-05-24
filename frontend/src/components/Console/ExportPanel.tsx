import React from 'react';
import { useConsoleStore } from '../../store/useConsoleStore';
import { 
  exportEphemerisCSV, 
  exportConjunctionsCSV, 
  exportCatalogCSV, 
  exportGroundTrackGeoJSON, 
  exportCatalogGeoJSON, 
  exportTrajectoryCZML, 
  exportMissionReport 
} from '../../utils/exportSystem';

export const ExportPanel: React.FC = () => {
  const {
    activeObject,
    activeEphemeris,
    activeState,
    activePasses,
    conjunctionResults,
    catalogLayerObjects,
    addLog
  } = useConsoleStore();

  const handleExportEphemerisCSV = () => {
    if (!activeObject || !activeEphemeris || activeEphemeris.length === 0) {
      addLog("Export Error: Update Orbit before exporting ephemeris.");
      return;
    }
    exportEphemerisCSV(activeEphemeris, activeObject.norad_id);
    addLog(`Export successful: Ephemeris CSV for ${activeObject.name}`);
  };

  const handleExportConjunctionsCSV = () => {
    if (!conjunctionResults || conjunctionResults.length === 0) return;
    exportConjunctionsCSV(conjunctionResults);
    addLog("Export successful: Conjunction Screening CSV");
  };

  const handleExportCatalogCSV = () => {
    if (!catalogLayerObjects || catalogLayerObjects.length === 0) return;
    exportCatalogCSV(catalogLayerObjects);
    addLog(`Export successful: Catalog Snapshot CSV (${catalogLayerObjects.length} objects)`);
  };

  const handleExportGroundTrackGeoJSON = () => {
    if (!activeObject || !activeEphemeris || activeEphemeris.length === 0) {
      addLog("Export Error: Update Orbit before exporting GeoJSON.");
      return;
    }
    exportGroundTrackGeoJSON(activeEphemeris, activeObject.norad_id);
    addLog(`Export successful: Ground Track GeoJSON for ${activeObject.name}`);
  };

  const handleExportCatalogGeoJSON = () => {
    if (!catalogLayerObjects || catalogLayerObjects.length === 0) return;
    exportCatalogGeoJSON(catalogLayerObjects);
    addLog(`Export successful: Catalog Snapshot GeoJSON (${catalogLayerObjects.length} objects)`);
  };

  const handleExportCZML = () => {
    if (!activeObject || !activeEphemeris || activeEphemeris.length === 0) {
      addLog("Export Error: Update Orbit before exporting CZML.");
      return;
    }
    exportTrajectoryCZML(activeEphemeris, activeObject);
    addLog(`Export successful: Trajectory CZML for ${activeObject.name}`);
  };

  const handleExportReportEN = () => {
    if (!activeObject) return;
    exportMissionReport('en', activeObject, activeState, activePasses, conjunctionResults);
    addLog(`Export successful: Mission Report (EN) for ${activeObject.name}`);
  };

  const handleExportReportTR = () => {
    if (!activeObject) return;
    exportMissionReport('tr', activeObject, activeState, activePasses, conjunctionResults);
    addLog(`Export successful: Mission Report (TR) for ${activeObject.name}`);
  };

  return (
    <details className="glass-panel" style={{ padding: '12px', borderRadius: '4px' }}>
      <summary style={{ cursor: 'pointer', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', fontWeight: 600 }}>
        Data Export System
      </summary>
      
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Ephemeris & Trajectory Exports */}
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
            Active Object Trajectory
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              onClick={handleExportEphemerisCSV}
              disabled={!activeObject || !activeEphemeris || activeEphemeris.length === 0}
              className="export-btn"
              style={{
                backgroundColor: 'rgba(34, 211, 238, 0.1)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                padding: '6px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: (!activeObject || !activeEphemeris || activeEphemeris.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (!activeObject || !activeEphemeris || activeEphemeris.length === 0) ? 0.4 : 1
              }}
            >
              Ephemeris (CSV)
            </button>
            <button 
              onClick={handleExportGroundTrackGeoJSON}
              disabled={!activeObject || !activeEphemeris || activeEphemeris.length === 0}
              className="export-btn"
              style={{
                backgroundColor: 'rgba(34, 211, 238, 0.1)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                padding: '6px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: (!activeObject || !activeEphemeris || activeEphemeris.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (!activeObject || !activeEphemeris || activeEphemeris.length === 0) ? 0.4 : 1
              }}
            >
              Ground Track (GeoJSON)
            </button>
            <button 
              onClick={handleExportCZML}
              disabled={!activeObject || !activeEphemeris || activeEphemeris.length === 0}
              className="export-btn"
              style={{
                gridColumn: '1 / span 2',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--accent-blue)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '6px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: (!activeObject || !activeEphemeris || activeEphemeris.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (!activeObject || !activeEphemeris || activeEphemeris.length === 0) ? 0.4 : 1
              }}
            >
              3D Trajectory (CZML)
            </button>
          </div>
        </div>

        {/* Catalog & Conjunction Exports */}
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
            Catalog & Analysis
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              onClick={handleExportConjunctionsCSV}
              disabled={!conjunctionResults || conjunctionResults.length === 0}
              className="export-btn"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--accent-red)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '6px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: (!conjunctionResults || conjunctionResults.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (!conjunctionResults || conjunctionResults.length === 0) ? 0.4 : 1
              }}
            >
              Conjunctions (CSV)
            </button>
            <button 
              onClick={handleExportCatalogCSV}
              disabled={!catalogLayerObjects || catalogLayerObjects.length === 0}
              className="export-btn"
              style={{
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                color: 'var(--accent-orange)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                padding: '6px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: (!catalogLayerObjects || catalogLayerObjects.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (!catalogLayerObjects || catalogLayerObjects.length === 0) ? 0.4 : 1
              }}
            >
              Catalog (CSV)
            </button>
            <button 
              onClick={handleExportCatalogGeoJSON}
              disabled={!catalogLayerObjects || catalogLayerObjects.length === 0}
              className="export-btn"
              style={{
                gridColumn: '1 / span 2',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                color: 'var(--accent-orange)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                padding: '6px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: (!catalogLayerObjects || catalogLayerObjects.length === 0) ? 'not-allowed' : 'pointer',
                opacity: (!catalogLayerObjects || catalogLayerObjects.length === 0) ? 0.4 : 1
              }}
            >
              Catalog Snapshot (GeoJSON)
            </button>
          </div>
        </div>

        {/* Mission Reports */}
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
            Mission Reports
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              onClick={handleExportReportEN}
              disabled={!activeObject}
              className="export-btn"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-bright)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '6px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: !activeObject ? 'not-allowed' : 'pointer',
                opacity: !activeObject ? 0.4 : 1
              }}
            >
              Report (English)
            </button>
            <button 
              onClick={handleExportReportTR}
              disabled={!activeObject}
              className="export-btn"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-bright)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '6px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: !activeObject ? 'not-allowed' : 'pointer',
                opacity: !activeObject ? 0.4 : 1
              }}
            >
              Rapor (Türkçe)
            </button>
          </div>
        </div>

      </div>
    </details>
  );
};
