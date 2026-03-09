from typing import Optional, List
from pydantic import BaseModel


class Product(BaseModel):
    sku: str
    name: str
    category: str
    price: float
    currency: str
    unit: str
    pack_size: Optional[float] = None
    min_qty: float
    step: float
    available_qty: float
    notes: Optional[str] = ""
    active: bool = True


class DeliveryPoint(BaseModel):
    city: str
    place: str
    active: bool = True
    notes: Optional[str] = ""

class OrderItemCreate(BaseModel):
    sku: str
    qty: float


class OrderCreate(BaseModel):
    customer_name: str
    telegram_username: Optional[str] = ""
    telegram_id: Optional[str] = ""
    phone: Optional[str] = ""
    city: str
    delivery_point: str
    comment: Optional[str] = ""
    items: List[OrderItemCreate]


class OrderCreateResponse(BaseModel):
    order_id: str
    status: str