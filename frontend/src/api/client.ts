const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// --- TYPES ---

export interface HealthResponse {
  status: string;
  app: string;
  environment: string;
  database: string;
}

export interface TLERead {
  id: number;
  norad_id: number;
  name: string;
  line1: string;
  line2: string;
  epoch: string;
  inclination_deg?: number;
  raan_deg?: number;
  eccentricity?: number;
  arg_perigee_deg?: number;
  mean_anomaly_deg?: number;
  mean_motion_rev_per_day?: number;
  bstar?: number;
  source: string;
  source_group: string;
  ingested_at: string;
}

export interface CatalogObject {
  norad_id: number;
  name: string;
  object_type: string; // PAYLOAD, ROCKET_BODY, DEBRIS, UNKNOWN
  category: string;
  source: string;
  source_group: string;
  cospar_id?: string;
  last_updated: string;
  latest_tle?: TLERead;
}

export interface CatalogSyncResponse {
  group: string;
  fetched_count: number;
  parsed_count: number;
  inserted_objects: number;
  inserted_tles: number;
  updated_objects: number;
  skipped_count: number;
}

export interface SpaceTrackStatusResponse {
  is_configured: boolean;
  message: string;
}

export interface SpaceTrackAuthTestResponse {
  success: boolean;
  message: string;
}

export interface ECEFPosition {
  x_km: number;
  y_km: number;
  z_km: number;
}

export interface SatelliteState {
  name: string;
  timestamp_utc: string;
  latitude_deg: number;
  longitude_deg: number;
  altitude_km: number;
  ecef: ECEFPosition;
  tle_epoch_utc?: string;
  tle_age_days?: number;
  reliability_status: string; // FRESH, AGING, STALE, UNKNOWN
}

export interface ObserverAER {
  timestamp_utc: string;
  azimuth_deg: number;
  elevation_deg: number;
  range_km: number;
}

export interface PassWindow {
  aos_time_utc: string;
  max_time_utc: string;
  los_time_utc: string;
  max_elevation_deg: number;
  azimuth_aos_deg?: number;
  azimuth_max_deg?: number;
  azimuth_los_deg?: number;
  range_at_max_km?: number;
}

// --- CLIENT FUNCTIONS ---

/**
 * Handle API calls and return structured json or throw friendly messages.
 */
async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errText = await response.text();
      let msg = `HTTP error ${response.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.detail) {
          msg = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
        }
      } catch {
        if (errText) msg = errText;
      }
      throw new Error(msg);
    }
    return await response.json();
  } catch (error: any) {
    if (error instanceof TypeError && error.message.includes('failed to fetch')) {
      throw new Error('Connection refused. Ensure the backend FastAPI server is running at ' + API_BASE_URL);
    }
    throw error;
  }
}

export async function getHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>(`${API_BASE_URL}/api/v1/health`);
}

export async function syncCatalogGroup(group: string): Promise<CatalogSyncResponse> {
  return apiRequest<CatalogSyncResponse>(`${API_BASE_URL}/api/v1/catalog/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group }),
  });
}

export async function searchCatalog(params: {
  q?: string;
  group?: string;
  object_type?: string;
  category?: string;
  limit?: number;
}): Promise<CatalogObject[]> {
  const url = new URL(`${API_BASE_URL}/api/v1/catalog/search`);
  if (params.q) url.searchParams.append('q', params.q);
  if (params.group) url.searchParams.append('group', params.group);
  if (params.object_type && params.object_type !== 'ALL') {
    url.searchParams.append('object_type', params.object_type);
  }
  if (params.category && params.category !== 'ALL') {
    url.searchParams.append('category', params.category);
  }
  if (params.limit) url.searchParams.append('limit', params.limit.toString());

  return apiRequest<CatalogObject[]>(url.toString());
}

export async function getCatalogObject(noradId: number): Promise<CatalogObject> {
  return apiRequest<CatalogObject>(`${API_BASE_URL}/api/v1/catalog/${noradId}`);
}

export async function getCatalogState(payload: {
  norad_id: number;
  timestamp_utc: string;
}): Promise<SatelliteState> {
  return apiRequest<SatelliteState>(`${API_BASE_URL}/api/v1/propagation/catalog/state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getCatalogEphemeris(payload: {
  norad_id: number;
  start_time_utc: string;
  end_time_utc: string;
  step_seconds: number;
}): Promise<SatelliteState[]> {
  return apiRequest<SatelliteState[]>(`${API_BASE_URL}/api/v1/propagation/catalog/ephemeris`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getCatalogAER(payload: {
  norad_id: number;
  timestamp_utc: string;
  observer_latitude_deg: number;
  observer_longitude_deg: number;
  observer_elevation_m: number;
}): Promise<ObserverAER> {
  return apiRequest<ObserverAER>(`${API_BASE_URL}/api/v1/observer/catalog/aer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getCatalogPasses(payload: {
  norad_id: number;
  observer_latitude_deg: number;
  observer_longitude_deg: number;
  observer_elevation_m: number;
  start_time_utc: string;
  end_time_utc: string;
  min_elevation_deg: number;
}): Promise<PassWindow[]> {
  return apiRequest<PassWindow[]>(`${API_BASE_URL}/api/v1/observer/catalog/passes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// --- SPACE-TRACK ---

export async function getSpaceTrackStatus(): Promise<SpaceTrackStatusResponse> {
  return apiRequest<SpaceTrackStatusResponse>(`${API_BASE_URL}/api/v1/spacetrack/status`);
}

export async function testSpaceTrackAuth(): Promise<SpaceTrackAuthTestResponse> {
  return apiRequest<SpaceTrackAuthTestResponse>(`${API_BASE_URL}/api/v1/spacetrack/test-auth`, {
    method: 'POST',
  });
}

export async function syncSpaceTrackNorad(noradId: number): Promise<CatalogSyncResponse> {
  return apiRequest<CatalogSyncResponse>(`${API_BASE_URL}/api/v1/spacetrack/sync/norad/${noradId}`, {
    method: 'POST',
  });
}
