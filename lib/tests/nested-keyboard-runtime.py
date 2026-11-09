"""Проверяет последовательность меню на сгенерированных обработчиках и Dispatcher aiogram."""

import ast
import asyncio
import logging
import sys
from datetime import datetime, timezone

from aiogram import Bot, Dispatcher, types
from aiogram.client.session.base import BaseSession
from aiogram.methods import AnswerCallbackQuery, EditMessageReplyMarkup, SendMessage
from aiogram.utils.keyboard import InlineKeyboardBuilder


def buttons(message):
    """Возвращает подписи и цели кнопок сообщения в порядке отображения."""
    return [(button.text, button.callback_data) for row in message.reply_markup.inline_keyboard for button in row]


class Session(BaseSession):
    """Имитирует только Telegram API, сохраняя настоящую логику сгенерированного бота."""

    def __init__(self):
        super().__init__()
        self.sent = []
        self.edited = []

    async def close(self):
        """Соединения не открываются."""

    async def stream_content(self, *args, **kwargs):
        """Загрузка файлов в этом сценарии не нужна."""
        yield b""

    async def make_request(self, bot, method, timeout=None):
        """Сохраняет сообщения и изменения клавиатур без внешних запросов."""
        if isinstance(method, AnswerCallbackQuery):
            return True
        if isinstance(method, SendMessage):
            message = types.Message(
                message_id=100 + len(self.sent), date=datetime.now(timezone.utc),
                chat=types.Chat(id=7, type="private"), text=method.text, reply_markup=method.reply_markup,
            )
            self.sent.append(message)
            return message
        if isinstance(method, EditMessageReplyMarkup):
            message = next(message for message in self.sent if message.message_id == method.message_id)
            updated = message.model_copy(update={"reply_markup": method.reply_markup})
            self.edited.append(updated)
            return updated
        raise AssertionError(f"Неожиданная операция: {type(method)}")


async def check(source):
    """Запускает приветствие, выбор статуса и выбор коннектора на реальных обработчиках."""
    compile(source, "bot.py", "exec")
    tree = ast.parse(source)
    names = {"handle_callback_" + name for name in ["greeting", "connectors", "one", "two", "restart"]}
    handlers = [item for item in tree.body if isinstance(item, ast.AsyncFunctionDef) and item.name in names]
    assert len(handlers) == len(names)
    session = Session()
    bot = Bot("123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk", session=session)
    dp = Dispatcher()
    user_data = {}

    async def init_vars(user_id):
        """Возвращает локальные переменные пользователя без БД."""
        return user_data.setdefault(user_id, {})

    scope = {"dp": dp, "bot": bot, "types": types, "FSMContext": object, "logging": logging,
             "InlineKeyboardBuilder": InlineKeyboardBuilder, "InlineKeyboardButton": types.InlineKeyboardButton,
             "user_data": user_data, "init_all_user_vars": init_vars,
             "replace_variables_in_text": lambda value, *args: value}
    exec(compile(ast.Module(body=handlers, type_ignores=[]), "handlers.py", "exec"), scope)
    user = types.User(id=7, is_bot=False, first_name="Тест")

    async def click(data, message, update_id):
        """Отправляет выбор пользователя через реальный маршрутизатор aiogram."""
        callback = types.CallbackQuery(id=str(update_id), chat_instance="chat", from_user=user,
                                       message=message, data=data)
        await dp.feed_update(bot, types.Update(update_id=update_id, callback_query=callback))

    entry = types.Message(message_id=1, date=datetime.now(timezone.utc), chat=types.Chat(id=7, type="private"))
    await click("greeting", entry, 1)
    assert len(session.sent) == 1
    assert session.edited == [], "Подменю открылось до нажатия"
    initial = session.sent[0]
    assert initial.text == "Здравствуйте"
    assert buttons(initial) == [("Статус коннектора", "connectors"), ("Перезагрузить станцию", "restart")]

    await click("connectors", initial, 2)
    assert len(session.sent) == 1, "Подменю должно менять кнопки существующего сообщения"
    assert len(session.edited) == 1
    submenu = session.edited[0]
    assert submenu.message_id == initial.message_id and submenu.text == initial.text
    assert buttons(submenu) == [("Коннектор 1", "one"), ("Коннектор 2", "two")]

    await click("one", submenu, 3)
    assert len(session.sent) == 2
    assert session.sent[-1].text == "Выбран коннектор 1"
    await bot.session.close()


asyncio.run(check(sys.stdin.read()))
print("OK")
