import httpx
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import logging

from app.config import settings
from app.models.rso import RSOCatalog, TLERecord
from app.services.tle_parser import parse_tle_text, extract_norad_id, extract_epoch, extract_tle_orbital_fields
from app.services.classifier import classify_object_type, classify_category

logger = logging.getLogger(__name__)

SPACETRACK_LOGIN_URL = "https://www.space-track.org/ajaxauth/login"
SPACETRACK_BASE_URL = "https://www.space-track.org/basicspacedata/query"

def space_track_credentials_available() -> bool:
    """Check if Space-Track credentials are set in configuration."""
    return bool(settings.SPACETRACK_USERNAME and settings.SPACETRACK_PASSWORD)

def authenticate_spacetrack_client() -> httpx.Client:
    """
    Authenticate with Space-Track and return an active httpx.Client session.
    Never logs credentials. Returns controlled error if missing.
    """
    if not space_track_credentials_available():
        raise RuntimeError("Space-Track credentials are not available in the environment configuration.")

    client = httpx.Client(timeout=20.0)
    data = {
        "identity": settings.SPACETRACK_USERNAME,
        "password": settings.SPACETRACK_PASSWORD
    }
    
    response = client.post(SPACETRACK_LOGIN_URL, data=data)
    if response.status_code != 200 or "authError" in response.text or "auth/login" in response.url.path:
        # Avoid logging raw response to prevent credential leak
        raise RuntimeError("Failed to authenticate with Space-Track API.")
    
    return client

def fetch_spacetrack_latest_by_norad(db: Session, norad_id: int):
    """
    Fetch the latest GP data for a single NORAD ID from Space-Track,
    parse it, classify it, and ingest it into the local catalog.
    Uses 'Space-Track' as the source.
    """
    client = authenticate_spacetrack_client()
    try:
        url = f"{SPACETRACK_BASE_URL}/class/gp/NORAD_CAT_ID/{norad_id}/orderby/EPOCH desc/limit/1/format/tle"
        response = client.get(url)
        if response.status_code != 200:
            raise RuntimeError(f"Space-Track data request failed with status: {response.status_code}")
        
        raw_tle_data = response.text
        if not raw_tle_data.strip():
            raise RuntimeError(f"No GP data found for NORAD ID {norad_id}")
            
        parsed_entries = parse_tle_text(raw_tle_data)
        if not parsed_entries:
            raise RuntimeError(f"Failed to parse TLE data for NORAD ID {norad_id}")
            
        entry = parsed_entries[0]
        line1 = entry["line1"]
        line2 = entry["line2"]
        
        epoch = extract_epoch(line1)
        orbital_fields = extract_tle_orbital_fields(line1, line2)
        cospar_id = line1[9:17].strip() if len(line1) >= 17 else None
        
        # Classification
        # Group is not naturally available like Celestrak, we use "spacetrack"
        group = "spacetrack"
        object_type = classify_object_type(entry["name"], group)
        category = classify_category(entry["name"], group)
        
        # Upsert RSOCatalog
        rso = db.query(RSOCatalog).filter(RSOCatalog.norad_id == norad_id).first()
        if not rso:
            rso = RSOCatalog(
                norad_id=norad_id,
                name=entry["name"],
                object_type=object_type,
                category=category,
                source="Space-Track",
                source_group=group,
                cospar_id=cospar_id,
                last_updated=datetime.now(timezone.utc).replace(tzinfo=None)
            )
            db.add(rso)
        else:
            rso.name = entry["name"]
            rso.object_type = object_type
            rso.category = category
            rso.source_group = group
            rso.cospar_id = cospar_id
            rso.last_updated = datetime.now(timezone.utc).replace(tzinfo=None)
            # source remains untouched or set to Space-Track, but instructions say:
            # "Check if source exists. If so, just use source = "Space-Track" for ST and source = "CelesTrak" for CT. Do NOT duplicate data_source if source already exists."
            rso.source = "Space-Track"
            
        db.flush()
        
        # Upsert TLERecord to preserve norad_id + epoch constraint
        existing_tle = db.query(TLERecord).filter(
            TLERecord.norad_id == norad_id,
            TLERecord.epoch == epoch
        ).first()
        
        if not existing_tle:
            tle_record = TLERecord(
                norad_id=norad_id,
                name=entry["name"],
                line1=line1,
                line2=line2,
                epoch=epoch,
                source="Space-Track",
                source_group=group,
                ingested_at=datetime.now(timezone.utc).replace(tzinfo=None),
                **orbital_fields
            )
            db.add(tle_record)
        else:
            existing_tle.name = entry["name"]
            existing_tle.line1 = line1
            existing_tle.line2 = line2
            existing_tle.source_group = group
            existing_tle.source = "Space-Track"
            existing_tle.ingested_at = datetime.now(timezone.utc).replace(tzinfo=None)
            for key, val in orbital_fields.items():
                setattr(existing_tle, key, val)
                
        db.commit()
        
        return {
            "status": "success",
            "norad_id": norad_id,
            "epoch": epoch.isoformat(),
            "message": "Space-Track authenticated catalog GP data integration successful."
        }
    finally:
        client.close()
