import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

GOOGLE_SHEETS_ID = os.getenv("GOOGLE_SHEETS_ID", "")
PRODUCTS_SHEET = os.getenv("PRODUCTS_SHEET", "Products")
DELIVERY_POINTS_SHEET = os.getenv("DELIVERY_POINTS_SHEET", "DeliveryPoints")

GOOGLE_SERVICE_ACCOUNT_JSON = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "")
GOOGLE_SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE", "service_account.json")


def ensure_service_account_file() -> str:
    if GOOGLE_SERVICE_ACCOUNT_JSON:
        path = Path("/tmp/service_account.json")
        path.write_text(GOOGLE_SERVICE_ACCOUNT_JSON, encoding="utf-8")
        return str(path)

    return GOOGLE_SERVICE_ACCOUNT_FILE