import { create } from 'zustand';
import { CatalogObject, SatelliteState, ObserverAER, PassWindow } from '../api/client';

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
  logs: string[];
  activePanel: 'mission_control' | 'catalog' | 'globe_config' | 'data_sources';

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
  addLog: (log: string) => void;
  setActivePanel: (panel: 'mission_control' | 'catalog' | 'globe_config' | 'data_sources') => void;
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
  logs: ['Console Initialized. System standby.'],
  activePanel: 'mission_control',

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

  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),

  setActivePanel: (panel) => set((state) => ({
    activePanel: panel,
    logs: [...state.logs, `Navigation: Switched active panel workspace to ${panel.toUpperCase().replace('_', ' ')}.`]
  }))
}));
