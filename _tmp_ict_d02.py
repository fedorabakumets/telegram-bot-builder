"""
PhaseICT_d02 - Telegram Bot
Сгенерировано с помощью TelegramBot Builder
"""

# -*- coding: utf-8 -*-
import os
import sys

# Устанавливаем UTF-8 кодировку для вывода
if sys.platform.startswith("win"):
    # Для Windows устанавливаем UTF-8 кодировку
    os.environ["PYTHONIOENCODING"] = "utf-8"
    try:
        import codecs
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except (AttributeError, UnicodeError):
        # Fallback для старых версий Python
        import codecs
        sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
        sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())


import asyncio
import logging
import signal

from aiogram import Bot, Dispatcher, types, F, BaseMiddleware
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    BotCommand,
    ReplyKeyboardRemove,
    FSInputFile,
    CopyTextButton,
    WebAppInfo
)
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from typing import Optional, Callable, Awaitable, Any

from dotenv import load_dotenv
from aiogram.filters import CommandStart, Command

import re
from types import SimpleNamespace


# Загрузка переменных окружения из .env файла
load_dotenv()


# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = os.getenv("BOT_TOKEN")


# Настройка логирования с поддержкой UTF-8
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)


# Подавление всех сообщений от asyncpg (настраивается через .env)
if os.getenv("DISABLE_ASYNC_LOG", "true").lower() == "true":
    logging.getLogger("asyncpg").setLevel(logging.CRITICAL)


# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


# Список администраторов (загружается из .env)
ADMIN_IDS = [int(x.strip()) for x in os.getenv("ADMIN_IDS", "").replace(" ", "").split(",") if x.strip()]


# Директория проекта
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
logging.info(f"📁 PROJECT_DIR: {PROJECT_DIR}")


# Хранилище пользователей (временное состояние)
user_data = {}


# Утилитарные функции

# TTL для записей user_data (секунды)
USER_DATA_TTL = 3600
# Метки времени последней активности пользователей
_user_last_seen: dict[int, float] = {}


async def cleanup_user_data() -> None:
    """Фоновая задача: удаляет записи user_data, неактивные дольше USER_DATA_TTL секунд.

    Запускается один раз при старте бота и работает в бесконечном цикле.
    Предотвращает бесконечный рост глобального словаря user_data.
    """
    import time
    while True:
        await asyncio.sleep(USER_DATA_TTL)
        now = time.monotonic()
        expired = [uid for uid, ts in _user_last_seen.items() if now - ts > USER_DATA_TTL]
        for uid in expired:
            user_data.pop(uid, None)
            _user_last_seen.pop(uid, None)
        if expired:
            logging.debug(f"🧹 TTL-очистка user_data: удалено {len(expired)} записей")

def get_user_variables(user_id):
    return user_data.get(user_id, {})


async def init_user_variables(user_id: int, from_user) -> str:
    """Инициализирует переменные пользователя в локальном хранилище.
    Обновляет метку времени активности для TTL-очистки.

    Args:
        user_id (int): ID пользователя Telegram
        from_user: Объект пользователя aiogram (types.User)

    Returns:
        str: Имя пользователя (username или first_name)
    """
    import time
    _user_last_seen[user_id] = time.monotonic()
    if user_id not in user_data:
        user_data[user_id] = {}
    username = getattr(from_user, 'username', None) or ''
    first_name = getattr(from_user, 'first_name', None) or ''
    last_name = getattr(from_user, 'last_name', None) or ''
    user_name = username or first_name or str(user_id)
    user_data[user_id]['username'] = username
    user_data[user_id]['first_name'] = first_name
    user_data[user_id]['last_name'] = last_name
    user_data[user_id]['user_name'] = user_name
    user_data[user_id]['user_id'] = user_id
    user_data[user_id]['language_code'] = getattr(from_user, 'language_code', None) or ''
    user_data[user_id]['is_premium'] = getattr(from_user, 'is_premium', None) or False
    user_data[user_id]['is_bot'] = getattr(from_user, 'is_bot', None) or False
    return user_name
async def check_auth(user_id: int) -> bool:
    return user_id in user_data


