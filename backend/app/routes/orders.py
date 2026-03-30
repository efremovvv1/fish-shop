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
        telegram_sent = send_telegram_message(user.telegram_user_id, message_text)
        if not telegram_sent:
            logger.warning("Telegram notification was not delivered for user=%s", user.telegram_user_id)
    except Exception as e:
        logger.exception("Unexpected error while sending order confirmation to Telegram for user=%s", user.telegram_user_id)

    return OrderCreateResponse(order_id="cart-saved", status="submitted")