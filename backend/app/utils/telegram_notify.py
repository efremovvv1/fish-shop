import requests
from app.config import BOT_TOKEN


def send_telegram_message(chat_id: str, text: str):
    if not BOT_TOKEN:
        return

    try:
        requests.post(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
            json={
                "chat_id": chat_id,
                "text": text,
            },
            timeout=10,
        )
    except Exception:
        pass