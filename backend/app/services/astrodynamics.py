from datetime import datetime, timezone, timedelta
import math
from typing import Optional, List
from skyfield.api import EarthSatellite, load, wgs84
from app.services.tle_parser import extract_epoch

# Initialize timescale offline to ensure local-first functionality without internet requests
ts = load.timescale(builtin=True)

def ensure_utc(dt: datetime) -> datetime:
    """
    Ensure the datetime object is timezone-aware and set to UTC.
    """
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def build_satellite_from_tle(name: Optional[str], line1: str, line2: str) -> EarthSatellite:
    """
    Build a Skyfield EarthSatellite object from TLE lines.
    """
    fallback_name = name if name else "OBJECT"
    return EarthSatellite(line1, line2, fallback_name, ts)

def get_tle_epoch_utc(line1: str) -> Optional[datetime]:
    """
    Extract TLE epoch and ensure it is in UTC.
    """
    try:
        epoch = extract_epoch(line1)
        return ensure_utc(epoch)
    except Exception:
        return None

def tle_age_days(line1: str, reference_dt: Optional[datetime] = None) -> Optional[float]:
    """
    Compute TLE age in days relative to a reference date.
    """
    epoch = get_tle_epoch_utc(line1)
    if epoch is None:
        return None
        
    ref = ensure_utc(reference_dt) if reference_dt else datetime.now(timezone.utc)
    delta = ref - epoch
    return delta.total_seconds() / 86400.0

def classify_tle_reliability(age_days: Optional[float]) -> str:
    """
    Classify TLE reliability status: FRESH, AGING, STALE, or UNKNOWN.
    """
    if age_days is None:
        return "UNKNOWN"
    if age_days <= 2.0:
        return "FRESH"
    if age_days <= 14.0:
        return "AGING"
    return "STALE"

def latlonalt_to_ecef(latitude_deg: float, longitude_deg: float, altitude_km: float) -> dict:
    """
    Convert geodetic coordinates to ECEF coordinates.
    NOTE: This uses a spherical approximation suitable for Cesium 3D visual mapping,
    not a high-precision ellipsoidal geodetic transformation.
    """
    R_EARTH_KM = 6378.137
    r = R_EARTH_KM + altitude_km
    lat_rad = math.radians(latitude_deg)
    lon_rad = math.radians(longitude_deg)
    
    x = r * math.cos(lat_rad) * math.cos(lon_rad)
    y = r * math.cos(lat_rad) * math.sin(lon_rad)
    z = r * math.sin(lat_rad)
    
    return {
        "x_km": x,
        "y_km": y,
        "z_km": z
    }

def propagate_state(name: Optional[str], line1: str, line2: str, timestamp_utc: datetime) -> dict:
    """
    Propagate the satellite position using SGP4/Skyfield.
    Transforms coordinates to subpoint and approximates ECEF position.
    """
    t_utc = ensure_utc(timestamp_utc)
    satellite = build_satellite_from_tle(name, line1, line2)
    
    t = ts.from_datetime(t_utc)
    geocentric = satellite.at(t)
    subpoint = wgs84.subpoint(geocentric)
    
    latitude_deg = subpoint.latitude.degrees
    longitude_deg = subpoint.longitude.degrees
    altitude_km = subpoint.elevation.km
    
    ecef = latlonalt_to_ecef(latitude_deg, longitude_deg, altitude_km)
    
    tle_epoch = get_tle_epoch_utc(line1)
    age = tle_age_days(line1, t_utc)
    reliability = classify_tle_reliability(age)
    
    return {
        "name": name if name else "OBJECT",
        "timestamp_utc": t_utc,
        "latitude_deg": latitude_deg,
        "longitude_deg": longitude_deg,
        "altitude_km": altitude_km,
        "ecef": ecef,
        "tle_epoch_utc": tle_epoch,
        "tle_age_days": age,
        "reliability_status": reliability
    }

def generate_ephemeris(
    name: Optional[str], 
    line1: str, 
    line2: str, 
    start_time_utc: datetime, 
    end_time_utc: datetime, 
    step_seconds: int = 60
) -> List[dict]:
    """
    Generate an ephemeris coordinate timeseries from start to end timestamps.
    Enforces a strict upper limit of 10000 points.
    """
    t_start = ensure_utc(start_time_utc)
    t_end = ensure_utc(end_time_utc)
    
    states = []
    current_time = t_start
    max_points = 10000
    
    while current_time <= t_end:
        states.append(propagate_state(name, line1, line2, current_time))
        current_time += timedelta(seconds=step_seconds)
        if len(states) >= max_points:
            break
            
    # Include end_time_utc if the stepping interval didn't land exactly on it
    if len(states) < max_points and (states[-1]["timestamp_utc"] - t_end).total_seconds() < -0.1:
        states.append(propagate_state(name, line1, line2, t_end))
        
    return states

def compute_observer_aer(
    name: Optional[str],
    line1: str,
    line2: str,
    timestamp_utc: datetime,
    observer_latitude_deg: float,
    observer_longitude_deg: float,
    observer_elevation_m: float = 0.0
) -> dict:
    """
    Compute topocentric Azimuth, Elevation, and Range (AER) of the satellite 
    relative to a WGS84 ground observer position.
    """
    t_utc = ensure_utc(timestamp_utc)
    satellite = build_satellite_from_tle(name, line1, line2)
    t = ts.from_datetime(t_utc)
    
    observer_topos = wgs84.latlon(
        observer_latitude_deg, 
        observer_longitude_deg, 
        elevation_m=observer_elevation_m
    )
    
    # Correct Skyfield relative vector formulation
    topocentric = (satellite - observer_topos).at(t)
    alt, az, distance = topocentric.altaz()
    
    return {
        "timestamp_utc": t_utc,
        "azimuth_deg": az.degrees,
        "elevation_deg": alt.degrees,
        "range_km": distance.km
    }
