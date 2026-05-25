import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.schemas.reliability_analysis import ReliabilityLabel

# To test the logic without triggering DB import errors if they exist,
# we import functions directly, patching if necessary, or just test the pure logic.
from app.services.reliability_analysis import get_reliability_label, calculate_age_days

client = TestClient(app)

def test_reliability_boundaries():
    # exactly 1 day -> FRESH
    assert get_reliability_label(1.0) == ReliabilityLabel.FRESH
    # >1 -> GOOD
    assert get_reliability_label(1.0001) == ReliabilityLabel.GOOD
    # exactly 3 -> GOOD
    assert get_reliability_label(3.0) == ReliabilityLabel.GOOD
    # >3 -> AGING
    assert get_reliability_label(3.0001) == ReliabilityLabel.AGING
    # exactly 7 -> AGING
    assert get_reliability_label(7.0) == ReliabilityLabel.AGING
    # >7 -> STALE
    assert get_reliability_label(7.0001) == ReliabilityLabel.STALE
    # exactly 14 -> STALE
    assert get_reliability_label(14.0) == ReliabilityLabel.STALE
    # >14 -> VERY_STALE
    assert get_reliability_label(14.0001) == ReliabilityLabel.VERY_STALE

@patch("app.services.reliability_analysis.datetime")
def test_calculate_age_days(mock_dt):
    # Mock datetime.now(timezone.utc) to return a fixed time
    fixed_now = datetime(2025, 1, 15, 12, 0, tzinfo=timezone.utc)
    mock_dt.now.return_value = fixed_now
    
    # Epoch 1 day ago
    epoch = fixed_now - timedelta(days=1)
    
    age = calculate_age_days(epoch)
    assert age == 1.0

@patch("app.api.endpoints.research.get_reliability_summary")
def test_get_reliability_summary_endpoint(mock_get_summary):
    mock_get_summary.return_value = {
        "total_objects": 100,
        "freshness_distribution": {
            "FRESH": 10, "GOOD": 20, "AGING": 30, "STALE": 25, "VERY_STALE": 15
        },
        "average_tle_age_days": 8.5,
        "median_tle_age_days": 7.0,
        "max_tle_age_days": 20.0,
        "stale_percentage": 25.0,
        "very_stale_percentage": 15.0,
        "scientific_warning": "Warning..."
    }
    
    response = client.get("/api/v1/research/reliability-summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_objects"] == 100
    assert data["stale_percentage"] == 25.0
    mock_get_summary.assert_called_once()

@patch("app.api.endpoints.research.get_object_reliability")
def test_get_object_reliability_endpoint(mock_get_object):
    mock_get_object.return_value = {
        "norad_id": "25544",
        "tle_age_days": 10.5,
        "label": "STALE",
        "warning": "High covariance expected."
    }
    
    response = client.get("/api/v1/research/object-reliability/25544")
    assert response.status_code == 200
    data = response.json()
    assert data["norad_id"] == "25544"
    assert data["label"] == "STALE"
    mock_get_object.assert_called_once()
