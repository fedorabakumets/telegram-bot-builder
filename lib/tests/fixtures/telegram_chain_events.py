"""@fileoverview Имитация получения событий Telegram без реального подключения."""
from types import SimpleNamespace

from aiohttp import web
from telethon import events


class FakeEventEmitter:
    """Хранит зарегистрированные обработчики настоящего брокера."""
    def __init__(self):
        """Создаёт список подписок, независимый от потребителей раннера."""
        self.event_handlers = []

    def add_event_handler(self, callback, event=None):
        """Запоминает обработчик и настоящий фильтр Telethon."""
        self.event_handlers.append((callback, event))

    def remove_event_handler(self, callback, event=None):
        """Удаляет только указанную подписку."""
        before = len(self.event_handlers)
        self.event_handlers = [(handler, builder) for handler, builder in self.event_handlers
                               if handler != callback or (event is not None and type(builder) is not type(event))]
        return before - len(self.event_handlers)

    async def emit(self, kind, chat_id, text):
        """Передаёт синтетическое новое или отредактированное сообщение брокеру."""
        message = SimpleNamespace(id=101, text=text, raw_text=text, sender_id=42,
                                  out=False, media=None, date=None, edit_date=None, buttons=[], chat_id=chat_id)
        event = SimpleNamespace(chat_id=chat_id, message=message)
        expected = events.MessageEdited if kind == "edited" else events.NewMessage
        for callback, builder in tuple(self.event_handlers):
            if type(builder) is expected:
                await callback(event)


def register_event_routes(app, client):
    """Добавляет только в изолированный стенд управление имитацией событий."""
    async def emit(request):
        """Принимает исключительно тестовые данные без доступа к Telegram."""
        value = await request.json()
        assert value["kind"] in ("new", "edited")
        await client.emit(value["kind"], int(value["chat_id"]), str(value["text"]))
        return web.json_response({"ok": True, "handlers": len(client.event_handlers)})

    app.router.add_post("/test/emit", emit)
