from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union

class Settings(BaseSettings):
    APP_NAME: str = "TR-SAT Mission Control V3"
    APP_ENV: str = "development"
    DATABASE_URL: str = "sqlite:///./trsat_v3.sqlite"
    
    # Handle both string (comma separated) and list CORS_ORIGINS
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173"
    
    CESIUM_ION_TOKEN: str = ""
    SPACETRACK_USERNAME: str = ""
    SPACETRACK_PASSWORD: str = ""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()
