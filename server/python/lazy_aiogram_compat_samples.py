"""@fileoverview Образцы проверки совместимости ленивых моделей с обычным импортом."""
from __future__ import annotations


def compatibility_samples():
    """Проверяет вложенные модели, псевдонимы полей и пользовательские ссылки.

    @returns Детерминированные сериализованные результаты без сетевых запросов
    """
    from aiogram.methods import SendMediaGroup, SetChatMenuButton
    from aiogram.types import Update
    from pydantic import BaseModel, ConfigDict, Field

    update = Update.model_validate({
        "update_id": 2,
        "message": {
            "message_id": 7, "date": 0,
            "from": {"id": 4, "is_bot": False, "first_name": "Анна"},
            "chat": {"id": 4, "type": "private"},
            "photo": [{"file_id": "photo", "file_unique_id": "unique", "width": 8, "height": 9}],
            "entities": [{"type": "bold", "offset": 0, "length": 1}],
            "reply_markup": {"inline_keyboard": [[{
                "text": "Открыть", "web_app": {"url": "https://example.com"},
            }]]},
        },
    })
    media = SendMediaGroup.model_validate({
        "chat_id": 4,
        "media": [{"type": "photo", "media": "photo"}, {"type": "video", "media": "video"}],
    })
    menu = SetChatMenuButton.model_validate({
        "chat_id": 4,
        "menu_button": {"type": "web_app", "text": "Меню", "web_app": {"url": "https://example.com"}},
    })

    class OwnChat(BaseModel):
        """Пользовательский тип с именем, конфликтующим с именами aiogram."""

        # Значение пользовательского поля, передаваемое через псевдоним.
        value: int = Field(alias="external")

    class OwnModel(BaseModel):
        """Отложенная модель должна разрешать явный namespace пользователя."""

        model_config = ConfigDict(defer_build=True)
        # Ссылка намеренно не импортирует тип Chat из aiogram.
        nested: "Chat"

    OwnModel.model_rebuild(_types_namespace={"Chat": OwnChat})
    own = OwnModel.model_validate({"nested": {"external": 42}})
    if not isinstance(own.nested, OwnChat):
        raise AssertionError("Пользовательский namespace заменён именами aiogram")
    return {
        "update": update.model_dump_json(by_alias=True, exclude_unset=True),
        "media": media.model_dump_json(by_alias=True, exclude_unset=True),
        "menu": menu.model_dump_json(by_alias=True, exclude_unset=True),
        "own": own.model_dump_json(by_alias=True),
        "media_types": [type(item).__name__ for item in media.media],
        "menu_type": type(menu.menu_button).__name__,
    }
