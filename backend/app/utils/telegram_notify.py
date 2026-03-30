import logging
import requests

from app.config import TELEGRAM_BOT_TOKEN

logger = logging.getLogger(__name__)


def send_telegram_message(chat_id: str, text: str) -> bool:
    if not TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN is missing")
        return False

    if not chat_id:
        logger.warning("Telegram message skipped: empty chat_id")
        return False

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"

    try:
        response = requests.post(
            url,
            json={
                "chat_id": chat_id,
                "text": text,
            },
            timeout=10,
        )

        response.raise_for_status()

        payload = response.json()
        if not payload.get("ok"):
            logger.error("Telegram API returned non-ok response: %s", payload)
            return False

        return True

    except requests.RequestException as exc:
        logger.exception("Telegram send failed for chat_id=%s: %s", chat_id, exc)
        return False