import { create } from 'zustand';
import { CatalogObject, SatelliteState, ObserverAER, PassWindow, ConjunctionResult, CatalogSnapshotObject } from '../api/client';

export interface ObserverConfig {
  name: string;
  latitude_deg: number;
  longitude_deg: number;
  elevation_m: number;
  min_elevation_deg: number;
}

export interface ConsoleState {
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
  activePanel: 'mission_control' | 'catalog' | 'globe_config' | 'data_sources' | 'conjunction' | 'catalog_layer';

  // Conjunction State
  conjunctionResults: ConjunctionResult[];
  activeConjunctionResult: ConjunctionResult | null;

  // Catalog Layer State
  catalogLayerEnabled: boolean;
  catalogLayerObjects: CatalogSnapshotObject[];
  catalogLayerLoading: boolean;

  // Actions
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
  setActivePanel: (panel: 'mission_control' | 'catalog' | 'globe_config' | 'data_sources' | 'conjunction' | 'catalog_layer') => void;
  setConjunctionResults: (results: ConjunctionResult[]) => void;
  setActiveConjunctionResult: (result: ConjunctionResult | null) => void;
  
  setCatalogLayerEnabled: (enabled: boolean) => void;
  setCatalogLayerObjects: (objects: CatalogSnapshotObject[]) => void;
  setCatalogLayerLoading: (loading: boolean) => void;
}

export const useConsoleStore = create<ConsoleState>((set) => ({
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
      lastApiError: null,
      logs: [...state.logs, `Removed NORAD ID: ${noradId} from active selection set.`]
    };
  }),

  setActiveObject: (obj) => set((state) => ({
    activeObject: obj,
    activeState: null,
    activeAER: null,
    activePasses: [],
    activeEphemeris: [],
    lastApiError: null,
    logs: obj 
      ? [...state.logs, `Active target focus set to: ${obj.name} (NORAD: ${obj.norad_id}).`]
      : [...state.logs, `Active target focus cleared.`]
  })),

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
  
  setCatalogLayerLoading: (loading) => set({ catalogLayerLoading: loading })
}));
