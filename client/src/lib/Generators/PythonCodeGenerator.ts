/**
 * Генератор базовой структуры Python кода для Telegram ботов
 * Отвечает за инициализацию бота, глобальные переменные и вспомогательные функции
 */

import { GenerationContext, IPythonCodeGenerator } from '../Core/types';
import { hasInlineButtons, hasAutoTransitions } from '../has';
import type { Node as BotNode } from '../../../../shared/schema';

export class PythonCodeGenerator implements IPythonCodeGenerator {
    /**
     * Генерирует инициализацию бота и диспетчера
     */
    generateBotInitialization(_context: GenerationContext): string {
        let code = '';

        // Токен бота
        code += '# Токен вашего бота (получите у @BotFather)\n';
        code += 'BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"\n\n';

        // Настройка логирования
        code += '# Настройка логирования с поддержкой UTF-8\n';
        code += 'logging.basicConfig(\n';
        code += '    level=logging.INFO,\n';
        code += '    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",\n';
        code += '    handlers=[\n';
        code += '        logging.StreamHandler(sys.stdout)\n';
        code += '    ]\n';
        code += ')\n\n';

        // Создание бота и диспетчера
        code += '# Создание бота и диспетчера\n';
        code += 'bot = Bot(token=BOT_TOKEN)\n';
        code += 'dp = Dispatcher()\n\n';

        return code;
    }

    /**
     * Генерирует глобальные переменные
     */
    generateGlobalVariables(context: GenerationContext): string {
        let code = '';

        // Список администраторов
        code += '# Список администраторов (добавьте свой Telegram ID)\n';
        code += 'ADMIN_IDS = [123456789]  # Замените на реальные ID администраторов\n\n';

        // API конфигурация для сохранения сообщений (только если включена БД)
        if (context.userDatabaseEnabled) {
            code += '# API configuration для сохранения сообщений\n';
            code += 'API_BASE_URL = os.getenv("API_BASE_URL", os.getenv("REPLIT_DEV_DOMAIN", "http://localhost:5000"))\n';
            code += `PROJECT_ID = int(os.getenv("PROJECT_ID", "${context.projectId || 0}"))  # ID проекта в системе\n\n`;
        }

        return code;
    }

    /**
     * Генерирует вспомогательные функции
     */
    generateUtilityFunctions(context: GenerationContext): string {
        let code = '';

        // Функция для сохранения сообщений в API (только если включена БД)
        if (context.userDatabaseEnabled) {
            code += this.generateSaveMessageFunction();
            code += this.generateMessageLoggingMiddleware(context.nodes as unknown as BotNode[]);

            // Callback query middleware только если есть inline кнопки
            if (hasInlineButtons(context.nodes as unknown as any[])) {
                code += this.generateCallbackQueryLoggingMiddleware();
            }

            // Обертки для автоматического сохранения сообщений
            code += this.generateMessageWrappers();
        }

        // Safe edit or send функция (если есть inline кнопки или автопереходы)
        if (hasInlineButtons(context.nodes as unknown as any[]) || hasAutoTransitions(context.nodes as unknown as any[])) {
            code += this.generateSafeEditOrSendFunction(context.userDatabaseEnabled);
        }

        // Утилитарные функции
        code += this.generateUtilityHelperFunctions();

        return code;
    }