async def init_all_user_vars(user_id: int) -> dict:
    """Собирает все переменные пользователя из локального хранилища и БД

    Returns:
        dict: Объединённый словарь всех переменных пользователя
    """
    all_vars = dict(user_data.get(user_id, {}))
    return all_vars
async def save_message_to_api(user_id, message_type: str, message_text: str = None, node_id: str = None, message_data: dict = None):
    """Заглушка save_message_to_api когда БД отключена"""
    return None


async def set_user_var(user_id: int, key: str, value) -> None:
    """Сохраняет переменную пользователя в локальное хранилище и БД.

    Args:
        user_id (int): ID пользователя Telegram
        key (str): Имя переменной
        value: Значение переменной
    """
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id][key] = value


def replace_variables_in_text(text: str, variables: dict, filters: dict = None) -> str:
    """Заменяет переменные вида {var_name} в тексте на их значения

    Args:
        text: Исходный текст с переменными
        variables: Словарь переменных для подстановки
        filters: Словарь фильтров форматирования (опционально)

    Returns:
        str: Текст с подставленными значениями
    """
    if not text or not variables:
        return text or ''
    result = text
    for key, value in variables.items():
        if value is not None:
            result = result.replace('{' + str(key) + '}', str(value))
    return result

async def navigate_to_node(message, node_id: str, text: str = None, all_user_vars: dict = None, reply_markup=None):
    """Навигация к указанному узлу с отправкой сообщения"""
    user_id = message.from_user.id

    if all_user_vars is None:
        all_user_vars = await init_all_user_vars(user_id)

    if text is None:
        text = "Привет! Добро пожаловать!"

    variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})
    text = replace_variables_in_text(text, all_user_vars, variable_filters)

    logging.info(f"🚀 Навигация к узлу: {node_id}")
    if reply_markup:
        await message.answer(text, reply_markup=reply_markup)
    else:
        await message.answer(text)


# Middleware триггеров входящих callback_query


# Middleware триггеров входящих callback_query
async def incoming_callback_trigger_ict1_middleware(handler, event: types.CallbackQuery, data: dict):
    """Срабатывает на каждое нажатие инлайн-кнопки пользователем"""
    try:
        user_id = event.from_user.id
        logging.info(f"Нажатие кнопки от {user_id} — триггер узла ict1")
        # Сохраняем данные нажатой кнопки
        if user_id not in user_data:
            user_data[user_id] = {}
        user_data[user_id]["callback_data"] = event.data or ""
        # Читаем текст кнопки из reply_markup
        _ict_btn_text = ""
        try:
            if event.data and event.message and hasattr(event.message, "reply_markup"):
                _rm = event.message.reply_markup
                if _rm and hasattr(_rm, "inline_keyboard"):
                    for _row in _rm.inline_keyboard:
                        for _btn in _row:
                            if getattr(_btn, "callback_data", None) == event.data:
                                _ict_btn_text = _btn.text or ""
                                break
                        if _ict_btn_text:
                            break
        except Exception:
            pass
        user_data[user_id]["button_text"] = _ict_btn_text

        class MockCallback:
            def __init__(self, data, user, msg):
                self.data = data
                self.from_user = user
                self.message = msg
                self._is_fake = True

            async def answer(self, *args, **kwargs):
                pass

            async def edit_text(self, text, **kwargs):
                try:
                    return await self.message.edit_text(text, **kwargs)
                except Exception as e:
                    logging.warning(f"Не удалось отредактировать сообщение: {e}")
                    return await self.message.answer(text, **kwargs)

        mock_callback = MockCallback("kb1", event.from_user, event.message)
        await handle_callback_kb1(mock_callback)
    except Exception as e:
        logging.error(f"Ошибка в incoming_callback_trigger middleware: {e}")

    return await handler(event, data)

dp.callback_query.middleware(incoming_callback_trigger_ict1_middleware)


# @@NODE_START:kb1@@

@dp.callback_query(lambda c: c.data == "kb1")
async def handle_callback_kb1(callback_query: types.CallbackQuery):
    """Обработчик keyboard-ноды kb1 без самостоятельной отправки сообщения."""
    try:
        user_id = callback_query.from_user.id
        logging.info(f"⌨️ Keyboard node kb1 вызвана для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка в keyboard node kb1: {e}")
        return
    return
