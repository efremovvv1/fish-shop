from typing import List, Optional

from fastapi import APIRouter, Query

from app.schemas import DeliveryPoint
from app.services.sheets import GoogleSheetsService

router = APIRouter(prefix="/delivery-points", tags=["delivery-points"])


@router.get("", response_model=List[DeliveryPoint])
def get_delivery_points(city: Optional[str] = Query(default=None)) -> List[DeliveryPoint]:
    service = GoogleSheetsService()
    points = service.get_active_delivery_points()

    if city:
        points = [p for p in points if p.city.lower() == city.lower()]

    return points