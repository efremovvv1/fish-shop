import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_SHEETS_ID = os.getenv("GOOGLE_SHEETS_ID", "")
GOOGLE_SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE", "service_account.json")
PRODUCTS_SHEET = os.getenv("PRODUCTS_SHEET", "Products")
DELIVERY_POINTS_SHEET = os.getenv("DELIVERY_POINTS_SHEET", "DeliveryPoints")