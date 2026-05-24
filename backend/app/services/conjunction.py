import time
from datetime import datetime, timezone, timedelta
from typing import List, Tuple, Dict, Any, Optional
import numpy as np
from sqlalchemy.orm import Session

from app.models.rso import TLERecord
from app.services.catalog_lookup import get_latest_tle_for_norad
from app.schemas.conjunction import ConjunctionScreenRequest, ConjunctionResult, ConjunctionScreenResponse
from app.services.astrodynamics import build_satellite_from_tle, ts

def get_all_latest_tles(db: Session) -> Dict[int, TLERecord]:
    """Retrieve the latest TLE for all cataloged objects."""
    # This might be heavy in a real DB, but we do our best here
    tles = db.query(TLERecord).order_by(TLERecord.epoch.desc()).all()
    catalog = {}
    for t in tles:
        if t.norad_id not in catalog:
            catalog[t.norad_id] = t
    return catalog

def ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def classify_severity(miss_distance_km: float) -> str:
    if miss_distance_km < 1.0:
        return "CRITICAL_CANDIDATE"
    elif miss_distance_km < 10.0:
        return "CLOSE"
    elif miss_distance_km < 50.0:
        return "WATCH"
    else:
        return "INFO"

def screen_conjunctions(db: Session, request: ConjunctionScreenRequest) -> ConjunctionScreenResponse:
    start_cpu = time.perf_counter()

    start_t = ensure_utc(request.start_time)
    end_t = ensure_utc(request.end_time)

    # 1. Gather TLEs
    primaries: Dict[int, TLERecord] = {}
    secondaries: Dict[int, TLERecord] = {}

    if request.mode == "selected_vs_selected":
        for pid in request.primary_norad_ids:
            tle = get_latest_tle_for_norad(db, pid)
            if tle:
                primaries[pid] = tle
        if request.secondary_norad_ids:
            for sid in request.secondary_norad_ids:
                tle = get_latest_tle_for_norad(db, sid)
                if tle:
                    secondaries[sid] = tle
    elif request.mode == "primary_vs_catalog":
        all_tles = get_all_latest_tles(db)
        for pid in request.primary_norad_ids:
            if pid in all_tles:
                primaries[pid] = all_tles[pid]
        
        for sid, tle in all_tles.items():
            if sid not in primaries:
                secondaries[sid] = tle
    
    # 2. Build Satellites
    primary_sats = {pid: build_satellite_from_tle(None, tle.line1, tle.line2) for pid, tle in primaries.items()}
    secondary_sats = {sid: build_satellite_from_tle(None, tle.line1, tle.line2) for sid, tle in secondaries.items()}

    # 3. Create time arrays for coarse screening
    duration_s = (end_t - start_t).total_seconds()
    coarse_steps = int(duration_s / request.coarse_step_seconds) + 1
    
    coarse_times = [start_t + timedelta(seconds=i * request.coarse_step_seconds) for i in range(coarse_steps)]
    t_coarse = ts.from_datetimes(coarse_times)

    results = []

    # 4. Screen
    # To prevent huge matrices, we iterate pairs
    pairs_evaluated = 0

    for pid, p_sat in primary_sats.items():
        # Compute primary positions over coarse grid
        p_geocentric = p_sat.at(t_coarse)
        p_pos = p_geocentric.position.km # shape (3, N)

        for sid, s_sat in secondary_sats.items():
            if pid == sid:
                continue

            # Compute secondary positions
            s_geocentric = s_sat.at(t_coarse)
            s_pos = s_geocentric.position.km # shape (3, N)

            # Distances
            diff = p_pos - s_pos
            distances = np.linalg.norm(diff, axis=0) # shape (N,)
            min_dist_idx = np.argmin(distances)
            min_dist_coarse = distances[min_dist_idx]

            # If coarse distance < 200 km, we refine
            if min_dist_coarse < 200.0:
                # Refine phase
                # Create a refine window around the coarse minimum
                refine_center = coarse_times[min_dist_idx]
                refine_start = max(start_t, refine_center - timedelta(seconds=request.coarse_step_seconds))
                refine_end = min(end_t, refine_center + timedelta(seconds=request.coarse_step_seconds))
                
                ref_duration = (refine_end - refine_start).total_seconds()
                ref_steps = int(ref_duration / request.refine_step_seconds) + 1
                refine_times = [refine_start + timedelta(seconds=i * request.refine_step_seconds) for i in range(ref_steps)]
                
                if not refine_times:
                    continue
                    
                t_refine = ts.from_datetimes(refine_times)
                p_geocentric_ref = p_sat.at(t_refine)
                s_geocentric_ref = s_sat.at(t_refine)
                
                p_pos_ref = p_geocentric_ref.position.km
                s_pos_ref = s_geocentric_ref.position.km
                
                diff_ref = p_pos_ref - s_pos_ref
                dist_ref = np.linalg.norm(diff_ref, axis=0)
                
                min_idx_ref = np.argmin(dist_ref)
                tca = refine_times[min_idx_ref]
                tca_dist = float(dist_ref[min_idx_ref])
                
                severity = classify_severity(tca_dist)
                
                # Fetch exact TCA state
                tca_t = ts.from_datetime(tca)
                p_tca_geo = p_sat.at(tca_t)
                s_tca_geo = s_sat.at(tca_t)
                
                p_p = p_tca_geo.position.km
                s_p = s_tca_geo.position.km
                p_v = p_tca_geo.velocity.km_per_s
                s_v = s_tca_geo.velocity.km_per_s
                
                res = ConjunctionResult(
                    primary_norad_id=pid,
                    secondary_norad_id=sid,
                    tca_time=tca,
                    miss_distance_km=tca_dist,
                    severity=severity,
                    primary_position_km=[float(x) for x in p_p],
                    secondary_position_km=[float(x) for x in s_p],
                    primary_velocity_km_per_s=[float(x) for x in p_v],
                    secondary_velocity_km_per_s=[float(x) for x in s_v]
                )
                results.append(res)
            
            pairs_evaluated += 1
            if pairs_evaluated >= request.max_candidates:
                break
        if pairs_evaluated >= request.max_candidates:
            break

    # Sort and limit to 100
    results.sort(key=lambda x: x.miss_distance_km)
    results = results[:100]

    end_cpu = time.perf_counter()
    computation_time_ms = (end_cpu - start_cpu) * 1000.0

    disclaimer = "Conjunction Screening uses TLE/GP-based SGP4 propagation and geometric miss-distance evaluation. It does not compute collision probability because public TLE/GP data does not include covariance."

    return ConjunctionScreenResponse(
        disclaimer=disclaimer,
        mode=request.mode,
        results=results,
        computation_time_ms=computation_time_ms
    )
