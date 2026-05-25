import { create } from 'zustand';
import { CatalogObject, SatelliteState, ObserverAER, PassWindow, ConjunctionResult, CatalogSnapshotObject, getCatalogEphemeris, getCatalogState } from '../api/client';

export interface ObserverConfig {
  name: string;
  latitude_deg: number;
  longitude_deg: number;
  elevation_m: number;
  min_elevation_deg: number;
}

export interface ConsoleState {
  language: 'en' | 'tr';
  apiStatus: 'checking' | 'connected' | 'disconnected';
  lastApiError: string | null;
  catalogGroup: string;
  catalogSearchQuery: string;
  catalogResults: CatalogObject[];
  selectedObjects: CatalogObject[];
  activeObject: CatalogObject | null;
  maxSelectedObjects: number;
  observer: ObserverConfig;
  activeState: SatelliteState | null;
  activeAER: ObserverAER | null;
  activePasses: PassWindow[];
  activeEphemeris: SatelliteState[];
  showOrbitPath: boolean;
  showGroundTrack: boolean;
  showObserver: boolean;
  followActiveObject: boolean;
  enableEarthLighting: boolean;
  enableEarthRotation: boolean;
  liveTrackingEnabled: boolean;
  liveConnectionStatus: 'DISCONNECTED' | 'CONNECTING' | 'LIVE' | 'PAUSED' | 'ERROR';
  liveRateHz: number;
  liveObjectStates: Record<number, SatelliteState>;
  lastTelemetryFrameUtc: string | null;
  liveErrors: string[];
  logs: string[];
  activePanel: 'mission_control' | 'catalog' | 'globe_config' | 'data_sources' | 'conjunction' | 'catalog_layer' | 'research';

  // Conjunction State
  conjunctionResults: ConjunctionResult[];
  activeConjunctionResult: ConjunctionResult | null;

  // Visibility State
  visibilityResults: any[];
  visibilityScanActive: boolean;

  // Catalog Layer State
  catalogLayerEnabled: boolean;
  catalogLayerObjects: CatalogSnapshotObject[];
  catalogLayerLoading: boolean;

  // Space Environment Dashboard
  catalogAnalyticsSummary: import('../api/client').CatalogAnalyticsSummary | null;
  analyticsLoading: boolean;
  analyticsError: string | null;
  analyticsFilters: {
    source?: string;
    source_group?: string;
    category?: string;
    object_type?: string;
  };
  analyticsLastUpdated: string | null;
  fetchCatalogAnalytics: () => Promise<void>;
  setAnalyticsFilters: (filters: Partial<ConsoleState['analyticsFilters']>) => void;

  // Reliability State
  reliabilitySummary: import('../api/client').ReliabilitySummary | null;
  activeObjectReliability: import('../api/client').ObjectReliabilityDetail | null;
  reliabilityLoading: boolean;
  reliabilityError: string | null;
  fetchReliabilitySummary: () => Promise<void>;
  fetchActiveObjectReliability: () => Promise<void>;

  // Replay State
  replayEnabled: boolean;
  replayPlaying: boolean;
  replayEphemeris: SatelliteState[];
  replayStartUtc: string | null;
  replayEndUtc: string | null;
  replayCurrentUtc: string | null;
  replaySpeed: number;
  replayIndex: number;
  replayMode: 'READY' | 'PLAYING' | 'PAUSED' | 'ERROR';
  replayError: string | null;

  // Detailed Passes State
  detailedPasses: import('../api/client').DetailedPassWindow[];
  selectedDetailedPass: import('../api/client').DetailedPassWindow | null;
  isComputingDetailedPasses: boolean;

  // Research State
  tleHistory: import('../api/client').HistoricalTLEPoint[];
  decayIndicators: import('../api/client').OrbitalDecayIndicators | null;
  illuminationState: import('../api/client').IlluminationStateResponse['illumination_state'] | null;
  relativeMotionResult: import('../api/client').RelativeMotionResult | null;
  researchLoading: boolean;
  researchError: string | null;

  // Cesium Diagnostics
  cesiumDiagnostics: { token: string, terrain: string, imagery: string };
  setCesiumDiagnostics: (diagnostics: { token: string, terrain: string, imagery: string }) => void;



