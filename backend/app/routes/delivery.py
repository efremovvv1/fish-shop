from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import DeliveryPoint
from app.services.db_service import DBService

router = APIRouter(prefix="/delivery-points", tags=["delivery"])


@router.get("", response_model=list[DeliveryPoint])
def get_delivery_points(db: Session = Depends(get_db)):
    service = DBService(db)
    points = service.get_all_delivery_points()
    return [p for p in points if p["active"]]