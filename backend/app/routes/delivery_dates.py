from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import DeliveryDateResponse
from app.services.db_service import DBService

router = APIRouter(tags=["delivery_dates"])


@router.get("/delivery-dates", response_model=list[DeliveryDateResponse])
def get_delivery_dates(
    city: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    service = DBService(db)
    return service.get_delivery_dates(city=city)