    /**
     * Генерирует функцию для сохранения сообщений в API
     */
    private generateSaveMessageFunction(): string {
        let code = '';

        code += '# Функция для сохранения сообщений в базу данных через API\n';
        code += 'async def save_message_to_api(user_id: str, message_type: str, message_text: str = None, node_id: str = None, message_data: dict = None):\n';
        code += '    """Сохраняет сообщение в базу данных через API"""\n';
        code += '    try:\n';
        code += '        # Формируем полный URL для API\n';
        code += '        if API_BASE_URL.startswith("http"):\n';
        code += '            api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/messages"\n';
        code += '        else:\n';
        code += '            api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/messages"\n';
        code += '        \n';
        code += '        payload = {\n';
        code += '            "userId": str(user_id),\n';
        code += '            "messageType": message_type,\n';
        code += '            "messageText": message_text,\n';
        code += '            "nodeId": node_id,\n';
        code += '            "messageData": message_data or {}\n';
        code += '        }\n';
        code += '        \n';
        code += '        logging.debug(f"💾 Отправка сообщения в API: {payload}")\n';
        code += '        \n';
        code += '        # Настройка SSL для локальных подключений\n';
        code += '        import ssl\n';
        code += '        ssl_context = None\n';
        code += '        if "localhost" in api_url or "127.0.0.1" in api_url:\n';
        code += '            # Для локальных подключений отключаем проверку SSL\n';
        code += '            ssl_context = False\n';
        code += '        \n';
        code += '        connector = aiohttp.TCPConnector(ssl=ssl_context)\n';
        code += '        async with aiohttp.ClientSession(connector=connector) as session:\n';
        code += '            async with session.post(api_url, json=payload, timeout=aiohttp.ClientTimeout(total=5)) as response:\n';
        code += '                if response.status == 200:\n';
        code += '                    logging.info(f"✅ Сообщение сохранено: {message_type} от {user_id}")\n';
        code += '                    response_data = await response.json()\n';
        code += '                    return response_data.get("data")  # Возвращаем сохраненное сообщение с id\n';
        code += '                else:\n';
        code += '                    error_text = await response.text()\n';
        code += '                    logging.error(f"❌ Не удалось сохранить сообщение: {response.status} - {error_text}")\n';
        code += '                    logging.error(f"Отправленный payload: {payload}")\n';
        code += '                    return None\n';
        code += '    except Exception as e:\n';
        code += '        logging.error(f"Ошибка при сохранении сообщения: {e}")\n';
        code += '        return None\n\n';

        return code;
    }

    /**
     * Генерирует middleware для логирования сообщений
     */
    private generateMessageLoggingMiddleware(_nodes: BotNode[]): string {
        let code = '';

        code += '# Middleware для сохранения входящих сообщений\n';
        code += 'async def message_logging_middleware(handler, event: types.Message, data: dict):\n';
        code += '    """Middleware для автоматического сохранения входящих сообщений от пользователей"""\n';
        code += '    try:\n';
        code += '        # Сохраняем входящее сообщение от пользователя\n';
        code += '        user_id = str(event.from_user.id)\n';
        code += '        message_text = event.text or event.caption or "[медиа]"\n';
        code += '        message_data = {"message_id": event.message_id}\n';
        code += '        \n';
        code += '        # Проверяем наличие фото\n';
        code += '        photo_file_id = None\n';
        code += '        if event.photo:\n';
        code += '            # Берем фото наибольшего размера (последнее в списке)\n';
        code += '            largest_photo = event.photo[-1]\n';
        code += '            photo_file_id = largest_photo.file_id\n';
        code += '            message_data["photo"] = {\n';
        code += '                "file_id": largest_photo.file_id,\n';
        code += '                "file_unique_id": largest_photo.file_unique_id,\n';
        code += '                "width": largest_photo.width,\n';
        code += '                "height": largest_photo.height,\n';
        code += '                "file_size": largest_photo.file_size if hasattr(largest_photo, "file_size") else None\n';
        code += '            }\n';
        code += '            if not message_text or message_text == "[медиа]":\n';
        code += '                message_text = "[Фото]"\n';
        code += '        \n';
        code += '        # Сохраняем сообщение в базу данных\n';
        code += '        saved_message = await save_message_to_api(\n';
        code += '            user_id=user_id,\n';
        code += '            message_type="user",\n';
        code += '            message_text=message_text,\n';
        code += '            message_data=message_data\n';
        code += '        )\n';
        code += '        \n';
        code += '        # Если есть фото и сообщение сохранено, регистрируем медиа\n';
        code += '        if photo_file_id and saved_message and "id" in saved_message:\n';
        code += '            try:\n';
        code += '                if API_BASE_URL.startswith("http://") or API_BASE_URL.startswith("https://"):\n';
        code += '                    media_api_url = f"{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"\n';
        code += '                else:\n';
        code += '                    media_api_url = f"https://{API_BASE_URL}/api/projects/{PROJECT_ID}/media/register-telegram-photo"\n';
        code += '                \n';
        code += '                media_payload = {\n';
        code += '                    "messageId": saved_message["id"],\n';
        code += '                    "fileId": photo_file_id,\n';
        code += '                    "botToken": BOT_TOKEN,\n';
        code += '                    "mediaType": "photo"\n';
        code += '                }\n';
        code += '                \n';
        code += '                async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=False if "localhost" in media_api_url or "127.0.0.1" in media_api_url else None)) as session:\n';
        code += '                    async with session.post(media_api_url, json=media_payload, timeout=aiohttp.ClientTimeout(total=10)) as response:\n';
        code += '                        if response.status == 200:\n';
        code += '                            message_id = saved_message.get("id")\n';
        code += '                            logging.info(f"✅ Медиа зарегистрировано для сообщения {message_id}")\n';
        code += '                        else:\n';
        code += '                            error_text = await response.text()\n';
        code += '                            logging.warning(f"⚠️ Не удалось зарегистрировать медиа: {response.status} - {error_text}")\n';
        code += '            except Exception as media_error:\n';
        code += '                logging.warning(f"Ошибка при регистрации медиа: {media_error}")\n';
        code += '    except Exception as e:\n';
        code += '        logging.error(f"Ошибка в middleware сохранения сообщений: {e}")\n';
        code += '    \n';
        code += '    # Продолжаем обработку сообщения\n';
        code += '    return await handler(event, data)\n\n';

        return code;
    }

