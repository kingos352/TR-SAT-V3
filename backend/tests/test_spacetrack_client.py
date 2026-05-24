import pytest
import os
from unittest.mock import patch, MagicMock
from app.services.spacetrack import space_track_credentials_available, authenticate_spacetrack_client, fetch_spacetrack_latest_by_norad

@patch('app.services.spacetrack.httpx.Client', create=True)
def test_missing_credentials(mock_httpx_client):
    original_user = os.environ.get('SPACETRACK_USERNAME')
    original_pass = os.environ.get('SPACETRACK_PASSWORD')
    if 'SPACETRACK_USERNAME' in os.environ:
        del os.environ['SPACETRACK_USERNAME']
    if 'SPACETRACK_PASSWORD' in os.environ:
        del os.environ['SPACETRACK_PASSWORD']

    try:
        from app.config import settings
        settings.SPACETRACK_USERNAME = None
        settings.SPACETRACK_PASSWORD = None
        with pytest.raises(RuntimeError, match='(?i)credential'):
            authenticate_spacetrack_client()
    finally:
        if original_user is not None:
            os.environ['SPACETRACK_USERNAME'] = original_user
            settings.SPACETRACK_USERNAME = original_user
        if original_pass is not None:
            os.environ['SPACETRACK_PASSWORD'] = original_pass
            settings.SPACETRACK_PASSWORD = original_pass

@patch('app.services.spacetrack.httpx.Client', create=True)
def test_mocked_auth_success(mock_httpx_client):
    mock_instance = mock_httpx_client.return_value
    mock_instance.post.return_value = MagicMock(status_code=200, text='')

    from app.config import settings
    settings.SPACETRACK_USERNAME = 'testuser'
    settings.SPACETRACK_PASSWORD = 'testpass'

    client = authenticate_spacetrack_client()
    assert client is not None

@patch('app.services.spacetrack.httpx.Client', create=True)
def test_mocked_auth_failure(mock_httpx_client):
    mock_instance = mock_httpx_client.return_value
    mock_instance.post.return_value = MagicMock(status_code=401, text='authError')

    from app.config import settings
    settings.SPACETRACK_USERNAME = 'testuser'
    settings.SPACETRACK_PASSWORD = 'testpass'

    with pytest.raises(RuntimeError):
        authenticate_spacetrack_client()

@patch('app.services.spacetrack.parse_tle_text')
@patch('app.services.spacetrack.authenticate_spacetrack_client')
def test_mocked_latest_norad_sync(mock_auth, mock_parse):
    mock_client = MagicMock()
    mock_auth.return_value = mock_client
    mock_client.get.return_value = MagicMock(status_code=200, text='MOCK TLE DATA FOR 25544')
    
    # We mock parse_tle_text and db so it does not fail
    mock_parse.return_value = [{'name': 'ISS', 'line1': '1 25544U 98067A   23001.00000000  .00000000  00000-0  00000-0 0  9999', 'line2': '2 25544  51.6400   0.0000 0000000   0.0000   0.0000 15.50000000    10'}]
    
    db_mock = MagicMock()
    
    from app.config import settings
    settings.SPACETRACK_USERNAME = 'testuser'
    settings.SPACETRACK_PASSWORD = 'testpass'

    result = fetch_spacetrack_latest_by_norad(db_mock, 25544)
    assert result['status'] == 'success'
    
    # Verify credentials are not exposed
    result_str = str(result).lower()
    assert 'testuser' not in result_str
    assert 'testpass' not in result_str
