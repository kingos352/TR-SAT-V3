from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.rso import TLERecord
from app.schemas.reliability_analysis import ReliabilityLabel, ObjectReliabilityDetail, ReliabilitySummary
import statistics

def get_reliability_label(age_days: float) -> ReliabilityLabel:
    if age_days <= 1:
        return ReliabilityLabel.FRESH
    elif age_days <= 3:
        return ReliabilityLabel.GOOD
    elif age_days <= 7:
        return ReliabilityLabel.AGING
    elif age_days <= 14:
        return ReliabilityLabel.STALE
    else:
        return ReliabilityLabel.VERY_STALE

def calculate_age_days(epoch: datetime) -> float:
    now = datetime.now(timezone.utc)
    # Ensure epoch is timezone-aware
    if epoch.tzinfo is None:
        epoch = epoch.replace(tzinfo=timezone.utc)
    delta = now - epoch
    return delta.total_seconds() / 86400.0

def get_object_reliability(db: Session, norad_id: str) -> ObjectReliabilityDetail:
    rso = db.query(TLERecord).filter(TLERecord.norad_id == norad_id).order_by(TLERecord.epoch.desc()).first()
    if not rso or not rso.epoch:
        raise ValueError("RSO not found or has no epoch.")
    
    age_days = calculate_age_days(rso.epoch)
    label = get_reliability_label(age_days)
    
    warning = None
    if label in [ReliabilityLabel.STALE, ReliabilityLabel.VERY_STALE]:
        warning = "High covariance expected. Propagation errors increase non-linearly over time."
        
    return ObjectReliabilityDetail(
        norad_id=norad_id,
        tle_age_days=age_days,
        label=label,
        warning=warning
    )

def get_reliability_summary(db: Session) -> ReliabilitySummary:
    rsos = db.query(TLERecord).filter(TLERecord.epoch.isnot(None)).all()
    if not rsos:
        raise ValueError("No RSOs with epoch data available.")
        
    ages = [calculate_age_days(rso.epoch) for rso in rsos]
    
    distribution = {label: 0 for label in ReliabilityLabel}
    stale_count = 0
    very_stale_count = 0
    
    for age in ages:
        label = get_reliability_label(age)
        distribution[label] += 1
        if label in [ReliabilityLabel.STALE, ReliabilityLabel.VERY_STALE]:
            stale_count += 1
        if label == ReliabilityLabel.VERY_STALE:
            very_stale_count += 1
            
    total = len(ages)
    
    return ReliabilitySummary(
        total_objects=total,
        freshness_distribution=distribution,
        average_tle_age_days=statistics.mean(ages),
        median_tle_age_days=statistics.median(ages),
        max_tle_age_days=max(ages),
        stale_percentage=(stale_count / total) * 100.0,
        very_stale_percentage=(very_stale_count / total) * 100.0,
        scientific_warning="Warning: TLEs lose accuracy rapidly. Objects with STALE or VERY_STALE labels exhibit high covariance, leading to significant uncertainty in state vectors and resulting in unreliable conjunction assessments or propagation."
    )
