from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import (
    TelegramAuthPayload,
    CartUpsertRequest,
    CartResponse,
)

from app.services.db_service import DBService
from app.utils.telegram_auth import validate_telegram_init_data

router = APIRouter(prefix="/cart", tags=["cart"])


class SaveCartRequest(TelegramAuthPayload, CartUpsertRequest):
    pass


@router.post("/get", response_model=CartResponse)
def get_cart(payload: TelegramAuthPayload, db: Session = Depends(get_db)) -> CartResponse:
    user = validate_telegram_init_data(payload.init_data)
    service = DBService(db)
    return service.get_cart(user)


@router.post("/save", response_model=CartResponse)
def save_cart(payload: SaveCartRequest, db: Session = Depends(get_db)) -> CartResponse:
    user = validate_telegram_init_data(payload.init_data)
    service = DBService(db)

    cart_payload = CartUpsertRequest(
        customer_name=payload.customer_name,
        phone=payload.phone,
        city=payload.city,
        delivery_point=payload.delivery_point,
        comment=payload.comment,
        items=payload.items,
    )

    return service.upsert_cart(user, cart_payload)


