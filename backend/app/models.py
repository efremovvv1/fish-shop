from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Date,
    ForeignKey,
    Numeric,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_user_id = Column(String, unique=True, index=True, nullable=False)
    telegram_username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    cart = relationship("Cart", back_populates="user", uselist=False)
    orders = relationship("Order", back_populates="user")


class ShopSetting(Base):
    __tablename__ = "shop_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False)
    value = Column(String, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    customer_name = Column(String, default="", nullable=False)
    phone = Column(String, default="", nullable=False)
    city = Column(String, default="", nullable=False)
    delivery_point = Column(String, default="", nullable=False)
    comment = Column(Text, default="", nullable=False)
    status = Column(String, default="draft", nullable=False)
    delivery_date = Column(Date, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    submitted_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint("cart_id", "sku", name="uq_cart_item_cart_sku"),
    )

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id"), nullable=False)
    sku = Column(String, nullable=False)
    qty = Column(Numeric(10, 2), nullable=False)

    cart = relationship("Cart", back_populates="items")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    status = Column(String, default="new", nullable=False)
    customer_name = Column(String, default="", nullable=False)
    phone = Column(String, default="", nullable=False)
    city = Column(String, default="", nullable=False)
    delivery_point = Column(String, default="", nullable=False)
    comment = Column(Text, default="", nullable=False)
    delivery_date = Column(Date, nullable=True)
    total = Column(Numeric(10, 2), default=0, nullable=False)
    currency = Column(String, default="EUR", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id_fk = Column(Integer, ForeignKey("orders.id"), nullable=False)

    sku = Column(String, nullable=False)
    product_name = Column(String, nullable=False)
    qty = Column(Numeric(10, 2), nullable=False)
    unit = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, nullable=False)
    line_total = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="EUR", nullable=False)
    unit = Column(String, nullable=False)
    pack_size = Column(Numeric(10, 2), nullable=True)
    min_qty = Column(Numeric(10, 2), default=1, nullable=False)
    step = Column(Numeric(10, 2), default=1, nullable=False)
    available_qty = Column(Numeric(10, 2), default=0, nullable=False)
    notes = Column(Text, default="", nullable=False)
    active = Column(String, default="true", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    image_url = Column(Text, default="", nullable=False)
    short_description = Column(Text, default="", nullable=False)
    description = Column(Text, default="", nullable=False)


class DeliveryPointModel(Base):
    __tablename__ = "delivery_points"
    __table_args__ = (
        UniqueConstraint("city", "place", name="uq_delivery_city_place"),
    )

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String, nullable=False, index=True)
    place = Column(String, nullable=False)
    active = Column(String, default="true", nullable=False)
    notes = Column(Text, default="", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class DeliveryDate(Base):
    __tablename__ = "delivery_dates"

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String, nullable=False, index=True)
    delivery_date = Column(Date, nullable=False, index=True)
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)