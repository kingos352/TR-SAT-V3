from skyfield.api import EarthSatellite, wgs84, load
from app.schemas.visibility import VisibilityScreenRequest, VisibilityScreenResponse, VisibilityResultObject, ObserverLocation
from app.models.rso import RSOCatalog, TLERecord
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import math

ts = load.timescale()

def compute_object_aer_from_tle(tle_line1: str, tle_line2: str, lat: float, lon: float, elev: float, t_skyfield):
    satellite = EarthSatellite(tle_line1, tle_line2, 'Object', ts)
    observer_topos = wgs84.latlon(lat, lon, elevation_m=elev)
    difference = satellite - observer_topos
    topocentric = difference.at(t_skyfield)
    alt, az, distance = topocentric.altaz()
    return az.degrees, alt.degrees, distance.km

def classify_visibility(elevation_deg: float, min_elevation_deg: float, high_elevation_deg: float) -> str:
    if elevation_deg < 0:
        return "BELOW_HORIZON"
    elif 0 <= elevation_deg < min_elevation_deg:
        return "LOW"
    elif elevation_deg >= 75:
        return "OVERHEAD"
    elif elevation_deg >= high_elevation_deg:
        return "HIGH_ELEVATION"
    else:
        return "OBSERVABLE"

def find_current_visible_objects(req: VisibilityScreenRequest, db: Session) -> VisibilityScreenResponse:
    eval_time = req.timestamp_utc or datetime.now(timezone.utc)
    t_skyfield = ts.utc(eval_time.year, eval_time.month, eval_time.day, eval_time.hour, eval_time.minute, eval_time.second)
    
    query = db.query(RSOCatalog)
    if req.object_type:
        query = query.filter(RSOCatalog.object_type == req.object_type)
    if req.category:
        query = query.filter(RSOCatalog.category == req.category)
    if req.source:
        query = query.filter(RSOCatalog.source == req.source)
    if req.source_group:
        query = query.filter(RSOCatalog.source_group == req.source_group)
    if not req.include_debris:
        query = query.filter(RSOCatalog.object_type != 'DEBRIS')
        
    candidates = query.limit(req.max_candidates).all()
    
    results = []
    skipped_count = 0
    evaluated_count = 0
    warnings = []
    
    for rso in candidates:
        latest_tle = db.query(TLERecord).filter(TLERecord.norad_id == rso.norad_id).order_by(TLERecord.epoch.desc()).first()
        if not latest_tle:
            skipped_count += 1
            warnings.append(f"No TLE found for NORAD ID {rso.norad_id}")
            continue
            
        evaluated_count += 1
        try:
            az, el, rng = compute_object_aer_from_tle(
                latest_tle.line1, latest_tle.line2, 
                req.observer_latitude_deg, req.observer_longitude_deg, req.observer_elevation_m, 
                t_skyfield
            )
            
            if math.isnan(el) or math.isnan(az):
                skipped_count += 1
                warnings.append(f"Math error calculating AER for NORAD ID {rso.norad_id}")
                continue
                
            if el >= req.min_elevation_deg:
                tle_age_days = (eval_time.replace(tzinfo=None) - latest_tle.epoch).total_seconds() / 86400.0
                vis_class = classify_visibility(el, req.min_elevation_deg, req.high_elevation_deg)
                
                res_obj = VisibilityResultObject(
                    norad_id=str(rso.norad_id),
                    name=rso.name,
                    object_type=rso.object_type,
                    category=rso.category,
                    source=rso.source,
                    source_group=rso.source_group,
                    azimuth_deg=az,
                    elevation_deg=el,
                    range_km=rng,
                    visibility_class=vis_class,
                    reliability_status="RELIABLE" if tle_age_days < 7 else "DEGRADED",
                    tle_age_days=tle_age_days
                )
                results.append(res_obj)
        except Exception as e:
            skipped_count += 1
            warnings.append(f"Failed to process NORAD ID {rso.norad_id}: {str(e)}")
            
    results.sort(key=lambda x: x.elevation_deg, reverse=True)
    results = results[:req.limit]
    
    return VisibilityScreenResponse(
        timestamp_utc=eval_time,
        observer=ObserverLocation(
            latitude_deg=req.observer_latitude_deg,
            longitude_deg=req.observer_longitude_deg,
            elevation_m=req.observer_elevation_m
        ),
        returned_count=len(results),
        evaluated_count=evaluated_count,
        skipped_count=skipped_count,
        objects=results,
        warnings=warnings,
        disclaimer="Visibility is based on TLE/GP-derived SGP4 propagation and observer elevation geometry. It does not guarantee optical brightness or naked-eye visibility."
    )
