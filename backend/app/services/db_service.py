from datetime import datetime
import uuid
import json

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import (
    User,
    ShopSetting,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Product,
    DeliveryPointModel,
)

from app.schemas import CartUpsertRequest, CartResponse, TelegramUser
from app.models import DeliveryDate


class DBService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_user(self, tg_user: TelegramUser) -> User:
        user = (
            self.db.query(User)
            .filter(User.telegram_user_id == tg_user.telegram_user_id)
            .first()
        )

        if user:
            user.telegram_username = tg_user.username or user.telegram_username
            user.first_name = tg_user.first_name or user.first_name
            user.last_name = tg_user.last_name or user.last_name
            self.db.commit()
            self.db.refresh(user)
            return user

        user = User(
            telegram_user_id=tg_user.telegram_user_id,
            telegram_username=tg_user.username or "",
            first_name=tg_user.first_name or "",
            last_name=tg_user.last_name or "",
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_shop_status(self) -> str:
        setting = (
            self.db.query(ShopSetting)
            .filter(ShopSetting.key == "shop_status")
            .first()
        )

        if not setting:
            setting = ShopSetting(key="shop_status", value="open")
            self.db.add(setting)
            self.db.commit()
            self.db.refresh(setting)

        if setting.value not in {"closed", "open", "locked"}:
            return "closed"

        return setting.value

    def ensure_shop_is_open(self) -> None:
        status = self.get_shop_status()
        if status != "open":
            raise HTTPException(
                status_code=409,
                detail=f"Shop is not open for editing. Current status: {status}",
            )

    def get_cart(self, tg_user: TelegramUser) -> CartResponse:
        user = self.get_or_create_user(tg_user)
        cart = self.db.query(Cart).filter(Cart.user_id == user.id).first()

        if not cart:
            cart = Cart(user_id=user.id, status="draft")
            self.db.add(cart)
            self.db.commit()
            self.db.refresh(cart)

        return CartResponse(
            telegram_user_id=user.telegram_user_id,
            telegram_username=user.telegram_username or "",
            customer_name=cart.customer_name or "",
            phone=cart.phone or "",
            city=cart.city or "",
            delivery_point=cart.delivery_point or "",
            delivery_date=cart.delivery_date.isoformat() if cart.delivery_date else "",
            pickup_number= cart.pickup_number,
            comment=cart.comment or "",
            items=[
                {"sku": item.sku, "qty": float(item.qty)}
                for item in cart.items
            ],
            status=cart.status,
            updated_at=cart.updated_at.isoformat() if cart.updated_at else None,
            submitted_at=cart.submitted_at.isoformat() if cart.submitted_at else None,
        )

    def upsert_cart(self, tg_user: TelegramUser, payload: CartUpsertRequest) -> CartResponse:
        self.ensure_shop_is_open()

        user = self.get_or_create_user(tg_user)
        cart = self.db.query(Cart).filter(Cart.user_id == user.id).first()

        if not cart:
            cart = Cart(user_id=user.id, status="draft")
            self.db.add(cart)
            self.db.commit()
            self.db.refresh(cart)

        cart.customer_name = payload.customer_name or ""
        cart.phone = payload.phone or ""
        cart.city = payload.city or ""
        cart.delivery_point = payload.delivery_point or ""
        cart.comment = payload.comment or ""
        cart.delivery_date = payload.delivery_date

        if cart.status != "submitted":
            cart.status = "draft"

        cart.updated_at = datetime.utcnow()

        self.db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()

        for item in payload.items:
            self.db.add(
                CartItem(
                    cart_id=cart.id,
                    sku=item.sku,
                    qty=item.qty,
                )
            )

        if cart.pickup_number is None:
            max_number = self.db.query(Cart.pickup_number).order_by(Cart.pickup_number.desc()).first()
            next_number = 1
            if max_number and max_number[0]:
                next_number = max_number[0] + 1
            cart.pickup_number = next_number

        self.db.commit()
        self.db.refresh(cart)

        return self.get_cart(tg_user)

    def set_shop_status(self, status: str) -> str:
        if status not in {"closed", "open", "locked"}:
            raise HTTPException(status_code=400, detail="Invalid shop status")

        setting = (
            self.db.query(ShopSetting)
            .filter(ShopSetting.key == "shop_status")
            .first()
        )

        if not setting:
            setting = ShopSetting(key="shop_status", value=status)
            self.db.add(setting)
        else:
            setting.value = status
            setting.updated_at = datetime.utcnow()

        self.db.commit()
        return status

    def confirm_cart(self, tg_user: TelegramUser) -> None:
        self.ensure_shop_is_open()

        user = self.get_or_create_user(tg_user)
        cart = self.db.query(Cart).filter(Cart.user_id == user.id).first()

        if not cart:
            raise HTTPException(status_code=400, detail="Cart not found")

        if not cart.items:
            raise HTTPException(status_code=400, detail="Cart is empty")

        cart.status = "submitted"
        cart.submitted_at = datetime.utcnow()
        cart.updated_at = datetime.utcnow()

        self.db.commit()
    
    def get_all_carts(self, delivery_date=None):
        query = self.db.query(Cart).join(User, Cart.user_id == User.id)

        if delivery_date:
            query = query.filter(Cart.delivery_date == delivery_date)

        carts = query.all()
        products_map = {p.sku: p for p in self.db.query(Product).all()}

        result = []
        for cart in carts:
            user = cart.user
            result.append({
                "cart_id": cart.id,
                "telegram_user_id": user.telegram_user_id,
                "telegram_username": user.telegram_username or "",
                "customer_name": cart.customer_name or "",
                "phone": cart.phone or "",
                "city": cart.city or "",
                "delivery_point": cart.delivery_point or "",
                "delivery_date": cart.delivery_date.isoformat() if cart.delivery_date else "",
                "approx_time": cart.approx_time or "",
                "pickup_number": cart.pickup_number,
                "comment": cart.comment or "",
                "status": cart.status,
                "updated_at": cart.updated_at.isoformat() if cart.updated_at else None,
                "submitted_at": cart.submitted_at.isoformat() if cart.submitted_at else None,
                "items": [
                    {
                        "sku": item.sku,
                        "product_name": products_map[item.sku].name if item.sku in products_map else item.sku,
                        "unit": products_map[item.sku].unit if item.sku in products_map else "",
                        "qty": float(item.qty),
                    }
                    for item in cart.items
                ],
            })

        result.sort(key=lambda x: x["updated_at"] or "", reverse=True)
        return result

    def get_product_totals(self):
        carts = self.db.query(Cart).filter(Cart.status.in_(["submitted", "locked"])).all()
        products_map = {p.sku: p for p in self.db.query(Product).all()}

        totals_map = {}

        for cart in carts:
            for item in cart.items:
                sku = item.sku
                qty = float(item.qty)

                if sku not in totals_map:
                    product = products_map.get(sku)
                    totals_map[sku] = {
                        "sku": sku,
                        "product_name": product.name if product else sku,
                        "unit": product.unit if product else "",
                        "total_qty": 0.0,
                    }

                totals_map[sku]["total_qty"] += qty

        result = list(totals_map.values())
        result.sort(key=lambda x: x["product_name"].lower())
        return result

    def get_cart_by_id(self, cart_id: int):
        cart = self.db.query(Cart).filter(Cart.id == cart_id).first()
        if not cart:
            raise HTTPException(status_code=404, detail="Cart not found")

        products_map = {p.sku: p for p in self.db.query(Product).all()}
        user = cart.user

        return {
            "cart_id": cart.id,
            "telegram_user_id": user.telegram_user_id,
            "telegram_username": user.telegram_username or "",
            "customer_name": cart.customer_name or "",
            "phone": cart.phone or "",
            "city": cart.city or "",
            "delivery_point": cart.delivery_point or "",
            "delivery_date": cart.delivery_date.isoformat() if cart.delivery_date else "",
            "pickup_number": cart.pickup_number,
            "comment": cart.comment or "",
            "status": cart.status,
            "updated_at": cart.updated_at.isoformat() if cart.updated_at else None,
            "submitted_at": cart.submitted_at.isoformat() if cart.submitted_at else None,
            "items": [
                {
                    "sku": item.sku,
                    "product_name": products_map[item.sku].name if item.sku in products_map else item.sku,
                    "unit": products_map[item.sku].unit if item.sku in products_map else "",
                    "qty": float(item.qty),
                }
                for item in cart.items
            ],
        }

    def update_product(self, product_id: int, payload):
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        existing = (
            self.db.query(Product)
            .filter(Product.sku == payload.sku, Product.id != product_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=409, detail="Product with this SKU already exists")

        product.sku = payload.sku
        product.name = payload.name
        product.category = payload.category
        product.price = payload.price
        product.currency = payload.currency
        product.unit = payload.unit
        product.pack_size = payload.pack_size
        product.min_qty = payload.min_qty
        product.step = payload.step
        product.available_qty = payload.available_qty
        product.notes = payload.notes or ""
        product.image_url = payload.image_url or ""
        product.short_description = payload.short_description or ""
        product.description = payload.description or ""
        product.active =payload.active

        self.db.commit()
        self.db.refresh(product)

        return {
            "id": product.id,
            "sku": product.sku,
            "name": product.name,
            "category": product.category,
            "price": float(product.price),
            "currency": product.currency,
            "unit": product.unit,
            "pack_size": float(product.pack_size) if product.pack_size is not None else None,
            "min_qty": float(product.min_qty),
            "step": float(product.step),
            "available_qty": float(product.available_qty),
            "notes": product.notes or "",
            "short_description": product.short_description or "",
            "description": product.description or "",
            "image_url": product.image_url or "",
            "active": product.active,
        }

    def delete_product(self, product_id: int):
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        self.db.delete(product)
        self.db.commit()
        return {"deleted": True}

    def get_all_products(self):
        products = self.db.query(Product).order_by(Product.category, Product.name).all()

        return [
            {
                "id": p.id,
                "sku": p.sku,
                "name": p.name,
                "category": p.category,
                "price": float(p.price),
                "currency": p.currency,
                "unit": p.unit,
                "pack_size": float(p.pack_size) if p.pack_size is not None else None,
                "min_qty": float(p.min_qty),
                "step": float(p.step),
                "available_qty": float(p.available_qty),
                "notes": p.notes or "",
                "image_url": p.image_url or "",
                "short_description": p.short_description or "",
                "description": p.description or "",
                "active": p.active,
            }
            for p in products
        ]

    def get_all_delivery_points(self):
        points = self.db.query(DeliveryPointModel).order_by(
            DeliveryPointModel.city, DeliveryPointModel.place
        ).all()

        return [
            {
                "id": p.id,
                "city": p.city,
                "place": p.place,
                "active": p.active,
                "notes": p.notes or "",
                "delivery_date": p.delivery_date.isoformat() if p.delivery_date else None,
                "approx_time": p.approx_time or None,
            }
            for p in points
        ]

    def create_product(self, payload):
        existing = self.db.query(Product).filter(Product.sku == payload.sku).first()
        if existing:
            raise HTTPException(status_code=409, detail="Product with this SKU already exists")

        product = Product(
            sku=payload.sku,
            name=payload.name,
            category=payload.category,
            price=payload.price,
            currency=payload.currency,
            unit=payload.unit,
            pack_size=payload.pack_size,
            min_qty=payload.min_qty,
            step=payload.step,
            available_qty=payload.available_qty,
            notes=payload.notes or "",
            active=payload.active,
        )
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)

        return {
            "id": product.id,
            "sku": product.sku,
            "name": product.name,
            "category": product.category,
            "price": float(product.price),
            "currency": product.currency,
            "unit": product.unit,
            "pack_size": float(product.pack_size) if product.pack_size is not None else None,
            "min_qty": float(product.min_qty),
            "step": float(product.step),
            "available_qty": float(product.available_qty),
            "notes": product.notes or "",
            "active": product.active,
        }

    def create_delivery_point(self, payload):
        point = DeliveryPointModel(
            city=payload.city.strip(),
            place=payload.place.strip(),
            active=payload.active,
            notes=(payload.notes or "").strip(),
            delivery_date=payload.delivery_date,
            approx_time=(payload.approx_time or "").strip() or None,
        )
        self.db.add(point)
        self.db.commit()
        self.db.refresh(point)

        return {
            "id": point.id,
            "city": point.city,
            "place": point.place,
            "active": point.active,
            "notes": point.notes or "",
            "delivery_date": point.delivery_date.isoformat() if point.delivery_date else None,
            "approx_time": point.approx_time or None,
        }

    def toggle_product_active(self, product_id: int):
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        product.active = not product.active
        self.db.commit()
        self.db.refresh(product)

        return {
            "id": product.id,
            "sku": product.sku,
            "name": product.name,
            "category": product.category,
            "price": float(product.price),
            "currency": product.currency,
            "unit": product.unit,
            "pack_size": float(product.pack_size) if product.pack_size is not None else None,
            "min_qty": float(product.min_qty),
            "step": float(product.step),
            "available_qty": float(product.available_qty),
            "notes": product.notes or "",
            "active": product.active,
        }
    
    def update_delivery_point(self, point_id: int, payload):
        point = self.db.query(DeliveryPointModel).filter(DeliveryPointModel.id == point_id).first()
        if not point:
            raise HTTPException(status_code=404, detail="Delivery point not found")

        point.city = payload.city.strip()
        point.place = payload.place.strip()
        point.active = payload.active
        point.notes = (payload.notes or "").strip()
        point.delivery_date = payload.delivery_date
        point.approx_time = (payload.approx_time or "").strip() or None

        self.db.commit()
        self.db.refresh(point)

        return {
            "id": point.id,
            "city": point.city,
            "place": point.place,
            "active": point.active,
            "notes": point.notes or "",
            "delivery_date": point.delivery_date.isoformat() if point.delivery_date else None,
            "approx_time": point.approx_time or None,
        }
    
    def delete_delivery_point(self, point_id: int):
        point = self.db.query(DeliveryPointModel).filter(DeliveryPointModel.id == point_id).first()
        if not point:
            raise HTTPException(status_code=404, detail="Delivery point not found")

        self.db.delete(point)
        self.db.commit()
        return {"deleted": True}
    
    def get_client_export_mapping(self):
        setting = (
            self.db.query(ShopSetting)
            .filter(ShopSetting.key == "client_export_mapping")
            .first()
        )

        if not setting or not setting.value.strip():
            return []

        try:
            mapping = json.loads(setting.value)
        except Exception:
            raise HTTPException(status_code=500, detail="Invalid client export mapping JSON")

        if not isinstance(mapping, list):
            raise HTTPException(status_code=500, detail="Client export mapping must be a list")

        normalized = []
        for row in mapping:
            if not isinstance(row, dict):
                continue
            if not row.get("active", True):
                continue

            sku = str(row.get("sku", "")).strip()
            column_name = str(row.get("column_name", "")).strip()
            column_order = int(row.get("column_order", 0))

            if not sku or not column_name:
                continue

            normalized.append({
                "sku": sku,
                "column_name": column_name,
                "column_order": column_order,
                "active": True,
                "weight_label": str(row.get("weight_label", "")).strip(),
                "price_label": str(row.get("price_label", "")).strip(),
                "fill_color": str(row.get("fill_color", "")).strip(),
            })

        normalized.sort(key=lambda x: (x["column_order"], x["column_name"].lower()))
        return normalized


    def validate_client_export_mapping(self):
        mapping = self.get_client_export_mapping()

        mapped_skus = [x["sku"] for x in mapping]
        mapped_column_names = [x["column_name"] for x in mapping]
        mapped_orders = [x["column_order"] for x in mapping]

        active_products = self.db.query(Product).filter(Product.active.is_(True)).all()
        active_product_skus = {p.sku for p in active_products}

        carts = self.db.query(Cart).filter(Cart.status.in_(["submitted", "locked"])).all()
        used_skus = set()
        for cart in carts:
            for item in cart.items:
                used_skus.add(item.sku)

        missing_in_mapping = sorted(list(used_skus - set(mapped_skus)))
        missing_in_products = sorted([sku for sku in mapped_skus if sku not in active_product_skus])

        duplicate_column_names = sorted(
            list({name for name in mapped_column_names if mapped_column_names.count(name) > 1})
        )
        duplicate_column_orders = sorted(
            list({num for num in mapped_orders if mapped_orders.count(num) > 1})
        )

        inactive_or_unmapped_products = sorted(list(active_product_skus - set(mapped_skus)))

        return {
            "ok": not (
                missing_in_mapping
                or missing_in_products
                or duplicate_column_names
                or duplicate_column_orders
            ),
            "missing_in_mapping": missing_in_mapping,
            "missing_in_products": missing_in_products,
            "duplicate_column_names": duplicate_column_names,
            "duplicate_column_orders": duplicate_column_orders,
            "inactive_or_unmapped_products": inactive_or_unmapped_products,
        }

    def toggle_delivery_point_active(self, point_id: int):
        point = self.db.query(DeliveryPointModel).filter(DeliveryPointModel.id == point_id).first()
        if not point:
            raise HTTPException(status_code=404, detail="Delivery point not found")

        point.active = not point.active
        self.db.commit()
        self.db.refresh(point)

        return {
            "id": point.id,
            "city": point.city,
            "place": point.place,
            "active": point.active,
            "notes": point.notes or "",
            "delivery_date": point.delivery_date.isoformat() if point.delivery_date else None,
            "approx_time": point.approx_time or None,
        }
    
    def clear_all_carts(self):
        cart_count = self.db.query(Cart).count()

        self.db.query(CartItem).delete()
        self.db.query(Cart).delete()

        setting = (
            self.db.query(ShopSetting)
            .filter(ShopSetting.key == "shop_status")
            .first()
        )
        if setting:
            setting.value = "closed"
            setting.updated_at = datetime.utcnow()

        self.db.commit()

        return {
            "deleted": True,
            "cleared_carts": cart_count,
            "shop_status": "closed",
        }
    
    def finalize_month_orders(self) -> dict:
        submitted_carts = (
            self.db.query(Cart)
            .filter(Cart.status == "submitted")
            .all()
        )

        if not submitted_carts:
            return {"created_orders": 0, "locked_carts": 0}

        products = {
            p.sku: p
            for p in self.db.query(Product).filter(Product.active.is_(True)).all()
        }

        created_orders = 0
        locked_carts = 0

        for cart in submitted_carts:
            if not cart.items:
                continue

            total = 0.0
            currency = "EUR"

            order = Order(
                order_id=f"ORD-{uuid.uuid4().hex[:10].upper()}",
                user_id=cart.user_id,
                status="new",
                customer_name=cart.customer_name or "",
                phone=cart.phone or "",
                city=cart.city or "",
                delivery_point=cart.delivery_point or "",
                delivery_date=cart.delivery_date,
                comment=cart.comment or "",
                total=0,
                currency="EUR",
            )
            self.db.add(order)
            self.db.flush()

            for item in cart.items:
                product = products.get(item.sku)
                if not product:
                    continue

                qty = float(item.qty)
                price = float(product.price)
                line_total = round(price * qty, 2)
                total += line_total
                currency = product.currency or "EUR"

                self.db.add(
                    OrderItem(
                        order_id_fk=order.id,
                        sku=product.sku,
                        product_name=product.name,
                        qty=qty,
                        unit=product.unit,
                        price=price,
                        currency=currency,
                        line_total=line_total,
                    )
                )

            order.total = round(total, 2)
            order.currency = currency

            cart.status = "locked"
            cart.updated_at = datetime.utcnow()

            created_orders += 1
            locked_carts += 1

        self.db.commit()

        return {
            "created_orders": created_orders,
            "locked_carts": locked_carts,
        }

    def build_cart_summary_message(self, tg_user: TelegramUser) -> str:
        cart = self.get_cart(tg_user)

        lines = []
        total = 0.0
        currency = "EUR"

        products = {p.sku: p for p in self.db.query(Product).all()}

        for item in cart.items:
            product = products.get(item.sku)
            if not product:
                continue

            qty = float(item.qty)
            price = float(product.price or 0)
            line_total = qty * price
            total += line_total
            currency = product.currency or "EUR"

            qty_text = int(qty) if qty.is_integer() else qty
            lines.append(f"• {product.name} — {qty_text} {product.unit}")

        items_text = "\n".join(lines) if lines else "• Нет товаров"

        return (
            "✅ Заказ сохранён\n\n"
            f"👤 Имя: {cart.customer_name or '-'}\n"
            f"📍 Город: {cart.city or '-'}\n"
            f"🏪 Точка выдачи: {cart.delivery_point or '-'}\n\n"
            f"🧾 Состав заказа:\n{items_text}\n\n"
            f"💶 Примерная сумма: {total:.2f} {currency}\n\n"
            "Вы можете изменить заказ до окончания приёма заявок."
        )
    
    def get_delivery_dates(self, city: str | None = None):
        query = self.db.query(DeliveryDate).filter(DeliveryDate.active == True)

        if city:
            query = query.filter(DeliveryDate.city == city)

        return query.order_by(DeliveryDate.delivery_date.asc()).all()


    def get_all_delivery_dates_admin(self):
        return (
            self.db.query(DeliveryDate)
            .order_by(DeliveryDate.city.asc(), DeliveryDate.delivery_date.asc())
            .all()
        )


    def create_delivery_date(self, city: str, delivery_date, active: bool = True):
        item = DeliveryDate(
            city=city.strip(),
            delivery_date=delivery_date,
            active=active,
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item


    def update_delivery_date(self, item_id: int, city: str, delivery_date, active: bool = True):
        item = self.db.query(DeliveryDate).filter(DeliveryDate.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Delivery date not found")

        item.city = city.strip()
        item.delivery_date = delivery_date
        item.active = active
        item.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(item)
        return item


    def delete_delivery_date(self, item_id: int):
        item = self.db.query(DeliveryDate).filter(DeliveryDate.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Delivery date not found")

        self.db.delete(item)
        self.db.commit()
        return True