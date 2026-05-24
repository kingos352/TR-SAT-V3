from datetime import datetime
from typing import List, Dict, Any, Optional
from skyfield.api import wgs84
from app.services.astrodynamics import build_satellite_from_tle, ensure_utc, ts

def predict_passes_from_tle(
    name: Optional[str],
    line1: str,
    line2: str,
    observer_latitude_deg: float,
    observer_longitude_deg: float,
    observer_elevation_m: float,
    start_time_utc: datetime,
    end_time_utc: datetime,
    min_elevation_deg: float = 10.0
) -> List[Dict[str, Any]]:
    """
    Predict visibility passes for a satellite relative to an observer location.
    Uses Skyfield's analytical find_events method and groups rise/culminate/set events.
    """
    t_start = ts.from_datetime(ensure_utc(start_time_utc))
    t_end = ts.from_datetime(ensure_utc(end_time_utc))
    
    satellite = build_satellite_from_tle(name, line1, line2)
    observer_topos = wgs84.latlon(
        observer_latitude_deg, 
        observer_longitude_deg, 
        elevation_m=observer_elevation_m
    )
    
    t_events, event_types = satellite.find_events(
        observer_topos, t_start, t_end, altitude_degrees=min_elevation_deg
    )
    
    passes = []
    current_pass = {}
    
    for t, event_type in zip(t_events, event_types):
        if event_type == 0:  # Rise (AOS)
            current_pass = {
                "aos_time": t.utc_datetime()
            }
        elif event_type == 1:  # Culminate (Max Elevation)
            if "aos_time" in current_pass:
                current_pass["max_time"] = t.utc_datetime()
        elif event_type == 2:  # Set (LOS)
            if "aos_time" in current_pass and "max_time" in current_pass:
                current_pass["los_time"] = t.utc_datetime()
                
                # Fetch Time objects for each key event point
                t_aos = ts.from_datetime(current_pass["aos_time"])
                t_max = ts.from_datetime(current_pass["max_time"])
                t_los = ts.from_datetime(current_pass["los_time"])
                
                # Compute coordinates at AOS
                topocentric_aos = (satellite - observer_topos).at(t_aos)
                _, az_aos, _ = topocentric_aos.altaz()
                
                # Compute coordinates at MAX
                topocentric_max = (satellite - observer_topos).at(t_max)
                alt_max, az_max, dist_max = topocentric_max.altaz()
                
                # Compute coordinates at LOS
                topocentric_los = (satellite - observer_topos).at(t_los)
                _, az_los, _ = topocentric_los.altaz()
                
                passes.append({
                    "aos_time_utc": current_pass["aos_time"],
                    "max_time_utc": current_pass["max_time"],
                    "los_time_utc": current_pass["los_time"],
                    "max_elevation_deg": alt_max.degrees,
                    "azimuth_aos_deg": az_aos.degrees,
                    "azimuth_max_deg": az_max.degrees,
                    "azimuth_los_deg": az_los.degrees,
                    "range_at_max_km": dist_max.km
                })
                
            current_pass = {}  # Reset state machine
            
    return passes
