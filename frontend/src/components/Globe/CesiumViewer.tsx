import React, { useEffect, useRef } from 'react';
import { 
  Viewer, 
  Ion, 
  Cartesian2, 
  Cartesian3, 
  Color, 
  LabelStyle, 
  VerticalOrigin, 
  ArcType,
  HeadingPitchRange
} from 'cesium';
import { useConsoleStore } from '../../store/useConsoleStore';
import { cartesianFromGeodetic, groundTrackCartesian } from '../../utils/cesiumCoordinates';
import 'cesium/Source/Widgets/widgets.css';

export const CesiumViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const prevActiveNoradIdRef = useRef<number | null>(null);

  const {
    activeObject,
    activeState,
    activeEphemeris,
    observer,
    showOrbitPath,
    showGroundTrack,
    showObserver,
    followActiveObject,
    setShowOrbitPath,
    setShowGroundTrack,
    setShowObserver,
    setFollowActiveObject,
    addLog,
    liveObjectStates,
    liveTrackingEnabled,
    selectedObjects
  } = useConsoleStore();

  // --- 1. Mount Cesium Globe Viewer ---
  useEffect(() => {
    const token = import.meta.env.VITE_CESIUM_ION_TOKEN || '';
    
    if (token && token.trim().length > 0) {
      Ion.defaultAccessToken = token;
      addLog('System: Cesium Ion credentials applied successfully.');
    } else {
      addLog('Warning: Cesium Ion token missing. Initializing fallback globe view.');
    }

    if (containerRef.current && !viewerRef.current) {
      try {
        const viewer = new Viewer(containerRef.current, {
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: true,
          infoBox: false,
          sceneModePicker: true,
          selectionIndicator: false,
          navigationHelpButton: false,
          fullscreenButton: false,
        });

        // Optimize baseline rendering
        viewer.scene.globe.enableLighting = false;
        viewerRef.current = viewer;
        addLog('System: 3D Visualization engine mounted.');
      } catch (err) {
        console.error('Failed to initialize Cesium Viewer:', err);
        addLog('CRITICAL: Failed to mount 3D Visualization engine.');
      }
    }

    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch (e) {
          // Ignore destruction exceptions
        }
        viewerRef.current = null;
      }
    };
  }, [addLog]);

  // --- 2. Update Ground Station in place ---
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // A) Ground Observer Station Entity
    const obsId = 'active-observer-station';
    const existingObs = viewer.entities.getById(obsId);
    
    if (showObserver && observer) {
      try {
        const obsPos = Cartesian3.fromDegrees(
          observer.longitude_deg,
          observer.latitude_deg,
          observer.elevation_m
        );
        
        if (existingObs) {
          existingObs.position = obsPos as any;
          if (existingObs.label) {
            existingObs.label.text = observer.name as any;
          }
        } else {
          viewer.entities.add({
            id: obsId,
            position: obsPos,
            point: {
              pixelSize: 10,
              color: Color.BLUE,
              outlineColor: Color.WHITE,
              outlineWidth: 1.5,
            },
            label: {
              text: observer.name,
              font: '11px Share Tech Mono, sans-serif',
              fillColor: Color.WHITE,
              outlineColor: Color.BLACK,
              outlineWidth: 2,
              style: LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: VerticalOrigin.BOTTOM,
              pixelOffset: new Cartesian2(0, -9)
            }
          });
        }
      } catch (err) {
        console.error('Error drawing observer station:', err);
      }
    } else {
      if (existingObs) {
        viewer.entities.remove(existingObs);
      }
    }
  }, [
    observer,
    showObserver
  ]);

  // --- 2.5 Camera Lock Follow Control (Only triggers on active target focus or lock-follow toggle changes) ---
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (followActiveObject && activeObject) {
      const satId = `live-object-${activeObject.norad_id}`;
      const satEntity = viewer.entities.getById(satId);
      if (satEntity && viewer.trackedEntity !== satEntity) {
        viewer.trackedEntity = satEntity;
      }
    } else {
      if (viewer.trackedEntity) {
        viewer.trackedEntity = undefined;
      }
    }
  }, [followActiveObject, activeObject, activeState]);

  // --- 3. Update Static Orbit Paths (Only re-drawn on explicit Ephemeris changes) ---
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Orbit Path Polyline (Cyan)
    const orbitId = 'active-orbit-path';
    const existingOrbit = viewer.entities.getById(orbitId);
    if (existingOrbit) {
      viewer.entities.remove(existingOrbit);
    }

    if (showOrbitPath && activeEphemeris && activeEphemeris.length > 0) {
      try {
        const orbitPositions = activeEphemeris.map(state => 
          cartesianFromGeodetic(state.latitude_deg, state.longitude_deg, state.altitude_km)
        );
        viewer.entities.add({
          id: orbitId,
          polyline: {
            positions: orbitPositions,
            width: 2.5,
            material: Color.CYAN,
            arcType: ArcType.NONE
          }
        });
      } catch (err) {
        console.error('Error drawing orbit path:', err);
      }
    }

    // Ground Track Polyline (Amber)
    const trackId = 'active-ground-track';
    const existingTrack = viewer.entities.getById(trackId);
    if (existingTrack) {
      viewer.entities.remove(existingTrack);
    }

    if (showGroundTrack && activeEphemeris && activeEphemeris.length > 0) {
      try {
        const trackPositions = activeEphemeris.map(state => 
          groundTrackCartesian(state.latitude_deg, state.longitude_deg, 2000)
        );
        viewer.entities.add({
          id: trackId,
          polyline: {
            positions: trackPositions,
            width: 2.0,
            material: Color.ORANGE,
            arcType: ArcType.GEODESIC
          }
        });
      } catch (err) {
        console.error('Error drawing ground track:', err);
      }
    }
  }, [activeEphemeris, showOrbitPath, showGroundTrack]);

  // --- 4. Manage Selected Satellite Markers from Live Telemetry Frame ---
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const activeNoradId = activeObject?.norad_id;
    const objectsToRender = new Map<number, any>();
    
    selectedObjects.forEach(obj => {
      objectsToRender.set(obj.norad_id, obj);
    });
    if (activeObject) {
      objectsToRender.set(activeObject.norad_id, activeObject);
    }

    const currentIdsToKeep = new Set(objectsToRender.keys());

    objectsToRender.forEach((obj, noradId) => {
      const entityId = `live-object-${noradId}`;
      const existing = viewer.entities.getById(entityId);
      const isActive = noradId === activeNoradId;
      
      let state = liveObjectStates[noradId];
      if (isActive && activeState) {
        state = activeState;
      }

      if (state) {
        const pos = cartesianFromGeodetic(
          state.latitude_deg,
          state.longitude_deg,
          state.altitude_km
        );

        if (existing) {
          existing.position = pos as any;
          if (existing.label) {
            existing.label.text = (isActive ? `${obj.name} (NORAD: ${obj.norad_id})` : obj.name) as any;
            existing.label.font = (isActive ? '12px Share Tech Mono, sans-serif' : '9px Share Tech Mono, sans-serif') as any;
          }
          if (existing.point) {
            existing.point.color = (isActive ? Color.RED : Color.ORANGE) as any;
            existing.point.pixelSize = (isActive ? 12 : 8) as any;
            existing.point.outlineWidth = (isActive ? 2 : 1.0) as any;
          }
        } else {
          try {
            viewer.entities.add({
              id: entityId,
              position: pos,
              point: {
                pixelSize: isActive ? 12 : 8,
                color: isActive ? Color.RED : Color.ORANGE,
                outlineColor: Color.WHITE,
                outlineWidth: isActive ? 2 : 1.0,
              },
              label: {
                text: isActive ? `${obj.name} (NORAD: ${obj.norad_id})` : obj.name,
                font: isActive ? '12px Share Tech Mono, sans-serif' : '9px Share Tech Mono, sans-serif',
                fillColor: Color.WHITE,
                outlineColor: Color.BLACK,
                outlineWidth: isActive ? 2.5 : 1.5,
                style: LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: VerticalOrigin.BOTTOM,
                pixelOffset: isActive ? new Cartesian2(0, -12) : new Cartesian2(0, -8)
              }
            });
          } catch (err) {
            console.error(`Failed to add live entity for NORAD ${noradId}:`, err);
          }
        }
      } else {
        if (existing) {
          viewer.entities.remove(existing);
        }
      }
    });

    const toRemove: any[] = [];
    for (let i = 0; i < viewer.entities.values.length; i++) {
      const ent = viewer.entities.values[i];
      if (ent.id.startsWith('live-object-')) {
        const idStr = ent.id.substring('live-object-'.length);
        const noradId = parseInt(idStr, 10);
        if (!currentIdsToKeep.has(noradId)) {
          toRemove.push(ent);
        }
      }
    }
    toRemove.forEach(ent => viewer.entities.remove(ent));

  }, [selectedObjects, liveObjectStates, liveTrackingEnabled, activeObject, activeState]);

  // --- 5. Camera Fly-To Active Satellite (On Focus Change Only) ---
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (activeObject) {
      const currentNorad = activeObject.norad_id;
      if (prevActiveNoradIdRef.current !== currentNorad) {
        prevActiveNoradIdRef.current = currentNorad;
        
        setTimeout(() => {
          const satEntity = viewer.entities.getById(`live-object-${currentNorad}`);
          if (satEntity) {
            viewer.flyTo(satEntity, {
              duration: 2.0,
              offset: new HeadingPitchRange(0, -Math.PI / 4, 1500000)
            });
          }
        }, 150);
      }
    } else {
      prevActiveNoradIdRef.current = null;
    }
  }, [activeObject]); // Only trigger when activeObject changes, preventing ticks from snapping camera

  // Manual Trigger to center camera on target
  const triggerFlyTo = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    if (!activeObject) return;
    const satEntity = viewer.entities.getById(`live-object-${activeObject.norad_id}`);
    if (satEntity) {
      viewer.flyTo(satEntity, {
        duration: 2.0,
        offset: new HeadingPitchRange(0, -Math.PI / 4, 1500000)
      });
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Layer Visualization Control Panel */}
      <div className="glass-panel" style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        padding: '12px 16px',
        borderRadius: '8px',
        zIndex: 5,
        width: '220px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        fontSize: '12px',
        color: 'var(--text-bright)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        border: '1px solid var(--border-color)',
        pointerEvents: 'auto'
      }}>
        <div style={{ 
          fontWeight: 600, 
          borderBottom: '1px solid var(--border-color)', 
          paddingBottom: '6px', 
          fontSize: '11px', 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em', 
          color: 'var(--accent-cyan)' 
        }}>
          Globe Layer Controls
        </div>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showOrbitPath} 
            onChange={(e) => setShowOrbitPath(e.target.checked)}
            style={{ accentColor: 'var(--accent-cyan)' }}
          />
          Show Orbit Path
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showGroundTrack} 
            onChange={(e) => setShowGroundTrack(e.target.checked)}
            style={{ accentColor: 'var(--accent-cyan)' }}
          />
          Show Ground Track
        </label>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showObserver} 
            onChange={(e) => setShowObserver(e.target.checked)}
            style={{ accentColor: 'var(--accent-cyan)' }}
          />
          Show Observer Station
        </label>

        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          cursor: activeObject ? 'pointer' : 'not-allowed', 
          borderTop: '1px solid var(--border-color)', 
          paddingTop: '6px',
          opacity: activeObject ? 1 : 0.5
        }}>
          <input 
            type="checkbox" 
            checked={followActiveObject} 
            onChange={(e) => setFollowActiveObject(e.target.checked)}
            disabled={!activeObject}
            style={{ accentColor: 'var(--accent-cyan)', cursor: activeObject ? 'pointer' : 'not-allowed' }}
          />
          Camera Lock Follow
        </label>

        {activeObject && (
          <button
            onClick={triggerFlyTo}
            style={{
              marginTop: '4px',
              padding: '6px 10px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'var(--accent-cyan)',
              color: 'var(--text-bright)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'background-color 0.2s'
            }}
          >
            ✈️ Center Active Target
          </button>
        )}
      </div>
    </div>
  );
};
