from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.catalog_visualization import CatalogSnapshotRequest, CatalogSnapshotResponse
from app.services.catalog_snapshot import generate_catalog_snapshot, get_catalog_summary

router = APIRouter()

@router.post("/snapshot", response_model=CatalogSnapshotResponse)
def get_catalog_snapshot(
    request: CatalogSnapshotRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a snapshot of the catalog at a specific time.
    """
    if request.limit > 5000:
        raise HTTPException(status_code=400, detail="Limit cannot exceed 5000")
        
    return generate_catalog_snapshot(db, request)

@router.get("/summary")
def get_catalog_summary_endpoint(db: Session = Depends(get_db)):
    """
    Get a summary of the catalog.
    """
    return get_catalog_summary(db)
