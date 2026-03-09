from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.products import router as products_router
from app.routes.delivery import router as delivery_router
from app.routes.orders import router as orders_router

app = FastAPI(title="Fish Shop MVP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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