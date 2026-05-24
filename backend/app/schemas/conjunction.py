from pydantic import BaseModel, Field, model_validator, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime

class ConjunctionScreenRequest(BaseModel):
    mode: Literal["selected_vs_selected", "primary_vs_catalog"]
    primary_norad_ids: List[int] = Field(..., min_length=1)
    secondary_norad_ids: Optional[List[int]] = Field(None, description="Used in selected_vs_selected mode")
    start_time: datetime
    end_time: datetime
    coarse_step_seconds: float = Field(60.0, gt=0)
    refine_step_seconds: float = Field(1.0, gt=0)
    max_candidates: int = Field(100, le=2000)

    @model_validator(mode="after")
    def validate_params(self) -> 'ConjunctionScreenRequest':
        if self.start_time >= self.end_time:
            raise ValueError("start_time must be before end_time")
        if (self.end_time - self.start_time).total_seconds() > 7 * 86400:
            raise ValueError("Screening horizon cannot exceed 7 days")
        if self.refine_step_seconds > self.coarse_step_seconds:
            raise ValueError("refine_step_seconds must be <= coarse_step_seconds")
        if self.mode == "selected_vs_selected" and not self.secondary_norad_ids:
            raise ValueError("secondary_norad_ids required for selected_vs_selected mode")
        return self

class ConjunctionResult(BaseModel):
    primary_norad_id: int
    secondary_norad_id: int
    tca_time: datetime
    miss_distance_km: float
    severity: Literal["CRITICAL_CANDIDATE", "CLOSE", "WATCH", "INFO"]
    primary_position_km: List[float]
    secondary_position_km: List[float]
    primary_velocity_km_per_s: Optional[List[float]] = None
    secondary_velocity_km_per_s: Optional[List[float]] = None

    model_config = ConfigDict(from_attributes=True)

class ConjunctionScreenResponse(BaseModel):
    disclaimer: str
    mode: str
    results: List[ConjunctionResult]
    computation_time_ms: float
