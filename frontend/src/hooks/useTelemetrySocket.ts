import { useEffect, useRef, useCallback } from 'react';
import { useConsoleStore } from '../store/useConsoleStore';
import { SatelliteState } from '../api/client';

const WS_ENDPOINT = "/api/v1/ws/telemetry";

function buildWsUrl() {
  const explicit = import.meta.env.VITE_WS_BASE_URL;
  if (explicit) {
    return `${explicit.replace(/\/$/, "")}${WS_ENDPOINT}`;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
  const wsBase = apiBase
    .replace(/^https:\/\//, "wss://")
    .replace(/^http:\/\//, "ws://")
    .replace(/\/$/, "");

  return `${wsBase}${WS_ENDPOINT}`;
}

const WS_URL = buildWsUrl();

export const useTelemetrySocket = () => {
  const socketRef = useRef<WebSocket | null>(null);
  
  const {
    selectedObjects,
    activeObject,
    setActiveState,
    liveTrackingEnabled,
    liveRateHz,
    setLiveConnectionStatus,
    setLiveObjectStates,
    setLastTelemetryFrameUtc,
    setLiveErrors,
    addLog
  } = useConsoleStore();

  // Create refs to hold the latest state values for stable socket callbacks
  const stateRef = useRef({
    selectedObjects,
    activeObject,
    liveTrackingEnabled,
    liveRateHz
  });

  // Sync state values on every render
  useEffect(() => {
    stateRef.current = {
      selectedObjects,
      activeObject,
      liveTrackingEnabled,
      liveRateHz
    };
  });

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      addLog('System WebSocket: Closing connection...');
      socketRef.current.close();
      socketRef.current = null;
    }
    setLiveConnectionStatus('DISCONNECTED');
  }, [addLog, setLiveConnectionStatus]);

  const connect = useCallback(() => {
    // Prevent reconnect loops: do not close and reopen if already CONNECTING or OPEN
    if (socketRef.current) {
      const state = socketRef.current.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
        console.log("[TR-SAT WS] Connection request ignored: Socket is already OPEN or CONNECTING.");
        return;
      }
      socketRef.current.close();
      socketRef.current = null;
    }

    const objects = stateRef.current.selectedObjects;
    if (objects.length < 1 || objects.length > 20) {
      addLog('System WebSocket: Cannot connect. Must select between 1 and 20 targets.');
      setLiveConnectionStatus('ERROR');
      setLiveErrors(['Must select between 1 and 20 objects to start live tracking.']);
      return;
    }

    const url = WS_URL;
    console.log("[TR-SAT WS] connecting to", url);
    addLog(`System WebSocket: Opening telemetry stream channel...`);
    setLiveConnectionStatus('CONNECTING');
    setLiveErrors([]); // Clear previous errors
    
    let hasError = false;

    try {
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("[TR-SAT WS] open");
        addLog('System WebSocket: Stream channel connected.');
        setLiveConnectionStatus('LIVE');
        
        // Auto-subscribe using latest values from ref
        const { selectedObjects: currentObjects, liveRateHz: rate } = stateRef.current;
        if (currentObjects.length > 0 && currentObjects.length <= 20) {
          const ids = currentObjects.map(o => o.norad_id);
          ws.send(JSON.stringify({
            action: 'subscribe',
            norad_ids: ids,
            rate_hz: rate
          }));
          addLog(`System WebSocket: Subscribed to ${ids.length} selected objects.`);
        }
      };

      ws.onmessage = (event) => {
        try {
          const frame = JSON.parse(event.data);
          
          if (frame.type === 'telemetry_frame') {
            setLastTelemetryFrameUtc(frame.timestamp_utc);
            
            // Map list to Record<norad_id, SatelliteState>
            const stateMap: Record<number, SatelliteState> = {};
            frame.objects.forEach((obj: any) => {
              stateMap[obj.norad_id] = {
                name: obj.name,
                timestamp_utc: obj.timestamp_utc,
                latitude_deg: obj.latitude_deg,
                longitude_deg: obj.longitude_deg,
                altitude_km: obj.altitude_km,
                ecef: obj.ecef,
                tle_epoch_utc: obj.tle_epoch_utc,
                tle_age_days: obj.tle_age_days,
                reliability_status: obj.reliability_status
              };
            });
            
            setLiveObjectStates(stateMap);
            setLiveErrors(frame.errors || []);
            
            // Update active state if the active object is in this frame
            const currentActive = stateRef.current.activeObject;
            if (currentActive && stateMap[currentActive.norad_id]) {
              setActiveState(stateMap[currentActive.norad_id]);
            }
          } else if (frame.type === 'status') {
            if (frame.status === 'paused') {
              setLiveConnectionStatus('PAUSED');
            } else if (frame.status === 'resumed' || frame.status === 'connected') {
              setLiveConnectionStatus('LIVE');
            } else if (frame.status === 'stopped') {
              setLiveConnectionStatus('DISCONNECTED');
            }
          } else if (frame.type === 'error') {
            addLog(`API ERROR Frame: ${frame.message}`);
            if (frame.details && frame.details.missing_ids) {
              addLog(`Missing NORAD IDs: ${frame.details.missing_ids.join(', ')}`);
            }
          }
        } catch (err: any) {
          console.error('Failed to parse websocket frame:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        hasError = true;
        setLiveConnectionStatus('ERROR');
        setLiveErrors(['CRITICAL: WebSocket connection failure. Ensure the backend is running at ' + WS_URL]);
        addLog('CRITICAL: WebSocket connection failure.');
      };

      ws.onclose = () => {
        if (!hasError) {
          setLiveConnectionStatus('DISCONNECTED');
        }
        addLog('System WebSocket: Connection closed.');
      };

    } catch (e: any) {
      console.error('WebSocket Connection exception:', e);
      hasError = true;
      setLiveConnectionStatus('ERROR');
      setLiveErrors([`CRITICAL: Failed to connect WebSocket (${e.message})`]);
      addLog(`CRITICAL: Failed to connect WebSocket (${e.message})`);
    }
  }, [
    setLiveConnectionStatus,
    setLiveObjectStates,
    setLastTelemetryFrameUtc,
    setLiveErrors,
    setActiveState,
    addLog
  ]);

  // Handle subscribe changes
  const subscribe = useCallback((noradIds: number[], rateHz: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        action: 'subscribe',
        norad_ids: noradIds,
        rate_hz: rateHz
      }));
      addLog(`System WebSocket: Subscribing to ${noradIds.length} target(s) at ${rateHz} Hz.`);
    } else {
      connect();
    }
  }, [connect, addLog]);

  // Pause stream
  const pause = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: 'pause' }));
      addLog('System WebSocket: Pausing stream updates.');
    }
  }, [addLog]);

  // Resume stream
  const resume = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: 'resume' }));
      addLog('System WebSocket: Resuming stream updates.');
    }
  }, [addLog]);

  // Stop stream
  const stop = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: 'stop' }));
      addLog('System WebSocket: Stopping stream.');
    }
  }, [addLog]);

  // Automatically handle synchronization when selected objects or rate changes
  useEffect(() => {
    if (liveTrackingEnabled && selectedObjects.length > 0) {
      const ids = selectedObjects.map(o => o.norad_id);
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          action: 'update',
          norad_ids: ids,
          rate_hz: liveRateHz
        }));
      }
    } else if (liveTrackingEnabled && selectedObjects.length === 0) {
      stop();
      disconnect();
    }
  }, [selectedObjects, liveRateHz, liveTrackingEnabled, stop, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    connect,
    disconnect,
    subscribe,
    pause,
    resume,
    stop
  };
};
