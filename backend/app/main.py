import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import ALLOWED_ORIGINS, ENVIRONMENT
from app.routes.products import router as products_router
from app.routes.delivery import router as delivery_router
from app.routes.orders import router as orders_router
from app.routes.cart import router as cart_router
from app.routes.shop import router as shop_router
from app.routes.admin import router as admin_router
from app.db import Base, engine
from app import models

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

app = FastAPI(title="Fish Shop MVP API")

if ENVIRONMENT != "production":
    Base.metadata.create_all(bind=engine)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

if ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(products_router)
app.include_router(delivery_router)
app.include_router(orders_router)
app.include_router(cart_router)
app.include_router(shop_router)
app.include_router(admin_router)