    /**
     * Генерирует middleware для логирования callback query
     */
    private generateCallbackQueryLoggingMiddleware(): string {
        let code = '';

        code += '# Middleware для сохранения нажатий на кнопки\n';
        code += 'async def callback_query_logging_middleware(handler, event: types.CallbackQuery, data: dict):\n';
        code += '    """Middleware для автоматического сохранения нажатий на кнопки"""\n';
        code += '    try:\n';
        code += '        user_id = str(event.from_user.id)\n';
        code += '        callback_data = event.data or ""\n';
        code += '        \n';
        code += '        # Пытаемся найти текст кнопки из сообщения\n';
        code += '        button_text = None\n';
        code += '        if event.message and hasattr(event.message, "reply_markup"):\n';
        code += '            reply_markup = event.message.reply_markup\n';
        code += '            if hasattr(reply_markup, "inline_keyboard"):\n';
        code += '                for row in reply_markup.inline_keyboard:\n';
        code += '                    for btn in row:\n';
        code += '                        if hasattr(btn, "callback_data") and btn.callback_data == callback_data:\n';
        code += '                            button_text = btn.text\n';
        code += '                            break\n';
        code += '                    if button_text:\n';
        code += '                        break\n';
        code += '        \n';
        code += '        # Сохраняем информацию о нажатии кнопки\n';
        code += '        message_text_to_save = f"[Нажата кнопка: {button_text}]" if button_text else "[Нажата кнопка]"\n';
        code += '        await save_message_to_api(\n';
        code += '            user_id=user_id,\n';
        code += '            message_type="user",\n';
        code += '            message_text=message_text_to_save,\n';
        code += '            message_data={\n';
        code += '                "button_clicked": True,\n';
        code += '                "button_text": button_text,\n';
        code += '                "callback_data": callback_data\n';
        code += '            }\n';
        code += '        )\n';
        code += '    except Exception as e:\n';
        code += '        logging.error(f"Ошибка в middleware сохранения нажатий кнопок: {e}")\n';
        code += '    \n';
        code += '    # Продолжаем обработку callback query\n';
        code += '    return await handler(event, data)\n\n';

        return code;
    }

