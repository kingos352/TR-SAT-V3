from fastapi import APIRouter
from app.api.endpoints import health, catalog, propagation, observer, telemetry, spacetrack, conjunction, catalog_visualization

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["system"])
api_router.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
api_router.include_router(propagation.router, prefix="/propagation", tags=["propagation"])
api_router.include_router(observer.router, prefix="/observer", tags=["observer"])
api_router.include_router(telemetry.router, prefix="/ws", tags=["telemetry"])
api_router.include_router(spacetrack.router, prefix="/spacetrack", tags=["spacetrack"])
api_router.include_router(conjunction.router, prefix="/conjunction", tags=["conjunction"])
api_router.include_router(catalog_visualization.router, prefix="/catalog-visualization", tags=["catalog-visualization"])
