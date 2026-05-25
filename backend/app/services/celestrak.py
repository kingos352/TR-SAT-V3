import httpx
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.rso import RSOCatalog, TLERecord
from app.services.tle_parser import parse_tle_text, extract_norad_id, extract_epoch, extract_tle_orbital_fields
from app.services.classifier import classify_object_type, classify_category
from app.schemas.rso import CatalogSyncResponse

CELESTRAK_BASE_URL = "https://celestrak.org/NORAD/elements/gp.php"

# Supported group identifiers in CelesTrak Elements
SUPPORTED_GROUPS = [
    "active",
    "stations",
    "visual",
    "geo",
    "weather",
    "noaa",
    "gps-ops",
    "galileo",
    "starlink",
    "oneweb",
    "science",
    "debris"
]

def build_celestrak_url(group: str) -> str:
    """
    Construct URL to query specific CelesTrak GP element groupings.
    """
    if group not in SUPPORTED_GROUPS:
        raise ValueError(f"Group '{group}' is not supported by TR-SAT CelesTrak client.")
    return f"{CELESTRAK_BASE_URL}?GROUP={group}&FORMAT=tle"

def fetch_celestrak_group(group: str, timeout_seconds: int = 20) -> str:
    """
    Fetch raw TLE stream from CelesTrak API using httpx.
    """
    url = build_celestrak_url(group)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    response = httpx.get(url, headers=headers, timeout=timeout_seconds)
    if response.status_code == 403 and "has not updated" in response.text:
        raise ValueError(
            "CelesTrak rate limit: Data has not updated since your last download. "
            "CelesTrak elements are updated once every 2 hours. Please try again later."
        )
    if response.status_code != 200:
        raise RuntimeError(f"CelesTrak request failed with status: {response.status_code}")
    return response.text

def ingest_celestrak_group(db: Session, group: str) -> CatalogSyncResponse:
    """
    Query CelesTrak elements, parse parameters, classify, and persist to SQLite.
    """
    raw_tle_data = fetch_celestrak_group(group)
    parsed_entries = parse_tle_text(raw_tle_data)
    
    fetched_count = len(parsed_entries)
    parsed_count = 0
    inserted_objects = 0
    updated_objects = 0
    inserted_tles = 0
    skipped_count = 0

    for entry in parsed_entries:
        try:
            line1 = entry["line1"]
            line2 = entry["line2"]
            
            norad_id = extract_norad_id(line1)
            epoch = extract_epoch(line1)
            orbital_fields = extract_tle_orbital_fields(line1, line2)
            
            # Extract COSPAR ID from Line 1 (cols 9-16)
            cospar_id = line1[9:17].strip() if len(line1) >= 17 else None
            
            # Classification
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
                    source="CelesTrak",
                    source_group=group,
                    cospar_id=cospar_id,
                    last_updated=datetime.now(timezone.utc).replace(tzinfo=None)
                )
                db.add(rso)
                inserted_objects += 1
            else:
                rso.name = entry["name"]
                rso.object_type = object_type
                rso.category = category
                rso.source_group = group
                rso.cospar_id = cospar_id
                rso.last_updated = datetime.now(timezone.utc).replace(tzinfo=None)
                updated_objects += 1
            
            # Flush catalog insertion so FK is valid
            db.flush()
            
            # Upsert TLERecord to prevent duplicates on same norad_id + epoch
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
                    source="CelesTrak",
                    source_group=group,
                    ingested_at=datetime.now(timezone.utc).replace(tzinfo=None),
                    **orbital_fields
                )
                db.add(tle_record)
                inserted_tles += 1
            else:
                # Update metadata for existing TLE
                existing_tle.name = entry["name"]
                existing_tle.line1 = line1
                existing_tle.line2 = line2
                existing_tle.source_group = group
                existing_tle.ingested_at = datetime.now(timezone.utc).replace(tzinfo=None)
                for key, val in orbital_fields.items():
                    setattr(existing_tle, key, val)
            
            parsed_count += 1
        except Exception as e:
            # Skip invalid lines
            skipped_count += 1
            continue
            
    # Commit changes
    db.commit()

    return CatalogSyncResponse(
        group=group,
        fetched_count=fetched_count,
        parsed_count=parsed_count,
        inserted_objects=inserted_objects,
        inserted_tles=inserted_tles,
        updated_objects=updated_objects,
        skipped_count=skipped_count
    )
