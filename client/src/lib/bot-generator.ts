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
  code += 'import aiohttp\n';
  code += 'import aiofiles\n';
  code += 'import tempfile\n';
  code += 'import os\n';
  code += 'from pathlib import Path\n';
  code += 'from aiogram import Bot, Dispatcher, types\n';
  code += 'from aiogram.filters import CommandStart, Command\n';
  code += 'from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove, FSInputFile, URLInputFile, BufferedInputFile\n';
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

  code += 'async def validate_url(url: str) -> bool:\n';
  code += '    """Проверяет, является ли URL действительным изображением"""\n';
  code += '    if not url:\n';
  code += '        return False\n';
  code += '    \n';
  code += '    # Проверяем схему URL\n';
  code += '    if not url.startswith(("http://", "https://")):\n';
  code += '        return False\n';
  code += '    \n';
  code += '    # Проверяем расширение файла\n';
  code += '    allowed_extensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]\n';
  code += '    url_lower = url.lower()\n';
  code += '    return any(url_lower.endswith(ext) for ext in allowed_extensions)\n\n';

  code += 'async def download_image(url: str) -> BufferedInputFile:\n';
  code += '    """Скачивает изображение по URL и возвращает BufferedInputFile"""\n';
  code += '    try:\n';
  code += '        async with aiohttp.ClientSession() as session:\n';
  code += '            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:\n';
  code += '                if response.status == 200:\n';
  code += '                    content = await response.read()\n';
  code += '                    # Определяем имя файла из URL или используем дефолтное\n';
  code += '                    filename = url.split("/")[-1] if "/" in url else "image.jpg"\n';
  code += '                    if "." not in filename:\n';
  code += '                        filename += ".jpg"\n';
  code += '                    return BufferedInputFile(content, filename=filename)\n';
  code += '                else:\n';
  code += '                    logging.error(f"Ошибка загрузки изображения: HTTP {response.status}")\n';
  code += '                    return None\n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Ошибка при скачивании изображения: {e}")\n';
  code += '        return None\n\n';

  code += 'async def send_photo_safe(message: types.Message, photo_url: str, caption: str = None, reply_markup=None, send_as_document: bool = False, has_content_protection: bool = False, disable_web_page_preview: bool = False):\n';
  code += '    """Безопасная отправка фото с обработкой различных форматов URL и дополнительными опциями"""\n';
  code += '    try:\n';
  code += '        # Проверяем валидность URL\n';
  code += '        if not await validate_url(photo_url):\n';
  code += '            raise ValueError("Недопустимый URL изображения")\n';
  code += '        \n';
  code += '        # Параметры отправки\n';
  code += '        send_params = {\n';
  code += '            "caption": caption,\n';
  code += '            "parse_mode": ParseMode.HTML,\n';
  code += '            "reply_markup": reply_markup,\n';
  code += '            "has_spoiler": False,  # Можно добавить как опцию\n';
  code += '            "protect_content": has_content_protection\n';
  code += '        }\n';
  code += '        \n';
  code += '        # Если URL начинается с file_id (для Telegram файлов)\n';
  code += '        if photo_url.startswith(("AgAC", "BAACAgIA", "BAADBAAD")):\n';
  code += '            if send_as_document:\n';
  code += '                await message.answer_document(\n';
  code += '                    document=photo_url,\n';
  code += '                    **send_params\n';
  code += '                )\n';
  code += '            else:\n';
  code += '                await message.answer_photo(\n';
  code += '                    photo=photo_url,\n';
  code += '                    **send_params\n';
  code += '                )\n';
  code += '        else:\n';
  code += '            # Для внешних URL\n';
  code += '            if send_as_document:\n';
  code += '                # Скачиваем файл для отправки как документ\n';
  code += '                photo_file = await download_image(photo_url)\n';
  code += '                if photo_file:\n';
  code += '                    await message.answer_document(\n';
  code += '                        document=photo_file,\n';
  code += '                        **send_params\n';
  code += '                    )\n';
  code += '                else:\n';
  code += '                    raise ValueError("Не удалось скачать изображение")\n';
  code += '            else:\n';
  code += '                # Обычная отправка фото\n';
  code += '                photo_file = URLInputFile(photo_url)\n';
  code += '                await message.answer_photo(\n';
  code += '                    photo=photo_file,\n';
  code += '                    **send_params\n';
  code += '                )\n';
  code += '        \n';
  code += '        logging.info(f"Фото успешно отправлено: {photo_url[:50]}... (документ: {send_as_document}, защита: {has_content_protection})")\n';
  code += '        return True\n';
  code += '        \n';
  code += '    except Exception as e:\n';
  code += '        logging.error(f"Ошибка при отправке фото {photo_url}: {e}")\n';
  code += '        \n';
  code += '        # Fallback: отправляем только текст\n';
  code += '        fallback_text = caption if caption else "❌ Не удалось загрузить изображение"\n';
  code += '        await message.answer(\n';
  code += '            text=fallback_text,\n';
  code += '            parse_mode=ParseMode.HTML,\n';
  code += '            reply_markup=reply_markup,\n';
  code += '            disable_web_page_preview=disable_web_page_preview,\n';
  code += '            protect_content=has_content_protection\n';
  code += '        )\n';
  code += '        return False\n\n';

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
    } else if (node.type === "message") {
      code += generateMessageHandler(node);
    } else if (node.type === "photo") {
      code += generatePhotoHandler(node);
    }
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
    node.data.keyboardType === 'inline' && 
    ((node.data.inlineButtons && node.data.inlineButtons.length > 0) || 
     (node.data.buttons && node.data.buttons.length > 0))
  );

  if (inlineNodes.length > 0) {
    code += '\n# Обработчики inline кнопок\n';
    inlineNodes.forEach(node => {
      const inlineButtons = node.data.inlineButtons || node.data.buttons || [];
      inlineButtons.forEach((button: any) => {
        // Skip URL buttons as they don't need callback handlers
        if (button.action === 'url') {
          return;
        }
        
        const callbackData = button.target || button.text.replace(/[^a-zA-Z0-9а-яА-Я_]/g, '_');
        const handlerId = (button.id || `btn_${Date.now()}`).replace(/[^a-zA-Z0-9_]/g, '_');
        
        if (button.action === 'goto') {
          // Find target node
          const targetNode = nodes.find(n => n.id === button.target);
          
          code += `\n@dp.callback_query(lambda c: c.data == "${callbackData}")\n`;
          code += `async def handle_inline_${handlerId}(callback_query: types.CallbackQuery):\n`;
          code += '    await callback_query.answer()\n';
          
          if (targetNode) {
            // Navigate to target node and generate its content
            if (targetNode.type === 'message') {
              const messageText = targetNode.data.messageText || 'Сообщение';
              code += `    text = "${messageText}"\n`;
              
              // Generate keyboard for target node if it has one
              if (targetNode.data.keyboardType === 'inline' && (targetNode.data.inlineButtons || targetNode.data.buttons)) {
                const targetButtons = targetNode.data.inlineButtons || targetNode.data.buttons || [];
                if (targetButtons.length > 0) {
                  code += '    builder = InlineKeyboardBuilder()\n';
                  targetButtons.forEach((btn: any) => {
                    const btnText = btn.icon ? `${btn.icon} ${btn.text}` : btn.text;
                    if (btn.action === "url") {
                      code += `    builder.add(InlineKeyboardButton(text="${btnText}", url="${btn.url || '#'}"))\n`;
                    } else {
                      const btnCallbackData = btn.target || btn.text.replace(/[^a-zA-Z0-9а-яА-Я_]/g, '_');
                      code += `    builder.add(InlineKeyboardButton(text="${btnText}", callback_data="${btnCallbackData}"))\n`;
                    }
                  });
                  code += '    keyboard = builder.as_markup()\n';
                  code += '    await callback_query.message.answer(text, reply_markup=keyboard)\n';
                } else {
                  code += '    await callback_query.message.answer(text)\n';
                }
              } else {
                code += '    await callback_query.message.answer(text)\n';
              }
            } else if (targetNode.type === 'photo') {
              const messageText = targetNode.data.messageText || '';
              const imageUrl = targetNode.data.imageUrl || '';
              code += `    text = "${messageText}"\n`;
              code += `    photo_url = "${imageUrl}"\n`;
              code += '    if photo_url:\n';
              code += '        await send_photo_safe(callback_query.message, photo_url, text)\n';
              code += '    else:\n';
              code += '        await callback_query.message.answer(text or "Фото недоступно")\n';
            } else if (targetNode.type === 'start') {
              code += '    # Вызываем start handler\n';
              code += '    await start_handler(callback_query.message)\n';
            } else if (targetNode.type === 'command') {
              const funcName = (targetNode.data.command || 'help').replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
              code += `    # Вызываем команду ${targetNode.data.command}\n`;
              code += `    await ${funcName}_handler(callback_query.message)\n`;
            } else {
              code += `    await callback_query.message.answer("Переход к: ${button.text}")\n`;
            }
          } else {
            code += `    await callback_query.message.answer("Переход к: ${button.text}")\n`;
          }
        } else if (button.action === 'command') {
          code += `\n@dp.callback_query(lambda c: c.data == "${callbackData}")\n`;
          code += `async def handle_inline_${handlerId}(callback_query: types.CallbackQuery):\n`;
          code += '    await callback_query.answer()\n';
          code += `    # Выполняем команду: ${button.target}\n`;
          
          // Find command handler
          const commandNode = nodes.find(n => n.data.command === button.target);
          if (commandNode && commandNode.type === 'start') {
            code += '    await start_handler(callback_query.message)\n';
          } else if (commandNode) {
            const funcName = (button.target || '').replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
            code += `    await ${funcName}_handler(callback_query.message)\n`;
          } else {
            code += `    await callback_query.message.answer("Команда: ${button.target}")\n`;
          }
        }
      });
    });
  }

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
  
  // Проверяем, есть ли изображение в стартовом узле
  if (node.data.imageUrl) {
    code += `    # Отправляем стартовое сообщение с фото\n`;
    code += `    photo_url = "${node.data.imageUrl}"\n`;
    code += `    caption = "${messageText}"\n`;
    code += `    \n`;
    code += `    # Используем безопасную отправку фото\n`;
    const keyboardCode = node.data.keyboardType !== 'none' ? 'keyboard' : 'None';
    const sendAsDocument = node.data.sendAsDocument ? 'True' : 'False';
    const hasContentProtection = node.data.hasContentProtection ? 'True' : 'False';
    const disableWebPagePreview = node.data.disableWebPagePreview ? 'True' : 'False';
    code += `    await send_photo_safe(message, photo_url, caption, ${keyboardCode}, ${sendAsDocument}, ${hasContentProtection}, ${disableWebPagePreview})\n`;
    return code + generateKeyboard(node);
  } else {
    code += `    text = "${messageText}"\n`;
    return code + generateKeyboard(node);
  }
}

