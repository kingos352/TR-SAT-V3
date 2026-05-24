from fastapi import APIRouter
from app.api.endpoints import health, catalog, propagation, observer

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["system"])
api_router.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
api_router.include_router(propagation.router, prefix="/propagation", tags=["propagation"])
api_router.include_router(observer.router, prefix="/observer", tags=["observer"])