  // Actions
  setLanguage: (lang: 'en' | 'tr') => void;
  setApiStatus: (status: 'checking' | 'connected' | 'disconnected', error?: string | null) => void;
  setCatalogResults: (results: CatalogObject[]) => void;
  setCatalogGroup: (group: string) => void;
  setCatalogSearchQuery: (query: string) => void;
  selectObject: (obj: CatalogObject) => void;
  removeSelectedObject: (noradId: number) => void;
  setActiveObject: (obj: CatalogObject | null) => void;
  setObserver: (config: ObserverConfig) => void;
  setActiveState: (state: SatelliteState | null) => void;
  setActiveAER: (aer: ObserverAER | null) => void;
  setActivePasses: (passes: PassWindow[]) => void;
  setActiveEphemeris: (ephemeris: SatelliteState[]) => void;
  setShowOrbitPath: (show: boolean) => void;
  setShowGroundTrack: (show: boolean) => void;
  setShowObserver: (show: boolean) => void;
  setFollowActiveObject: (follow: boolean) => void;
  setEnableEarthLighting: (enable: boolean) => void;
  setEnableEarthRotation: (enable: boolean) => void;
  setLiveTrackingEnabled: (enabled: boolean) => void;
  setLiveConnectionStatus: (status: 'DISCONNECTED' | 'CONNECTING' | 'LIVE' | 'PAUSED' | 'ERROR') => void;
  setLiveRateHz: (rate: number) => void;
  setLiveObjectStates: (states: Record<number, SatelliteState>) => void;
  setLastTelemetryFrameUtc: (timestamp: string | null) => void;
  setLiveErrors: (errors: string[]) => void;
  addLog: (log: string) => void;
  setActivePanel: (panel: 'mission_control' | 'catalog' | 'globe_config' | 'data_sources' | 'conjunction' | 'catalog_layer' | 'research') => void;
  setConjunctionResults: (results: ConjunctionResult[]) => void;
  setActiveConjunctionResult: (result: ConjunctionResult | null) => void;
  
  setCatalogLayerEnabled: (enabled: boolean) => void;
  setCatalogLayerObjects: (objects: CatalogSnapshotObject[]) => void;
  setCatalogLayerLoading: (loading: boolean) => void;

  setVisibilityResults: (results: any[]) => void;
  setVisibilityScanActive: (active: boolean) => void;

  // Replay Actions
  setReplayEnabled: (enabled: boolean) => void;
  setReplayPlaying: (playing: boolean) => void;
  setReplayEphemeris: (ephemeris: SatelliteState[]) => void;
  setReplayStartUtc: (utc: string | null) => void;
  setReplayEndUtc: (utc: string | null) => void;
  setReplayCurrentUtc: (utc: string | null) => void;
  setReplaySpeed: (speed: number) => void;
  setReplayIndex: (index: number) => void;
  setReplayMode: (mode: 'READY' | 'PLAYING' | 'PAUSED' | 'ERROR') => void;
  setReplayError: (error: string | null) => void;
  clearReplay: () => void;
  requestReplayEphemeris: (norad_id: number, start_time: string, end_time: string, step: number) => Promise<void>;

  setDetailedPasses: (passes: import('../api/client').DetailedPassWindow[]) => void;
  setSelectedDetailedPass: (pass: import('../api/client').DetailedPassWindow | null) => void;
  setIsComputingDetailedPasses: (computing: boolean) => void;
  fetchDetailedPasses: (startUtc: string, endUtc: string, minElev: number, stepSec: number) => Promise<void>;

  fetchTLEHistory: (norad_id: number) => Promise<void>;
  fetchDecayIndicators: (norad_id: number) => Promise<void>;
  fetchIllumination: (norad_id: number, timestamp_utc: string) => Promise<void>;
  fetchRelativeMotion: (primary: number, secondary: number, tca_utc: string) => Promise<void>;
}

