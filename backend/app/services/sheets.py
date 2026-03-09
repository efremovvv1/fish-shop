from __future__ import annotations

from typing import Any, Dict, List, Optional

import gspread
from google.oauth2.service_account import Credentials

from app.config import (
    GOOGLE_SHEETS_ID,
    PRODUCTS_SHEET,
    DELIVERY_POINTS_SHEET,
    ensure_service_account_file,
)
from app.schemas import Product, DeliveryPoint
from datetime import datetime
from app.schemas import OrderCreate


SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]


def _to_float(value: Any, default: float = 0.0) -> float:
    if value is None or value == "":
        return default
    try:
        return float(str(value).replace(",", "."))
    except (ValueError, TypeError):
        return default


def _to_bool(value: Any, default: bool = False) -> bool:
    if value is None or value == "":
        return default
    return str(value).strip().lower() in {"true", "1", "yes", "y"}


class GoogleSheetsService:
    def __init__(self) -> None:
        service_account_file = ensure_service_account_file()

        creds = Credentials.from_service_account_file(
           service_account_file,
            scopes=SCOPES,
        )
        client = gspread.authorize(creds)
        self.spreadsheet = client.open_by_key(GOOGLE_SHEETS_ID)

    def _get_records(self, sheet_name: str) -> List[Dict[str, Any]]:
        worksheet = self.spreadsheet.worksheet(sheet_name)
        return worksheet.get_all_records()

    def get_products(self) -> List[Product]:
        rows = self._get_records(PRODUCTS_SHEET)
        products: List[Product] = []

        for row in rows:
            product = Product(
                sku=str(row.get("sku", "")).strip(),
                name=str(row.get("name", "")).strip(),
                category=str(row.get("category", "")).strip(),
                price=_to_float(row.get("price")),
                currency=str(row.get("currency", "EUR")).strip(),
                unit=str(row.get("unit", "")).strip(),
                pack_size=_to_float(row.get("pack_size"), default=0.0) or None,
                min_qty=_to_float(row.get("min_qty"), default=1.0),
                step=_to_float(row.get("step"), default=1.0),
                available_qty=_to_float(row.get("available_qty"), default=0.0),
                notes=str(row.get("notes", "")).strip(),
                active=_to_bool(row.get("active"), default=True),
            )
            products.append(product)

        return products

    def get_active_products(self) -> List[Product]:
        return [p for p in self.get_products() if p.active]

    def get_delivery_points(self) -> List[DeliveryPoint]:
        rows = self._get_records(DELIVERY_POINTS_SHEET)
        points: List[DeliveryPoint] = []

        for row in rows:
            point = DeliveryPoint(
                city=str(row.get("city", "")).strip(),
                place=str(row.get("place", "")).strip(),
                active=_to_bool(row.get("active"), default=True),
                notes=str(row.get("notes", "")).strip(),
            )
            points.append(point)

        return points

    def get_active_delivery_points(self) -> List[DeliveryPoint]:
        return [p for p in self.get_delivery_points() if p.active]

    def _get_orders_sheet(self):
        return self.spreadsheet.worksheet("Orders")

    def _next_order_id(self) -> str:
        worksheet = self._get_orders_sheet()
        rows = worksheet.get_all_records()

        max_id = 0
        for row in rows:
            raw_id = str(row.get("order_id", "")).strip()
            if raw_id.isdigit():
                max_id = max(max_id, int(raw_id))

        return str(max_id + 1)

    def create_order(self, payload: OrderCreate) -> str:
        products = {p.sku: p for p in self.get_active_products()}
        total = 0.0
        currency = "EUR"
        items_text_parts = []

        for item in payload.items:
            product = products.get(item.sku)
            if not product:
                raise ValueError(f"Товар с SKU {item.sku} не найден")

            line_total = product.price * item.qty
            total += line_total
            currency = product.currency
            items_text_parts.append(f"{item.sku} | {product.name} | {item.qty} {product.unit}")

        order_id = self._next_order_id()
        created_at = datetime.utcnow().isoformat()

        row = [
            order_id,
            created_at,
            "new",
            "",
            payload.telegram_username or "",
            payload.city,
            payload.delivery_point,
            " ; ".join(items_text_parts),
            round(total, 2),
            currency,
            payload.comment or "",
        ]

        worksheet = self._get_orders_sheet()
        worksheet.append_row(row, value_input_option="USER_ENTERED")

        return order_id