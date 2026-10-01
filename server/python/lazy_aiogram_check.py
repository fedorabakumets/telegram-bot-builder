"""
@fileoverview Проверка ленивой сборки моделей aiogram (запускается из lazyAiogram.test.ts).

Режимы (argv[1]):
  lazy     — импорт через lazy_aiogram.enable()
  eager    — обычный импорт aiogram
  disabled — enable() при AIOGRAM_LAZY_MODELS=false

Печатает в stdout один JSON с результатами.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List

sys.path.insert(0, str(Path(__file__).resolve().parent))


def rss_mb() -> int:
    """
    Текущий RSS процесса
    @returns RSS в МБ (0, если /proc недоступен)
    """
    try:
        with open("/proc/self/status") as f:
            for line in f:
                if line.startswith("VmRSS"):
                    return int(line.split()[1]) // 1024
    except OSError:
        pass
    return 0


def model_classes() -> List[type]:
    """
    Собирает все модели pydantic из aiogram.types и aiogram.methods
    @returns список классов моделей
    """
    import aiogram.methods as methods
    import aiogram.types as types
    import pydantic

    result = []
    for mod in (types, methods):
        for name in mod.__all__:
            cls = getattr(mod, name, None)
            if isinstance(cls, type) and issubclass(cls, pydantic.BaseModel):
                result.append(cls)
    return result


def sample_requests() -> List[str]:
    """
    Сериализует типовые запросы Bot API так же, как это делает сессия aiogram
    @returns список JSON-строк запросов
    """
    from aiogram import Bot
    from aiogram.methods import EditMessageText, SendMessage, SetMyCommands
    from aiogram.types import (
        BotCommand,
        InlineKeyboardButton,
        InlineKeyboardMarkup,
        KeyboardButton,
        ReplyKeyboardMarkup,
    )

    bot = Bot("123456:TEST")
    calls = [
        SendMessage(
            chat_id=1,
            text="t",
            reply_markup=InlineKeyboardMarkup(
                inline_keyboard=[[InlineKeyboardButton(text="a", callback_data="b")]]
            ),
        ),
        SendMessage(
            chat_id=1,
            text="t",
            reply_markup=ReplyKeyboardMarkup(keyboard=[[KeyboardButton(text="a")]], resize_keyboard=True),
        ),
        EditMessageText(chat_id=1, message_id=1, text="e"),
        SetMyCommands(commands=[BotCommand(command="start", description="s")]),
    ]
    return [
        json.dumps(bot.session.prepare_value(m.model_dump(warnings=False), bot=bot, files={}), sort_keys=True)
        for m in calls
    ]


def parse_update() -> str:
    """
    Разбирает callback-апдейт с вложенными сообщением и клавиатурой
    @returns текст первой кнопки из разобранного апдейта
    """
    from aiogram.types import Update

    raw = {
        "update_id": 1,
        "callback_query": {
            "id": "1",
            "chat_instance": "c",
            "data": "d",
            "from": {"id": 1, "is_bot": False, "first_name": "a"},
            "message": {
                "message_id": 1,
                "date": 0,
                "chat": {"id": 1, "type": "private"},
                "text": "hi",
                "reply_markup": {"inline_keyboard": [[{"text": "x", "callback_data": "y"}]]},
            },
        },
    }
    update = Update.model_validate(raw)
    return update.callback_query.message.reply_markup.inline_keyboard[0][0].text


def build_all(classes: List[type]) -> List[str]:
    """
    Принудительно строит схемы всех моделей
    @param classes - Классы моделей
    @returns список ошибок сборки "Имя: сообщение"
    """
    errors = []
    for cls in classes:
        try:
            cls.model_rebuild(raise_errors=True)
            if not cls.__pydantic_complete__:
                errors.append(f"{cls.__name__}: не собрана")
        except Exception as exc:
            errors.append(f"{cls.__name__}: {str(exc)[:120]}")
    return errors


def safe(fn) -> Any:
    """
    Выполняет проверку, превращая исключение в строку ошибки
    @param fn - Функция проверки без аргументов
    @returns результат функции или "ERROR: ..." при исключении
    """
    try:
        return fn()
    except Exception as exc:
        return f"ERROR: {type(exc).__name__}: {str(exc)[:200]}"


def main() -> None:
    """Выполняет проверку в режиме из argv[1] и печатает JSON"""
    mode = sys.argv[1] if len(sys.argv) > 1 else "lazy"
    before = rss_mb()
    applied = None
    if mode in ("lazy", "disabled"):
        if mode == "disabled":
            os.environ["AIOGRAM_LAZY_MODELS"] = "false"
        import lazy_aiogram

        applied = lazy_aiogram.enable()
    import aiogram.types  # noqa: F401
    from aiogram import Bot, Dispatcher  # noqa: F401
    import pydantic

    import_mb = rss_mb() - before
    classes = model_classes()
    incomplete = sum(1 for c in classes if not c.__pydantic_complete__)

    class OwnModel(pydantic.BaseModel):
        """Модель «кода бота», созданная после патча: должна собираться сразу"""

        value: int = 0

    result: Dict[str, Any] = {
        "mode": mode,
        "applied": applied,
        "import_mb": import_mb,
        "models": len(classes),
        "incomplete_after_import": incomplete,
        "own_model_complete": OwnModel.__pydantic_complete__,
        "button_text": safe(parse_update),
        "requests": safe(sample_requests),
        "build_errors": build_all(classes),
    }
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
