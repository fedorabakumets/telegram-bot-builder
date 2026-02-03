
/**
 * Асинхронная функция генерации Python-кода для Telegram-бота (устаревшая версия)
 *
 * @param botData - Объект с данными бота, содержащий узлы (nodes) с информацией о командах и сообщениях
 * @returns Сгенерированный Python-код в виде строки
 *
 * @description
 * Функция принимает объект с данными бота и генерирует Python-код для создания Telegram-бота с использованием библиотеки aiogram.
 * Код включает в себя:
 * - Импорт необходимых модулей
 * - Настройку токена бота
 * - Создание обработчиков для различных типов узлов (start, command, message)
 * - Обработчики для синонимов команд
 * - Настройку клавиатур (reply и inline)
 * - Основной цикл запуска бота
 *
 * @example
 * // Пример использования функции
 * const botData = {
 *   nodes: [
 *     {
 *       type: "start",
 *       data: {
 *         messageText: "Привет! Добро пожаловать!",
 *         keyboardType: "reply",
 *         buttons: [{ text: "Меню", action: "goto", target: "menu" }]
 *       }
 *     }
 *   ]
 * };
 *
 * const pythonCode = await generatePythonCodeOld(botData);
 * console.log(pythonCode); // Выведет сгенерированный Python-код
 *
 * @since 1.0.0
 * @deprecated Используйте новую версию генерации кода
 */
