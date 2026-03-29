from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import (
    ShopStatusResponse,
    ShopStatusUpdateRequest,
    ShopStatusUpdateResponse,
    StoreSettingsUpdateRequest,
)
from app.services.db_service import DBService

router = APIRouter(prefix="/shop", tags=["shop"])


@router.get("/status", response_model=ShopStatusResponse)
def get_shop_status(db: Session = Depends(get_db)) -> ShopStatusResponse:
    service = DBService(db)
    return ShopStatusResponse(status=service.get_shop_status())

@router.get("/store-settings", response_model=StoreSettingsResponse)
def get_store_settings(db: Session = Depends(get_db)):
    service = DBService(db)
    return service.get_store_settings()