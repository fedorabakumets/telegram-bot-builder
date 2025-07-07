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
  code += 'from aiogram import Bot, Dispatcher, types, F\n';
  code += 'from aiogram.filters import CommandStart, Command\n';
  code += 'from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove\n';
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
        if (button.action === 'goto' && button.target) {
          const callbackData = button.target; // Используем ID узла как callback_data
          
          // Avoid duplicate handlers
          if (processedCallbacks.has(callbackData)) return;
          processedCallbacks.add(callbackData);
          
          // Find target node
          const targetNode = nodes.find(n => n.id === button.target);
          if (targetNode) {
            code += `\n@dp.callback_query(lambda c: c.data == "${callbackData}")\n`;
            // Создаем безопасное имя функции на основе target ID
            const safeFunctionName = callbackData.replace(/[^a-zA-Z0-9]/g, '_');
            code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
            code += '    await callback_query.answer()\n';
            
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
            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
              code += '    builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach(btn => {
                if (btn.action === "url") {
                  code += `    builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                } else {
                  code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${btn.target}"))\n`;
                }
              });
              code += '    keyboard = builder.as_markup()\n';
              code += '    await callback_query.message.edit_text(text, reply_markup=keyboard)\n';
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
              code += '    await bot.send_message(callback_query.from_user.id, text, reply_markup=keyboard)\n';
            } else {
              code += '    await callback_query.message.edit_text(text)\n';
            }
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
            const escapedTargetText = targetText.replace(/\n/g, '\\n').replace(/"/g, '\\"');
            code += `    text = "${escapedTargetText}"\n`;
            
            // Handle keyboard for target node
            if (targetNode.data.keyboardType === "reply" && targetNode.data.buttons.length > 0) {
              code += '    builder = ReplyKeyboardBuilder()\n';
              targetNode.data.buttons.forEach(btn => {
                code += `    builder.add(KeyboardButton(text="${btn.text}"))\n`;
              });
              const resizeKeyboard = targetNode.data.resizeKeyboard === true ? 'True' : 'False';
              const oneTimeKeyboard = targetNode.data.oneTimeKeyboard === true ? 'True' : 'False';
              code += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
              code += '    await message.answer(text, reply_markup=keyboard)\n';
            } else if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons.length > 0) {
              code += '    builder = InlineKeyboardBuilder()\n';
              targetNode.data.buttons.forEach(btn => {
                if (btn.action === "url") {
                  code += `    builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
                } else {
                  code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${btn.target || btn.text}"))\n`;
                }
              });
              code += '    keyboard = builder.as_markup()\n';
              code += '    await message.answer(text, reply_markup=keyboard)\n';
            } else {
              code += '    # Удаляем предыдущие reply клавиатуры если они были\n';
              code += '    await message.answer(text, reply_markup=ReplyKeyboardRemove())\n';
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
    code += '    await message.answer(text, reply_markup=keyboard)\n';
  } else if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
    code += '    \n';
    code += '    # Создаем inline клавиатуру с кнопками\n';
    code += '    builder = InlineKeyboardBuilder()\n';
    node.data.buttons.forEach(button => {
      if (button.action === "url") {
        code += `    builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\n`;
      } else {
        code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target}"))\n`;
      }
    });
    
    code += '    keyboard = builder.as_markup()\n';
    code += '    # Отправляем сообщение с прикрепленными inline кнопками\n';
    code += '    await message.answer(text, reply_markup=keyboard)\n';
  } else if (node.data.keyboardType === "none" || !node.data.keyboardType) {
    code += '    # Отправляем сообщение без клавиатуры (удаляем reply клавиатуру если была)\n';
    code += '    await message.answer(text, reply_markup=ReplyKeyboardRemove())\n';
  } else {
    code += '    await message.answer(text)\n';
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