# @@NODE_END:kb1@@

# @@NODE_START:msg1@@


@dp.callback_query(lambda c: c.data == "msg1" or c.data.startswith("msg1_btn_"))
async def handle_callback_msg1(callback_query: types.CallbackQuery):
    """Обработчик перехода к узлу msg1"""
    user_id = callback_query.from_user.id
    logging.info(f"🔵 Переход к узлу msg1 для пользователя {user_id}")

    _pressed_cb = getattr(callback_query, 'data', None)
    if _pressed_cb and not getattr(callback_query, '_is_fake', False):
        logging.info(f"🖱️ Пользователь {user_id} нажал кнопку с callback_data=\"{_pressed_cb}\"")
    # Сохраняем данные нажатой кнопки для использования в переменных {callback_data} и {button_text}
    if user_id not in user_data:
        user_data[user_id] = {}
    # Не перезаписываем если это fake callback (вызов из middleware/триггера) — реальные данные уже сохранены
    if not getattr(callback_query, '_is_fake', False):
        user_data[user_id]["callback_data"] = _pressed_cb or ""
        # Читаем текст кнопки из reply_markup сообщения — Telegram хранит его там
        _btn_text_found = ""
        try:
            if _pressed_cb and callback_query.message and hasattr(callback_query.message, "reply_markup"):
                _rm = callback_query.message.reply_markup
                if _rm and hasattr(_rm, "inline_keyboard"):
                    for _row in _rm.inline_keyboard:
                        for _btn in _row:
                            if getattr(_btn, "callback_data", None) == _pressed_cb:
                                _btn_text_found = _btn.text or ""
                                break
                        if _btn_text_found:
                            break
        except Exception:
            pass
        user_data[user_id]["button_text"] = _btn_text_found

    # Отвечаем на callback (чтобы убрать часы загрузки)
    try:
        await callback_query.answer()
    except Exception:
        pass

    
    username = callback_query.from_user.username
    first_name = callback_query.from_user.first_name
    last_name = callback_query.from_user.last_name

    # Сохранение в локальное хранилище
    if user_id not in user_data:
        user_data[user_id] = {}
    user_data[user_id]["username"] = username
    user_data[user_id]["first_name"] = first_name
    user_data[user_id]["last_name"] = last_name

    text = "Ответ"

    all_user_vars = await init_all_user_vars(user_id)
    text = replace_variables_in_text(text, all_user_vars, {})

    

    keyboard = None

    

    

    

    async def _send_to_msg1(_target_chat_id, _thread_id=None):
        """
        Отправляет сообщение (с медиа или без) в указанный чат.

        @param _target_chat_id - Идентификатор целевого чата
        @param _thread_id - Идентификатор треда (для групп с топиками), None если не нужен
        @returns Объект отправленного сообщения или None при ошибке
        """
        try:
            return await bot.send_message(_target_chat_id, text, reply_markup=keyboard, message_thread_id=_thread_id)
        except Exception as _send_err:
            logging.error(f"❌ Ошибка отправки в {_target_chat_id}: {_send_err}")
            return None

    sent_message = None
    sent_message = await _send_to_msg1(
        callback_query.message.chat.id,
        getattr(callback_query.message, "message_thread_id", None),
    )


# @@NODE_END:msg1@@

# Обработчики автопереходов

@dp.callback_query(lambda c: c.data == "ict1")
async def handle_callback_ict1(callback_query: types.CallbackQuery):
    try:
        user_id = callback_query.from_user.id
        callback_data = callback_query.data
        logging.info(f"🔵 Callback: handle_callback_ict1 для пользователя {user_id}")
    except Exception as e:
        logging.error(f"❌ Ошибка в handle_callback_ict1: {e}")
        return

    # Пытаемся ответить на callback (игнорируем ошибку если уже обработан)
    try:
        await callback_query.answer()
    except Exception:
        pass

    # Инициализируем базовые переменные пользователя
    user_name = await init_user_variables(user_id, callback_query.from_user)

    return


