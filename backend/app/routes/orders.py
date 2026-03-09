from fastapi import APIRouter, HTTPException

from app.schemas import OrderCreate, OrderCreateResponse
from app.services.sheets import GoogleSheetsService

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderCreateResponse)
def create_order(payload: OrderCreate) -> OrderCreateResponse:
    service = GoogleSheetsService()

    try:
        order_id = service.create_order(payload)
        return OrderCreateResponse(order_id=order_id, status="created")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))