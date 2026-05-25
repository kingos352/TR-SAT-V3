import React, { useEffect, useState } from 'react';
import { useConsoleStore } from '../../store/useConsoleStore';
import { getHealth } from '../../api/client';
import { useTranslation } from '../../i18n/useTranslation';

export const StatusBar: React.FC = () => {
  const [utcTime, setUtcTime] = useState<string>('');
  const { 
    apiStatus, 
    setApiStatus, 
    selectedObjects, 
    activeObject, 
    observer, 
    addLog,
    liveTrackingEnabled,
    liveConnectionStatus,
    liveRateHz,
    lastTelemetryFrameUtc,
    language,
    setLanguage
  } = useConsoleStore();
  
  const { t } = useTranslation();

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
      </div>
    </header>
  );
};