@dp.message(F.text)
async def fallback_text_handler(message: types.Message):
    """
    Fallback обработчик для всех текстовых сообщений без специфичного обработчика.
    """
    user_id = message.from_user.id
    user_text = message.text

    # Проверяем, ожидаем ли мы кнопочный ответ через reply клавиатуру

    if user_id in user_data and "button_response_config" in user_data[user_id]:
        config = user_data[user_id]["button_response_config"]
        user_text = message.text

        # Ищем выбранный вариант среди доступных опций
        selected_option = None
        for option in config.get("options", []):
            if option["text"] == user_text:
                selected_option = option
                break

        if selected_option:
            selected_value = selected_option["value"]
            selected_text = selected_option["text"]

            # Сохраняем ответ пользователя
            variable_name = config.get("variable", "button_response")
            timestamp = get_moscow_time()
            node_id = config.get("node_id", "unknown")

            response_data = {
                "value": selected_value,
                "text": selected_text,
                "type": "button_response",
                "timestamp": timestamp,
                "nodeId": node_id,
                "variable": variable_name
            }

            # Сохраняем в пользовательские данные
            user_data[user_id][variable_name] = response_data

            # Сохраняем в базу данных если включено
            if config.get("save_to_database"):
                await update_user_data_in_db(user_id, variable_name, response_data)
                logging.info(f"✅ Кнопочный ответ сохранен в БД: {variable_name} = {selected_text} (пользователь {user_id})")

            # Отправляем сообщение об успехе
            success_message = config.get("success_message", "Спасибо за ваш выбор!")
            await message.answer(f"{success_message}\n\n✅ Ваш выбор: {selected_text}", reply_markup=ReplyKeyboardRemove())

            # Очищаем состояние
            del user_data[user_id]["button_response_config"]

            logging.info(f"Получен кнопочный ответ через reply клавиатуру: {variable_name} = {selected_text}")

            # Навигация на основе действия кнопки
            option_action = selected_option.get("action", "goto")
            option_target = selected_option.get("target", "")
            option_url = selected_option.get("url", "")

            if option_action == "command" and option_target:

                # Выполнение команды
                command = option_target
                # Создаем фиктивное сообщение для выполнения команды
                fake_message = SimpleNamespace(
                    from_user=message.from_user,
                    chat=message.chat,
                    text=command,
                    message_id=message.message_id
                )

            elif option_action == "goto" and option_target:
                # Переход к узлу
                target_node_id = option_target
                try:
                    # Вызываем обработчик для целевого узла
                    _goto_handled = False

                    if target_node_id == "ict1":
                        _goto_handled = True
                        await handle_callback_ict1(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))

                    elif target_node_id == "kb1":
                        _goto_handled = True
                        await handle_callback_kb1(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))

                    elif target_node_id == "msg1":
                        _goto_handled = True
                        await handle_callback_msg1(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=target_node_id, message=message))

                    if not _goto_handled:
                        logging.warning(f"Неизвестный целевой узел: {target_node_id}")
                except Exception as e:
                    logging.error(f"Ошибка при переходе к узлу {target_node_id}: {e}")
            elif option_action not in ["command", "goto"]:
                # Fallback к старой системе next_node_id если нет action
                next_node_id = config.get("next_node_id")
                if next_node_id:
                    try:
                        # Вызываем обработчик для следующего узла
                        _next_handled = False

                        if next_node_id == "ict1":
                            _next_handled = True
                            await handle_callback_ict1(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))

                        elif next_node_id == "kb1":
                            _next_handled = True
                            await handle_callback_kb1(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))

                        elif next_node_id == "msg1":
                            _next_handled = True
                            await handle_callback_msg1(types.CallbackQuery(id="reply_nav", from_user=message.from_user, chat_instance="", data=next_node_id, message=message))

                        if not _next_handled:
                            logging.warning(f"Неизвестный следующий узел: {next_node_id}")
                    except Exception as e:
                        logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")
            return
        if not selected_option:
            # Неверный выбор - показываем доступные варианты
            available_options = [option["text"] for option in config.get("options", [])]
            options_text = "\n".join([f"• {opt}" for opt in available_options])
            await message.answer(f"❌ Неверный выбор. Пожалуйста, выберите один из предложенных вариантов:\n\n{options_text}")
            return

    # ИСПРАВЛЕНИЕ: Проверяем pending_skip_buttons для медиа-узлов (фото/видео/аудио)
    # Эта проверка нужна когда узел ожидает медиа, но пользователь нажал reply-кнопку с skipDataCollection

    # Проверяем, ожидаем ли мы текстовый ввод от пользователя (универсальная система)
    has_waiting_state = user_id in user_data and "waiting_for_input" in user_data[user_id]
    logging.info(f"DEBUG: Получен текст {message.text}, состояние ожидания: {has_waiting_state}")
    if user_id in user_data and "waiting_for_input" in user_data[user_id]:
        # Обрабатываем ввод через универсальную систему
        waiting_config = user_data[user_id]["waiting_for_input"]
        logging.info(f"DEBUG: waiting_config = {waiting_config}")
        logging.info(f"DEBUG: waiting_node_id = {waiting_config.get('node_id') if isinstance(waiting_config, dict) else waiting_config}")

        # Проверяем, что пользователь все еще находится в состоянии ожидания ввода
        if not waiting_config:
            logging.error(f"❌ waiting_config пустой! user_data[user_id] = {user_data.get(user_id)}")
            return  # Состояние ожидания пустое, игнорируем

        # Извлекаем конфигурацию из waiting_config (dict)
        waiting_node_id = waiting_config.get("node_id")
        input_type = waiting_config.get("type", "text")
        variable_name = waiting_config.get("variable", "user_response")
        save_to_database = waiting_config.get("save_to_database", False)
        min_length = waiting_config.get("min_length", 0)
        max_length = waiting_config.get("max_length", 0)
        next_node_id = waiting_config.get("next_node_id")
        appendVariable = waiting_config.get("appendVariable", False)
        user_text = message.text
        logging.info(f"DEBUG: input_type = {input_type}, variable_name = {variable_name}, next_node_id = {next_node_id}, appendVariable = {appendVariable}")
        # Проверяем, является ли тип ввода не-текстовым и должен обрабатываться отдельным runtime-хендлером
        if input_type in ["photo", "video", "audio", "document", "location", "contact"]:
            logging.info(f"Текстовый ввод от пользователя {user_id} проигнорирован - ожидается медиа ({input_type})")
            return
        # Валидация длины
        if min_length > 0 and len(user_text) < min_length:
            retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")
            await message.answer(f"❌ Слишком короткий ответ (минимум {min_length} символов). {retry_message}")
            return
        if max_length > 0 and len(user_text) > max_length:
            retry_message = waiting_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")
            await message.answer(f"❌ Слишком длинный ответ (максимум {max_length} символов). {retry_message}")
            return
        # КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Очищаем старое состояние ожидания перед навигацией
        if "waiting_for_input" in user_data[user_id]:
            del user_data[user_id]["waiting_for_input"]

        logging.info(f"✅ Переход к следующему узлу выполнен успешно")
        logging.info(f"Получен пользовательский ввод: {variable_name} = {user_text}")

        # ИСПРАВЛЕНИЕ: Проверяем, является ли текст кнопкой с skipDataCollection=true

        timestamp = get_moscow_time()
        response_data = user_text

        # Всегда сохраняем в локальное хранилище (для condition и других узлов)
        if user_id not in user_data:
            user_data[user_id] = {}
        user_data[user_id][variable_name] = response_data
        logging.info(f"✅ Сохранено в user_data: {variable_name} = {response_data}")

        # Дополнительно сохраняем в БД если доступна
        if db_pool:
            try:
                async with db_pool.acquire() as conn:
                    row = await conn.fetchrow(
                        "SELECT user_data FROM bot_users WHERE user_id = $1 AND project_id = $2",
                        user_id, PROJECT_ID
                    )
                    if row and row["user_data"]:
                        db_user_data = row["user_data"]
                        if isinstance(db_user_data, str):
                            try:
                                db_user_data = json.loads(db_user_data)
                            except:
                                db_user_data = {}
                        elif not isinstance(db_user_data, dict):
                            db_user_data = {}
                    if not (row and row["user_data"]):
                        db_user_data = {}
                    db_user_data[variable_name] = response_data
                    await conn.execute(
                        "UPDATE bot_users SET user_data = $1 WHERE user_id = $2 AND project_id = $3",
                        json.dumps(db_user_data, ensure_ascii=False), user_id, PROJECT_ID
                    )
                    logging.info(f"✅ Сохранено в bot_users: {variable_name} = {response_data}")
            except Exception as e:
                logging.error(f"❌ Ошибка сохранения в bot_users: {e}")

        # Навигация к следующему узлу
        if next_node_id:
            try:
                # Цикл для поддержки автопереходов
                while next_node_id:
                    logging.info(f"🚀 Переходим к узлу: {next_node_id}")
                    current_node_id = next_node_id
                    next_node_id = None  # Сбрасываем, будет установлен при автопереходе
                    # Проверяем навигацию к узлам
                    _node_handled = False

                    if not _node_handled:

                        if current_node_id == "ict1":
                            _node_handled = True
                            # Переход к узлу ict1

                            fake_callback = SimpleNamespace(
                                id="text_nav",
                                from_user=message.from_user,
                                chat_instance="",
                                data=current_node_id,
                                message=message,
                                answer=lambda *_args, **_kwargs: asyncio.sleep(0)
                            )
                            await handle_callback_ict1(fake_callback)
                            break

                        elif current_node_id == "kb1":
                            _node_handled = True
                            # Переход к узлу kb1

                            fake_callback = SimpleNamespace(
                                id="text_nav",
                                from_user=message.from_user,
                                chat_instance="",
                                data=current_node_id,
                                message=message,
                                answer=lambda *_args, **_kwargs: asyncio.sleep(0)
                            )
                            await handle_callback_kb1(fake_callback)
                            break

                        elif current_node_id == "msg1":
                            _node_handled = True
                            # Переход к узлу msg1

                            text = "Ответ"
                            user_data[user_id] = user_data.get(user_id, {})

                            await navigate_to_node(message, current_node_id, text=text)

                            break  # Нет автоперехода

                        if not _node_handled:
                            logging.warning(f"Неизвестный узел для навигации: {current_node_id}")
                            break
            except Exception as e:
                logging.error(f"Ошибка при переходе к узлу: {e}")

    if not (user_id in user_data and "waiting_for_input" in user_data.get(user_id, {})):
        if not user_data.get(user_id, {}).get("_imt_handled"):
            logging.info(f"📩 Получено необработанное текстовое сообщение от {message.from_user.id}: {message.text}")