function generateCommandHandler(node: Node): string {
  const command = node.data.command || "/help";
  const functionName = command.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
  
  let code = `\n@dp.message(Command("${command.replace('/', '')}"))\n`;
  code += `async def ${functionName}_handler(message: types.Message):\n`;

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

  const messageText = node.data.messageText || "Команда выполнена";
  
  // Проверяем, есть ли изображение в команде
  if (node.data.imageUrl) {
    code += `    # Отправляем ответ команды с фото\n`;
    code += `    photo_url = "${node.data.imageUrl}"\n`;
    code += `    caption = "${messageText}"\n`;
    code += `    \n`;
    code += `    # Используем безопасную отправку фото\n`;
    const keyboardCode = node.data.keyboardType !== 'none' ? 'keyboard' : 'None';
    const sendAsDocument = node.data.sendAsDocument ? 'True' : 'False';
    const hasContentProtection = node.data.hasContentProtection ? 'True' : 'False';
    const disableWebPagePreview = node.data.disableWebPagePreview ? 'True' : 'False';
    code += `    await send_photo_safe(message, photo_url, caption, ${keyboardCode}, ${sendAsDocument}, ${hasContentProtection}, ${disableWebPagePreview})\n`;
  } else {
    code += `\n    text = "${messageText}"\n`;
    code += `    await message.answer(text)\n`;
  }
  
  return code;
}