export const useConsoleStore = create<ConsoleState>((set) => ({
  language: 'en',
  apiStatus: 'checking',
  lastApiError: null,
  catalogGroup: 'stations',
  catalogSearchQuery: '',
  catalogResults: [],
  selectedObjects: [],
  activeObject: null,
  maxSelectedObjects: 20,
  observer: {
    name: 'Nevşehir Ground Station',
    latitude_deg: 38.6244,
    longitude_deg: 34.7144,
    elevation_m: 1200.0,
    min_elevation_deg: 10.0
  },
  activeState: null,
  activeAER: null,
  activePasses: [],
  activeEphemeris: [],
  showOrbitPath: true,
  showGroundTrack: true,
  showObserver: true,
  followActiveObject: false,
  enableEarthLighting: false,
  enableEarthRotation: false,
  liveTrackingEnabled: false,
  liveConnectionStatus: 'DISCONNECTED',
  liveRateHz: 1.0,
  liveObjectStates: {},
  lastTelemetryFrameUtc: null,
  liveErrors: [],
  logs: ['Console Initialized. System standby.'],
  activePanel: 'mission_control',
  conjunctionResults: [],
  activeConjunctionResult: null,
  catalogLayerEnabled: false,
  catalogLayerObjects: [],
  catalogLayerLoading: false,
  visibilityResults: [],
  visibilityScanActive: false,

  reliabilitySummary: null,
  activeObjectReliability: null,
  reliabilityLoading: false,
  reliabilityError: null,

  replayEnabled: false,
  replayPlaying: false,
  replayEphemeris: [],
  replayStartUtc: null,
  replayEndUtc: null,
  replayCurrentUtc: null,
  replaySpeed: 1,
  replayIndex: 0,
  replayMode: 'READY',
  replayError: null,

  // Detailed Passes
  detailedPasses: [],
  selectedDetailedPass: null,
  isComputingDetailedPasses: false,

  // Research
  tleHistory: [],
  decayIndicators: null,
  illuminationState: null,
  relativeMotionResult: null,
  researchLoading: false,
  researchError: null,

  cesiumDiagnostics: { token: 'Missing', terrain: 'Fallback', imagery: 'Fallback' },
  setCesiumDiagnostics: (diagnostics) => set({ cesiumDiagnostics: diagnostics }),

  setLanguage: (lang) => set({ language: lang }),

  setApiStatus: (status, error = null) => set((state) => ({
    apiStatus: status,
    lastApiError: error,
    logs: error ? [...state.logs, `API ERROR: ${error}`] : state.logs
  })),

  setCatalogResults: (results) => set({ catalogResults: results }),
  
  setCatalogGroup: (group) => set({ catalogGroup: group }),
  
  setCatalogSearchQuery: (query) => set({ catalogSearchQuery: query }),

  selectObject: (obj) => set((state) => {
    const exists = state.selectedObjects.some((item) => item.norad_id === obj.norad_id);
    if (exists) return {}; // Already selected

    if (state.selectedObjects.length >= state.maxSelectedObjects) {
      const warningMsg = 'Maximum tracking selection limit is 20 objects.';
      return {
        logs: [...state.logs, `WARNING: ${warningMsg}`],
        lastApiError: warningMsg
      };
    }

    return {
      selectedObjects: [...state.selectedObjects, obj],
      lastApiError: null,
      logs: [...state.logs, `Selected: ${obj.name} (NORAD ID: ${obj.norad_id}) added to tracking set.`]
    };
  }),

  removeSelectedObject: (noradId) => set((state) => {
    const filtered = state.selectedObjects.filter((item) => item.norad_id !== noradId);
    const wasActive = state.activeObject?.norad_id === noradId;
    
    return {
      selectedObjects: filtered,
      activeObject: wasActive ? null : state.activeObject,
      activeState: wasActive ? null : state.activeState,
      activeAER: wasActive ? null : state.activeAER,
      activePasses: wasActive ? [] : state.activePasses,
      activeEphemeris: wasActive ? [] : state.activeEphemeris,
      detailedPasses: wasActive ? [] : state.detailedPasses,
      selectedDetailedPass: wasActive ? null : state.selectedDetailedPass,
      activeObjectReliability: wasActive ? null : state.activeObjectReliability,
      tleHistory: wasActive ? [] : state.tleHistory,
      decayIndicators: wasActive ? null : state.decayIndicators,
      illuminationState: wasActive ? null : state.illuminationState,
      relativeMotionResult: wasActive ? null : state.relativeMotionResult,
      replayEphemeris: wasActive ? [] : state.replayEphemeris,
      lastApiError: null,
      logs: [...state.logs, `Removed NORAD ID: ${noradId} from active selection set.`]
    };
  }),

  setActiveObject: (obj) => set((state) => {
    // Automatically fetch object reliability when setting active object
    if (obj) {
      setTimeout(() => {
        const store = useConsoleStore.getState();
        store.fetchActiveObjectReliability();
        
        // Auto-fetch current position (for the red dot)
        const nowUtc = new Date().toISOString();
        getCatalogState({ norad_id: obj.norad_id, timestamp_utc: nowUtc })
          .then(res => store.setActiveState(res))
          .catch(err => store.addLog(`Auto-Propagation error: ${err.message}`));
          
        // Auto-fetch orbit path
        const startTime = new Date(new Date().getTime() - 45 * 60 * 1000).toISOString();
        const endTime = new Date(new Date().getTime() + 45 * 60 * 1000).toISOString();
        getCatalogEphemeris({
          norad_id: obj.norad_id,
          start_time_utc: startTime,
          end_time_utc: endTime,
          step_seconds: 60
        })
          .then(ephemeris => store.setActiveEphemeris(ephemeris))
          .catch(err => store.addLog(`Auto-Ephemeris error: ${err.message}`));
      }, 0);
    }
    return {
      activeObject: obj,
      activeState: null,
      activeAER: null,
      activePasses: [],
      activeEphemeris: [],
      detailedPasses: [],
      selectedDetailedPass: null,
      activeObjectReliability: null,
      tleHistory: [],
      decayIndicators: null,
      illuminationState: null,
      relativeMotionResult: null,
      replayEphemeris: [],
      lastApiError: null,
      logs: obj 
        ? [...state.logs, `Active target focus set to: ${obj.name} (NORAD: ${obj.norad_id}).`]
        : [...state.logs, `Active target focus cleared.`]
    };
  }),

  setObserver: (config) => set((state) => ({
    observer: config,
    logs: [...state.logs, `Observer coordinates updated: ${config.name}.`]
  })),

  setActiveState: (state) => set({ activeState: state }),

  setActiveAER: (aer) => set({ activeAER: aer }),

  setActivePasses: (passes) => set({ activePasses: passes }),

  setActiveEphemeris: (ephemeris) => set({ activeEphemeris: ephemeris }),

  setShowOrbitPath: (show) => set((state) => ({
    showOrbitPath: show,
    logs: [...state.logs, `Settings: Orbit path rendering ${show ? 'ENABLED' : 'DISABLED'}.`]
  })),

  setShowGroundTrack: (show) => set((state) => ({
    showGroundTrack: show,
    logs: [...state.logs, `Settings: Ground track rendering ${show ? 'ENABLED' : 'DISABLED'}.`]
  })),

  setShowObserver: (show) => set((state) => ({
    showObserver: show,
    logs: [...state.logs, `Settings: Observer station marker rendering ${show ? 'ENABLED' : 'DISABLED'}.`]
  })),

  setFollowActiveObject: (follow) => set((state) => ({
    followActiveObject: follow,
    logs: [...state.logs, `Settings: Camera lock tracking follow-mode ${follow ? 'ENABLED' : 'DISABLED'}.`]
  })),

  setEnableEarthLighting: (enable) => set((state) => ({
    enableEarthLighting: enable,
    logs: [...state.logs, `Settings: Earth lighting (sunlight) ${enable ? 'ENABLED' : 'DISABLED'}.`]
  })),

  setEnableEarthRotation: (enable) => set((state) => ({
    enableEarthRotation: enable,
    logs: [...state.logs, `Settings: Real-time Earth rotation ${enable ? 'ENABLED' : 'DISABLED'}.`]
  })),

  setLiveTrackingEnabled: (enabled) => set({ liveTrackingEnabled: enabled }),

  setLiveConnectionStatus: (status) => set({ liveConnectionStatus: status }),

  setLiveRateHz: (rate) => set({ liveRateHz: rate }),

  setLiveObjectStates: (states) => set({ liveObjectStates: states }),

  setLastTelemetryFrameUtc: (timestamp) => set({ lastTelemetryFrameUtc: timestamp }),

  setLiveErrors: (errors) => set({ liveErrors: errors }),

  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),

  setActivePanel: (panel) => set((state) => ({
    activePanel: panel,
    logs: [...state.logs, `Navigation: Switched active panel workspace to ${panel.toUpperCase().replace('_', ' ')}.`]
  })),

  setConjunctionResults: (results) => set({ conjunctionResults: results }),

  setActiveConjunctionResult: (result) => set((state) => ({
    activeConjunctionResult: result,
    logs: result 
      ? [...state.logs, `System: Highlighted conjunction TCA for Primary NORAD ${result.primary_norad_id} & Secondary NORAD ${result.secondary_norad_id}.`]
      : state.logs
  })),

  setCatalogLayerEnabled: (enabled) => set((state) => ({ 
    catalogLayerEnabled: enabled,
    logs: [...state.logs, `Catalog Layer visualization ${enabled ? 'ENABLED' : 'DISABLED'}.`]
  })),
  
  setCatalogLayerObjects: (objects) => set({ catalogLayerObjects: objects }),
  
  setCatalogLayerLoading: (loading) => set({ catalogLayerLoading: loading }),

  setVisibilityResults: (results) => set({ visibilityResults: results }),

  setVisibilityScanActive: (active) => set({ visibilityScanActive: active }),

  setReplayEnabled: (enabled) => set({ replayEnabled: enabled }),
  setReplayPlaying: (playing) => set({ replayPlaying: playing }),
  setReplayEphemeris: (ephemeris) => set({ replayEphemeris: ephemeris }),
  setReplayStartUtc: (utc) => set({ replayStartUtc: utc }),
  setReplayEndUtc: (utc) => set({ replayEndUtc: utc }),
  setReplayCurrentUtc: (utc) => set({ replayCurrentUtc: utc }),
  setReplaySpeed: (speed) => set({ replaySpeed: speed }),
  setReplayIndex: (index) => set({ replayIndex: index }),
  setReplayMode: (mode) => set({ replayMode: mode }),
  setReplayError: (error) => set({ replayError: error }),
  clearReplay: () => set({
    replayEnabled: false,
    replayPlaying: false,
    replayEphemeris: [],
    replayStartUtc: null,
    replayEndUtc: null,
    replayCurrentUtc: null,
    replaySpeed: 1,
    replayIndex: 0,
    replayMode: 'READY',
    replayError: null,
  }),
  requestReplayEphemeris: async (norad_id, start_time, end_time, step) => {
    try {
      set({ replayMode: 'READY', replayError: null });
      const pts = Math.floor((new Date(end_time).getTime() - new Date(start_time).getTime()) / (step * 1000));
      if (pts > 5000) {
        throw new Error(`Requested points (${pts}) exceeds maximum allowed (5000). Please reduce duration or increase step size.`);
      }
      const data = await getCatalogEphemeris({
        norad_id,
        start_time_utc: start_time,
        end_time_utc: end_time,
        step_seconds: step
      });
      set({
        replayEphemeris: data,
        replayIndex: 0,
        replayEnabled: true,
        replayMode: 'READY',
        replayStartUtc: start_time,
        replayEndUtc: end_time,
        replayCurrentUtc: data.length > 0 ? data[0].timestamp_utc : null
      });
    } catch (err: any) {
      set({ replayError: err.message, replayMode: 'ERROR' });
    }
  },

  setDetailedPasses: (passes) => set({ detailedPasses: passes }),
  setSelectedDetailedPass: (pass) => set({ selectedDetailedPass: pass }),
  setIsComputingDetailedPasses: (computing) => set({ isComputingDetailedPasses: computing }),
  fetchDetailedPasses: async (startUtc, endUtc, minElev, stepSec) => {
    const { activeObject, observer } = useConsoleStore.getState();
    if (!activeObject) return;
    set({ isComputingDetailedPasses: true, selectedDetailedPass: null });
    try {
      const { getDetailedPasses } = await import('../api/client');
      const passes = await getDetailedPasses(
        activeObject.norad_id,
        observer.latitude_deg,
        observer.longitude_deg,
        observer.elevation_m,
        startUtc,
        endUtc,
        minElev,
        stepSec
      );
      set({ detailedPasses: passes });
    } catch (err: any) {
      console.error(err);
      set({ detailedPasses: [] });
    } finally {
      set({ isComputingDetailedPasses: false });
    }
  },

  // Space Environment Dashboard
  catalogAnalyticsSummary: null,
  analyticsLoading: false,
  analyticsError: null,
  analyticsFilters: {},
  analyticsLastUpdated: null,
  setAnalyticsFilters: (filters) => set((state) => ({ 
    analyticsFilters: { ...state.analyticsFilters, ...filters } 
  })),
  fetchCatalogAnalytics: async () => {
    set({ analyticsLoading: true, analyticsError: null });
    try {
      const { getCatalogAnalyticsSummary } = await import('../api/client');
      const filters = useConsoleStore.getState().analyticsFilters;
      const summary = await getCatalogAnalyticsSummary(filters);
      set({ 
        catalogAnalyticsSummary: summary, 
        analyticsLastUpdated: new Date().toISOString()
      });
    } catch (err: any) {
      console.error(err);
      set({ analyticsError: err.message || 'Failed to load catalog analytics' });
    } finally {
      set({ analyticsLoading: false });
    }
  },

  fetchReliabilitySummary: async () => {
    set({ reliabilityLoading: true, reliabilityError: null });
    try {
      const { getReliabilitySummary } = await import('../api/client');
      const data = await getReliabilitySummary();
      set({ reliabilitySummary: data });
    } catch (err: any) {
      console.error(err);
      set({ reliabilityError: err.message || 'Failed to load reliability summary' });
    } finally {
      set({ reliabilityLoading: false });
    }
  },

  fetchActiveObjectReliability: async () => {
    const { activeObject } = useConsoleStore.getState();
    if (!activeObject) {
      set({ activeObjectReliability: null });
      return;
    }
    set({ reliabilityLoading: true, reliabilityError: null });
    try {
      const { getObjectReliability } = await import('../api/client');
      const data = await getObjectReliability(activeObject.norad_id);
      set({ activeObjectReliability: data });
    } catch (err: any) {
      console.error(err);
      set({ reliabilityError: err.message || 'Failed to load object reliability' });
    } finally {
      set({ reliabilityLoading: false });
    }
  },

  fetchTLEHistory: async (norad_id) => {
    set({ researchLoading: true, researchError: null });
    try {
      const { getHistoricalTLEs } = await import('../api/client');
      const data = await getHistoricalTLEs(norad_id);
      set({ tleHistory: data });
    } catch (err: any) {
      console.error(err);
      set({ researchError: err.message || 'Failed to fetch TLE history' });
    } finally {
      set({ researchLoading: false });
    }
  },

  fetchDecayIndicators: async (norad_id) => {
    set({ researchLoading: true, researchError: null });
    try {
      const { getDecayIndicators } = await import('../api/client');
      const data = await getDecayIndicators(norad_id);
      set({ decayIndicators: data });
    } catch (err: any) {
      console.error(err);
      set({ researchError: err.message || 'Failed to fetch decay indicators' });
    } finally {
      set({ researchLoading: false });
    }
  },

  fetchIllumination: async (norad_id, timestamp_utc) => {
    set({ researchLoading: true, researchError: null });
    try {
      const { getAdvancedIllumination } = await import('../api/client');
      const data = await getAdvancedIllumination(norad_id, timestamp_utc);
      set({ illuminationState: data.illumination_state });
    } catch (err: any) {
      console.error(err);
      set({ researchError: err.message || 'Failed to fetch illumination state' });
    } finally {
      set({ researchLoading: false });
    }
  },

  fetchRelativeMotion: async (primary, secondary, tca_utc) => {
    set({ researchLoading: true, researchError: null });
    try {
      const { getAdvancedRelativeMotion } = await import('../api/client');
      const data = await getAdvancedRelativeMotion(primary, secondary, tca_utc);
      set({ relativeMotionResult: data });
    } catch (err: any) {
      console.error(err);
      set({ researchError: err.message || 'Failed to fetch relative motion' });
    } finally {
      set({ researchLoading: false });
    }
  }
}));
