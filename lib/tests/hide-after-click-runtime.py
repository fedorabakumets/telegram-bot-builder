"""Проверяет сгенерированное скрытие клавиатуры через настоящий Dispatcher aiogram."""

import ast
import asyncio
import logging
import sys
from datetime import datetime, timezone

from aiogram import Bot, Dispatcher, types
from aiogram.client.session.base import BaseSession
from aiogram.methods import EditMessageReplyMarkup, EditMessageText


class Session(BaseSession):
    """Заменяет только транспорт Telegram, сохраняя настоящую обработку событий."""

    def __init__(self):
        super().__init__()
        self.calls = []
        self.fail = False

    async def close(self):
        """Транспорт не открывает соединений."""

    async def stream_content(self, *args, **kwargs):
        """Загрузка файлов для проверки не требуется."""
        yield b""

    async def make_request(self, bot, method, timeout=None):
        """Проверяет снятие клавиатуры без удаления сообщения."""
        if isinstance(method, EditMessageText):
            assert method.reply_markup is None, "Редактирование вернуло снятые кнопки"
            self.calls.append("edit")
            return True
        assert isinstance(method, EditMessageReplyMarkup), type(method)
        assert method.reply_markup is None
        self.calls.append("hide")
        if self.fail:
            raise RuntimeError("Telegram недоступен")
        return True


async def check(source):
    """Проверяет порядок действий, независимость от целевого типа и продолжение цепочки."""
    compile(source, "bot.py", "exec")
    tree = ast.parse(source)
    middleware = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef)
                      and n.name == "hide_after_click_middleware")
    dp = Dispatcher()
    scope = {"types": types, "logging": logging}
    exec(compile(ast.Module(body=[middleware], type_ignores=[]), "middleware.py", "exec"), scope)
    dp.callback_query.middleware(scope["hide_after_click_middleware"])
    session = Session()
    bot = Bot("123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk", session=session)
    received = []

    async def target(event, data=None):
        """Имитирует действие целевого блока и проверяет сохранение данных кнопки."""
        received.append(event)
        session.calls.append("target")
        assert event.message.reply_markup.inline_keyboard[0][0].text
        return "continued"

    dp.callback_query.register(target)

    async def send(callback_data, text, hide, fail=False):
        """Проводит нажатие через настоящий Dispatcher без запросов к Telegram."""
        session.calls.clear()
        session.fail = fail
        message = types.Message(
            message_id=10, date=datetime.now(timezone.utc),
            chat=types.Chat(id=7, type="private"), text="Меню",
            reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[[
                types.InlineKeyboardButton(text=text, callback_data=callback_data)
            ]]),
        )
        callback = types.CallbackQuery(id="click", from_user=types.User(id=7, is_bot=False, first_name="Тест"),
                                       chat_instance="chat", data=callback_data, message=message)
        result = await dp.feed_update(bot, types.Update(update_id=len(received), callback_query=callback))
        assert result == "continued"
        assert session.calls == (["hide", "target"] if hide else ["target"]), session.calls
        assert bool(getattr(received[-1].message, "_hide_after_click_removed", False)) == (hide and not fail)

    targets = ["message", "condition", "set_variable", "delay", "http_request", "edit_message",
               "delete_message", "keyboard", "media", "code", "forward_message", "stop_processing", "input"]
    for kind in targets:
        await send("target_" + kind, kind, True)
    await send("custom_42", "Выбор 42", True)
    await send("target_delay", "Обновлённый текст кнопки", True)
    await send("target_message", "Оставить", False)
    await send("unrelated", "message", False)
    await send("target_message", "message", True, fail=True)
    await send("target_message", "message", True)
    middleware_fn = scope["hide_after_click_middleware"]
    fake = received[-1].model_copy(update={"_is_fake": True})
    session.calls.clear()
    await middleware_fn(target, fake, {})
    assert session.calls == ["target"]

    # Проверяем настоящий сгенерированный edit_message после промежуточного перехода.
    edit = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef)
                and n.name == "handle_callback_target_edit_message")
    edit.decorator_list = []

    async def init_vars(user_id):
        """Переменные для исполнения реального обработчика редактирования."""
        return {}

    scope.update({"bot": bot, "FSMContext": object, "user_data": {},
                  "init_all_user_vars": init_vars,
                  "replace_variables_in_text": lambda value, *args: value})
    exec(compile(ast.Module(body=[edit], type_ignores=[]), "edit.py", "exec"), scope)
    session.calls.clear()
    await scope["handle_callback_target_edit_message"](received[-1])
    assert session.calls == ["edit"]

    async def broken(event, data):
        """Ошибка целевого узла должна дойти до штатной обработки ошибок."""
        raise ValueError("Ошибка целевого узла")

    try:
        await middleware_fn(broken, fake, {})
    except ValueError:
        pass
    else:
        raise AssertionError("Middleware проглотил ошибку целевого узла")
    await bot.session.close()


asyncio.run(check(sys.stdin.read()))
print("OK")
