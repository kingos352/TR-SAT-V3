from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.conjunction import ConjunctionScreenRequest, ConjunctionScreenResponse
from app.services.conjunction import screen_conjunctions

router = APIRouter()

@router.post("/screen", response_model=ConjunctionScreenResponse)
def screen_for_conjunctions(
    request: ConjunctionScreenRequest,
    db: Session = Depends(get_db)
):
    try:
        response = screen_conjunctions(db, request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
