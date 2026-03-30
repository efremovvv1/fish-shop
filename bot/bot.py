import os
import logging
from dotenv import load_dotenv

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
WEBAPP_URL = os.getenv("TELEGRAM_WEBAPP_URL", "")

logging.basicConfig(
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return

    if not WEBAPP_URL:
        logger.error("TELEGRAM_WEBAPP_URL is not configured")
        await update.message.reply_text(
            "Магазин временно недоступен. Не настроен адрес приложения."
        )
        return

    keyboard = [[
        InlineKeyboardButton(
            text="Открыть магазин",
            web_app=WebAppInfo(url=WEBAPP_URL),
        )
    ]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    text = (
        "🐟 Добро пожаловать в магазин «Бавария Рыба».\n\n"
        "Как оформить заказ:\n"
        "1. Нажмите кнопку «Открыть магазин».\n"
        "2. Добавьте нужные товары в корзину.\n"
        "3. Заполните данные для выдачи.\n"
        "4. Сохраните заказ.\n\n"
        "После сохранения заказа вы получите уведомление в Telegram."
    )

    logger.info(
        "User started bot: telegram_user_id=%s username=%s",
        update.effective_user.id if update.effective_user else None,
        update.effective_user.username if update.effective_user else None,
    )

    await update.message.reply_text(text, reply_markup=reply_markup)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return

    await update.message.reply_text(
        "Используйте /start, чтобы открыть магазин и оформить заказ."
    )


async def chat_id_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return

    await update.message.reply_text(
        f"Ваш Telegram user id: {update.effective_user.id}"
    )


def main() -> None:
    if not BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is not set")

    if not WEBAPP_URL:
        logger.warning("TELEGRAM_WEBAPP_URL is not set")

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("chatid", chat_id_command))

    logger.info("Bot started")
    app.run_polling()


if __name__ == "__main__":
    main()