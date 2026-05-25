import React, { useEffect, useState } from 'react';
import { useConsoleStore } from '../../store/useConsoleStore';
import { getHealth, API_BASE_URL } from '../../api/client';
import { useTranslation } from '../../i18n/useTranslation';

const StatusBarInner: React.FC = () => {
  const [utcTime, setUtcTime] = useState<string>('');
  const apiStatus = useConsoleStore(s => s.apiStatus);
  const setApiStatus = useConsoleStore(s => s.setApiStatus);
  const selectedObjects = useConsoleStore(s => s.selectedObjects);
  const activeObject = useConsoleStore(s => s.activeObject);
  const observer = useConsoleStore(s => s.observer);
  const addLog = useConsoleStore(s => s.addLog);
  const liveTrackingEnabled = useConsoleStore(s => s.liveTrackingEnabled);
  const liveConnectionStatus = useConsoleStore(s => s.liveConnectionStatus);
  const liveRateHz = useConsoleStore(s => s.liveRateHz);
  const lastTelemetryFrameUtc = useConsoleStore(s => s.lastTelemetryFrameUtc);
  const language = useConsoleStore(s => s.language);
  const setLanguage = useConsoleStore(s => s.setLanguage);
  
  const { t } = useTranslation();
  const isTr = language === 'tr';

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsData, setSettingsData] = useState({
    cesium_token: '',
    spacetrack_user: '',
    spacetrack_password: '',
    ai_key: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    if (showSettingsModal) {
      const fetchConfig = async () => {
        try {
          const resp = await fetch(`${API_BASE_URL}/api/v1/config/current`);
          if (resp.ok) {
            const data = await resp.json();
            setSettingsData({
              cesium_token: data.cesium_token || '',
              spacetrack_user: data.spacetrack_user || '',
              spacetrack_password: data.spacetrack_password || '',
              ai_key: data.ai_key || ''
            });
          }
        } catch (err) {
          console.error('Failed to load current config', err);
        }
      };
      fetchConfig();
    }
  }, [showSettingsModal]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/config/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });
      if (!resp.ok) {
        throw new Error(isTr ? 'Ayarlar kaydedilemedi.' : 'Failed to save settings.');
      }
      addLog(isTr ? 'Sistem: Ayarlar başarıyla güncellendi. Yeniden başlatılıyor...' : 'System: Settings successfully updated. Restarting...');
      window.location.reload();
    } catch (err: any) {
      setSettingsError(err.message);
      setSettingsLoading(false);
    }
  };

  // Dynamic ticking UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll backend health status
  useEffect(() => {
    let active = true;
    const checkConnection = async () => {
      try {
        await getHealth();
        if (active) {
          if (apiStatus !== 'connected') {
            setApiStatus('connected');
            addLog('System: Backend API connected successfully.');
          }
        }
      } catch (err: any) {
        if (active) {
          if (apiStatus !== 'disconnected') {
            setApiStatus('disconnected', err.message);
            addLog(`CRITICAL: Backend API disconnected. Retrying... (${err.message})`);
          }
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [apiStatus, setApiStatus, addLog]);



  return (
    <header className="glass-panel" style={{
      gridArea: 'header',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px 0 0px',
      height: '60px',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      borderBottom: '1px solid var(--border-color)',
      borderRadius: '0',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/TR_SAT.png" alt="TR-SAT Logo" style={{ 
            height: '60px', 
            objectFit: 'contain', 
            transform: 'scale(2.2)', 
            transformOrigin: 'left center', 
            marginLeft: '15px' 
          }} />
        </div>


      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '13px' }}>
        {/* Dynamic UTC clock */}
        <div className="mono-text" style={{ color: 'var(--text-bright)', letterSpacing: '0.1em' }}>
          {utcTime}
        </div>

        {/* Selected satellites count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-muted)' }}>{t('status_bar.selected')}</span>
          <span className="mono-text" style={{ 
            color: selectedObjects.length > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontWeight: 600
          }}>
            {selectedObjects.length}/20
          </span>
        </div>

        {/* Active tracking satellite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-muted)' }}>{t('status_bar.active')}</span>
          <span className="mono-text" style={{ 
            color: activeObject ? 'var(--accent-green)' : 'var(--accent-red)',
            fontWeight: 600
          }}>
            {activeObject ? `${activeObject.name} (${activeObject.norad_id})` : t('status_bar.none')}
          </span>
        </div>

        {/* Observer Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-muted)' }}>{t('status_bar.station')}</span>
          <span className="mono-text" style={{ color: 'var(--text-bright)' }}>
            {observer.name}
          </span>
        </div>

        {/* Live tracking status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid var(--border-color)', paddingRight: '16px' }}>
          <span style={{ color: 'var(--text-muted)' }}>{t('status_bar.live_tracking')}</span>
          <span className={`status-indicator ${
            !liveTrackingEnabled ? 'status-muted' :
            liveConnectionStatus === 'LIVE' ? 'status-ok' : 
            liveConnectionStatus === 'PAUSED' ? 'status-warning' : 'status-error'
          }`} style={!liveTrackingEnabled ? { backgroundColor: 'rgba(75, 85, 99, 0.5)', boxShadow: 'none' } : undefined} />
          <span className="mono-text" style={{ 
            fontSize: '11px', 
            textTransform: 'uppercase',
            color: !liveTrackingEnabled ? 'var(--text-muted)' :
                   liveConnectionStatus === 'LIVE' ? 'var(--accent-green)' : 
                   liveConnectionStatus === 'PAUSED' ? 'var(--accent-orange)' : 'var(--accent-red)',
            fontWeight: 600
          }}>
            {!liveTrackingEnabled ? t('system.offline') : liveConnectionStatus === 'LIVE' ? `LIVE (${liveRateHz}Hz)` : liveConnectionStatus}
          </span>
          {liveTrackingEnabled && lastTelemetryFrameUtc && (
            <span className="mono-text" style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '4px' }}>
              [{lastTelemetryFrameUtc.substring(11, 19)}]
            </span>
          )}
        </div>

        {/* Connection status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`status-indicator ${
            apiStatus === 'connected' ? 'status-ok' : 
            apiStatus === 'checking' ? 'status-warning' : 'status-error'
          }`} />
          <span className="mono-text" style={{ 
            fontSize: '11px', 
            textTransform: 'uppercase',
            color: apiStatus === 'connected' ? 'var(--accent-green)' : 
                   apiStatus === 'checking' ? 'var(--accent-orange)' : 'var(--accent-red)',
            fontWeight: 600
          }}>
            {apiStatus === 'connected' ? t('system.online') : apiStatus === 'checking' ? t('status_bar.checking') : t('system.offline')}
          </span>
        </div>

        {/* Language Toggle */}
        <div 
          onClick={() => setLanguage(language === 'en' ? 'tr' : 'en')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer',
            padding: '4px 8px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            gap: '6px'
          }}
          title={language === 'en' ? "Switch to Turkish" : "İngilizce'ye Geç"}
        >
          <span style={{ fontSize: '14px' }}>🌐</span>
          <span className="mono-text" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-bright)' }}>
            {language.toUpperCase()}
          </span>
        </div>

        {/* Settings Toggle */}
        <div 
          onClick={() => setShowSettingsModal(true)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer',
            padding: '4px 8px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            gap: '6px'
          }}
          title={language === 'en' ? "System Settings" : "Sistem Ayarları"}
        >
          <span style={{ fontSize: '14px' }}>⚙️</span>
        </div>
      </div>

      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(5, 8, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '500px',
            padding: '30px',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            backgroundColor: '#0a0d1e',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>⚙️ {isTr ? 'Sistem Ayarları' : 'System Settings'}</span>
              <button 
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </h2>

            {settingsError && (
              <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', borderRadius: '6px', color: 'var(--accent-red)', fontSize: '12px', marginBottom: '15px' }}>
                {settingsError}
              </div>
            )}

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cesium ION Token *</label>
                <input 
                  type="text" 
                  value={settingsData.cesium_token}
                  onChange={e => setSettingsData({ ...settingsData, cesium_token: e.target.value })}
                  required
                  style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontSize: '12px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SpaceTrack Username *</label>
                <input 
                  type="text" 
                  value={settingsData.spacetrack_user}
                  onChange={e => setSettingsData({ ...settingsData, spacetrack_user: e.target.value })}
                  required
                  style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontSize: '12px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SpaceTrack Password *</label>
                <input 
                  type="password" 
                  value={settingsData.spacetrack_password}
                  onChange={e => setSettingsData({ ...settingsData, spacetrack_password: e.target.value })}
                  required
                  style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontSize: '12px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AI Key (Gemini - Optional)</label>
                <input 
                  type="password" 
                  value={settingsData.ai_key}
                  onChange={e => setSettingsData({ ...settingsData, ai_key: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontSize: '12px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowSettingsModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-bright)', cursor: 'pointer', fontSize: '12px' }}
                >
                  {isTr ? 'İptal' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  disabled={settingsLoading}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--accent-cyan)', color: 'var(--bg-space-dark)', fontWeight: 600, cursor: settingsLoading ? 'wait' : 'pointer', fontSize: '12px' }}
                >
                  {settingsLoading ? (isTr ? 'Kaydediliyor...' : 'Saving...') : (isTr ? 'Kaydet' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export const StatusBar = React.memo(StatusBarInner);
