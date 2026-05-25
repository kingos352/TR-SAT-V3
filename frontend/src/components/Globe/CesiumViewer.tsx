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
  ScreenSpaceEventType,
  Camera,
  Rectangle,
  createWorldTerrainAsync,
  HeightReference,
  ArcGisMapServerImageryProvider,
  ImageryLayer
} from 'cesium';
import { useConsoleStore } from '../../store/useConsoleStore';
import { cartesianFromGeodetic, groundTrackCartesian } from '../../utils/cesiumCoordinates';
import { API_BASE_URL } from '../../api/client';
import 'cesium/Source/Widgets/widgets.css';

export const CesiumViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const prevActiveNoradIdRef = useRef<number | null>(null);

  // PERF: Narrow selectors — each subscribes only to its specific state slice,
  // preventing re-renders when unrelated state (panel visibility, UI settings) changes.
  const activeObject = useConsoleStore(s => s.activeObject);
  const activeState = useConsoleStore(s => s.activeState);
  const activeEphemeris = useConsoleStore(s => s.activeEphemeris);
  const observer = useConsoleStore(s => s.observer);
  const showOrbitPath = useConsoleStore(s => s.showOrbitPath);
  const showGroundTrack = useConsoleStore(s => s.showGroundTrack);
  const showObserver = useConsoleStore(s => s.showObserver);
  const followActiveObject = useConsoleStore(s => s.followActiveObject);
  const addLog = useConsoleStore(s => s.addLog);
  const liveObjectStates = useConsoleStore(s => s.liveObjectStates);
  const liveTrackingEnabled = useConsoleStore(s => s.liveTrackingEnabled);
  const selectedObjects = useConsoleStore(s => s.selectedObjects);
  const activeConjunctionResult = useConsoleStore(s => s.activeConjunctionResult);
  const catalogLayerEnabled = useConsoleStore(s => s.catalogLayerEnabled);
  const catalogLayerObjects = useConsoleStore(s => s.catalogLayerObjects);
  const enableEarthLighting = useConsoleStore(s => s.enableEarthLighting);
  const enableEarthRotation = useConsoleStore(s => s.enableEarthRotation);
  const replayEnabled = useConsoleStore(s => s.replayEnabled);
  const replayIndex = useConsoleStore(s => s.replayIndex);
  const replayEphemeris = useConsoleStore(s => s.replayEphemeris);
  const setCesiumDiagnostics = useConsoleStore(s => s.setCesiumDiagnostics);

  const pointsRef = useRef<PointPrimitiveCollection | null>(null);

  // PERF: Refs for ephemeris data used by hover handler — avoids re-registering
  // the ScreenSpaceEventHandler every time ephemeris arrays change.
  const activeEphemerisRef = useRef(activeEphemeris);
  const replayEphemerisRef = useRef(replayEphemeris);
  const hoverHandlerRef = useRef<ScreenSpaceEventHandler | null>(null);

  // Keep ephemeris refs in sync with latest state
  useEffect(() => { activeEphemerisRef.current = activeEphemeris; }, [activeEphemeris]);
  useEffect(() => { replayEphemerisRef.current = replayEphemeris; }, [replayEphemeris]);

  // --- 1. Mount Cesium Globe Viewer ---
  useEffect(() => {
    let active = true;

    const initCesium = async () => {
      let token = import.meta.env.VITE_CESIUM_ION_TOKEN || '';
      
      if (!token || token.trim().length === 0) {
        try {
          const resp = await fetch(`${API_BASE_URL}/api/v1/config/current`);
          if (resp.ok) {
            const data = await resp.json();
            token = data.cesium_token || '';
          }
        } catch (e) {
          console.error("Failed to fetch cesium token from backend", e);
        }
      }

      if (!active) return;

      if (token && token.trim().length > 0) {
        Ion.defaultAccessToken = token;
        addLog('System: Cesium Ion credentials applied successfully.');
      } else {
        addLog('Warning: Cesium Ion token missing. Initializing fallback globe view.');
      }

      if (containerRef.current && !viewerRef.current) {
        if (observer) {
          Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(
            observer.longitude_deg - 15,
            observer.latitude_deg - 15,
            observer.longitude_deg + 15,
            observer.latitude_deg + 15
          );
        }

        try {
          const useIon = token && token.trim().length > 0;
          
          const viewerOptions: any = {
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
            contextOptions: {
              webgl: {
                antialias: true
              }
            }
          };

          if (!useIon) {
            viewerOptions.baseLayer = ImageryLayer.fromProviderAsync(
              ArcGisMapServerImageryProvider.fromUrl('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer', {
                enablePickFeatures: false
              })
            );
          }

          const viewer = new Viewer(containerRef.current, viewerOptions);

          // Professional high-quality rendering settings
          viewer.scene.globe.enableLighting = false;
          viewer.resolutionScale = Math.max(window.devicePixelRatio || 1.0, 2.0); // Force super-sampling for glass-like sharpness
          viewer.scene.postProcessStages.fxaa.enabled = false; // Disable FXAA to prevent post-process blurring of text/orbit paths
          if (viewer.scene.msaaSamples !== undefined) {
            viewer.scene.msaaSamples = 8; // 8x MSAA for ultra-smooth edges
          }
          viewer.scene.globe.maximumScreenSpaceError = 1.0; // Sharper terrain and imagery (lower is better, default is 2.0)
          viewer.scene.highDynamicRange = true; // Realistic aerospace dynamic range
          
          viewerRef.current = viewer;
          addLog('System: 3D Visualization engine mounted.');

          if (token && token.trim().length > 0) {
            setCesiumDiagnostics({ token: 'Configured', terrain: 'Checking...', imagery: 'Checking...' });
            try {
              if (createWorldTerrainAsync) {
                viewer.terrainProvider = await createWorldTerrainAsync();
                viewer.scene.globe.depthTestAgainstTerrain = true;
                setCesiumDiagnostics({ token: 'Configured', terrain: 'Ion Terrain', imagery: 'Ion Imagery' });
              }
            } catch (err) {
              console.warn('Cesium ion imagery/terrain unavailable. Using fallback globe.', err);
              addLog('Warning: Cesium ion imagery/terrain unavailable. Using fallback globe.');
              setCesiumDiagnostics({ token: 'Configured', terrain: 'Failed', imagery: 'Fallback' });
            }
          }
        } catch (err) {
          console.error('Failed to initialize Cesium Viewer:', err);
          addLog('CRITICAL: Failed to mount 3D Visualization engine.');
        }
      }
    };

    initCesium();

    return () => {
      active = false;
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
        // Update Cesium Default Home View to point to the Ground Station
        Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(
          observer.longitude_deg - 15, // West
          observer.latitude_deg - 15,  // South
          observer.longitude_deg + 15, // East
          observer.latitude_deg + 15   // North
        );

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
              heightReference: HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            },
            label: {
              text: observer.name,
              font: '40px Inter, sans-serif',
              scale: 0.3,
              fillColor: Color.WHITE,
              outlineColor: Color.BLACK,
              outlineWidth: 3,
              style: LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: VerticalOrigin.BOTTOM,
              pixelOffset: new Cartesian2(0, -9),
              heightReference: HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY
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
            existing.label.font = (isActive ? '40px "Share Tech Mono", monospace' : '30px "Share Tech Mono", monospace') as any;
            existing.label.scale = 0.3 as any;
            if (isConjunctionTarget && !isActive) {
               existing.label.fillColor = isPrimary ? Color.CYAN.withAlpha(alpha) : Color.MAGENTA.withAlpha(alpha) as any;
            } else {
               existing.label.fillColor = Color.WHITE.withAlpha(alpha) as any;
            }
            existing.label.outlineColor = Color.BLACK.withAlpha(alpha) as any;
            existing.label.outlineWidth = (isActive ? 3 : 2) as any;
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
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              },
              label: {
                text: isActive ? `${obj.name} (NORAD: ${obj.norad_id})` : isConjunctionTarget ? `[CONJ] ${obj.name}` : obj.name,
                font: isActive ? '40px Inter, sans-serif' : '30px Inter, sans-serif',
                scale: 0.3,
                fillColor: isConjunctionTarget && !isActive ? (isPrimary ? Color.CYAN.withAlpha(alpha) : Color.MAGENTA.withAlpha(alpha)) : Color.WHITE.withAlpha(alpha),
                outlineColor: Color.BLACK.withAlpha(alpha),
                outlineWidth: isActive ? 3.0 : 2.0,
                style: LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: VerticalOrigin.BOTTOM,
                pixelOffset: isActive ? new Cartesian2(0, -12) : new Cartesian2(0, -8),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
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
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          label: {
            text: `[REPLAY] ${activeObject.name}`,
            font: '44px Inter, sans-serif',
            scale: 0.3,
            fillColor: Color.YELLOW,
            outlineColor: Color.BLACK,
            outlineWidth: 4,
            style: LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: new Cartesian2(0, -15),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
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
  // PERF: Register handler ONCE on mount, read ephemeris from refs to avoid
  // destroying/recreating ScreenSpaceEventHandler on every ephemeris update.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    // Avoid duplicate registration
    if (hoverHandlerRef.current) return;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    hoverHandlerRef.current = handler;
    const ghostId = 'ephemeris-hover-ghost';

    handler.setInputAction((movement: any) => {
      const pickedObject = viewer.scene.pick(movement.endPosition);
      if (pickedObject && pickedObject.id && (pickedObject.id.id === 'replay-orbit-path' || pickedObject.id.id === 'active-orbit-path')) {
        
        // Read from refs — always up-to-date, no stale closures
        const ephemeris = pickedObject.id.id === 'replay-orbit-path' ? replayEphemerisRef.current : activeEphemerisRef.current;
        if (!ephemeris || ephemeris.length === 0) return;

        // Find closest point in 2D, using 3D distance to camera to disambiguate crossings and back-of-earth
        let minCamDist = Infinity;
        let closestState = null;
        let closestPos3D = null;

        for (let i = 0; i < ephemeris.length; i++) {
          const state = ephemeris[i];
          const pos3D = cartesianFromGeodetic(state.latitude_deg, state.longitude_deg, state.altitude_km);
          const pos2D = SceneTransforms.worldToWindowCoordinates(viewer.scene, pos3D);
          if (pos2D) {
            const dist = Cartesian2.distance(pos2D, movement.endPosition);
            if (dist < 30) {
              const camDist = Cartesian3.distance(viewer.camera.position, pos3D);
              if (camDist < minCamDist) {
                minCamDist = camDist;
                closestState = state;
                closestPos3D = pos3D;
              }
            }
          }
        }

        if (closestState) {
          const existingGhost = viewer.entities.getById(ghostId);
          const timeStr = new Date(closestState.timestamp_utc).toISOString().substring(11, 19);
          const text = `T: ${timeStr}\nAlt: ${closestState.altitude_km.toFixed(1)} km`;
          
          if (existingGhost) {
            existingGhost.position = closestPos3D as any;
            if (existingGhost.label) {
              existingGhost.label.text = text as any;
              existingGhost.label.font = '40px "Share Tech Mono", monospace' as any;
              existingGhost.label.scale = 0.3 as any;
            }
          } else {
            viewer.entities.add({
              id: ghostId,
              position: closestPos3D as any,
              point: {
                pixelSize: 8,
                color: Color.CYAN,
                outlineColor: Color.WHITE,
                outlineWidth: 2,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
              },
              label: {
                text: text,
                font: '40px Inter, sans-serif',
                scale: 0.3,
                fillColor: Color.CYAN,
                outlineColor: Color.BLACK,
                outlineWidth: 3,
                style: LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: VerticalOrigin.BOTTOM,
                pixelOffset: new Cartesian2(0, -10),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
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
      if (hoverHandlerRef.current && !hoverHandlerRef.current.isDestroyed()) {
        hoverHandlerRef.current.destroy();
      }
      hoverHandlerRef.current = null;
      const existingGhost = viewerRef.current?.entities.getById(ghostId);
      if (existingGhost && viewerRef.current) viewerRef.current.entities.remove(existingGhost);
    };
  }, []); // PERF: Empty deps — register once, reads from refs

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