    /**
     * Генерирует функцию safe_edit_or_send
     */
    private generateSafeEditOrSendFunction(userDatabaseEnabled: boolean): string {
        let code = '';

        code += '# Safe helper for editing messages with fallback to new message\n';
        code += 'async def safe_edit_or_send(cbq, text, node_id=None, is_auto_transition=False, **kwargs):\n';
        code += '    """\n';
        code += '    Безопасное редактирование сообщения с fallback на новое сообщение\n';
        code += '    При автопереходе сразу отправляет новое сообщение без попытки редактирования\n';
        code += '    """\n';
        code += '    result = None\n';
        code += '    user_id = None\n';
        code += '    \n';
        code += '    # Получаем user_id для сохранения\n';
        code += '    if hasattr(cbq, "from_user") and cbq.from_user:\n';
        code += '        user_id = str(cbq.from_user.id)\n';
        code += '    elif hasattr(cbq, "message") and cbq.message and hasattr(cbq.message, "chat"):\n';
        code += '        user_id = str(cbq.message.chat.id)\n';
        code += '    \n';
        code += '    try:\n';
        code += '        # При автопереходе сразу отправляем новое сообщение без редактирования\n';
        code += '        if is_auto_transition:\n';
        code += '            logging.info(f"⚡ Автопереход: отправляем новое сообщение вместо редактирования")\n';
        code += '            if hasattr(cbq, "message") and cbq.message:\n';
        code += '                result = await cbq.message.answer(text, **kwargs)\n';
        code += '            else:\n';
        code += '                raise Exception("Cannot send message in auto-transition")\n';
        code += '        else:\n';
        code += '            # Пробуем редактировать сообщение\n';
        code += '            if hasattr(cbq, "edit_text") and callable(getattr(cbq, "edit_text")):\n';
        code += '                result = await cbq.edit_text(text, **kwargs)\n';
        code += '            elif (hasattr(cbq, "message") and cbq.message):\n';
        code += '                result = await cbq.message.edit_text(text, **kwargs)\n';
        code += '            else:\n';
        code += '                raise Exception("No valid edit method found")\n';
        code += '    except Exception as e:\n';
        code += '        # При любой ошибке отправляем новое сообщение\n';
        code += '        if is_auto_transition:\n';
        code += '            logging.info(f"⚡ Автопереход: {e}, отправляем новое сообщение")\n';
        code += '        else:\n';
        code += '            logging.warning(f"Не удалось отредактировать сообщение: {e}, отправляем новое")\n';
        code += '        if hasattr(cbq, "message") and cbq.message:\n';
        code += '            result = await cbq.message.answer(text, **kwargs)\n';
        code += '        else:\n';
        code += '            logging.error("Не удалось ни отредактировать, ни отправить новое сообщение")\n';
        code += '            raise\n';
        code += '    \n';

        if (userDatabaseEnabled) {
            code += '    # Сохраняем сообщение в базу данных\n';
            code += '    if result and user_id:\n';
            code += '        message_data_obj = {"message_id": result.message_id if hasattr(result, "message_id") else None}\n';
            code += '        \n';
            code += '        # Извлекаем кнопки из reply_markup\n';
            code += '        if "reply_markup" in kwargs:\n';
            code += '            try:\n';
            code += '                reply_markup = kwargs["reply_markup"]\n';
            code += '                buttons_data = []\n';
            code += '                # Обработка inline клавиатуры\n';
            code += '                if hasattr(reply_markup, "inline_keyboard"):\n';
            code += '                    for row in reply_markup.inline_keyboard:\n';
            code += '                        for btn in row:\n';
            code += '                            button_info = {"text": btn.text}\n';
            code += '                            if hasattr(btn, "url") and btn.url:\n';
            code += '                                button_info["url"] = btn.url\n';
            code += '                            if hasattr(btn, "callback_data") and btn.callback_data:\n';
            code += '                                button_info["callback_data"] = btn.callback_data\n';
            code += '                            buttons_data.append(button_info)\n';
            code += '                    if buttons_data:\n';
            code += '                        message_data_obj["buttons"] = buttons_data\n';
            code += '                        message_data_obj["keyboard_type"] = "inline"\n';
            code += '                # Обработка reply клавиатуры\n';
            code += '                elif hasattr(reply_markup, "keyboard"):\n';
            code += '                    for row in reply_markup.keyboard:\n';
            code += '                        for btn in row:\n';
            code += '                            button_info = {"text": btn.text}\n';
            code += '                            if hasattr(btn, "request_contact") and btn.request_contact:\n';
            code += '                                button_info["request_contact"] = True\n';
            code += '                            if hasattr(btn, "request_location") and btn.request_location:\n';
            code += '                                button_info["request_location"] = True\n';
            code += '                            buttons_data.append(button_info)\n';
            code += '                    if buttons_data:\n';
            code += '                        message_data_obj["buttons"] = buttons_data\n';
            code += '                        message_data_obj["keyboard_type"] = "reply"\n';
            code += '            except Exception as btn_error:\n';
            code += '                logging.warning(f"Не удалось извлечь кнопки в safe_edit_or_send: {btn_error}")\n';
            code += '        \n';
            code += '        await save_message_to_api(\n';
            code += '            user_id=user_id,\n';
            code += '            message_type="bot",\n';
            code += '            message_text=text,\n';
            code += '            node_id=node_id,\n';
            code += '            message_data=message_data_obj\n';
            code += '        )\n';
        }

        code += '    \n';
        code += '    return result\n\n';

        return code;
    }

