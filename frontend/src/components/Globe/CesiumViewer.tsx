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
  HeadingPitchRange,
  SceneTransforms,
  PointPrimitiveCollection,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType
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
    addLog,
    liveObjectStates,
    liveTrackingEnabled,
    selectedObjects,
    activeConjunctionResult,
    catalogLayerEnabled,
    catalogLayerObjects,
    enableEarthLighting,
    enableEarthRotation,
    replayEnabled,
    replayIndex,
    replayEphemeris
  } = useConsoleStore();

  const pointsRef = useRef<PointPrimitiveCollection | null>(null);

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
          creditContainer: document.createElement('div'),
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
        pointsRef.current = null;
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
      const isReplay = replayEnabled && replayEphemeris && replayEphemeris.length > 0;
      const targetId = isReplay ? 'replay-satellite' : `live-object-${activeObject.norad_id}`;
      const targetEntity = viewer.entities.getById(targetId);
      if (targetEntity && viewer.trackedEntity !== targetEntity) {
        viewer.trackedEntity = targetEntity;
      }
    } else {
      if (viewer.trackedEntity) {
        viewer.trackedEntity = undefined;
      }
    }
  }, [followActiveObject, activeObject, activeState, replayEnabled, replayEphemeris]);

  // --- 2.8 Earth Lighting & Rotation Controls ---
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    viewer.scene.globe.enableLighting = enableEarthLighting;
    viewer.clock.shouldAnimate = enableEarthRotation;
    if (enableEarthRotation) {
      viewer.clock.multiplier = 1.0; // 1x real-time speed
    }
  }, [enableEarthLighting, enableEarthRotation]);

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

      let isConjunctionTarget = false;
      let isPrimary = false;
      let isSecondary = false;

      if (activeConjunctionResult) {
        if (noradId === activeConjunctionResult.primary_norad_id) {
          isConjunctionTarget = true;
          isPrimary = true;
        } else if (noradId === activeConjunctionResult.secondary_norad_id) {
          isConjunctionTarget = true;
          isSecondary = true;
        }
      }

      if (state) {
        const pos = cartesianFromGeodetic(
          state.latitude_deg,
          state.longitude_deg,
          state.altitude_km
        );

        const isReplayMode = isActive && replayEnabled && replayEphemeris && replayEphemeris.length > 0;
        const alpha = isReplayMode ? 0.3 : 1.0;

        if (existing) {
          existing.position = pos as any;
          if (existing.label) {
            existing.label.text = (isActive ? `${obj.name} (NORAD: ${obj.norad_id})` : isConjunctionTarget ? `[CONJ] ${obj.name}` : obj.name) as any;
            existing.label.font = (isActive ? '12px Share Tech Mono, sans-serif' : '9px Share Tech Mono, sans-serif') as any;
            if (isConjunctionTarget && !isActive) {
               existing.label.fillColor = isPrimary ? Color.CYAN.withAlpha(alpha) : Color.MAGENTA.withAlpha(alpha) as any;
            } else {
               existing.label.fillColor = Color.WHITE.withAlpha(alpha) as any;
            }
            existing.label.outlineColor = Color.BLACK.withAlpha(alpha) as any;
          }
          if (existing.point) {
            existing.point.color = (isActive ? Color.RED.withAlpha(alpha) : isPrimary ? Color.CYAN.withAlpha(alpha) : isSecondary ? Color.MAGENTA.withAlpha(alpha) : Color.ORANGE.withAlpha(alpha)) as any;
            existing.point.pixelSize = (isActive ? 12 : isConjunctionTarget ? 10 : 8) as any;
            existing.point.outlineWidth = (isActive ? 2 : 1.0) as any;
            existing.point.outlineColor = Color.WHITE.withAlpha(alpha) as any;
          }
        } else {
          try {
            viewer.entities.add({
              id: entityId,
              position: pos,
              point: {
                pixelSize: isActive ? 12 : isConjunctionTarget ? 10 : 8,
                color: isActive ? Color.RED.withAlpha(alpha) : isPrimary ? Color.CYAN.withAlpha(alpha) : isSecondary ? Color.MAGENTA.withAlpha(alpha) : Color.ORANGE.withAlpha(alpha),
                outlineColor: Color.WHITE.withAlpha(alpha),
                outlineWidth: isActive ? 2 : 1.0,
              },
              label: {
                text: isActive ? `${obj.name} (NORAD: ${obj.norad_id})` : isConjunctionTarget ? `[CONJ] ${obj.name}` : obj.name,
                font: isActive ? '12px Share Tech Mono, sans-serif' : '9px Share Tech Mono, sans-serif',
                fillColor: isConjunctionTarget && !isActive ? (isPrimary ? Color.CYAN.withAlpha(alpha) : Color.MAGENTA.withAlpha(alpha)) : Color.WHITE.withAlpha(alpha),
                outlineColor: Color.BLACK.withAlpha(alpha),
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

  }, [selectedObjects, liveObjectStates, liveTrackingEnabled, activeObject, activeState, activeConjunctionResult, replayEnabled, replayEphemeris]);

  // --- 4.5. Render Replay Mode Entities ---
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const replaySatId = 'replay-satellite';
    const replayOrbitId = 'replay-orbit-path';
    const replayTrackId = 'replay-ground-track';
    const replayPointId = 'replay-current-ground-point';

    const existingSat = viewer.entities.getById(replaySatId);
    const existingOrbit = viewer.entities.getById(replayOrbitId);
    const existingTrack = viewer.entities.getById(replayTrackId);
    const existingPoint = viewer.entities.getById(replayPointId);

    if (replayEnabled && replayEphemeris && replayEphemeris.length > 0 && activeObject) {
      const state = replayEphemeris[replayIndex];
      if (!state) return;

      const pos = cartesianFromGeodetic(state.latitude_deg, state.longitude_deg, state.altitude_km);
      const groundPos = groundTrackCartesian(state.latitude_deg, state.longitude_deg, 2000);

      // Replay Satellite
      if (existingSat) {
        existingSat.position = pos as any;
      } else {
        viewer.entities.add({
          id: replaySatId,
          position: pos,
          point: {
            pixelSize: 14,
            color: Color.YELLOW,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
          },
          label: {
            text: `[REPLAY] ${activeObject.name}`,
            font: '13px Share Tech Mono, sans-serif',
            fillColor: Color.YELLOW,
            outlineColor: Color.BLACK,
            outlineWidth: 3,
            style: LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: new Cartesian2(0, -15)
          }
        });
      }

      // Replay Orbit Path
      if (!existingOrbit) {
        const orbitPositions = replayEphemeris.map(s => 
          cartesianFromGeodetic(s.latitude_deg, s.longitude_deg, s.altitude_km)
        );
        viewer.entities.add({
          id: replayOrbitId,
          polyline: {
            positions: orbitPositions,
            width: 3,
            material: Color.YELLOW.withAlpha(0.5),
            arcType: ArcType.NONE
          }
        });
      }

      // Replay Ground Track
      if (!existingTrack) {
        const trackPositions = replayEphemeris.map(s => 
          groundTrackCartesian(s.latitude_deg, s.longitude_deg, 2000)
        );
        viewer.entities.add({
          id: replayTrackId,
          polyline: {
            positions: trackPositions,
            width: 2.5,
            material: Color.YELLOW.withAlpha(0.3),
            arcType: ArcType.GEODESIC
          }
        });
      }

      // Replay Ground Point
      if (existingPoint) {
        existingPoint.position = groundPos as any;
      } else {
        viewer.entities.add({
          id: replayPointId,
          position: groundPos,
          point: {
            pixelSize: 8,
            color: Color.YELLOW.withAlpha(0.8),
            outlineColor: Color.BLACK,
            outlineWidth: 1,
          }
        });
      }
    } else {
      if (existingSat) viewer.entities.remove(existingSat);
      if (existingOrbit) viewer.entities.remove(existingOrbit);
      if (existingTrack) viewer.entities.remove(existingTrack);
      if (existingPoint) viewer.entities.remove(existingPoint);
    }
  }, [replayEnabled, replayIndex, replayEphemeris, activeObject]);

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

  // --- 6. Render Catalog Snapshot Layer ---
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (!pointsRef.current) {
      pointsRef.current = viewer.scene.primitives.add(new PointPrimitiveCollection());
    }

    const points = pointsRef.current!;
    points.removeAll();

    if (catalogLayerEnabled && catalogLayerObjects && catalogLayerObjects.length > 0) {
      catalogLayerObjects.forEach(obj => {
        const pos = Cartesian3.fromDegrees(obj.longitude_deg, obj.latitude_deg, obj.altitude_km * 1000);
        
        let color = Color.WHITE;
        if (obj.object_type === 'PAYLOAD') color = Color.CYAN;
        else if (obj.object_type === 'ROCKET_BODY') color = Color.ORANGE;
        else if (obj.object_type === 'DEBRIS') color = Color.MAGENTA;

        points.add({
          position: pos,
          color: color,
          pixelSize: 4,
          id: `catalog-layer-obj-${obj.norad_id}`
        });
      });
    }
  }, [catalogLayerEnabled, catalogLayerObjects]);

  // --- Hover interaction for Ephemeris Ghost ---
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    const ghostId = 'ephemeris-hover-ghost';

    handler.setInputAction((movement: any) => {
      const pickedObject = viewer.scene.pick(movement.endPosition);
      if (pickedObject && pickedObject.id && (pickedObject.id.id === 'replay-orbit-path' || pickedObject.id.id === 'active-orbit-path')) {
        
        const ephemeris = pickedObject.id.id === 'replay-orbit-path' ? replayEphemeris : activeEphemeris;
        if (!ephemeris || ephemeris.length === 0) return;

        // Find closest point in 2D
        let minDistance = Infinity;
        let closestState = null;
        let closestPos3D = null;

        for (let i = 0; i < ephemeris.length; i++) {
          const state = ephemeris[i];
          const pos3D = cartesianFromGeodetic(state.latitude_deg, state.longitude_deg, state.altitude_km);
          const pos2D = SceneTransforms.worldToWindowCoordinates(viewer.scene, pos3D);
          if (pos2D) {
            const dist = Cartesian2.distance(pos2D, movement.endPosition);
            if (dist < minDistance) {
              minDistance = dist;
              closestState = state;
              closestPos3D = pos3D;
            }
          }
        }

        if (closestState && minDistance < 50) { // threshold
          const existingGhost = viewer.entities.getById(ghostId);
          const timeStr = new Date(closestState.timestamp_utc).toISOString().substring(11, 19);
          const text = `T: ${timeStr}\nAlt: ${closestState.altitude_km.toFixed(1)} km`;
          
          if (existingGhost) {
            existingGhost.position = closestPos3D as any;
            if (existingGhost.label) existingGhost.label.text = text as any;
          } else {
            viewer.entities.add({
              id: ghostId,
              position: closestPos3D as any,
              point: {
                pixelSize: 8,
                color: Color.CYAN,
                outlineColor: Color.WHITE,
                outlineWidth: 2,
              },
              label: {
                text: text,
                font: '11px Share Tech Mono, sans-serif',
                fillColor: Color.WHITE,
                outlineColor: Color.BLACK,
                outlineWidth: 2,
                style: LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: VerticalOrigin.BOTTOM,
                pixelOffset: new Cartesian2(0, -10),
                backgroundColor: new Color(0, 0, 0, 0.7),
                showBackground: true,
              }
            });
          }
        } else {
          const existingGhost = viewer.entities.getById(ghostId);
          if (existingGhost) viewer.entities.remove(existingGhost);
        }

      } else {
        const existingGhost = viewer.entities.getById(ghostId);
        if (existingGhost) viewer.entities.remove(existingGhost);
      }
    }, ScreenSpaceEventType.MOUSE_MOVE);

    return () => {
      if (!handler.isDestroyed()) {
        handler.destroy();
      }
      const existingGhost = viewerRef.current?.entities.getById(ghostId);
      if (existingGhost && viewerRef.current) viewerRef.current.entities.remove(existingGhost);
    };
  }, [replayEphemeris, activeEphemeris]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

    </div>
  );
};