function generateMessageHandler(node: Node): string {
  const messageText = node.data.messageText || "Сообщение";
  let code = `\n@dp.message()\n`;
  code += `async def message_${node.id}_handler(message: types.Message):\n`;
  code += `    text = "${messageText}"\n`;
  
  // Генерируем клавиатуру или отправляем простое сообщение
  if (node.data.keyboardType === "inline" && 
      ((node.data.inlineButtons && node.data.inlineButtons.length > 0) || 
       (node.data.buttons && node.data.buttons.length > 0))) {
    
    code += '    \n';
    code += '    builder = InlineKeyboardBuilder()\n';
    
    // Use inlineButtons first, fallback to buttons for compatibility
    const inlineButtons = node.data.inlineButtons || node.data.buttons || [];
    
    // Group inline buttons by row position for better layout
    const inlineButtonsByRow = groupButtonsByRow(inlineButtons);
    Object.entries(inlineButtonsByRow).forEach(([row, buttons]) => {
      (buttons as any[]).forEach((button: any) => {
        const buttonText = button.icon ? `${button.icon} ${button.text}` : button.text;
        if (button.action === "url") {
          code += `    builder.add(InlineKeyboardButton(text="${buttonText}", url="${button.url || '#'}"))\n`;
        } else {
          const callbackData = button.target || button.text.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
          code += `    builder.add(InlineKeyboardButton(text="${buttonText}", callback_data="${callbackData}"))\n`;
        }
      });
      
      // Add row adjustments for better layout
      if ((buttons as any[]).length > 1) {
        code += `    builder.adjust(${(buttons as any[]).length})\n`;
      }
    });
    
    code += '    keyboard = builder.as_markup()\n';
    code += '    await message.answer(text, reply_markup=keyboard)\n';
  } else {
    // Удаляем предыдущие reply клавиатуры если они были
    code += '    await message.answer(text, reply_markup=ReplyKeyboardRemove())\n';
  }
  
  return code;
}

