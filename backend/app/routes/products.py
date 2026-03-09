from typing import List, Optional

from fastapi import APIRouter, Query

from app.schemas import Product
from app.services.sheets import GoogleSheetsService

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=List[Product])
def get_products(category: Optional[str] = Query(default=None)) -> List[Product]:
    service = GoogleSheetsService()
    products = service.get_active_products()

    if category:
        products = [p for p in products if p.category.lower() == category.lower()]

    return products


@router.get("/categories", response_model=List[str])
def get_categories() -> List[str]:
    service = GoogleSheetsService()
    products = service.get_active_products()
    categories = sorted({p.category for p in products if p.category})
    return categories