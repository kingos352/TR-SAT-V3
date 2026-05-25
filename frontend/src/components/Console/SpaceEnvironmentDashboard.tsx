import React, { useEffect } from 'react';
import { useConsoleStore } from '../../store/useConsoleStore';
import { MiniBarChart } from './Charts/MiniBarChart';
import { DonutChart } from './Charts/DonutChart';
import { HistogramChart } from './Charts/HistogramChart';

export const SpaceEnvironmentDashboard: React.FC = () => {
  const { 
    catalogAnalyticsSummary, 
    analyticsLoading, 
    analyticsError, 
    fetchCatalogAnalytics 
  } = useConsoleStore();

  useEffect(() => {
    // Initial fetch if we don't have it
    if (!catalogAnalyticsSummary && !analyticsLoading) {
      fetchCatalogAnalytics();
    }
  }, []);

  return (
    <div className="panel-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="panel-title" style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-cyan)' }}>
          Space Environment Dashboard
        </h2>
        <button 
          onClick={() => fetchCatalogAnalytics()}
          disabled={analyticsLoading}
          style={{
            background: 'var(--accent-cyan)',
            color: 'var(--bg-space-dark)',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: analyticsLoading ? 'wait' : 'pointer',
            opacity: analyticsLoading ? 0.7 : 1
          }}
        >
          {analyticsLoading ? 'Analyzing...' : 'Refresh Analytics'}
        </button>
      </div>

      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '12px',
        fontSize: '11px',
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        lineHeight: 1.4
      }}>
        {catalogAnalyticsSummary ? catalogAnalyticsSummary.disclaimer : "Catalog analytics are derived from locally stored TLE/GP metadata and SGP4-derived orbital characteristics. They are intended for situational awareness, not certified operational SSA."}
      </div>

      {analyticsError && (
        <div style={{ color: 'var(--accent-orange)', fontSize: '12px', padding: '8px', border: '1px solid var(--accent-orange)', borderRadius: '4px' }}>
          {analyticsError}
        </div>
      )}

      {catalogAnalyticsSummary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <MetricCard label="Total Objects" value={catalogAnalyticsSummary.total_objects.toLocaleString()} color="var(--accent-cyan)" />
            <MetricCard label="Payloads" value={catalogAnalyticsSummary.by_object_type['PAYLOAD']?.toLocaleString() || '0'} color="#10B981" />
            <MetricCard label="Debris" value={catalogAnalyticsSummary.by_object_type['DEBRIS']?.toLocaleString() || '0'} color="var(--accent-orange)" />
            <MetricCard label="Stale TLE %" value={`${catalogAnalyticsSummary.stale_percentage.toFixed(1)}%`} color="#EF4444" />
          </div>

          {/* Charts Row 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="chart-card">
              <h3 className="chart-title">Object Type Distribution</h3>
              <DonutChart 
                data={Object.entries(catalogAnalyticsSummary.by_object_type).map(([k, v]) => ({
                  label: k,
                  value: v,
                  color: k === 'PAYLOAD' ? '#10B981' : k === 'DEBRIS' ? 'var(--accent-orange)' : k === 'ROCKET BODY' ? '#8B5CF6' : '#6B7280'
                }))}
                size={90}
                holeSize={50}
              />
            </div>
            
            <div className="chart-card">
              <h3 className="chart-title">Orbital Regime</h3>
              <DonutChart 
                data={Object.entries(catalogAnalyticsSummary.by_orbital_regime)
                  .filter(([_, v]) => v > 0)
                  .map(([k, v]) => ({
                  label: k,
                  value: v,
                  color: k === 'LEO' ? 'var(--accent-cyan)' : k === 'MEO' ? '#3B82F6' : k === 'GEO' ? '#8B5CF6' : k === 'HEO' ? '#F59E0B' : '#6B7280'
                }))}
                size={90}
                holeSize={50}
              />
            </div>
          </div>

          {/* Charts Row 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="chart-card">
              <h3 className="chart-title">Altitude Distribution</h3>
              <HistogramChart data={catalogAnalyticsSummary.altitude_bins} color="var(--accent-cyan)" />
            </div>

            <div className="chart-card">
              <h3 className="chart-title">Inclination Distribution</h3>
              <HistogramChart data={catalogAnalyticsSummary.inclination_bins} color="#8B5CF6" />
            </div>
          </div>

          {/* Sources */}
          <div className="chart-card">
            <h3 className="chart-title">Source Coverage</h3>
            <MiniBarChart 
              data={Object.entries(catalogAnalyticsSummary.by_source).map(([k, v]) => ({ label: k, value: v }))} 
              color="#10B981"
            />
          </div>

        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string | number; color: string }> = ({ label, value, color }) => (
  <div style={{
    backgroundColor: 'rgba(0,0,0,0.2)',
    border: `1px solid ${color}40`,
    borderRadius: '6px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderLeft: `3px solid ${color}`
  }}>
    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
    <div className="mono-text" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-bright)' }}>{value}</div>
  </div>
);
