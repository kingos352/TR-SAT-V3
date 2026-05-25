import React from 'react';
import { useConsoleStore } from '../../store/useConsoleStore';
import { useTranslation } from '../../i18n/useTranslation';

export const GlobeControlsPanel: React.FC = () => {
  const {
    activeObject,
    showOrbitPath, setShowOrbitPath,
    showGroundTrack, setShowGroundTrack,
    showObserver, setShowObserver,
    enableEarthLighting, setEnableEarthLighting,
    enableEarthRotation, setEnableEarthRotation,
    followActiveObject, setFollowActiveObject
  } = useConsoleStore();
  const { t } = useTranslation();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      fontSize: '11px',
      color: 'var(--text-bright)'
    }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input 
          type="checkbox" 
          checked={showOrbitPath} 
          onChange={(e) => setShowOrbitPath(e.target.checked)}
          style={{ accentColor: 'var(--accent-cyan)' }}
        />
        {t('globe.show_orbit_path')}
      </label>
      
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input 
          type="checkbox" 
          checked={showGroundTrack} 
          onChange={(e) => setShowGroundTrack(e.target.checked)}
          style={{ accentColor: 'var(--accent-cyan)' }}
        />
        {t('globe.show_ground_track')}
      </label>
      
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input 
          type="checkbox" 
          checked={showObserver} 
          onChange={(e) => setShowObserver(e.target.checked)}
          style={{ accentColor: 'var(--accent-cyan)' }}
        />
        {t('globe.show_observer_station')}
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px', marginTop: '2px' }}>
        <input 
          type="checkbox" 
          checked={enableEarthLighting} 
          onChange={(e) => setEnableEarthLighting(e.target.checked)}
          style={{ accentColor: 'var(--accent-orange)' }}
        />
        {t('globe.earth_sun_lighting')}
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input 
          type="checkbox" 
          checked={enableEarthRotation} 
          onChange={(e) => setEnableEarthRotation(e.target.checked)}
          style={{ accentColor: 'var(--accent-orange)' }}
        />
        {t('globe.real_time_earth_rotation')}
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
        {t('globe.camera_lock_follow')}
      </label>
    </div>
  );
};
