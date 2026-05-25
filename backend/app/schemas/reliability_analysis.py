from enum import Enum
from pydantic import BaseModel, Field
from typing import Dict, Optional

class ReliabilityLabel(str, Enum):
    FRESH = "FRESH"
    GOOD = "GOOD"
    AGING = "AGING"
    STALE = "STALE"
    VERY_STALE = "VERY_STALE"

class ObjectReliabilityDetail(BaseModel):
    norad_id: str = Field(..., description="NORAD Catalog Number")
    tle_age_days: float = Field(..., description="Age of the TLE in days")
    label: ReliabilityLabel = Field(..., description="Categorical label for TLE reliability")
    warning: Optional[str] = Field(None, description="Scientific warning for stale TLEs")

class ReliabilitySummary(BaseModel):
    total_objects: int = Field(..., description="Total number of objects analyzed")
    freshness_distribution: Dict[ReliabilityLabel, int] = Field(..., description="Count of objects per label")
    average_tle_age_days: float = Field(..., description="Mean TLE age in days")
    median_tle_age_days: float = Field(..., description="Median TLE age in days")
    max_tle_age_days: float = Field(..., description="Maximum TLE age in days")
    stale_percentage: float = Field(..., description="Percentage of objects that are STALE or VERY_STALE")
    very_stale_percentage: float = Field(..., description="Percentage of objects that are VERY_STALE")
    scientific_warning: str = Field(..., description="General warning about covariance and propagation errors")