    /**
     * Генерирует обертки для автоматического сохранения сообщений
     */
    private generateMessageWrappers(): string {
        let code = '';

        code += '# Обертка для сохранения исходящих сообщений\n';
        code += 'original_send_message = bot.send_message\n';
        code += 'async def send_message_with_logging(chat_id, text, *args, node_id=None, **kwargs):\n';
        code += '    """Обертка для bot.send_message с автоматическим сохранением"""\n';
        code += '    result = await original_send_message(chat_id, text, *args, **kwargs)\n';
        code += '    \n';
        code += '    # Извлекаем информацию о кнопках из reply_markup\n';
        code += '    message_data_obj = {"message_id": result.message_id if result else None}\n';
        code += '    if "reply_markup" in kwargs:\n';
        code += '        try:\n';
        code += '            reply_markup = kwargs["reply_markup"]\n';
        code += '            buttons_data = []\n';
        code += '            # Обработка inline клавиатуры\n';
        code += '            if hasattr(reply_markup, "inline_keyboard"):\n';
        code += '                for row in reply_markup.inline_keyboard:\n';
        code += '                    for btn in row:\n';
        code += '                        button_info = {"text": btn.text}\n';
        code += '                        if hasattr(btn, "url") and btn.url:\n';
        code += '                            button_info["url"] = btn.url\n';
        code += '                        if hasattr(btn, "callback_data") and btn.callback_data:\n';
        code += '                            button_info["callback_data"] = btn.callback_data\n';
        code += '                        buttons_data.append(button_info)\n';
        code += '                if buttons_data:\n';
        code += '                    message_data_obj["buttons"] = buttons_data\n';
        code += '                    message_data_obj["keyboard_type"] = "inline"\n';
        code += '            # Обработка reply клавиатуры\n';
        code += '            elif hasattr(reply_markup, "keyboard"):\n';
        code += '                for row in reply_markup.keyboard:\n';
        code += '                    for btn in row:\n';
        code += '                        button_info = {"text": btn.text}\n';
        code += '                        if hasattr(btn, "request_contact") and btn.request_contact:\n';
        code += '                            button_info["request_contact"] = True\n';
        code += '                        if hasattr(btn, "request_location") and btn.request_location:\n';
        code += '                            button_info["request_location"] = True\n';
        code += '                        buttons_data.append(button_info)\n';
        code += '                if buttons_data:\n';
        code += '                    message_data_obj["buttons"] = buttons_data\n';
        code += '                    message_data_obj["keyboard_type"] = "reply"\n';
        code += '        except Exception as btn_error:\n';
        code += '            logging.warning(f"Не удалось извлечь кнопки: {btn_error}")\n';
        code += '    \n';
        code += '    # Сохраняем синхронно для гарантии доставки\n';
        code += '    await save_message_to_api(\n';
        code += '        user_id=str(chat_id),\n';
        code += '        message_type="bot",\n';
        code += '        message_text=text,\n';
        code += '        node_id=node_id,\n';
        code += '        message_data=message_data_obj\n';
        code += '    )\n';
        code += '    return result\n\n';
        code += 'bot.send_message = send_message_with_logging\n\n';

        code += '# Обертка для message.answer с сохранением\n';
        code += 'original_answer = types.Message.answer\n';
        code += 'async def answer_with_logging(self, text, *args, node_id=None, **kwargs):\n';
        code += '    """Обертка для message.answer с автоматическим сохранением"""\n';
        code += '    result = await original_answer(self, text, *args, **kwargs)\n';
        code += '    \n';
        code += '    # Извлекаем информацию о кнопках из reply_markup\n';
        code += '    message_data_obj = {"message_id": result.message_id if result else None}\n';
        code += '    if "reply_markup" in kwargs:\n';
        code += '        try:\n';
        code += '            reply_markup = kwargs["reply_markup"]\n';
        code += '            buttons_data = []\n';
        code += '            # Обработка inline клавиатуры\n';
        code += '            if hasattr(reply_markup, "inline_keyboard"):\n';
        code += '                for row in reply_markup.inline_keyboard:\n';
        code += '                    for btn in row:\n';
        code += '                        button_info = {"text": btn.text}\n';
        code += '                        if hasattr(btn, "url") and btn.url:\n';
        code += '                            button_info["url"] = btn.url\n';
        code += '                        if hasattr(btn, "callback_data") and btn.callback_data:\n';
        code += '                            button_info["callback_data"] = btn.callback_data\n';
        code += '                        buttons_data.append(button_info)\n';
        code += '                if buttons_data:\n';
        code += '                    message_data_obj["buttons"] = buttons_data\n';
        code += '                    message_data_obj["keyboard_type"] = "inline"\n';
        code += '            # Обработка reply клавиатуры\n';
        code += '            elif hasattr(reply_markup, "keyboard"):\n';
        code += '                for row in reply_markup.keyboard:\n';
        code += '                    for btn in row:\n';
        code += '                        button_info = {"text": btn.text}\n';
        code += '                        if hasattr(btn, "request_contact") and btn.request_contact:\n';
        code += '                            button_info["request_contact"] = True\n';
        code += '                        if hasattr(btn, "request_location") and btn.request_location:\n';
        code += '                            button_info["request_location"] = True\n';
        code += '                        buttons_data.append(button_info)\n';
        code += '                if buttons_data:\n';
        code += '                    message_data_obj["buttons"] = buttons_data\n';
        code += '                    message_data_obj["keyboard_type"] = "reply"\n';
        code += '        except Exception as btn_error:\n';
        code += '            logging.warning(f"Не удалось извлечь кнопки: {btn_error}")\n';
        code += '    \n';
        code += '    # Сохраняем синхронно для гарантии доставки\n';
        code += '    await save_message_to_api(\n';
        code += '        user_id=str(self.chat.id),\n';
        code += '        message_type="bot",\n';
        code += '        message_text=text,\n';
        code += '        node_id=node_id,\n';
        code += '        message_data=message_data_obj\n';
        code += '    )\n';
        code += '    return result\n\n';
        code += 'types.Message.answer = answer_with_logging\n\n';

        code += '# Обертка для callback_query.answer с сохранением\n';
        code += 'original_callback_answer = types.CallbackQuery.answer\n';
        code += 'async def callback_answer_with_logging(self, text=None, *args, node_id=None, **kwargs):\n';
        code += '    """Обертка для callback_query.answer с автоматическим сохранением"""\n';
        code += '    result = await original_callback_answer(self, text, *args, **kwargs)\n';
        code += '    \n';
        code += '    # Сохраняем сообщение в базу данных\n';
        code += '    saved_message = await save_message_to_api(\n';
        code += '        user_id=str(self.from_user.id),\n';
        code += '        message_type="bot",\n';
        code += '        message_text=text or "[Callback ответ]",\n';
        code += '        node_id=node_id,\n';
        code += '        message_data={"callback_answer": True}\n';
        code += '    )\n';
        code += '    return result\n\n';
        code += 'types.CallbackQuery.answer = callback_answer_with_logging\n\n';

        return code;
    }

    /**
     * Генерирует утилитарные вспомогательные функции
     */
    private generateUtilityHelperFunctions(): string {
        let code = '';

        code += '# Утилитарные функции\n';
        code += 'async def is_admin(user_id: int) -> bool:\n';
        code += '    return user_id in ADMIN_IDS\n\n';

        code += 'async def is_private_chat(message: types.Message) -> bool:\n';
        code += '    return message.chat.type == "private"\n\n';

        return code;
    }
}