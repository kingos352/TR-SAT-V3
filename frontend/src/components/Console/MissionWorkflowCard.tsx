import React, { useState } from 'react';

export const MissionWorkflowCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{
      borderBottom: '1px solid var(--border-color)', 
      paddingBottom: '16px',
      marginBottom: '16px'
    }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <h2 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-bright)', margin: 0, fontWeight: 600 }}>
          Mission Workflow
        </h2>
        <span style={{ color: 'var(--text-muted)' }}>{isOpen ? '▼' : '▶'}</span>
      </div>
      
      {isOpen && (
        <div style={{
          marginTop: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '11px',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>1.</span>
            <span><strong>Sync Catalog:</strong> Ingest TLEs from Space-Track or CelesTrak.</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>2.</span>
            <span><strong>Search & Select:</strong> Query the catalog and set an Active Object.</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>3.</span>
            <span><strong>Update State:</strong> Propagate SGP4 to get current position/orbit.</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>4.</span>
            <span><strong>Live Tracking:</strong> Stream real-time SGP4 positions via WebSocket.</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>5.</span>
            <span><strong>Snapshot Layer:</strong> Visualize thousands of objects at once.</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>6.</span>
            <span><strong>Conjunction:</strong> Screen for close approaches.</span>
          </div>
        </div>
      )}
    </div>
  );
};
