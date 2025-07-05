import { BotData, Node } from '@/types/bot';
import { generateBotFatherCommands } from './commands';

export function generatePythonCode(botData: BotData, botName: string = "MyBot"): string {
  const { nodes } = botData;
  
  let code = '"""\\n';
  code += `${botName} - Telegram Bot\\n`;
  code += 'Сгенерировано с помощью TelegramBot Builder\\n\\n';
  code += generateBotFatherCommands(nodes);
  code += '"""\\n\\n';
  
  code += 'import asyncio\\n';
  code += 'import logging\\n';
  code += 'from aiogram import Bot, Dispatcher, types\\n';
  code += 'from aiogram.filters import CommandStart, Command\\n';
  code += 'from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand\\n';
  code += 'from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder\\n';
  code += 'from aiogram.enums import ParseMode\\n\\n';
  
  code += '# Токен вашего бота (получите у @BotFather)\\n';
  code += 'BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"\\n\\n';
  
  code += '# Настройка логирования\\n';
  code += 'logging.basicConfig(level=logging.INFO)\\n\\n';
  
  code += '# Создание бота и диспетчера\\n';
  code += 'bot = Bot(token=BOT_TOKEN)\\n';
  code += 'dp = Dispatcher()\\n\\n';
  
  code += '# Список администраторов (добавьте свой Telegram ID)\\n';
  code += 'ADMIN_IDS = [123456789]  # Замените на реальные ID администраторов\\n\\n';
  
  code += '# Хранилище пользователей (в реальном боте используйте базу данных)\\n';
  code += 'user_data = {}\\n\\n';

  // Добавляем утилитарные функции
  code += '\\n# Утилитарные функции\\n';
  code += 'async def is_admin(user_id: int) -> bool:\\n';
  code += '    return user_id in ADMIN_IDS\\n\\n';
  
  code += 'async def is_private_chat(message: types.Message) -> bool:\\n';
  code += '    return message.chat.type == "private"\\n\\n';
  
  code += 'async def check_auth(user_id: int) -> bool:\\n';
  code += '    # Здесь можно добавить логику проверки авторизации\\n';
  code += '    return user_id in user_data\\n\\n';

  // Настройка меню команд для BotFather
  const menuCommands = nodes.filter(node => 
    (node.type === 'start' || node.type === 'command') && 
    node.data.showInMenu && 
    node.data.command
  );

  if (menuCommands.length > 0) {
    code += '\\n# Настройка меню команд\\n';
    code += 'async def set_bot_commands():\\n';
    code += '    commands = [\\n';
    
    menuCommands.forEach(node => {
      const command = node.data.command?.replace('/', '') || '';
      const description = node.data.description || 'Команда бота';
      code += `        BotCommand(command="${command}", description="${description}"),\\n`;
    });
    
    code += '    ]\\n';
    code += '    await bot.set_my_commands(commands)\\n\\n';
  }

  // Generate handlers for each node
  nodes.forEach((node: Node) => {
    if (node.type === "start") {
      code += generateStartHandler(node);
    } else if (node.type === "command") {
      code += generateCommandHandler(node);
    } else if (node.type === "message") {
      code += generateMessageHandler(node);
    }
  });

  // Generate callback handlers for inline buttons
  const inlineNodes = nodes.filter(node => 
    node.data.keyboardType === 'inline' && node.data.buttons.length > 0
  );

  if (inlineNodes.length > 0) {
    code += '\\n# Обработчики inline кнопок\\n';
    inlineNodes.forEach(node => {
      node.data.buttons.forEach(button => {
        if (button.action === 'goto') {
          code += `\\n@dp.callback_query(lambda c: c.data == "${button.target || button.text}")\\n`;
          code += `async def handle_${button.id}(callback_query: types.CallbackQuery):\\n`;
          code += '    await callback_query.answer()\\n';
          code += `    # TODO: Implement navigation to ${button.target}\\n`;
          code += `    await callback_query.message.answer("Переход к: ${button.text}")\\n`;
        }
      });
    });
  }

  code += '\\n\\n# Запуск бота\\n';
  code += 'async def main():\\n';
  if (menuCommands.length > 0) {
    code += '    await set_bot_commands()\\n';
  }
  code += '    print("Бот запущен!")\\n';
  code += '    await dp.start_polling(bot)\\n\\n';
  
  code += 'if __name__ == "__main__":\\n';
  code += '    asyncio.run(main())\\n';

  return code;
}

