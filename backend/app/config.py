import os
from dotenv import load_dotenv

load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/fishshop",
).strip()

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "").strip()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "").strip()
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "").strip()
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))

PUBLIC_BACKEND_URL = os.getenv("PUBLIC_BACKEND_URL", "http://127.0.0.1:8000").strip()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]


def validate_required_settings() -> None:
    required = {
        "DATABASE_URL": DATABASE_URL,
        "PUBLIC_BACKEND_URL": PUBLIC_BACKEND_URL,
    }

    missing = [key for key, value in required.items() if not value]
    if missing:
        raise RuntimeError(
            f"Missing required environment variables: {', '.join(missing)}"
        )

    if ENVIRONMENT == "production":
        production_required = {
            "ADMIN_USERNAME": ADMIN_USERNAME,
            "ADMIN_PASSWORD": ADMIN_PASSWORD,
            "JWT_SECRET_KEY": JWT_SECRET_KEY,
            "TELEGRAM_BOT_TOKEN": TELEGRAM_BOT_TOKEN,
        }

        missing_prod = [key for key, value in production_required.items() if not value]
        if missing_prod:
            raise RuntimeError(
                "Missing required production environment variables: "
                + ", ".join(missing_prod)
            )

        if not ALLOWED_ORIGINS:
            raise RuntimeError(
                "ALLOWED_ORIGINS must be configured in production"
            )