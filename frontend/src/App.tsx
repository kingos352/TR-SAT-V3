import React from 'react';
import { useTranslation } from './i18n/useTranslation';
import { StatusBar } from './components/Console/StatusBar';
import { CatalogIntelligence, DataSources, SystemLogs } from './components/Console/SidePanel';
import { CesiumViewer } from './components/Globe/CesiumViewer';
import { TelemetryPanel } from './components/Console/TelemetryPanel';
import { ObserverPanel } from './components/Console/ObserverPanel';
import { LiveTrackingPanel } from './components/Console/LiveTrackingPanel';
import { ConjunctionPanel } from './components/Console/ConjunctionPanel';
import { CatalogLayerPanel } from './components/Console/CatalogLayerPanel';
import { GroundStationVisibilityPanel } from './components/Console/GroundStationVisibilityPanel';

import { ExportPanel } from './components/Console/ExportPanel';
import { AssistantPanel } from './components/Console/AssistantPanel';
import { GlobeControlsPanel } from './components/Console/GlobeControlsPanel';
import { MissionReplayPanel } from './components/Console/MissionReplayPanel';
import { PassTimelinePanel } from './components/Console/PassTimelinePanel';
import { SpaceEnvironmentDashboard } from './components/Console/SpaceEnvironmentDashboard';
import { ResearchReliabilityDashboard } from './components/Console/ResearchReliabilityDashboard';
import { ResearchModePanel } from './components/Console/ResearchModePanel';
import { MissionWorkflowCard } from './components/Console/MissionWorkflowCard';

import { CollapsibleWrapper } from './components/Console/CollapsibleWrapper';

const LeftSidebar: React.FC = () => {
  const { t } = useTranslation();
  return (
    <aside style={{
      gridArea: 'left-dock',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 60px)',
      overflowY: 'auto',
      overflowX: 'hidden',
      backgroundColor: 'var(--bg-console-panel)',
      borderRight: '1px solid var(--border-color)',
      zIndex: 10
    }}>
      {/* Mission Workflow — always visible at top */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
        <MissionWorkflowCard />
      </div>

      {/* 1. Core Search & Identification */}
      <CollapsibleWrapper title={t('menus.catalog_intelligence')} defaultOpen={false}>
        <CatalogIntelligence />
      </CollapsibleWrapper>

      {/* 2. Primary Configuration */}
      <CollapsibleWrapper title={t('menus.observer_station_config')} defaultOpen={false}>
        <ObserverPanel />
      </CollapsibleWrapper>

      <CollapsibleWrapper title={t('menus.ground_station_visibility')} defaultOpen={false}>
        <GroundStationVisibilityPanel />
      </CollapsibleWrapper>

      {/* 3. Visualizations & Layers */}
      <CollapsibleWrapper title={t('menus.globe_visualization')} defaultOpen={false}>
        <GlobeControlsPanel />
      </CollapsibleWrapper>

      <CollapsibleWrapper title={t('menus.catalog_layer_snapshot')} defaultOpen={false}>
        <CatalogLayerPanel />
      </CollapsibleWrapper>

      <CollapsibleWrapper title={t('menus.space_environment_dashboard')} defaultOpen={false}>
        <SpaceEnvironmentDashboard />
      </CollapsibleWrapper>

      {/* 4. Advanced Analytics & Research */}
      <CollapsibleWrapper title={t('menus.tle_reliability_dashboard')} defaultOpen={false}>
        <ResearchReliabilityDashboard />
      </CollapsibleWrapper>

      <CollapsibleWrapper title={t('menus.research_mode')} defaultOpen={false}>
        <ResearchModePanel />
      </CollapsibleWrapper>

      {/* 5. System Admin & Support */}
      <CollapsibleWrapper title={t('menus.data_sources_ingestion')} defaultOpen={false}>
        <DataSources />
      </CollapsibleWrapper>

      <CollapsibleWrapper title={t('menus.export_system')} defaultOpen={false}>
        <ExportPanel />
      </CollapsibleWrapper>

      <CollapsibleWrapper title={t('menus.system_event_logs')} defaultOpen={false}>
        <SystemLogs />
      </CollapsibleWrapper>

      <CollapsibleWrapper title={t('menus.mission_knowledge_assistant')} defaultOpen={false}>
        <AssistantPanel />
      </CollapsibleWrapper>
    </aside>
  );
};

const App: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div style={{
      display: 'grid',
      gridTemplateAreas: `
        "header header header"
        "left-dock main right-dock"
      `,
      gridTemplateRows: '60px 1fr',
      gridTemplateColumns: '400px 1fr 350px',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'var(--bg-space-dark)',
      color: 'var(--text-bright)',
      overflow: 'hidden'
    }}>
      {/* Top Status Bar & Header */}
      <StatusBar />

      {/* Left Dock — fully scrollable flat list of collapsible sections */}
      <LeftSidebar />

      {/* Center 3D Globe Visualizer */}
      <main style={{
        gridArea: 'main',
        position: 'relative',
        height: 'calc(100vh - 60px)',
        overflow: 'hidden'
      }}>
        <CesiumViewer />
        
        {/* Overlay Title */}
        <div className="mono-text" style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'rgba(11, 25, 44, 0.85)',
          backdropFilter: 'blur(4px)',
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid var(--accent-primary)',
          color: 'var(--accent-primary)',
          fontSize: '11px',
          zIndex: 5,
          pointerEvents: 'none',
          boxShadow: '0 0 10px rgba(56, 189, 248, 0.1)'
        }}>
          {t('system.active_orbit_visualization') || 'ACTIVE ORBIT VISUALIZATION [SGP4]'}
        </div>
      </main>

      {/* Right Dock */}
      <aside style={{
        gridArea: 'right-dock',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 60px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: 'var(--bg-console-panel)',
        borderLeft: '1px solid var(--border-color)',
        zIndex: 10
      }}>
        <CollapsibleWrapper title={t('menus.telemetry_orbital_state')} defaultOpen={false}>
          <TelemetryPanel />
        </CollapsibleWrapper>

        <CollapsibleWrapper title={t('menus.live_tracking')} defaultOpen={false}>
          <LiveTrackingPanel />
        </CollapsibleWrapper>

        <CollapsibleWrapper title={t('menus.mission_replay')} defaultOpen={false}>
          <MissionReplayPanel />
        </CollapsibleWrapper>

        <CollapsibleWrapper title={t('menus.pass_timeline')} defaultOpen={false}>
          <PassTimelinePanel />
        </CollapsibleWrapper>

        <CollapsibleWrapper title={t('menus.conjunction_analysis')} defaultOpen={false}>
          <ConjunctionPanel />
        </CollapsibleWrapper>
      </aside>
    </div>
  );
};

export default App;