@dp.message(F.photo)
async def handle_unhandled_photo(message: types.Message):
    """
    Обрабатывает фотографии, которые не были обработаны другими обработчиками.
    """
    logging.info(f"📸 Получено фото от пользователя {message.from_user.id}")


@dp.message()
async def handle_unhandled_message(message: types.Message):
    """
    Catch-all обработчик для всех остальных типов сообщений (стикеры, голосовые, видео и т.д.).
    Нужен чтобы middleware (incoming_message_trigger) срабатывал на любой тип сообщения.
    """
    logging.info(f"📨 Получено необработанное сообщение от {message.from_user.id} (тип: {message.content_type})")


async def main():
    """Главная функция запуска бота"""
    global db_pool

    def signal_handler(signum, _frame):
        print(f"⚠️ Получен сигнал {signum}, начинаем корректное завершение...")
        try:
            asyncio.get_running_loop().stop()
        except RuntimeError:
            pass

    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    try:

        # Запускаем фоновую задачу TTL-очистки user_data
        asyncio.create_task(cleanup_user_data())

        await dp.start_polling(bot)
    except KeyboardInterrupt:
        print("⚠️ Получен сигнал остановки, завершаем работу...")
    except SystemExit:
        print("⚠️ Системное завершение, завершаем работу...")
    except Exception as e:
        logging.error(f"Ошибка: {e}")
    finally:

        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