async function generatePythonCodeOld(botData: any): Promise<string> {
  const { nodes } = botData;

  let code = `import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart, Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardRemove
from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder

# Токен вашего бота (получите у @BotFather)
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

# Настройка логирования
logging.basicConfig(level=logging.INFO)

# Создание бота и диспетчера
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

`;

  // Generate handlers for each node
  nodes.forEach((node: any) => {
    if (node.type === "start") {
      const messageText = node.data.messageText || "Привет! Добро пожаловать!";
      const textAssignment = messageText.includes('\n')
        ? `text = """${messageText}"""`
        : `text = "${messageText.replace(/"/g, '\\"')}"`;

      code += `
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    ${textAssignment}
`;

      if (node.data.keyboardType === "reply" && node.data.buttons.length > 0) {
        code += `    
    builder = ReplyKeyboardBuilder()
`;
        node.data.buttons.forEach((button: any) => {
          code += `    builder.add(KeyboardButton(text="${button.text}"))
`;
        });

        code += `    keyboard = builder.as_markup(resize_keyboard=${node.data.resizeKeyboard ? 'True' : 'False'}, one_time_keyboard=${node.data.oneTimeKeyboard ? 'True' : 'False'})
    await message.answer(text, reply_markup=keyboard)
`;
      } else if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
        code += `    
    builder = InlineKeyboardBuilder()
`;
        node.data.buttons.forEach((button: any) => {
          if (button.action === "url") {
            code += `    builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))
`;
          } else {
            code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target || button.text}"))
`;
          }
        });

        code += `    keyboard = builder.as_markup()
    # Удаляем предыдущие reply клавиатуры перед показом inline кнопок
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
    await message.answer("Выберите действие:", reply_markup=keyboard)
`;
      } else {
        code += `    # Удаляем предыдущие reply клавиатуры если они были
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
`;
      }
    } else if (node.type === "command") {
      const command = node.data.command || "/help";
      const functionName = command.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
      const messageText = node.data.messageText || "Команда выполнена";
      const textAssignment = messageText.includes('\n')
        ? `text = """${messageText}"""`
        : `text = "${messageText.replace(/"/g, '\\"')}"`;

      code += `
@dp.message(Command("${command.replace('/', '')}"))
async def ${functionName}_handler(message: types.Message):
    ${textAssignment}
`;

      if (node.data.keyboardType === "reply" && node.data.buttons.length > 0) {
        code += `    
    builder = ReplyKeyboardBuilder()
`;
        node.data.buttons.forEach((button: any) => {
          code += `    builder.add(KeyboardButton(text="${button.text}"))
`;
        });

        code += `    keyboard = builder.as_markup(resize_keyboard=${node.data.resizeKeyboard ? 'True' : 'False'}, one_time_keyboard=${node.data.oneTimeKeyboard ? 'True' : 'False'})
    await message.answer(text, reply_markup=keyboard)
`;
      } else if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
        code += `    
    builder = InlineKeyboardBuilder()
`;
        node.data.buttons.forEach((button: any) => {
          if (button.action === "url") {
            code += `    builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))
`;
          } else {
            code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target || button.text}"))
`;
          }
        });

        code += `    keyboard = builder.as_markup()
    # Удаляем предыдущие reply клавиатуры перед показом inline кнопок
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
    await message.answer("Выберите действие:", reply_markup=keyboard)
`;
      } else {
        code += `    # Удаляем предыдущие reply клавиатуры если они были
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
`;
      }
    } else if (node.type === "message") {
      const functionName = `message_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      const messageText = node.data.messageText || "Сообщение получено";
      const textAssignment = messageText.includes('\n')
        ? `text = """${messageText}"""`
        : `text = "${messageText.replace(/"/g, '\\"')}"`;

      code += `
@dp.message()
async def ${functionName}_handler(message: types.Message):
    ${textAssignment}
`;

      if (node.data.keyboardType === "reply" && node.data.buttons.length > 0) {
        code += `    
    builder = ReplyKeyboardBuilder()
`;
        node.data.buttons.forEach((button: any) => {
          code += `    builder.add(KeyboardButton(text="${button.text}"))
`;
        });

        code += `    keyboard = builder.as_markup(resize_keyboard=${node.data.resizeKeyboard ? 'True' : 'False'}, one_time_keyboard=${node.data.oneTimeKeyboard ? 'True' : 'False'})
    await message.answer(text, reply_markup=keyboard)
`;
      } else if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
        code += `    
    builder = InlineKeyboardBuilder()
`;
        node.data.buttons.forEach((button: any) => {
          if (button.action === "url") {
            code += `    builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))
`;
          } else {
            code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target || button.text}"))
`;
          }
        });

        code += `    keyboard = builder.as_markup()
    # Удаляем предыдущие reply клавиатуры перед показом inline кнопок
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
    await message.answer("Выберите действие:", reply_markup=keyboard)
`;
      } else {
        code += `    # Удаляем предыдущие reply клавиатуры если они были
    await message.answer(text, reply_markup=ReplyKeyboardRemove())
`;
      }
    }
  });

  // Generate synonym handlers for commands
  const nodesWithSynonyms = nodes.filter((node: any) => (node.type === 'start' || node.type === 'command') &&
    node.data.synonyms &&
    node.data.synonyms.length > 0
  );

  if (nodesWithSynonyms.length > 0) {
    code += `

# Обработчики синонимов команд`;
    nodesWithSynonyms.forEach((node: any) => {
      if (node.data.synonyms) {
        node.data.synonyms.forEach((synonym: string) => {
          const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
          const originalCommand = node.data.command || (node.type === 'start' ? '/start' : '/help');
          const functionName = originalCommand.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');

          code += `
@dp.message(lambda message: message.text and message.text.lower() == "${synonym.toLowerCase()}")
async def ${functionName}_synonym_${sanitizedSynonym}_handler(message: types.Message):
    # Синоним для команды ${originalCommand}
`;

          if (node.type === 'start') {
            code += '    await start_handler(message)';
          } else {
            code += `    await ${functionName}_handler(message)`;
          }
        });
      }
    });
  }

  code += `

# Запуск бота
async def main():
    try:
        print("Запускаем бота...")
        await dp.start_polling(bot)
    except Exception as e:
        print(f"Ошибка запуска бота: {e}")
        raise

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Бот остановлен")
    except Exception as e:
        print(f"Критическая ошибка: {e}")
        exit(1)
`;

  return code;
}
