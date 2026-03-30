from typing import Optional, List, Literal
from pydantic import BaseModel, Field, COnfigDict
from datetime import date

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
    image_url: Optional[str] = ""
    short_description: Optional[str] = ""
    description: Optional[str] = ""
    active: bool = True


class DeliveryPoint(BaseModel):
    city: str
    place: str
    active: bool = True
    notes: Optional[str] = ""
    delivery_date: Optional[str] = None
    approx_time: Optional[str] = None


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


class TelegramAuthPayload(BaseModel):
    init_data: str = Field(..., min_length=1)


class TelegramUser(BaseModel):
    telegram_user_id: str
    username: Optional[str] = ""
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""


class CartUpsertRequest(BaseModel):
    customer_name: Optional[str] = Field(default="", max_length=255)
    phone: Optional[str] = Field(default="", max_length=64)
    city: Optional[str] = Field(default="", max_length=255)
    delivery_point: Optional[str] = Field(default="", max_length=255)
    delivery_date: Optional[date] = None
    approx_time: Optional[str] = Field(default=None, max_length=32)
    comment: Optional[str] = Field(default="", max_length=2000)
    items: List[OrderItemCreate]


class CartResponse(BaseModel):
    pickup_number: int | None = None
    telegram_user_id: str
    telegram_username: Optional[str] = ""
    customer_name: Optional[str] = ""
    phone: Optional[str] = ""
    city: Optional[str] = ""
    delivery_point: Optional[str] = ""
    delivery_date: Optional[str] = ""
    approx_time: Optional[str] = None
    comment: Optional[str] = ""
    items: List[OrderItemCreate]
    status: str
    updated_at: Optional[str] = None
    submitted_at: Optional[str] = None


class SubmitOrderRequest(BaseModel):
    init_data: str = Field(..., min_length=1)


class ShopStatusResponse(BaseModel):
    status: Literal["closed", "open", "locked"]

class ShopStatusUpdateRequest(BaseModel):
    status: Literal["closed", "open", "locked"]


class ShopStatusUpdateResponse(BaseModel):
    status: Literal["closed", "open", "locked"]
    updated: bool

class AdminLoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=128)
    password: str = Field(..., min_length=1, max_length=256)


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminCartItemResponse(BaseModel):
    sku: str
    product_name: str
    unit: str
    qty: float


class AdminCartResponse(BaseModel):
    cart_id: int
    telegram_user_id: str
    telegram_username: Optional[str] = ""
    customer_name: Optional[str] = ""
    phone: Optional[str] = ""
    city: Optional[str] = ""
    delivery_point: Optional[str] = ""
    delivery_date: Optional[str] = ""
    approx_time: Optional[str] = None
    pickup_number: int | None = None
    comment: Optional[str] = ""
    status: str
    updated_at: Optional[str] = None
    submitted_at: Optional[str] = None
    items: List[AdminCartItemResponse]


class AdminCartsListResponse(BaseModel):
    carts: List[AdminCartResponse]

class AdminProductTotalResponse(BaseModel):
    sku: str
    product_name: str
    unit: str
    total_qty: float


class AdminProductTotalsResponse(BaseModel):
    totals: List[AdminProductTotalResponse]

class AdminProductResponse(BaseModel):
    id: int
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
    image_url: Optional[str] = ""
    short_description: Optional[str] = ""
    description: Optional[str] = ""
    active: bool


class AdminProductsListResponse(BaseModel):
    products: List[AdminProductResponse]


class AdminProductCreateRequest(BaseModel):
    sku: str
    name: str
    category: str
    price: float
    currency: str = "EUR"
    unit: str
    pack_size: Optional[float] = None
    min_qty: float
    step: float
    available_qty: float
    notes: Optional[str] = ""
    image_url: Optional[str] = ""
    short_description: Optional[str] = ""
    description: Optional[str] = ""
    active: bool = True


class AdminDeliveryPointResponse(BaseModel):
    id: int
    city: str
    place: str
    active: bool
    notes: Optional[str] = ""
    delivery_date: date | None = None
    approx_time: Optional[str] = None

class AdminDeliveryPointsListResponse(BaseModel):
    delivery_points: List[AdminDeliveryPointResponse]


class AdminDeliveryPointCreateRequest(BaseModel):
    city: str
    place: str
    active: bool = True
    notes: Optional[str] = ""
    delivery_date: date | None = None
    approx_time: Optional[str] = None

class AdminProductUpdateRequest(BaseModel):
    sku: str
    name: str
    category: str
    price: float
    currency: str = "EUR"
    unit: str
    pack_size: Optional[float] = None
    min_qty: float
    step: float
    available_qty: float
    notes: Optional[str] = ""
    image_url: Optional[str] = ""
    short_description: Optional[str] = ""
    description: Optional[str] = ""
    active: bool = True

class DeleteResponse(BaseModel):
    deleted: bool

class AdminDeliveryPointUpdateRequest(BaseModel):
    city: str
    place: str
    active: bool = True
    notes: Optional[str] = ""
    delivery_date: date | None = None
    approx_time: Optional[str] = None

class UploadImageResponse(BaseModel):
    image_url: str 

class ClearCartsResponse(BaseModel):
    deleted: bool
    cleared_carts: int
    shop_status: Literal["closed", "open", "locked"]

class DeliveryDateCreateRequest(BaseModel):
    delivery_date: date
    approx_time: str | None = None
    active: bool = True

class DeliveryDateUpdateRequest(BaseModel):
    delivery_date: date
    approx_time: str | None = None
    active: bool = True

class DeliveryDateResponse(BaseModel):
    id: int
    delivery_point_id: int
    city: str
    delivery_date: date
    approx_time: str | None = None
    active: bool

    model_config = COnfigDict(from_attributes = True)

class Config:
    from_attributes = True

class StoreSettingsResponse(BaseModel):
    shop_name: str
    shop_cover_image: str


class StoreSettingsUpdateRequest(BaseModel):
    shop_name: str
    shop_cover_image: str = ""

class DeleteCartWithReasonRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=1000)

class DeleteCartWithReasonResponse(BaseModel):
    deleted: bool
    telegram_sent: bool
