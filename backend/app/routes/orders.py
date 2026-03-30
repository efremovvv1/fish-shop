from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import SubmitOrderRequest, OrderCreateResponse
from app.services.db_service import DBService
from app.utils.telegram_auth import validate_telegram_init_data
from app.utils.telegram_notify import send_telegram_message

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/submit", response_model=OrderCreateResponse)
def submit_order(payload: SubmitOrderRequest, db: Session = Depends(get_db)) -> OrderCreateResponse:
    user = validate_telegram_init_data(payload.init_data)
    service = DBService(db)

    service.confirm_cart(user)

    try:
        message_text = service.build_cart_summary_message(user)
        send_telegram_message(user.telegram_user_id, message_text)
    except Exception as e:
        print(f"Failed to send Telegram message: {e}")

    return OrderCreateResponse(order_id="cart-saved", status="submitted")