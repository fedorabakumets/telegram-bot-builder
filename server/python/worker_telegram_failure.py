"""@fileoverview Достоверное событие заморозки из объекта исключения aiogram, без анализа произвольных логов."""
import hashlib
import re
import sys
from contextvars import ContextVar

# Идентичность наследуется задачами запуска и не подменяется регистрацией следующего бота с тем же ID.
current_failure_identity = ContextVar("worker_failure_identity", default=None)


def frozen_event(exc, token_id, token, launch_id):
    """Проверяет настоящий тип TelegramBadRequest и связывает отказ с секретом и запуском источника."""
    exceptions = sys.modules.get("aiogram.exceptions")
    bad_request = getattr(exceptions, "TelegramBadRequest", None)
    if not isinstance(bad_request, type) or not isinstance(exc, bad_request):
        return None
    if getattr(exc, "message", None) not in ("FROZEN_METHOD_INVALID", "Bad Request: FROZEN_METHOD_INVALID"):
        return None
    method = getattr(getattr(exc, "method", None), "__api_method__", None)
    if not isinstance(method, str) or not re.fullmatch(r"[a-z][A-Za-z0-9]{0,79}", method):
        return None
    try:
        launch_id = int(launch_id)
    except (ValueError, TypeError):
        return None
    if isinstance(token_id, bool) or not isinstance(token_id, int) or token_id <= 0 or launch_id <= 0:
        return None
    if not isinstance(token, str) or not token:
        return None
    return {"type": "bot_runtime_error", "token_id": token_id, "launch_id": launch_id,
            "code": "telegram_frozen", "source": "telegram_bot_api", "method": method,
            "tokenFingerprint": hashlib.sha256(token.encode("utf-8")).hexdigest()}
