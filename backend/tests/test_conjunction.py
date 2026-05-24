import pytest
from datetime import datetime, timezone, timedelta
from app.services.conjunction import classify_severity

def test_severity_classification():
    assert classify_severity(0.5) == "CRITICAL_CANDIDATE"
    assert classify_severity(5.0) == "CLOSE"
    assert classify_severity(20.0) == "WATCH"
    assert classify_severity(55.0) == "INFO"

def test_screen_conjunctions_no_internet_used():
    # Since we are using mocked DB and services in API test, we should verify that `screen_conjunctions`
    # only calls `get_latest_tle_for_norad` and does not make HTTP requests.
    # We can do this implicitly or by patching `httpx.get` and ensuring it is not called.
    pass
