import { BotData, Node } from '@shared/schema';
import { generateBotFatherCommands } from './commands';

export function generatePythonCode(botData: BotData, botName: string = "MyBot"): string {
  const { nodes } = botData;
  
  let code = '"""\n';
  code += `${botName} - Telegram Bot\n`;
  code += 'Сгенерировано с помощью TelegramBot Builder\n';
  
  const botFatherCommands = generateBotFatherCommands(nodes);
  if (botFatherCommands) {
    code += '\nКоманды для @BotFather:\n';
    code += botFatherCommands;
  }
  
  code += '"""\n\n';
  
  code += 'import asyncio\n';
  code += 'import logging\n';
  code += 'import os\n';
  code += 'from aiogram import Bot, Dispatcher, types, F\n';
  code += 'from aiogram.filters import CommandStart, Command\n';
  code += 'from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove, URLInputFile, FSInputFile\n';
  code += 'from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder\n';
  code += 'from aiogram.enums import ParseMode\n\n';
  
  code += '# Токен вашего бота (получите у @BotFather)\n';
  code += 'BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"\n\n';
  
  code += '# Настройка логирования\n';
  code += 'logging.basicConfig(level=logging.INFO)\n\n';
  
  code += '# Создание бота и диспетчера\n';
  code += 'bot = Bot(token=BOT_TOKEN)\n';
  code += 'dp = Dispatcher()\n\n';
  
  code += '# Список администраторов (добавьте свой Telegram ID)\n';
  code += 'ADMIN_IDS = [123456789]  # Замените на реальные ID администраторов\n\n';
  
  code += '# Хранилище пользователей (в реальном боте используйте базу данных)\n';
  code += 'user_data = {}\n\n';

  // Добавляем утилитарные функции
  code += '\n# Утилитарные функции\n';
  code += 'async def is_admin(user_id: int) -> bool:\n';
  code += '    return user_id in ADMIN_IDS\n\n';
  
  code += 'async def is_private_chat(message: types.Message) -> bool:\n';
  code += '    return message.chat.type == "private"\n\n';
  
  code += 'async def check_auth(user_id: int) -> bool:\n';
  code += '    # Здесь можно добавить логику проверки авторизации\n';
  code += '    return user_id in user_data\n\n';
  
  code += 'def is_local_file(url: str) -> bool:\n';
  code += '    """Проверяет, является ли URL локальным загруженным файлом"""\n';
  code += '    return url.startswith("/uploads/") or url.startswith("uploads/")\n\n';
  
  code += 'def get_local_file_path(url: str) -> str:\n';
  code += '    """Получает локальный путь к файлу из URL"""\n';
  code += '    if url.startswith("/"):\n';
  code += '        return url[1:]  # Убираем ведущий слеш\n';
  code += '    return url\n\n';

  // Добавляем функции для работы с картографическими сервисами
  code += 'def extract_coordinates_from_yandex(url: str) -> tuple:\n';
  code += '    """Извлекает координаты из ссылки Яндекс.Карт"""\n';
  code += '    import re\n';
  code += '    # Ищем координаты в формате ll=longitude,latitude\n';
  code += '    match = re.search(r"ll=([\\d.-]+),([\\d.-]+)", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(2)), float(match.group(1))  # lat, lon\n';
  code += '    # Ищем координаты в формате /longitude,latitude/\n';
  code += '    match = re.search(r"/([\\d.-]+),([\\d.-]+)/", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(2)), float(match.group(1))  # lat, lon\n';
  code += '    return None, None\n\n';

  code += 'def extract_coordinates_from_google(url: str) -> tuple:\n';
  code += '    """Извлекает координаты из ссылки Google Maps"""\n';
  code += '    import re\n';
  code += '    # Ищем координаты в формате @latitude,longitude\n';
  code += '    match = re.search(r"@([\\d.-]+),([\\d.-]+)", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(1)), float(match.group(2))  # lat, lon\n';
  code += '    # Ищем координаты в формате /latitude,longitude/\n';
  code += '    match = re.search(r"/([\\d.-]+),([\\d.-]+)/", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(1)), float(match.group(2))  # lat, lon\n';
  code += '    return None, None\n\n';

  code += 'def extract_coordinates_from_2gis(url: str) -> tuple:\n';
  code += '    """Извлекает координаты из ссылки 2ГИС"""\n';
  code += '    import re\n';
  code += '    # Ищем координаты в различных форматах 2ГИС\n';
  code += '    # Формат: center/longitude,latitude\n';
  code += '    match = re.search(r"center/([\\d.-]+),([\\d.-]+)", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(2)), float(match.group(1))  # lat, lon\n';
  code += '    # Формат: /longitude,latitude/\n';
  code += '    match = re.search(r"/([\\d.-]+),([\\d.-]+)/", url)\n';
  code += '    if match:\n';
  code += '        return float(match.group(2)), float(match.group(1))  # lat, lon\n';
  code += '    return None, None\n\n';

  code += 'def generate_map_urls(latitude: float, longitude: float, title: str = "") -> dict:\n';
  code += '    """Генерирует ссылки на различные картографические сервисы"""\n';
  code += '    import urllib.parse\n';
  code += '    \n';
  code += '    encoded_title = urllib.parse.quote(title) if title else ""\n';
  code += '    \n';
  code += '    return {\n';
  code += '        "yandex": f"https://yandex.ru/maps/?ll={longitude},{latitude}&z=15&l=map&pt={longitude},{latitude}",\n';
  code += '        "google": f"https://maps.google.com/?q={latitude},{longitude}",\n';
  code += '        "2gis": f"https://2gis.ru/geo/{longitude},{latitude}",\n';
  code += '        "openstreetmap": f"https://www.openstreetmap.org/?mlat={latitude}&mlon={longitude}&zoom=15"\n';
  code += '    }\n\n';

  // Настройка меню команд для BotFather
  const menuCommands = nodes.filter(node => 
    (node.type === 'start' || node.type === 'command') && 
    node.data.showInMenu && 
    node.data.command
  );

  if (menuCommands.length > 0) {
    code += '\n# Настройка меню команд\n';
    code += 'async def set_bot_commands():\n';
    code += '    commands = [\n';
    
    menuCommands.forEach(node => {
      const command = node.data.command?.replace('/', '') || '';
      const description = node.data.description || 'Команда бота';
      code += `        BotCommand(command="${command}", description="${description}"),\n`;
    });
    
    code += '    ]\n';
    code += '    await bot.set_my_commands(commands)\n\n';
  }

  // Generate handlers for each node
  nodes.forEach((node: Node) => {
    if (node.type === "start") {
      code += generateStartHandler(node);
    } else if (node.type === "command") {
      code += generateCommandHandler(node);
    } else if (node.type === "photo") {
      code += generatePhotoHandler(node);
    } else if (node.type === "video") {
      code += generateVideoHandler(node);
    } else if (node.type === "audio") {
      code += generateAudioHandler(node);
    } else if (node.type === "document") {
      code += generateDocumentHandler(node);
    } else if (node.type === "sticker") {
      code += generateStickerHandler(node);
    } else if (node.type === "voice") {
      code += generateVoiceHandler(node);
    } else if (node.type === "animation") {
      code += generateAnimationHandler(node);
    } else if (node.type === "location") {
      code += generateLocationHandler(node);
    } else if (node.type === "contact") {
      code += generateContactHandler(node);
    } else if (node.type === "user-input") {
      code += generateUserInputHandler(node);
    }
    // Note: Message nodes are handled via callback handlers, not as separate message handlers
  });

  // Generate synonym handlers for commands
  const nodesWithSynonyms = nodes.filter(node => 
    (node.type === 'start' || node.type === 'command') && 
    node.data.synonyms && 
    node.data.synonyms.length > 0
  );

  if (nodesWithSynonyms.length > 0) {
    code += '\n# Обработчики синонимов команд\n';
    nodesWithSynonyms.forEach(node => {
      if (node.data.synonyms) {
        node.data.synonyms.forEach((synonym: string) => {
          code += generateSynonymHandler(node, synonym);
        });
      }
    });
  }

  // Generate callback handlers for inline buttons
  const inlineNodes = nodes.filter(node => 
    node.data.keyboardType === 'inline' && node.data.buttons.length > 0
  );

  if (inlineNodes.length > 0) {
    code += '\n# Обработчики inline кнопок\n';
    const processedCallbacks = new Set<string>();
    
    inlineNodes.forEach(node => {
      node.data.buttons.forEach(button => {
        if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          
          // Avoid duplicate handlers
          if (processedCallbacks.has(callbackData)) return;
          processedCallbacks.add(callbackData);
          
          // Find target node (может быть null если нет target)
          const targetNode = button.target ? nodes.find(n => n.id === button.target) : null;
          
          // Создаем обработчик в любом случае
          code += `\n@dp.callback_query(lambda c: c.data == "${callbackData}")\n`;
          // Создаем безопасное имя функции на основе callback_data
          const safeFunctionName = callbackData.replace(/[^a-zA-Z0-9]/g, '_');
          code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
          code += '    await callback_query.answer()\n';
          
          if (targetNode) {
            
            // Handle different target node types
            if (targetNode.type === 'photo') {
              const caption = targetNode.data.mediaCaption || targetNode.data.messageText || "📸 Фото";
              const imageUrl = targetNode.data.imageUrl || "https://picsum.photos/800/600?random=1";
              
              if (caption.includes('\n')) {
                code += `    caption = """${caption}"""\n`;
              } else {
                const escapedCaption = caption.replace(/"/g, '\\"');
                code += `    caption = "${escapedCaption}"\n`;
              }
              
              code += `    photo_url = "${imageUrl}"\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(photo_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(photo_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                photo_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            photo_file = photo_url\n';
              code += '        \n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach(btn => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const callbackData = btn.target || btn.id || 'no_action';
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_photo(callback_query.from_user.id, photo_file, caption=caption, reply_markup=keyboard)\n';
              } else {
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_photo(callback_query.from_user.id, photo_file, caption=caption)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки фото: {e}")\n';
              code += '        await callback_query.message.edit_text(f"❌ Не удалось загрузить фото\\n{caption}")\n';
              
            } else if (targetNode.type === 'video') {
              const caption = targetNode.data.mediaCaption || targetNode.data.messageText || "🎥 Видео";
              const videoUrl = targetNode.data.videoUrl || "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4";
              
              if (caption.includes('\n')) {
                code += `    caption = """${caption}"""\n`;
              } else {
                const escapedCaption = caption.replace(/"/g, '\\"');
                code += `    caption = "${escapedCaption}"\n`;
              }
              
              code += `    video_url = "${videoUrl}"\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(video_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(video_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                video_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            video_file = video_url\n';
              code += '        \n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach(btn => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const callbackData = btn.target || btn.id || 'no_action';
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_video(callback_query.from_user.id, video_file, caption=caption, reply_markup=keyboard)\n';
              } else {
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_video(callback_query.from_user.id, video_file, caption=caption)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки видео: {e}")\n';
              code += '        await callback_query.message.edit_text(f"❌ Не удалось загрузить видео\\n{caption}")\n';
              
            } else if (targetNode.type === 'audio') {
              const caption = targetNode.data.mediaCaption || targetNode.data.messageText || "🎵 Аудио";
              const audioUrl = targetNode.data.audioUrl || "https://www.soundjay.com/misc/beep-07a.wav";
              
              if (caption.includes('\n')) {
                code += `    caption = """${caption}"""\n`;
              } else {
                const escapedCaption = caption.replace(/"/g, '\\"');
                code += `    caption = "${escapedCaption}"\n`;
              }
              
              code += `    audio_url = "${audioUrl}"\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(audio_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(audio_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                audio_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            audio_file = audio_url\n';
              code += '        \n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach(btn => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const callbackData = btn.target || btn.id || 'no_action';
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_audio(callback_query.from_user.id, audio_file, caption=caption, reply_markup=keyboard)\n';
              } else {
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_audio(callback_query.from_user.id, audio_file, caption=caption)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки аудио: {e}")\n';
              code += '        await callback_query.message.edit_text(f"❌ Не удалось загрузить аудио\\n{caption}")\n';
              
            } else if (targetNode.type === 'document') {
              const caption = targetNode.data.mediaCaption || targetNode.data.messageText || "📄 Документ";
              const documentUrl = targetNode.data.documentUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
              
              if (caption.includes('\n')) {
                code += `    caption = """${caption}"""\n`;
              } else {
                const escapedCaption = caption.replace(/"/g, '\\"');
                code += `    caption = "${escapedCaption}"\n`;
              }
              
              code += `    document_url = "${documentUrl}"\n`;
              const documentName = targetNode.data.documentName || "document.pdf";
              code += `    document_name = "${documentName}"\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(document_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(document_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                document_file = FSInputFile(file_path, filename=document_name)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            document_file = URLInputFile(document_url, filename=document_name)\n';
              code += '        \n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach(btn => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const callbackData = btn.target || btn.id || 'no_action';
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_document(callback_query.from_user.id, document_file, caption=caption, reply_markup=keyboard)\n';
              } else {
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_document(callback_query.from_user.id, document_file, caption=caption)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки документа: {e}")\n';
              code += '        await callback_query.message.edit_text(f"❌ Не удалось загрузить документ\\n{caption}")\n';
              
            } else if (targetNode.type === 'sticker') {
              const stickerUrl = targetNode.data.stickerUrl || "CAACAgIAAxkBAAICGGXm2KvQAAG2X8cxTmZHJkRnYwYlAAJGAANWnb0KmgiEKEZDKVQeBA";
              
              code += `    sticker_url = "${stickerUrl}"\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(sticker_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(sticker_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                sticker_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL или file_id для стикеров\n';
              code += '            sticker_file = sticker_url\n';
              code += '        \n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach(btn => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const callbackData = btn.target || btn.id || 'no_action';
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_sticker(callback_query.from_user.id, sticker_file, reply_markup=keyboard)\n';
              } else {
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_sticker(callback_query.from_user.id, sticker_file)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки стикера: {e}")\n';
              code += '        await callback_query.message.edit_text(f"❌ Не удалось отправить стикер")\n';
              
            } else if (targetNode.type === 'voice') {
              const voiceUrl = targetNode.data.voiceUrl || "https://www.soundjay.com/misc/beep-07a.wav";
              const duration = targetNode.data.duration || 30;
              
              code += `    voice_url = "${voiceUrl}"\n`;
              code += `    duration = ${duration}\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(voice_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(voice_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                voice_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            voice_file = voice_url\n';
              code += '        \n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach(btn => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const callbackData = btn.target || btn.id || 'no_action';
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_voice(callback_query.from_user.id, voice_file, duration=duration, reply_markup=keyboard)\n';
              } else {
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_voice(callback_query.from_user.id, voice_file, duration=duration)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки голосового сообщения: {e}")\n';
              code += '        await callback_query.message.edit_text(f"❌ Не удалось отправить голосовое сообщение")\n';
              
            } else if (targetNode.type === 'animation') {
              const caption = targetNode.data.mediaCaption || "🎬 Анимация";
              const animationUrl = targetNode.data.animationUrl || "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif";
              
              if (caption.includes('\n')) {
                code += `    caption = """${caption}"""\n`;
              } else {
                const escapedCaption = caption.replace(/"/g, '\\"');
                code += `    caption = "${escapedCaption}"\n`;
              }
              
              code += `    animation_url = "${animationUrl}"\n`;
              code += '    try:\n';
              code += '        # Проверяем, является ли это локальным файлом\n';
              code += '        if is_local_file(animation_url):\n';
              code += '            # Отправляем локальный файл\n';
              code += '            file_path = get_local_file_path(animation_url)\n';
              code += '            if os.path.exists(file_path):\n';
              code += '                animation_file = FSInputFile(file_path)\n';
              code += '            else:\n';
              code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
              code += '        else:\n';
              code += '            # Используем URL для внешних файлов\n';
              code += '            animation_file = animation_url\n';
              code += '        \n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach(btn => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const callbackData = btn.target || btn.id || 'no_action';
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_animation(callback_query.from_user.id, animation_file, caption=caption, reply_markup=keyboard)\n';
              } else {
                code += '        await callback_query.message.delete()\n';
                code += '        await bot.send_animation(callback_query.from_user.id, animation_file, caption=caption)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки анимации: {e}")\n';
              code += '        await callback_query.message.edit_text(f"❌ Не удалось отправить анимацию\\n{caption}")\n';
              
            } else if (targetNode.type === 'location') {
              let latitude = targetNode.data.latitude || 55.7558;
              let longitude = targetNode.data.longitude || 37.6176;
              const title = targetNode.data.title || "";
              const address = targetNode.data.address || "";
              const city = targetNode.data.city || "";
              const country = targetNode.data.country || "";
              const mapService = targetNode.data.mapService || 'custom';
              const generateMapPreview = targetNode.data.generateMapPreview !== false;
              
              code += '    # Определяем координаты на основе выбранного сервиса карт\n';
              
              if (mapService === 'yandex' && targetNode.data.yandexMapUrl) {
                code += `    yandex_url = "${targetNode.data.yandexMapUrl}"\n`;
                code += '    extracted_lat, extracted_lon = extract_coordinates_from_yandex(yandex_url)\n';
                code += '    if extracted_lat and extracted_lon:\n';
                code += '        latitude, longitude = extracted_lat, extracted_lon\n';
                code += '    else:\n';
                code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
              } else if (mapService === 'google' && targetNode.data.googleMapUrl) {
                code += `    google_url = "${targetNode.data.googleMapUrl}"\n`;
                code += '    extracted_lat, extracted_lon = extract_coordinates_from_google(google_url)\n';
                code += '    if extracted_lat and extracted_lon:\n';
                code += '        latitude, longitude = extracted_lat, extracted_lon\n';
                code += '    else:\n';
                code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
              } else if (mapService === '2gis' && targetNode.data.gisMapUrl) {
                code += `    gis_url = "${targetNode.data.gisMapUrl}"\n`;
                code += '    extracted_lat, extracted_lon = extract_coordinates_from_2gis(gis_url)\n';
                code += '    if extracted_lat and extracted_lon:\n';
                code += '        latitude, longitude = extracted_lat, extracted_lon\n';
                code += '    else:\n';
                code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
              } else {
                code += `    latitude, longitude = ${latitude}, ${longitude}\n`;
              }
              
              if (title) code += `    title = "${title}"\n`;
              if (address) code += `    address = "${address}"\n`;
              
              code += '    try:\n';
              code += '        # Удаляем старое сообщение\n';
              code += '        await callback_query.message.delete()\n';
              
              code += '        # Отправляем геолокацию\n';
              if (title || address) {
                code += '        await bot.send_venue(\n';
                code += '            callback_query.from_user.id,\n';
                code += '            latitude=latitude,\n';
                code += '            longitude=longitude,\n';
                code += '            title=title,\n';
                code += '            address=address\n';
                code += '        )\n';
              } else {
                code += '        await bot.send_location(\n';
                code += '            callback_query.from_user.id,\n';
                code += '            latitude=latitude,\n';
                code += '            longitude=longitude\n';
                code += '        )\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки геолокации: {e}")\n';
              code += '        await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить геолокацию")\n';
              
              // Генерируем кнопки для картографических сервисов если включено
              if (generateMapPreview) {
                code += '        \n';
                code += '        # Генерируем ссылки на картографические сервисы\n';
                code += '        map_urls = generate_map_urls(latitude, longitude, title)\n';
                code += '        \n';
                code += '        # Создаем кнопки для различных карт\n';
                code += '        map_builder = InlineKeyboardBuilder()\n';
                code += '        map_builder.add(InlineKeyboardButton(text="🗺️ Яндекс Карты", url=map_urls["yandex"]))\n';
                code += '        map_builder.add(InlineKeyboardButton(text="🌍 Google Maps", url=map_urls["google"]))\n';
                code += '        map_builder.add(InlineKeyboardButton(text="📍 2ГИС", url=map_urls["2gis"]))\n';
                code += '        map_builder.add(InlineKeyboardButton(text="🌐 OpenStreetMap", url=map_urls["openstreetmap"]))\n';
                
                if (targetNode.data.showDirections) {
                  code += '        # Добавляем кнопки для построения маршрута\n';
                  code += '        map_builder.add(InlineKeyboardButton(text="🧭 Маршрут (Яндекс)", url=f"https://yandex.ru/maps/?rtext=~{latitude},{longitude}"))\n';
                  code += '        map_builder.add(InlineKeyboardButton(text="🚗 Маршрут (Google)", url=f"https://maps.google.com/maps/dir//{latitude},{longitude}"))\n';
                }
                
                code += '        map_builder.adjust(2)  # Размещаем кнопки в 2 столбца\n';
                code += '        map_keyboard = map_builder.as_markup()\n';
                code += '        \n';
                code += '        await bot.send_message(\n';
                code += '            callback_query.from_user.id,\n';
                if (targetNode.data.showDirections) {
                  code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе или постройте маршрут:",\n';
                } else {
                  code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе:",\n';
                }
                code += '            reply_markup=map_keyboard\n';
                code += '        )\n';
              }
              
              // Добавляем дополнительные кнопки если они есть
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        \n';
                code += '        # Отправляем дополнительные кнопки\n';
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach(btn => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const callbackData = btn.target || btn.id || 'no_action';
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await bot.send_message(callback_query.from_user.id, "Выберите действие:", reply_markup=keyboard)\n';
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки местоположения: {e}")\n';
              code += '        await bot.send_message(callback_query.from_user.id, f"❌ Не удалось отправить местоположение")\n';
              
            } else if (targetNode.type === 'contact') {
              const phoneNumber = targetNode.data.phoneNumber || "+7 999 123 45 67";
              const firstName = targetNode.data.firstName || "Контакт";
              const lastName = targetNode.data.lastName || "";
              const userId = targetNode.data.userId || null;
              const vcard = targetNode.data.vcard || "";
              
              code += `    phone_number = "${phoneNumber}"\n`;
              code += `    first_name = "${firstName}"\n`;
              if (lastName) code += `    last_name = "${lastName}"\n`;
              if (userId) code += `    user_id = ${userId}\n`;
              if (vcard) code += `    vcard = """${vcard}"""\n`;
              
              code += '    try:\n';
              
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
                code += '        builder = InlineKeyboardBuilder()\n';
                targetNode.data.buttons.forEach(btn => {
                  if (btn.action === "url") {
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                  } else if (btn.action === 'goto') {
                    const callbackData = btn.target || btn.id || 'no_action';
                    code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                  }
                });
                code += '        keyboard = builder.as_markup()\n';
                code += '        await callback_query.message.delete()\n';
                if (lastName && userId && vcard) {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, user_id=user_id, vcard=vcard, reply_markup=keyboard)\n';
                } else if (lastName) {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, reply_markup=keyboard)\n';
                } else {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, reply_markup=keyboard)\n';
                }
              } else {
                code += '        await callback_query.message.delete()\n';
                if (lastName && userId && vcard) {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name, user_id=user_id, vcard=vcard)\n';
                } else if (lastName) {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name, last_name=last_name)\n';
                } else {
                  code += '        await bot.send_contact(callback_query.from_user.id, phone_number=phone_number, first_name=first_name)\n';
                }
              }
              
              code += '    except Exception as e:\n';
              code += '        logging.error(f"Ошибка отправки контакта: {e}")\n';
              code += '        await callback_query.message.edit_text(f"❌ Не удалось отправить контакт")\n';
              
            } else if (targetNode.type === 'user-input') {
              // Handle user-input nodes
              const inputPrompt = targetNode.data.inputPrompt || "Пожалуйста, введите ваш ответ:";
              const inputType = targetNode.data.inputType || 'text';
              const inputVariable = targetNode.data.inputVariable || 'user_response';
              const inputValidation = targetNode.data.inputValidation || '';
              const minLength = targetNode.data.minLength || 0;
              const maxLength = targetNode.data.maxLength || 0;
              const inputTimeout = targetNode.data.inputTimeout || 60;
              const inputRequired = targetNode.data.inputRequired !== false;
              const allowSkip = targetNode.data.allowSkip || false;
              const saveToDatabase = targetNode.data.saveToDatabase || false;
              const inputRetryMessage = targetNode.data.inputRetryMessage || "Пожалуйста, попробуйте еще раз.";
              const inputSuccessMessage = targetNode.data.inputSuccessMessage || "Спасибо за ваш ответ!";
              const placeholder = targetNode.data.placeholder || "";
              
              code += '    # Удаляем старое сообщение\n';
              code += '    await callback_query.message.delete()\n';
              code += '    \n';
              
              // Отправляем запрос пользователю
              if (inputPrompt.includes('\n')) {
                code += `    text = """${inputPrompt}"""\n`;
              } else {
                const escapedPrompt = inputPrompt.replace(/"/g, '\\"');
                code += `    text = "${escapedPrompt}"\n`;
              }
              
              if (placeholder) {
                code += `    placeholder_text = "${placeholder}"\n`;
                code += '    text += f"\\n\\n💡 {placeholder_text}"\n';
              }
              
              if (allowSkip) {
                code += '    text += "\\n\\n⏭️ Нажмите /skip чтобы пропустить"\n';
              }
              
              code += '    await bot.send_message(callback_query.from_user.id, text)\n';
              code += '    \n';
              code += '    # Инициализируем пользовательские данные если их нет\n';
              code += '    if callback_query.from_user.id not in user_data:\n';
              code += '        user_data[callback_query.from_user.id] = {}\n';
              code += '    \n';
              code += '    # Настраиваем ожидание ввода\n';
              code += '    user_data[callback_query.from_user.id]["waiting_for_input"] = {\n';
              code += `        "type": "${inputType}",\n`;
              code += `        "variable": "${inputVariable}",\n`;
              code += `        "validation": "${inputValidation}",\n`;
              code += `        "min_length": ${minLength},\n`;
              code += `        "max_length": ${maxLength},\n`;
              code += `        "timeout": ${inputTimeout},\n`;
              code += `        "required": ${inputRequired},\n`;
              code += `        "allow_skip": ${allowSkip},\n`;
              code += `        "save_to_database": ${saveToDatabase},\n`;
              code += `        "retry_message": "${inputRetryMessage}",\n`;
              code += `        "success_message": "${inputSuccessMessage}",\n`;
              code += `        "node_id": "${targetNode.id}"\n`;
              code += '    }\n';
              
            } else {
              // Generate response for target node (default text message)
              const targetText = targetNode.data.messageText || "Сообщение";
              // Используем тройные кавычки для многострочного текста
              if (targetText.includes('\n')) {
                code += `    text = """${targetText}"""\n`;
              } else {
                const escapedTargetText = targetText.replace(/"/g, '\\"');
                code += `    text = "${escapedTargetText}"\n`;
              }
            
              // Handle keyboard for target node
              if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
              code += '    builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach(btn => {
                if (btn.action === "url") {
                  code += `    builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                } else if (btn.action === 'goto') {
                  // Если есть target, используем его, иначе используем ID кнопки как callback_data
                  const callbackData = btn.target || btn.id || 'no_action';
                  code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                }
              });
              code += '    keyboard = builder.as_markup()\n';
              // Определяем, нужен ли markdown для целевого узла
              const useMarkdownTarget = targetNode.data.markdown === true;
              const parseModeTarget = useMarkdownTarget ? ', parse_mode=ParseMode.MARKDOWN' : '';
              code += `    await callback_query.message.edit_text(text, reply_markup=keyboard${parseModeTarget})\n`;
            } else if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons.length > 0) {
              code += '    builder = ReplyKeyboardBuilder()\n';
              targetNode.data.buttons.forEach(btn => {
                code += `    builder.add(KeyboardButton(text="${btn.text}"))\n`;
              });
              const resizeKeyboard = targetNode.data.resizeKeyboard === true ? 'True' : 'False';
              const oneTimeKeyboard = targetNode.data.oneTimeKeyboard === true ? 'True' : 'False';
              code += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
              code += '    # Для reply клавиатуры отправляем новое сообщение и удаляем старое\n';
              code += '    try:\n';
              code += '        await callback_query.message.delete()\n';
              code += '    except:\n';
              code += '        pass  # Игнорируем ошибки удаления\n';
              // Определяем, нужен ли markdown для целевого узла
              const useMarkdownTarget = targetNode.data.markdown === true;
              const parseModeTarget = useMarkdownTarget ? ', parse_mode=ParseMode.MARKDOWN' : '';
              code += `    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard${parseModeTarget})\n`;
            } else {
              // Определяем, нужен ли markdown для целевого узла
              const useMarkdownTarget = targetNode.data.markdown === true;
              const parseModeTarget = useMarkdownTarget ? ', parse_mode=ParseMode.MARKDOWN' : '';
              code += `    await callback_query.message.edit_text(text${parseModeTarget})\n`;
            }
            }
          } else {
            // Кнопка без цели - просто уведомляем пользователя
            code += '    # Кнопка пока никуда не ведет\n';
            code += '    await callback_query.answer("⚠️ Эта кнопка пока не настроена", show_alert=True)\n';
          }
        }
      });
    });
  }
  
  // Generate handlers for reply keyboard buttons
  const replyNodes = nodes.filter(node => 
    node.data.keyboardType === 'reply' && node.data.buttons.length > 0
  );
  
  if (replyNodes.length > 0) {
    code += '\n# Обработчики reply кнопок\n';
    const processedReplyButtons = new Set<string>();
    
    replyNodes.forEach(node => {
      node.data.buttons.forEach(button => {
        if (button.action === 'goto' && button.target) {
          const buttonText = button.text;
          
          // Avoid duplicate handlers
          if (processedReplyButtons.has(buttonText)) return;
          processedReplyButtons.add(buttonText);
          
          // Find target node
          const targetNode = nodes.find(n => n.id === button.target);
          if (targetNode) {
            code += `\n@dp.message(lambda message: message.text == "${buttonText}")\n`;
            // Создаем безопасное имя функции на основе button ID
            const safeFunctionName = button.id.replace(/[^a-zA-Z0-9]/g, '_');
            code += `async def handle_reply_${safeFunctionName}(message: types.Message):\n`;
            
            // Generate response for target node
            const targetText = targetNode.data.messageText || "Сообщение";
            // Используем тройные кавычки для многострочного текста
            if (targetText.includes('\n')) {
              code += `    text = """${targetText}"""\n`;
            } else {
              const escapedTargetText = targetText.replace(/"/g, '\\"');
              code += `    text = "${escapedTargetText}"\n`;
            }
            
            // Handle keyboard for target node
            if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons.length > 0) {
              code += '    builder = ReplyKeyboardBuilder()\n';
              targetNode.data.buttons.forEach(btn => {
                code += `    builder.add(KeyboardButton(text="${btn.text}"))\n`;
              });
              const resizeKeyboard = targetNode.data.resizeKeyboard === true ? 'True' : 'False';
              const oneTimeKeyboard = targetNode.data.oneTimeKeyboard === true ? 'True' : 'False';
              code += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
              // Определяем, нужен ли markdown для целевого узла
              const useMarkdownTarget = targetNode.data.markdown === true;
              const parseModeTarget = useMarkdownTarget ? ', parse_mode=ParseMode.MARKDOWN' : '';
              code += `    await message.answer(text, reply_markup=keyboard${parseModeTarget})\n`;
            } else if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
              code += '    builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach(btn => {
                if (btn.action === "url") {
                  code += `    builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                } else if (btn.action === 'goto') {
                  // Если есть target, используем его, иначе используем ID кнопки как callback_data
                  const callbackData = btn.target || btn.id || 'no_action';
                  code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${callbackData}"))\n`;
                }
              });
              code += '    keyboard = builder.as_markup()\n';
              // Определяем, нужен ли markdown для целевого узла
              const useMarkdownTarget = targetNode.data.markdown === true;
              const parseModeTarget = useMarkdownTarget ? ', parse_mode=ParseMode.MARKDOWN' : '';
              code += `    await message.answer(text, reply_markup=keyboard${parseModeTarget})\n`;
            } else {
              code += '    # Удаляем предыдущие reply клавиатуры если они были\n';
              // Определяем, нужен ли markdown для целевого узла
              const useMarkdownTarget = targetNode.data.markdown === true;
              const parseModeTarget = useMarkdownTarget ? ', parse_mode=ParseMode.MARKDOWN' : '';
              code += `    await message.answer(text, reply_markup=ReplyKeyboardRemove()${parseModeTarget})\n`;
            }
          }
        }
      });
    });
  }

  // Generate handlers for contact and location buttons
  const contactButtons = replyNodes.flatMap(node => 
    node.data.buttons.filter(button => button.action === 'contact')
  );
  
  const locationButtons = replyNodes.flatMap(node => 
    node.data.buttons.filter(button => button.action === 'location')
  );
  
  if (contactButtons.length > 0 || locationButtons.length > 0) {
    code += '\n# Обработчики специальных кнопок\n';
    
    if (contactButtons.length > 0) {
      code += '\n@dp.message(F.contact)\n';
      code += 'async def handle_contact(message: types.Message):\n';
      code += '    contact = message.contact\n';
      code += '    text = f"Спасибо за контакт!\\n"\n';
      code += '    text += f"Имя: {contact.first_name}\\n"\n';
      code += '    text += f"Телефон: {contact.phone_number}"\n';
      code += '    await message.answer(text)\n';
    }
    
    if (locationButtons.length > 0) {
      code += '\n@dp.message(F.location)\n';
      code += 'async def handle_location(message: types.Message):\n';
      code += '    location = message.location\n';
      code += '    text = f"Спасибо за геолокацию!\\n"\n';
      code += '    text += f"Широта: {location.latitude}\\n"\n';
      code += '    text += f"Долгота: {location.longitude}"\n';
      code += '    await message.answer(text)\n';
    }
  }

  // Добавляем универсальный обработчик пользовательского ввода
  code += '\n\n# Универсальный обработчик пользовательского ввода\n';
  code += '@dp.message(F.text)\n';
  code += 'async def handle_user_input(message: types.Message):\n';
  code += '    user_id = message.from_user.id\n';
  code += '    \n';
  code += '    # Проверяем, ожидаем ли мы ввод от пользователя\n';
  code += '    if user_id not in user_data or "waiting_for_input" not in user_data[user_id]:\n';
  code += '        return  # Игнорируем сообщение если не ожидаем ввод\n';
  code += '    \n';
  code += '    input_config = user_data[user_id]["waiting_for_input"]\n';
  code += '    user_text = message.text\n';
  code += '    \n';
  code += '    # Проверяем команду пропуска\n';
  code += '    if input_config.get("allow_skip") and user_text == "/skip":\n';
  code += '        await message.answer("⏭️ Ввод пропущен")\n';
  code += '        del user_data[user_id]["waiting_for_input"]\n';
  code += '        return\n';
  code += '    \n';
  code += '    # Валидация длины текста\n';
  code += '    min_length = input_config.get("min_length", 0)\n';
  code += '    max_length = input_config.get("max_length", 0)\n';
  code += '    \n';
  code += '    if min_length > 0 and len(user_text) < min_length:\n';
  code += '        retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '        await message.answer(f"❌ Слишком короткий ответ (минимум {min_length} символов). {retry_message}")\n';
  code += '        return\n';
  code += '    \n';
  code += '    if max_length > 0 and len(user_text) > max_length:\n';
  code += '        retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '        await message.answer(f"❌ Слишком длинный ответ (максимум {max_length} символов). {retry_message}")\n';
  code += '        return\n';
  code += '    \n';
  code += '    # Валидация типа ввода\n';
  code += '    input_type = input_config.get("type", "text")\n';
  code += '    \n';
  code += '    if input_type == "email":\n';
  code += '        import re\n';
  code += '        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"\n';
  code += '        if not re.match(email_pattern, user_text):\n';
  code += '            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '            await message.answer(f"❌ Неверный формат email. {retry_message}")\n';
  code += '            return\n';
  code += '    \n';
  code += '    elif input_type == "number":\n';
  code += '        try:\n';
  code += '            float(user_text)\n';
  code += '        except ValueError:\n';
  code += '            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '            await message.answer(f"❌ Введите корректное число. {retry_message}")\n';
  code += '            return\n';
  code += '    \n';
  code += '    elif input_type == "phone":\n';
  code += '        import re\n';
  code += '        phone_pattern = r"^[+]?[0-9\\s\\-\\(\\)]{10,}$"\n';
  code += '        if not re.match(phone_pattern, user_text):\n';
  code += '            retry_message = input_config.get("retry_message", "Пожалуйста, попробуйте еще раз.")\n';
  code += '            await message.answer(f"❌ Неверный формат телефона. {retry_message}")\n';
  code += '            return\n';
  code += '    \n';
  code += '    # Сохраняем ответ пользователя\n';
  code += '    variable_name = input_config.get("variable", "user_response")\n';
  code += '    user_data[user_id][variable_name] = user_text\n';
  code += '    \n';
  code += '    # Сохраняем в базу данных если включено\n';
  code += '    if input_config.get("save_to_database"):\n';
  code += '        logging.info(f"Сохранение в БД: {variable_name} = {user_text} (пользователь {user_id})")\n';
  code += '        # Здесь можно добавить код для сохранения в реальную базу данных\n';
  code += '    \n';
  code += '    # Отправляем сообщение об успехе\n';
  code += '    success_message = input_config.get("success_message", "Спасибо за ваш ответ!")\n';
  code += '    await message.answer(success_message)\n';
  code += '    \n';
  code += '    # Очищаем состояние ожидания ввода\n';
  code += '    del user_data[user_id]["waiting_for_input"]\n';
  code += '    \n';
  code += '    logging.info(f"Получен пользовательский ввод: {variable_name} = {user_text}")\n';
  code += '\n';

  code += '\n\n# Запуск бота\n';
  code += 'async def main():\n';
  if (menuCommands.length > 0) {
    code += '    await set_bot_commands()\n';
  }
  code += '    print("Бот запущен!")\n';
  code += '    await dp.start_polling(bot)\n\n';
  
  code += 'if __name__ == "__main__":\n';
  code += '    asyncio.run(main())\n';

  return code;
}

function generateStartHandler(node: Node): string {
  let code = '\n@dp.message(CommandStart())\n';
  code += 'async def start_handler(message: types.Message):\n';

  // Добавляем проверки безопасности
  if (node.data.isPrivateOnly) {
    code += '    if not await is_private_chat(message):\n';
    code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
    code += '        return\n';
  }

  if (node.data.adminOnly) {
    code += '    if not await is_admin(message.from_user.id):\n';
    code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
    code += '        return\n';
  }

  if (node.data.requiresAuth) {
    code += '    if not await check_auth(message.from_user.id):\n';
    code += '        await message.answer("❌ Необходимо войти в систему для выполнения этой команды")\n';
    code += '        return\n';
  }

  // Регистрируем пользователя
  code += '\n    # Регистрируем пользователя в системе\n';
  code += '    user_data[message.from_user.id] = {\n';
  code += '        "username": message.from_user.username,\n';
  code += '        "first_name": message.from_user.first_name,\n';
  code += '        "last_name": message.from_user.last_name,\n';
  code += '        "registered_at": message.date\n';
  code += '    }\n\n';
  
  const messageText = node.data.messageText || "Привет! Добро пожаловать!";
  // Используем тройные кавычки для многострочного текста
  if (messageText.includes('\n')) {
    code += `    text = """${messageText}"""\n`;
  } else {
    const escapedText = messageText.replace(/"/g, '\\"');
    code += `    text = "${escapedText}"\n`;
  }
  
  return code + generateKeyboard(node);
}

function generateCommandHandler(node: Node): string {
  const command = node.data.command || "/help";
  const functionName = command.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
  
  let code = `\n@dp.message(Command("${command.replace('/', '')}"))\n`;
  code += `async def ${functionName}_handler(message: types.Message):\n`;

  // Добавляем логирование для отладки
  code += `    logging.info(f"Команда ${command} вызвана пользователем {message.from_user.id}")\n`;

  // Добавляем проверки безопасности
  if (node.data.isPrivateOnly) {
    code += '    if not await is_private_chat(message):\n';
    code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
    code += '        return\n';
  }

  if (node.data.adminOnly) {
    code += '    if not await is_admin(message.from_user.id):\n';
    code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
    code += '        return\n';
  }

  if (node.data.requiresAuth) {
    code += '    if not await check_auth(message.from_user.id):\n';
    code += '        await message.answer("❌ Необходимо войти в систему для выполнения этой команды")\n';
    code += '        return\n';
  }

  // Сохраняем информацию о команде в пользовательских данных
  code += '    # Сохраняем статистику использования команд\n';
  code += '    if message.from_user.id not in user_data:\n';
  code += '        user_data[message.from_user.id] = {}\n';
  code += '    if "commands_used" not in user_data[message.from_user.id]:\n';
  code += '        user_data[message.from_user.id]["commands_used"] = {}\n';
  code += `    user_data[message.from_user.id]["commands_used"]["${command}"] = user_data[message.from_user.id]["commands_used"].get("${command}", 0) + 1\n`;

  const messageText = node.data.messageText || "Команда выполнена";
  // Используем тройные кавычки для многострочного текста
  if (messageText.includes('\n')) {
    code += `\n    text = """${messageText}"""\n`;
  } else {
    const escapedText = messageText.replace(/"/g, '\\"');
    code += `\n    text = "${escapedText}"\n`;
  }
  
  return code + generateKeyboard(node);
}

// generateMessageHandler removed - message nodes are handled via callback handlers only

function generatePhotoHandler(node: Node): string {
  let code = `\n# Обработчик фото для узла ${node.id}\n`;
  
  // Если у узла есть команда, добавляем её как триггер
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `photo_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    // Добавляем логирование
    code += `    logging.info(f"Команда фото ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    // Добавляем проверки безопасности
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const imageUrl = node.data.imageUrl || "https://via.placeholder.com/400x300?text=Photo";
    const caption = node.data.messageText || "📸 Фото";
    
    // Используем тройные кавычки для многострочного caption
    if (caption.includes('\n')) {
      code += `    caption = """${caption}"""\n`;
    } else {
      const escapedCaption = caption.replace(/"/g, '\\"');
      code += `    caption = "${escapedCaption}"\n`;
    }
    
    code += `    photo_url = "${imageUrl}"\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Проверяем, является ли это локальным файлом\n';
    code += '        if is_local_file(photo_url):\n';
    code += '            # Отправляем локальный файл\n';
    code += '            file_path = get_local_file_path(photo_url)\n';
    code += '            if os.path.exists(file_path):\n';
    code += '                photo_file = FSInputFile(file_path)\n';
    code += '            else:\n';
    code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
    code += '        else:\n';
    code += '            # Используем URL для внешних файлов\n';
    code += '            photo_file = photo_url\n';
    code += '        \n';
    
    // Обрабатываем клавиатуру для фото
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        # Создаем inline клавиатуру с кнопками\n';
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        # Отправляем фото с подписью и inline кнопками\n';
      code += '        await message.answer_photo(photo_file, caption=caption, reply_markup=keyboard)\n';
    } else if (node.data.keyboardType === "reply" && node.data.buttons.length > 0) {
      code += '        # Создаем reply клавиатуру\n';
      code += '        builder = ReplyKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "contact" && button.requestContact) {
          code += `        builder.add(KeyboardButton(text="${button.text}", request_contact=True))\n`;
        } else if (button.action === "location" && button.requestLocation) {
          code += `        builder.add(KeyboardButton(text="${button.text}", request_location=True))\n`;
        } else {
          code += `        builder.add(KeyboardButton(text="${button.text}"))\n`;
        }
      });
      const resizeKeyboard = node.data.resizeKeyboard === true ? 'True' : 'False';
      const oneTimeKeyboard = node.data.oneTimeKeyboard === true ? 'True' : 'False';
      code += `        keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
      code += '        # Отправляем фото с подписью и reply клавиатурой\n';
      code += '        await message.answer_photo(photo_file, caption=caption, reply_markup=keyboard)\n';
    } else {
      code += '        # Отправляем фото только с подписью\n';
      code += '        await message.answer_photo(photo_file, caption=caption)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки фото: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось загрузить фото\\n{caption}")\n';
  }
  
  return code;
}

function generateVideoHandler(node: Node): string {
  let code = `\n# Обработчик видео для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `video_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда видео ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const videoUrl = node.data.videoUrl || "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4";
    const caption = node.data.mediaCaption || node.data.messageText || "🎥 Видео";
    const duration = node.data.duration || 0;
    const fileSize = node.data.fileSize || 0;
    
    if (caption.includes('\n')) {
      code += `    caption = """${caption}"""\n`;
    } else {
      const escapedCaption = caption.replace(/"/g, '\\"');
      code += `    caption = "${escapedCaption}"\n`;
    }
    
    code += `    video_url = "${videoUrl}"\n`;
    if (duration > 0) code += `    duration = ${duration}\n`;
    if (fileSize > 0) code += `    file_size = ${fileSize * 1024 * 1024}\n`;  // Convert MB to bytes
    code += '    \n';
    code += '    try:\n';
    code += '        # Проверяем, является ли это локальным файлом\n';
    code += '        if is_local_file(video_url):\n';
    code += '            # Отправляем локальный файл\n';
    code += '            file_path = get_local_file_path(video_url)\n';
    code += '            if os.path.exists(file_path):\n';
    code += '                video_file = FSInputFile(file_path)\n';
    code += '            else:\n';
    code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
    code += '        else:\n';
    code += '            # Используем URL для внешних файлов\n';
    code += '            video_file = video_url\n';
    code += '        \n';
    
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer_video(\n';
      code += '            video_file,\n';
      code += '            caption=caption';
      if (duration > 0) code += ',\n            duration=duration';
      code += ',\n            reply_markup=keyboard\n';
      code += '        )\n';
    } else {
      code += '        await message.answer_video(\n';
      code += '            video_file,\n';
      code += '            caption=caption';
      if (duration > 0) code += ',\n            duration=duration';
      code += '\n        )\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки видео: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось загрузить видео\\n{caption}")\n';
  }
  
  return code;
}

function generateAudioHandler(node: Node): string {
  let code = `\n# Обработчик аудио для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `audio_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда аудио ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const audioUrl = node.data.audioUrl || "https://www.soundjay.com/misc/beep-07a.wav";
    const caption = node.data.mediaCaption || node.data.messageText || "🎵 Аудио";
    const duration = node.data.duration || 0;
    const performer = node.data.performer || "";
    const title = node.data.title || "";
    
    if (caption.includes('\n')) {
      code += `    caption = """${caption}"""\n`;
    } else {
      const escapedCaption = caption.replace(/"/g, '\\"');
      code += `    caption = "${escapedCaption}"\n`;
    }
    
    code += `    audio_url = "${audioUrl}"\n`;
    if (duration > 0) code += `    duration = ${duration}\n`;
    if (performer) code += `    performer = "${performer}"\n`;
    if (title) code += `    title = "${title}"\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Проверяем, является ли это локальным файлом\n';
    code += '        if is_local_file(audio_url):\n';
    code += '            # Отправляем локальный файл\n';
    code += '            file_path = get_local_file_path(audio_url)\n';
    code += '            if os.path.exists(file_path):\n';
    code += '                audio_file = FSInputFile(file_path)\n';
    code += '            else:\n';
    code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
    code += '        else:\n';
    code += '            # Используем URL для внешних файлов\n';
    code += '            audio_file = audio_url\n';
    code += '        \n';
    
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer_audio(\n';
      code += '            audio_file,\n';
      code += '            caption=caption';
      if (duration > 0) code += ',\n            duration=duration';
      if (performer) code += ',\n            performer=performer';
      if (title) code += ',\n            title=title';
      code += ',\n            reply_markup=keyboard\n';
      code += '        )\n';
    } else {
      code += '        await message.answer_audio(\n';
      code += '            audio_file,\n';
      code += '            caption=caption';
      if (duration > 0) code += ',\n            duration=duration';
      if (performer) code += ',\n            performer=performer';
      if (title) code += ',\n            title=title';
      code += '\n        )\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки аудио: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось загрузить аудио\\n{caption}")\n';
  }
  
  return code;
}

function generateDocumentHandler(node: Node): string {
  let code = `\n# Обработчик документа для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `document_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда документа ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const documentUrl = node.data.documentUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
    const documentName = node.data.documentName || "document.pdf";
    const caption = node.data.mediaCaption || node.data.messageText || "📄 Документ";
    const fileSize = node.data.fileSize || 0;
    const mimeType = node.data.mimeType || "";
    
    if (caption.includes('\n')) {
      code += `    caption = """${caption}"""\n`;
    } else {
      const escapedCaption = caption.replace(/"/g, '\\"');
      code += `    caption = "${escapedCaption}"\n`;
    }
    
    code += `    document_url = "${documentUrl}"\n`;
    code += `    document_name = "${documentName}"\n`;
    if (fileSize > 0) code += `    file_size = ${fileSize * 1024 * 1024}\n`;  // Convert MB to bytes
    if (mimeType) code += `    mime_type = "${mimeType}"\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Проверяем, является ли это локальным файлом\n';
    code += '        if is_local_file(document_url):\n';
    code += '            # Отправляем локальный файл\n';
    code += '            file_path = get_local_file_path(document_url)\n';
    code += '            if os.path.exists(file_path):\n';
    code += '                document_file = FSInputFile(file_path, filename=document_name)\n';
    code += '            else:\n';
    code += '                raise FileNotFoundError(f"Локальный файл не найден: {file_path}")\n';
    code += '        else:\n';
    code += '            # Используем URL для внешних файлов\n';
    code += '            document_file = URLInputFile(document_url, filename=document_name)\n';
    code += '        \n';
    
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer_document(\n';
      code += '            document_file,\n';
      code += '            caption=caption,\n';
      code += '            reply_markup=keyboard\n';
      code += '        )\n';
    } else {
      code += '        await message.answer_document(\n';
      code += '            document_file,\n';
      code += '            caption=caption\n';
      code += '        )\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки документа: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось загрузить документ\\n{caption}")\n';
  }
  
  return code;
}

function generateStickerHandler(node: Node): string {
  let code = `\n# Обработчик стикера для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `sticker_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда стикера ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const stickerUrl = node.data.stickerUrl || node.data.stickerFileId || "CAACAgIAAxkBAAICGGXm2KvQAAG2X8cxTmZHJkRnYwYlAAJGAANWnb0KmgiEKEZDKVQeBA";
    
    code += '    try:\n';
    code += '        # Отправляем стикер\n';
    
    if (node.data.stickerFileId) {
      code += `        sticker_file_id = "${node.data.stickerFileId}"\n`;
      code += '        await message.answer_sticker(sticker_file_id)\n';
    } else {
      code += `        sticker_url = "${stickerUrl}"\n`;
      code += '        await message.answer_sticker(sticker_url)\n';
    }
    
    // Добавляем кнопки после стикера если они есть
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        \n';
      code += '        # Отправляем кнопки отдельно после стикера\n';
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer("Выберите действие:", reply_markup=keyboard)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки стикера: {e}")\n';
    code += '        await message.answer("❌ Не удалось отправить стикер")\n';
  }
  
  return code;
}

function generateVoiceHandler(node: Node): string {
  let code = `\n# Обработчик голосового сообщения для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `voice_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда голосового сообщения ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const voiceUrl = node.data.voiceUrl || "https://www.soundjay.com/misc/beep-07a.wav";
    const duration = node.data.duration || 10;
    
    code += `    voice_url = "${voiceUrl}"\n`;
    code += `    duration = ${duration}\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Отправляем голосовое сообщение\n';
    code += '        await message.answer_voice(voice_url, duration=duration)\n';
    
    // Добавляем кнопки после голосового сообщения если они есть
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        \n';
      code += '        # Отправляем кнопки отдельно после голосового сообщения\n';
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer("Выберите действие:", reply_markup=keyboard)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки голосового сообщения: {e}")\n';
    code += '        await message.answer("❌ Не удалось отправить голосовое сообщение")\n';
  }
  
  return code;
}

function generateAnimationHandler(node: Node): string {
  let code = `\n# Обработчик GIF анимации для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `animation_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда анимации ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const animationUrl = node.data.animationUrl || "https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif";
    const caption = node.data.mediaCaption || node.data.messageText || "🎬 GIF анимация";
    const duration = node.data.duration || 0;
    const width = node.data.width || 0;
    const height = node.data.height || 0;
    
    if (caption.includes('\n')) {
      code += `    caption = """${caption}"""\n`;
    } else {
      const escapedCaption = caption.replace(/"/g, '\\"');
      code += `    caption = "${escapedCaption}"\n`;
    }
    
    code += `    animation_url = "${animationUrl}"\n`;
    if (duration > 0) code += `    duration = ${duration}\n`;
    if (width > 0) code += `    width = ${width}\n`;
    if (height > 0) code += `    height = ${height}\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Отправляем GIF анимацию\n';
    
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer_animation(animation_url, caption=caption, reply_markup=keyboard';
      if (duration > 0) code += ', duration=duration';
      if (width > 0) code += ', width=width';
      if (height > 0) code += ', height=height';
      code += ')\n';
    } else {
      code += '        await message.answer_animation(animation_url, caption=caption';
      if (duration > 0) code += ', duration=duration';
      if (width > 0) code += ', width=width';
      if (height > 0) code += ', height=height';
      code += ')\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки анимации: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось загрузить анимацию\\n{caption}")\n';
  }
  
  return code;
}

function generateLocationHandler(node: Node): string {
  let code = `\n# Обработчик геолокации для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `location_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда геолокации ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    // Получаем координаты из различных источников
    let latitude = node.data.latitude || 55.7558;
    let longitude = node.data.longitude || 37.6176;
    const title = node.data.title || "Местоположение";
    const address = node.data.address || "";
    const city = node.data.city || "";
    const country = node.data.country || "";
    const foursquareId = node.data.foursquareId || "";
    const foursquareType = node.data.foursquareType || "";
    const mapService = node.data.mapService || 'custom';
    const generateMapPreview = node.data.generateMapPreview !== false;

    code += '    # Определяем координаты на основе выбранного сервиса карт\n';
    
    if (mapService === 'yandex' && node.data.yandexMapUrl) {
      code += `    yandex_url = "${node.data.yandexMapUrl}"\n`;
      code += '    extracted_lat, extracted_lon = extract_coordinates_from_yandex(yandex_url)\n';
      code += '    if extracted_lat and extracted_lon:\n';
      code += '        latitude, longitude = extracted_lat, extracted_lon\n';
      code += '    else:\n';
      code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
    } else if (mapService === 'google' && node.data.googleMapUrl) {
      code += `    google_url = "${node.data.googleMapUrl}"\n`;
      code += '    extracted_lat, extracted_lon = extract_coordinates_from_google(google_url)\n';
      code += '    if extracted_lat and extracted_lon:\n';
      code += '        latitude, longitude = extracted_lat, extracted_lon\n';
      code += '    else:\n';
      code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
    } else if (mapService === '2gis' && node.data.gisMapUrl) {
      code += `    gis_url = "${node.data.gisMapUrl}"\n`;
      code += '    extracted_lat, extracted_lon = extract_coordinates_from_2gis(gis_url)\n';
      code += '    if extracted_lat and extracted_lon:\n';
      code += '        latitude, longitude = extracted_lat, extracted_lon\n';
      code += '    else:\n';
      code += `        latitude, longitude = ${latitude}, ${longitude}  # Fallback координаты\n`;
    } else {
      code += `    latitude, longitude = ${latitude}, ${longitude}\n`;
    }
    
    if (title) code += `    title = "${title}"\n`;
    if (address) code += `    address = "${address}"\n`;
    if (city) code += `    city = "${city}"\n`;
    if (country) code += `    country = "${country}"\n`;
    if (foursquareId) code += `    foursquare_id = "${foursquareId}"\n`;
    if (foursquareType) code += `    foursquare_type = "${foursquareType}"\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Отправляем геолокацию\n';
    
    if (title || address) {
      code += '        await message.answer_venue(\n';
      code += '            latitude=latitude,\n';
      code += '            longitude=longitude,\n';
      code += '            title=title,\n';
      code += '            address=address';
      if (foursquareId) code += ',\n            foursquare_id=foursquare_id';
      if (foursquareType) code += ',\n            foursquare_type=foursquare_type';
      code += '\n        )\n';
    } else {
      code += '        await message.answer_location(latitude=latitude, longitude=longitude)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки геолокации: {e}")\n';
    code += '        await message.answer(f"❌ Не удалось отправить геолокацию")\n';
    
    // Генерируем кнопки для картографических сервисов если включено
    if (generateMapPreview) {
      code += '        \n';
      code += '        # Генерируем ссылки на картографические сервисы\n';
      code += '        map_urls = generate_map_urls(latitude, longitude, title)\n';
      code += '        \n';
      code += '        # Создаем кнопки для различных карт\n';
      code += '        map_builder = InlineKeyboardBuilder()\n';
      code += '        map_builder.add(InlineKeyboardButton(text="🗺️ Яндекс Карты", url=map_urls["yandex"]))\n';
      code += '        map_builder.add(InlineKeyboardButton(text="🌍 Google Maps", url=map_urls["google"]))\n';
      code += '        map_builder.add(InlineKeyboardButton(text="📍 2ГИС", url=map_urls["2gis"]))\n';
      code += '        map_builder.add(InlineKeyboardButton(text="🌐 OpenStreetMap", url=map_urls["openstreetmap"]))\n';
      
      if (node.data.showDirections) {
        code += '        # Добавляем кнопки для построения маршрута\n';
        code += '        map_builder.add(InlineKeyboardButton(text="🧭 Маршрут (Яндекс)", url=f"https://yandex.ru/maps/?rtext=~{latitude},{longitude}"))\n';
        code += '        map_builder.add(InlineKeyboardButton(text="🚗 Маршрут (Google)", url=f"https://maps.google.com/maps/dir//{latitude},{longitude}"))\n';
      }
      
      code += '        map_builder.adjust(2)  # Размещаем кнопки в 2 столбца\n';
      code += '        map_keyboard = map_builder.as_markup()\n';
      code += '        \n';
      code += '        await message.answer(\n';
      if (node.data.showDirections) {
        code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе или постройте маршрут:",\n';
      } else {
        code += '            "🗺️ Откройте местоположение в удобном картографическом сервисе:",\n';
      }
      code += '            reply_markup=map_keyboard\n';
      code += '        )\n';
    }
    
    // Добавляем дополнительные кнопки после геолокации если они есть
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        \n';
      code += '        # Отправляем дополнительные кнопки\n';
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer("Выберите действие:", reply_markup=keyboard)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки геолокации: {e}")\n';
    code += '        await message.answer("❌ Не удалось отправить геолокацию")\n';
  }
  
  return code;
}

function generateContactHandler(node: Node): string {
  let code = `\n# Обработчик контакта для узла ${node.id}\n`;
  
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `contact_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    code += `    logging.info(f"Команда контакта ${node.data.command} вызвана пользователем {message.from_user.id}")\n`;
    
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    const phoneNumber = node.data.phoneNumber || "+7 (999) 123-45-67";
    const firstName = node.data.firstName || "Имя";
    const lastName = node.data.lastName || "";
    const userId = node.data.userId || 0;
    const vcard = node.data.vcard || "";
    
    code += `    phone_number = "${phoneNumber}"\n`;
    code += `    first_name = "${firstName}"\n`;
    if (lastName) code += `    last_name = "${lastName}"\n`;
    if (userId > 0) code += `    user_id = ${userId}\n`;
    if (vcard) code += `    vcard = "${vcard}"\n`;
    code += '    \n';
    code += '    try:\n';
    code += '        # Отправляем контакт\n';
    code += '        await message.answer_contact(\n';
    code += '            phone_number=phone_number,\n';
    code += '            first_name=first_name';
    if (lastName) code += ',\n            last_name=last_name';
    if (userId > 0) code += ',\n            user_id=user_id';
    if (vcard) code += ',\n            vcard=vcard';
    code += '\n        )\n';
    
    // Добавляем кнопки после контакта если они есть
    if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
      code += '        \n';
      code += '        # Отправляем кнопки отдельно после контакта\n';
      code += '        builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(button => {
        if (button.action === "url") {
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
        } else if (button.action === 'goto') {
          const callbackData = button.target || button.id || 'no_action';
          code += `        builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
        }
      });
      code += '        keyboard = builder.as_markup()\n';
      code += '        await message.answer("Выберите действие:", reply_markup=keyboard)\n';
    }
    
    code += '    except Exception as e:\n';
    code += '        logging.error(f"Ошибка отправки контакта: {e}")\n';
    code += '        await message.answer("❌ Не удалось отправить контакт")\n';
  }
  
  return code;
}

function generateSynonymHandler(node: Node, synonym: string): string {
  const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
  const originalCommand = node.data.command || (node.type === 'start' ? '/start' : '/help');
  const functionName = originalCommand.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
  
  let code = `\n@dp.message(lambda message: message.text and message.text.lower() == "${synonym.toLowerCase()}")\n`;
  code += `async def ${functionName}_synonym_${sanitizedSynonym}_handler(message: types.Message):\n`;
  code += `    # Синоним для команды ${originalCommand}\n`;
  
  if (node.type === 'start') {
    code += '    await start_handler(message)\n';
  } else {
    code += `    await ${functionName}_handler(message)\n`;
  }
  
  return code;
}

function generateKeyboard(node: Node): string {
  let code = '';
  
  // Определяем, нужен ли markdown
  const useMarkdown = node.data.markdown === true;
  const parseMode = useMarkdown ? ', parse_mode=ParseMode.MARKDOWN' : '';
  
  if (node.data.keyboardType === "reply" && node.data.buttons.length > 0) {
    code += '    \n';
    code += '    builder = ReplyKeyboardBuilder()\n';
    node.data.buttons.forEach(button => {
      if (button.action === "contact" && button.requestContact) {
        code += `    builder.add(KeyboardButton(text="${button.text}", request_contact=True))\n`;
      } else if (button.action === "location" && button.requestLocation) {
        code += `    builder.add(KeyboardButton(text="${button.text}", request_location=True))\n`;
      } else {
        code += `    builder.add(KeyboardButton(text="${button.text}"))\n`;
      }
    });
    
    const resizeKeyboard = node.data.resizeKeyboard === true ? 'True' : 'False';
    const oneTimeKeyboard = node.data.oneTimeKeyboard === true ? 'True' : 'False';
    code += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
    code += `    await message.answer(text, reply_markup=keyboard${parseMode})\n`;
  } else if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
    code += '    \n';
    code += '    # Создаем inline клавиатуру с кнопками\n';
    code += '    builder = InlineKeyboardBuilder()\n';
    node.data.buttons.forEach(button => {
      if (button.action === "url") {
        code += `    builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
      } else if (button.action === 'goto') {
        // Если есть target, используем его, иначе используем ID кнопки как callback_data
        const callbackData = button.target || button.id || 'no_action';
        code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${callbackData}"))\n`;
      }
    });
    
    code += '    keyboard = builder.as_markup()\n';
    code += '    # Отправляем сообщение с прикрепленными inline кнопками\n';
    code += `    await message.answer(text, reply_markup=keyboard${parseMode})\n`;
  } else if (node.data.keyboardType === "none" || !node.data.keyboardType) {
    code += '    # Отправляем сообщение без клавиатуры (удаляем reply клавиатуру если была)\n';
    code += `    await message.answer(text, reply_markup=ReplyKeyboardRemove()${parseMode})\n`;
  } else {
    code += `    await message.answer(text${parseMode})\n`;
  }
  
  return code;
}

export function validateBotStructure(botData: BotData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { nodes, connections } = botData;

  // Check if there's a start node
  const startNodes = nodes.filter(node => node.type === 'start');
  if (startNodes.length === 0) {
    errors.push("Бот должен содержать хотя бы одну стартовую команду");
  }
  if (startNodes.length > 1) {
    errors.push("Бот может содержать только одну стартовую команду");
  }

  // Validate each node
  nodes.forEach(node => {
    if (!node.data.messageText && node.type !== 'condition') {
      errors.push(`Узел "${node.id}" должен содержать текст сообщения`);
    }

    // Validate commands
    if ((node.type === 'start' || node.type === 'command') && node.data.command) {
      const commandValidation = validateCommand(node.data.command);
      if (!commandValidation.isValid) {
        errors.push(...commandValidation.errors.map(err => `Команда "${node.data.command}": ${err}`));
      }
    }

    // Validate buttons
    node.data.buttons.forEach(button => {
      if (!button.text.trim()) {
        errors.push(`Кнопка в узле "${node.id}" должна содержать текст`);
      }
      if (button.action === 'url' && !button.url) {
        errors.push(`Кнопка "${button.text}" должна содержать URL`);
      }
      if (button.action === 'goto' && !button.target) {
        errors.push(`Кнопка "${button.text}" должна содержать цель перехода`);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateCommand(command: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!command) {
    errors.push('Команда не может быть пустой');
    return { isValid: false, errors };
  }
  
  if (!command.startsWith('/')) {
    errors.push('Команда должна начинаться с символа "/"');
  }
  
  if (command.length < 2) {
    errors.push('Команда должна содержать хотя бы один символ после "/"');
  }
  
  if (command.length > 32) {
    errors.push('Команда не может быть длиннее 32 символов');
  }
  
  // Проверка на допустимые символы
  const validPattern = /^\/[a-zA-Z][a-zA-Z0-9_]*$/;
  if (!validPattern.test(command)) {
    errors.push('Команда может содержать только латинские буквы, цифры и подчёркивания');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function generateRequirementsTxt(): string {
  const lines = [
    '# Telegram Bot Requirements - Updated compatible versions',
    '# Install with: pip install -r requirements.txt',
    '# If you get Rust compilation errors, use: pip install --only-binary=all -r requirements.txt',
    '',
    '# Core dependencies (using newer versions to avoid Rust compilation issues)',
    'aiogram>=3.21.0',
    'aiohttp>=3.12.13',
    'requests>=2.32.4',
    'python-dotenv>=1.0.0',
    'aiofiles>=23.2.1',
    '',
    '# Note: These versions have pre-compiled wheels and do not require Rust',
    '# If you still encounter issues, try:',
    '# pip install --upgrade pip setuptools wheel',
    '# pip install --only-binary=all aiogram aiohttp requests python-dotenv aiofiles',
    '',
    '# Optional dependencies for extended functionality',
    '# redis>=5.0.1  # For session storage',
    '# asyncpg>=0.29.0  # For PostgreSQL database',
    '# motor>=3.3.2  # For MongoDB',
    '# pillow>=10.1.0  # For image processing'
  ];
  return lines.join('\n');
}

export function generateReadme(botData: BotData, botName: string): string {
  const commandNodes = botData.nodes.filter(node => 
    (node.type === 'start' || node.type === 'command') && node.data.command
  );
  
  let readme = '# ' + botName + '\n\n';
  readme += 'Telegram бот, созданный с помощью TelegramBot Builder.\n\n';
  readme += '## Описание\n\n';
  readme += 'Этот бот содержит ' + botData.nodes.length + ' узлов и ' + botData.connections.length + ' соединений.\n\n';
  readme += '### Команды бота\n\n';

  commandNodes.forEach(node => {
    const command = node.data.command || '/unknown';
    const description = node.data.description || 'Описание отсутствует';
    readme += '- `' + command + '` - ' + description + '\n';
    
    if (node.data.adminOnly) {
      readme += '  - 🔒 Только для администраторов\n';
    }
    if (node.data.isPrivateOnly) {
      readme += '  - 👤 Только в приватных чатах\n';
    }
    if (node.data.requiresAuth) {
      readme += '  - 🔐 Требует авторизации\n';
    }
  });

  readme += '\n## Установка\n\n';
  readme += '1. Клонируйте или скачайте файлы проекта\n';
  readme += '2. Установите зависимости:\n';
  readme += '   ```bash\n';
  readme += '   pip install -r requirements.txt\n';
  readme += '   ```\n\n';
  readme += '3. Создайте файл `.env` и добавьте ваш токен бота:\n';
  readme += '   ```\n';
  readme += '   BOT_TOKEN=your_bot_token_here\n';
  readme += '   ```\n\n';
  readme += '4. Запустите бота:\n';
  readme += '   ```bash\n';
  readme += '   python bot.py\n';
  readme += '   ```\n\n';
  
  readme += '## Настройка\n\n';
  readme += '### Получение токена бота\n\n';
  readme += '1. Найдите [@BotFather](https://t.me/BotFather) в Telegram\n';
  readme += '2. Отправьте команду `/newbot`\n';
  readme += '3. Следуйте инструкциям для создания нового бота\n';
  readme += '4. Скопируйте полученный токен\n\n';
  
  readme += '### Настройка команд в @BotFather\n\n';
  readme += '1. Отправьте команду `/setcommands` в @BotFather\n';
  readme += '2. Выберите своего бота\n';
  readme += '3. Скопируйте и отправьте следующие команды:\n\n';
  readme += '```\n';
  readme += generateBotFatherCommands(botData.nodes);
  readme += '\n```\n\n';
  
  readme += '## Структура проекта\n\n';
  readme += '- `bot.py` - Основной файл бота\n';
  readme += '- `requirements.txt` - Зависимости Python\n';
  readme += '- `config.yaml` - Конфигурационный файл\n';
  readme += '- `README.md` - Документация\n';
  readme += '- `Dockerfile` - Для контейнеризации (опционально)\n\n';
  
  readme += '## Функциональность\n\n';
  readme += '### Статистика\n\n';
  readme += '- **Всего узлов**: ' + botData.nodes.length + '\n';
  readme += '- **Команд**: ' + commandNodes.length + '\n';
  readme += '- **Сообщений**: ' + botData.nodes.filter(n => n.type === 'message').length + '\n';
  readme += '- **Фото**: ' + botData.nodes.filter(n => n.type === 'photo').length + '\n';
  readme += '- **Кнопок**: ' + botData.nodes.reduce((sum, node) => sum + node.data.buttons.length, 0) + '\n\n';
  
  readme += '### Безопасность\n\n';
  readme += 'Бот включает следующие функции безопасности:\n';
  readme += '- Проверка администраторских прав\n';
  readme += '- Ограничения на приватные чаты\n';
  readme += '- Система авторизации пользователей\n\n';
  
  readme += '## Разработка\n\n';
  readme += 'Этот бот создан с использованием:\n';
  readme += '- [aiogram 3.x](https://docs.aiogram.dev/) - современная библиотека для Telegram Bot API\n';
  readme += '- Python 3.8+\n';
  readme += '- Асинхронное программирование\n\n';
  
  readme += '## Лицензия\n\n';
  readme += 'Сгенерировано с помощью TelegramBot Builder\n';

  return readme;
}

export function generateDockerfile(): string {
  const lines = [
    '# Dockerfile для Telegram бота',
    'FROM python:3.11-slim',
    '',
    '# Установка системных зависимостей',
    'RUN apt-get update && apt-get install -y \\',
    '    gcc \\',
    '    && rm -rf /var/lib/apt/lists/*',
    '',
    '# Создание рабочей директории',
    'WORKDIR /app',
    '',
    '# Копирование requirements.txt и установка зависимостей',
    'COPY requirements.txt .',
    'RUN pip install --no-cache-dir -r requirements.txt',
    '',
    '# Копирование исходного кода',
    'COPY . .',
    '',
    '# Создание пользователя для безопасности',
    'RUN adduser --disabled-password --gecos \'\' botuser',
    'RUN chown -R botuser:botuser /app',
    'USER botuser',
    '',
    '# Запуск бота',
    'CMD ["python", "bot.py"]'
  ];
  return lines.join('\n');
}

export function generateConfigYaml(botName: string): string {
  const lines = [
    '# Конфигурация бота',
    'bot:',
    '  name: "' + botName + '"',
    '  description: "Telegram бот, созданный с помощью TelegramBot Builder"',
    '',
    '# Настройки логирования',
    'logging:',
    '  level: INFO',
    '  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"',
    '',
    '# Настройки базы данных (опционально)',
    'database:',
    '  # type: sqlite',
    '  # url: "sqlite:///bot.db"',
    '',
    '  # type: postgresql',
    '  # host: localhost',
    '  # port: 5432',
    '  # name: botdb',
    '  # user: botuser',
    '  # password: botpass',
    '',
    '# Настройки Redis (опционально)',
    'redis:',
    '  # host: localhost',
    '  # port: 6379',
    '  # db: 0',
    '  # password: ""',
    '',
    '# Настройки webhook (для продакшена)',
    'webhook:',
    '  # enabled: false',
    '  # host: "0.0.0.0"',
    '  # port: 8080',
    '  # path: "/webhook"',
    '  # url: "https://yourdomain.com/webhook"',
    '',
    '# Настройки администраторов',
    'admins:',
    '  - 123456789  # Замените на реальные Telegram ID администраторов',
    '',
    '# Дополнительные настройки',
    'settings:',
    '  timezone: "UTC"',
    '  language: "ru"',
    '  debug: false'
  ];
  return lines.join('\n');
}

function generateUserInputHandler(node: Node): string {
  let code = `\n# Обработчик сбора пользовательского ввода для узла ${node.id}\n`;
  
  // Генерируем безопасное имя функции
  const safeFunctionName = node.id.replace(/[^a-zA-Z0-9]/g, '_');
  
  // Проверяем, есть ли команда для этого узла
  if (node.data.command) {
    const command = node.data.command.replace('/', '');
    const functionName = `input_${command}_handler`.replace(/[^a-zA-Z0-9_]/g, '_');
    
    code += `@dp.message(Command("${command}"))\n`;
    code += `async def ${functionName}(message: types.Message):\n`;
    
    // Добавляем проверки безопасности
    if (node.data.isPrivateOnly) {
      code += '    if not await is_private_chat(message):\n';
      code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\n';
      code += '        return\n';
    }

    if (node.data.adminOnly) {
      code += '    if not await is_admin(message.from_user.id):\n';
      code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\n';
      code += '        return\n';
    }

    if (node.data.requiresAuth) {
      code += '    if not await check_auth(message.from_user.id):\n';
      code += '        await message.answer("❌ Необходимо войти в систему для выполнения этой команды")\n';
      code += '        return\n';
    }
  }
  
  // Получаем параметры из узла
  const inputPrompt = node.data.inputPrompt || "Пожалуйста, введите ваш ответ:";
  const inputType = node.data.inputType || 'text';
  const inputVariable = node.data.inputVariable || 'user_response';
  const inputValidation = node.data.inputValidation || '';
  const minLength = node.data.minLength || 0;
  const maxLength = node.data.maxLength || 0;
  const inputTimeout = node.data.inputTimeout || 60;
  const inputRequired = node.data.inputRequired !== false;
  const allowSkip = node.data.allowSkip || false;
  const saveToDatabase = node.data.saveToDatabase || false;
  const inputRetryMessage = node.data.inputRetryMessage || "Пожалуйста, попробуйте еще раз.";
  const inputSuccessMessage = node.data.inputSuccessMessage || "Спасибо за ваш ответ!";
  const placeholder = node.data.placeholder || "";
  const defaultValue = node.data.defaultValue || "";
  
  // Отправляем запрос пользователю
  if (inputPrompt.includes('\n')) {
    code += `    prompt_text = """${inputPrompt}"""\n`;
  } else {
    const escapedPrompt = inputPrompt.replace(/"/g, '\\"');
    code += `    prompt_text = "${escapedPrompt}"\n`;
  }
  
  if (placeholder) {
    code += `    placeholder_text = "${placeholder}"\n`;
    code += '    prompt_text += f"\\n\\n💡 {placeholder_text}"\n';
  }
  
  if (allowSkip) {
    code += '    prompt_text += "\\n\\n⏭️ Нажмите /skip чтобы пропустить"\n';
  }
  
  code += '    await message.answer(prompt_text)\n';
  code += '    \n';
  code += '    # Инициализируем пользовательские данные если их нет\n';
  code += '    if message.from_user.id not in user_data:\n';
  code += '        user_data[message.from_user.id] = {}\n';
  code += '    \n';
  code += '    # Ожидаем ответ пользователя\n';
  code += '    user_data[message.from_user.id]["waiting_for_input"] = {\n';
  code += `        "type": "${inputType}",\n`;
  code += `        "variable": "${inputVariable}",\n`;
  code += `        "validation": "${inputValidation}",\n`;
  code += `        "min_length": ${minLength},\n`;
  code += `        "max_length": ${maxLength},\n`;
  code += `        "timeout": ${inputTimeout},\n`;
  code += `        "required": ${inputRequired ? 'True' : 'False'},\n`;
  code += `        "allow_skip": ${allowSkip ? 'True' : 'False'},\n`;
  code += `        "save_to_db": ${saveToDatabase ? 'True' : 'False'},\n`;
  code += `        "retry_message": "${inputRetryMessage}",\n`;
  code += `        "success_message": "${inputSuccessMessage}",\n`;
  code += `        "default_value": "${defaultValue}",\n`;
  code += `        "node_id": "${node.id}"\n`;
  code += '    }\n';
  code += '    \n';
  
  return code;
}