import { create } from 'zustand';

export interface ObserverConfig {
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
}

export interface ConsoleState {
  selectedObjects: number[];
  activeObserver: ObserverConfig;
  backendStatus: 'connected' | 'disconnected' | 'checking';
  activePanel: 'mission_control' | 'catalog' | 'globe_config' | 'data_sources';
  systemLogs: string[];
  cesiumTokenMissing: boolean;
  
  // Actions
  toggleSelectedObject: (id: number) => void;
  setBackendStatus: (status: 'connected' | 'disconnected' | 'checking') => void;
  setActivePanel: (panel: 'mission_control' | 'catalog' | 'globe_config' | 'data_sources') => void;
  addSystemLog: (log: string) => void;
  setCesiumTokenMissing: (missing: boolean) => void;
  setActiveObserver: (config: ObserverConfig) => void;
}

export const useConsoleStore = create<ConsoleState>((set) => ({
  selectedObjects: [],
  activeObserver: {
    name: 'Ankara Ground Station',
    latitude: 39.9334,
    longitude: 32.8597,
    elevation: 938.0
  },
  backendStatus: 'checking',
  activePanel: 'mission_control',
  systemLogs: ['Console Initialized. System standby.'],
  cesiumTokenMissing: false,

  toggleSelectedObject: (id) => set((state) => {
    const isSelected = state.selectedObjects.includes(id);
    if (isSelected) {
      return { selectedObjects: state.selectedObjects.filter(item => item !== id) };
    } else {
      if (state.selectedObjects.length >= 20) {
        return { 
          systemLogs: [...state.systemLogs, 'WARNING: Max tracking limit of 20 objects reached.'] 
        };
      }
      return { selectedObjects: [...state.selectedObjects, id] };
    }
  }),

  setBackendStatus: (status) => set({ backendStatus: status }),
  
  setActivePanel: (panel) => set((state) => ({ 
    activePanel: panel,
    systemLogs: [...state.systemLogs, `Navigation: Switched workspace focus to ${panel.toUpperCase().replace('_', ' ')}.`]
  })),

  addSystemLog: (log) => set((state) => ({ systemLogs: [...state.systemLogs, log] })),
  
  setCesiumTokenMissing: (missing) => set({ cesiumTokenMissing: missing }),
  
  setActiveObserver: (config) => set((state) => ({
    activeObserver: config,
    systemLogs: [...state.systemLogs, `Observer updated: ${config.name} (${config.latitude.toFixed(4)}°N, ${config.longitude.toFixed(4)}°E)`]
  }))
}));
