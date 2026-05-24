import React, { useEffect, useRef } from 'react';
import { Viewer, Ion } from 'cesium';
import { useConsoleStore } from '../../store/useConsoleStore';
import 'cesium/Source/Widgets/widgets.css';

export const CesiumViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const setCesiumTokenMissing = useConsoleStore((state) => state.setCesiumTokenMissing);
  const addSystemLog = useConsoleStore((state) => state.addSystemLog);

  useEffect(() => {
    const token = import.meta.env.VITE_CESIUM_ION_TOKEN || '';
    
    if (token && token.trim().length > 0) {
      Ion.defaultAccessToken = token;
      setCesiumTokenMissing(false);
      addSystemLog('System: Cesium Ion credentials applied successfully.');
    } else {
      setCesiumTokenMissing(true);
      addSystemLog('Warning: Cesium Ion token missing. Initializing fallback globe view.');
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
        addSystemLog('System: 3D Visualization engine mounted.');
      } catch (err) {
        console.error('Failed to initialize Cesium Viewer:', err);
        addSystemLog('CRITICAL: Failed to mount 3D Visualization engine.');
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
  }, [setCesiumTokenMissing, addSystemLog]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