function generatePhotoHandler(node: Node): string {
  const messageText = node.data.messageText || "";
  const imageUrl = node.data.imageUrl || "";
  let code = `\n# Обработчик для фото: ${node.id}\n`;
  code += `async def handle_photo_${node.id}(message: types.Message):\n`;
  
  // Добавляем проверки безопасности
  if (node.data.isPrivateOnly) {
    code += '    if not await is_private_chat(message):\n';
    code += '        await message.answer("Эта команда доступна только в приватном чате")\n';
    code += '        return\n\n';
  }
  
  if (node.data.adminOnly) {
    code += '    if not await is_admin(message.from_user.id):\n';
    code += '        await message.answer("У вас нет прав для выполнения этой команды")\n';
    code += '        return\n\n';
  }
  
  if (node.data.requiresAuth) {
    code += '    if not await check_auth(message.from_user.id):\n';
    code += '        await message.answer("Сначала авторизуйтесь в системе")\n';
    code += '        return\n\n';
  }
  
  if (imageUrl) {
    code += `    # Отправляем фото с улучшенной обработкой\n`;
    code += `    photo_url = "${imageUrl}"\n`;
    code += `    caption = "${messageText}" if "${messageText}" else None\n`;
    code += `    \n`;
    code += `    # Используем безопасную отправку фото\n`;
    const keyboardCode = node.data.keyboardType !== 'none' ? 'keyboard' : 'None';
    const sendAsDocument = node.data.sendAsDocument ? 'True' : 'False';
    const hasContentProtection = node.data.hasContentProtection ? 'True' : 'False';
    const disableWebPagePreview = node.data.disableWebPagePreview ? 'True' : 'False';
    code += `    await send_photo_safe(message, photo_url, caption, ${keyboardCode}, ${sendAsDocument}, ${hasContentProtection}, ${disableWebPagePreview})\n`;
  } else {
    // Нет URL изображения
    code += `    # URL изображения не указан\n`;
    code += `    await message.answer("❌ Изображение не настроено")\n`;
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
  // Эта функция оставлена для совместимости, но теперь генерация клавиатур
  // встроена непосредственно в обработчики сообщений для лучшего контроля
  return '';
}

// Helper function to group buttons by row position
function groupButtonsByRow(buttons: any[]): { [key: string]: any[] } {
  const grouped: { [key: string]: any[] } = {};
  
  buttons.forEach((button: any) => {
    const row = button.rowPosition || 0;
    if (!grouped[row]) {
      grouped[row] = [];
    }
    grouped[row].push(button);
  });
  
  return grouped;
}

// Helper function to generate keyboard layout based on settings
function generateKeyboardLayout(buttons: any[], layout: string, maxRowSize: number): string {
  let code = '';
  
  switch (layout) {
    case 'compact':
      // Compact layout: try to fit more buttons per row
      code += `    builder.adjust(${Math.min(buttons.length, maxRowSize)})\n`;
      break;
    case 'wide':
      // Wide layout: fewer buttons per row for better readability
      code += `    builder.adjust(${Math.min(buttons.length, Math.max(1, maxRowSize - 1))})\n`;
      break;
    case 'grid':
      // Grid layout: equal distribution
      const cols = Math.ceil(Math.sqrt(buttons.length));
      code += `    builder.adjust(${cols})\n`;
      break;
    default:
      // Default layout
      if (buttons.length > maxRowSize) {
        code += `    builder.adjust(${maxRowSize})\n`;
      }
      break;
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
    '# Telegram Bot Requirements',
    'aiogram==3.4.1',
    'python-dotenv==1.0.0',
    'aiofiles==23.2.1',
    'aiohttp==3.9.1',
    'async-timeout==4.0.3',
    'certifi==2023.11.17',
    'multidict==6.0.4',
    'yarl==1.9.4',
    '',
    '# Optional dependencies for extended functionality',
    '# redis==5.0.1  # For session storage',
    '# asyncpg==0.29.0  # For PostgreSQL database',
    '# motor==3.3.2  # For MongoDB',
    '# pillow==10.1.0  # For image processing',
    '# requests==2.31.0  # For HTTP requests'
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