"""@fileoverview Проверка конфигурации запуска бота по требованию."""

from bot_env_overlay import get_base_environ
import ast
from pathlib import Path


def build_markers(bot_file):
    """Читает маркеры без импорта кода и открытия его соединений."""
    tree = ast.parse(Path(bot_file).read_text(encoding="utf-8-sig"))
    markers = {}
    for statement in tree.body:
        if isinstance(statement, ast.Assign) and isinstance(statement.value, ast.Constant):
            for target in statement.targets:
                if isinstance(target, ast.Name):
                    markers[target.id] = statement.value.value
    return markers


def validate_build(bot_file):
    """Проверяет совместимость сборки без её импорта и открытия соединений."""
    markers = build_markers(bot_file)
    if not markers.get("_WORKER_EXTERNAL_UPDATES_PROTOCOL"):
        raise ValueError("Пересоберите бота: отсутствует протокол внешних обновлений")
    if not markers.get("_WORKER_EXTERNAL_UPDATES_SAFE"):
        raise ValueError("Фоновые возможности этого бота несовместимы с ondemand")
    if not markers.get("_WORKER_EXTERNAL_STATE_PROTOCOL"):
        raise ValueError("Пересоберите бота: отсутствует протокол сохранения состояния")


def resolve_settings(token_id, inline, webhook_url):
    """Возвращает настройки выбранного режима, отклоняя неверные значения."""
    values = {**get_base_environ(), **(inline or {})}
    mode = values.get("BOT_POLLING_MODE", "direct")
    if mode not in ("direct", "ondemand", "process"):
        raise ValueError("BOT_POLLING_MODE должен быть direct, ondemand или process")
    selected = values.get("BOT_ON_DEMAND_TOKEN_IDS", "").strip()
    ids = {int(value.strip()) for value in selected.split(",") if value.strip()}
    if mode == "direct" or (ids and token_id not in ids):
        return None
    if webhook_url:
        raise ValueError("Режим ondemand пока несовместим с webhook")
    redis_url = values.get("REDIS_URL")
    if not redis_url:
        raise ValueError("Для режима ondemand требуется REDIS_URL")
    idle = float(values.get("BOT_ON_DEMAND_IDLE_SECONDS", "30"))
    maximum = int(values.get("BOT_ON_DEMAND_MAX_ACTIVE", "0"))
    if not 0.1 <= idle <= 86400 or not 0 <= maximum <= 64:
        raise ValueError("Недопустимые ограничения режима ondemand")
    return {"mode": mode, "redis_url": redis_url, "idle": idle, "maximum": maximum}