function generateStartHandler(node: Node): string {
  let code = '\\n@dp.message(CommandStart())\\n';
  code += 'async def start_handler(message: types.Message):\\n';

  // Добавляем проверки безопасности
  if (node.data.isPrivateOnly) {
    code += '    if not await is_private_chat(message):\\n';
    code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\\n';
    code += '        return\\n';
  }

  if (node.data.adminOnly) {
    code += '    if not await is_admin(message.from_user.id):\\n';
    code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\\n';
    code += '        return\\n';
  }

  if (node.data.requiresAuth) {
    code += '    if not await check_auth(message.from_user.id):\\n';
    code += '        await message.answer("❌ Необходимо войти в систему для выполнения этой команды")\\n';
    code += '        return\\n';
  }

  // Регистрируем пользователя
  code += '\\n    # Регистрируем пользователя в системе\\n';
  code += '    user_data[message.from_user.id] = {\\n';
  code += '        "username": message.from_user.username,\\n';
  code += '        "first_name": message.from_user.first_name,\\n';
  code += '        "last_name": message.from_user.last_name,\\n';
  code += '        "registered_at": message.date\\n';
  code += '    }\\n\\n';
  
  const messageText = node.data.messageText || "Привет! Добро пожаловать!";
  code += `    text = "${messageText}"\\n`;
  
  return code + generateKeyboard(node);
}

function generateCommandHandler(node: Node): string {
  const command = node.data.command || "/help";
  const functionName = command.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
  
  let code = `\\n@dp.message(Command("${command.replace('/', '')}"))\\n`;
  code += `async def ${functionName}_handler(message: types.Message):\\n`;

  // Добавляем проверки безопасности
  if (node.data.isPrivateOnly) {
    code += '    if not await is_private_chat(message):\\n';
    code += '        await message.answer("❌ Эта команда доступна только в приватных чатах")\\n';
    code += '        return\\n';
  }

  if (node.data.adminOnly) {
    code += '    if not await is_admin(message.from_user.id):\\n';
    code += '        await message.answer("❌ У вас нет прав для выполнения этой команды")\\n';
    code += '        return\\n';
  }

  if (node.data.requiresAuth) {
    code += '    if not await check_auth(message.from_user.id):\\n';
    code += '        await message.answer("❌ Необходимо войти в систему для выполнения этой команды")\\n';
    code += '        return\\n';
  }

  const messageText = node.data.messageText || "Команда выполнена";
  code += `\\n    text = "${messageText}"\\n`;
  
  return code + generateKeyboard(node);
}

function generateMessageHandler(node: Node): string {
  const messageText = node.data.messageText || "Сообщение";
  let code = `\\n# Обработчик для сообщения: ${node.id}\\n`;
  code += `async def handle_${node.id}(message: types.Message):\\n`;
  code += `    text = "${messageText}"\\n`;
  
  return code + generateKeyboard(node);
}

function generateKeyboard(node: Node): string {
  let code = '';
  
  if (node.data.keyboardType === "reply" && node.data.buttons.length > 0) {
    code += '    \\n';
    code += '    builder = ReplyKeyboardBuilder()\\n';
    node.data.buttons.forEach(button => {
      code += `    builder.add(KeyboardButton(text="${button.text}"))\\n`;
    });
    
    code += `    keyboard = builder.as_markup(resize_keyboard=${node.data.resizeKeyboard}, one_time_keyboard=${node.data.oneTimeKeyboard})\\n`;
    code += '    await message.answer(text, reply_markup=keyboard)\\n';
  } else if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
    code += '    \\n';
    code += '    builder = InlineKeyboardBuilder()\\n';
    node.data.buttons.forEach(button => {
      if (button.action === "url") {
        code += `    builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))\\n`;
      } else {
        code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target || button.text}"))\\n`;
      }
    });
    
    code += '    keyboard = builder.as_markup()\\n';
    code += '    await message.answer(text, reply_markup=keyboard)\\n';
  } else {
    code += '    await message.answer(text)\\n';
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