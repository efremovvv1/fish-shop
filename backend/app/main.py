import logging
import time
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import ALLOWED_ORIGINS, ENVIRONMENT, validate_required_settings
from app.routes.products import router as products_router
from app.routes.delivery import router as delivery_router
from app.routes.orders import router as orders_router
from app.routes.cart import router as cart_router
from app.routes.shop import router as shop_router
from app.routes.admin import router as admin_router
from app.db import Base, engine
from app import models  # noqa: F401

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

logger = logging.getLogger(__name__)

validate_required_settings()

app = FastAPI(title="Fish Shop MVP API")

if ENVIRONMENT != "production":
    Base.metadata.create_all(bind=engine)

uploads_dir = Path("uploads")
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"] if ENVIRONMENT != "production" else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.exception(
            "Unhandled request error | method=%s path=%s duration_ms=%s",
            request.method,
            request.url.path,
            duration_ms,
        )
        raise

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "Request completed | method=%s path=%s status=%s duration_ms=%s",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.get("/health")
def health():
    return {"status": "ok", "environment": ENVIRONMENT}


app.include_router(products_router)
app.include_router(delivery_router)
app.include_router(orders_router)
app.include_router(cart_router)
app.include_router(shop_router)
app.include_router(admin_router)