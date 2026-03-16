import os
import logging
from dotenv import load_dotenv

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
WEBAPP_URL = os.getenv("TELEGRAM_WEBAPP_URL", "")

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return

    if not WEBAPP_URL:
        await update.message.reply_text(
            "Магазин временно недоступен. Не настроен адрес приложения."
        )
        return

    keyboard = [
        [
            InlineKeyboardButton(
                text="Открыть магазин",
                web_app=WebAppInfo(url=WEBAPP_URL),
            )
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    text = (
        "🐟 Добро пожаловать в магазин «Бавария Рыба».\n\n"
        "Как оформить заказ:\n"
        "1. Нажмите кнопку «Открыть магазин».\n"
        "2. Добавьте нужные товары в корзину.\n"
        "3. Укажите имя, телефон, город и точку выдачи.\n"
        "4. Нажмите «Сохранить заказ».\n\n"
        "После сохранения вы получите сообщение с составом заказа и примерной суммой.\n"
        "До окончания приёма заявок заказ можно изменить."
    )

    await update.message.reply_text(text, reply_markup=reply_markup)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return

    await update.message.reply_text(
        "Используйте команду /start, чтобы открыть магазин и оформить заказ."
    )


def main() -> None:
    if not BOT_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is not set")

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))

    logger.info("Bot started")
    app.run_polling()


if __name__ == "__main__":
    main()