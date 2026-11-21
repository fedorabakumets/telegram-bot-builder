"""@fileoverview Проверка готовности брокера без открытия Telegram-сессий."""

from aiohttp import web


def readiness_handler(broker, ownership):
    """Создаёт безопасный HTTP-обработчик готовности процесса и владельца Redis."""
    async def ready(_request):
        """Не возвращает реквизиты аккаунтов и не обращается к Telegram."""
        available = not broker.closed
        if available and ownership:
            try:
                await ownership.check()
            except Exception:
                available = False
        return web.json_response({"status": "ready" if available else "unavailable"},
                                 status=200 if available else 503)
    return ready
