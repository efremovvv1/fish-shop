from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import Product
from app.services.db_service import DBService

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[Product])
def get_products(db: Session = Depends(get_db)):
    service = DBService(db)
    products = service.get_all_products()
    return [p for p in products if p["active"]]


@router.get("/categories", response_model=list[str])
def get_categories(db: Session = Depends(get_db)):
    service = DBService(db)
    products = service.get_all_products()
    categories = sorted({p["category"] for p in products if p["active"]})
    return categories