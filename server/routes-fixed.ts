// Восстановленная версия generatePythonCode функции
import { generateUnifiedKeyboardCode } from './unified-keyboard-generator';

function generatePythonCode(botData: any): string {
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
      code += `
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    text = "${node.data.messageText || "Привет! Добро пожаловать!"}"
`;
      
      // Используем унифицированный генератор клавиатур
      code += generateUnifiedKeyboardCode(node);
      
    } else if (node.type === "command") {
      const command = node.data.command || "/help";
      const functionName = command.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
      
      code += `
@dp.message(Command("${command.replace('/', '')}"))
async def ${functionName}_handler(message: types.Message):
    text = "${node.data.messageText || "Команда выполнена"}"
`;
      
      // Используем унифицированный генератор клавиатур
      code += generateUnifiedKeyboardCode(node);
      
    } else if (node.type === "message") {
      const functionName = `message_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      
      code += `
@dp.message()
async def ${functionName}_handler(message: types.Message):
    text = "${node.data.messageText || "Сообщение получено"}"
`;
      
      // Используем унифицированный генератор клавиатур
      code += generateUnifiedKeyboardCode(node);
    }
  });

  // Generate synonym handlers for commands
  const nodesWithSynonyms = nodes.filter((node: any) => 
    (node.type === 'start' || node.type === 'command') && 
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

  // Generate callback handlers for inline buttons
  const inlineNodes = nodes.filter((node: any) => 
    (node.data.keyboardType === 'inline' || node.data.keyboardType === 'combined') && 
    node.data.inlineButtons && node.data.inlineButtons.length > 0
  );

  if (inlineNodes.length > 0) {
    code += `

# Обработчики inline кнопок`;
    inlineNodes.forEach((node: any) => {
      node.data.inlineButtons.forEach((button: any) => {
        if (button.action === 'goto') {
          const callbackData = button.target || button.text;
          const handlerId = button.id.replace(/[^a-zA-Z0-9_]/g, '_');
          
          // Find target node
          const targetNode = nodes.find((n: any) => n.id === button.target);
          
          code += `
@dp.callback_query(lambda c: c.data == "${callbackData}")
async def handle_inline_${handlerId}(callback_query: types.CallbackQuery):
    await callback_query.answer()
`;
          
          if (targetNode) {
            // Navigate to target node
            if (targetNode.type === 'message') {
              code += `    text = "${targetNode.data.messageText || 'Сообщение'}"
    await callback_query.message.answer(text)`;
            } else if (targetNode.type === 'start') {
              code += `    await start_handler(callback_query.message)`;
            } else {
              code += `    await callback_query.message.answer("Переход к: ${button.text}")`;
            }
          } else {
            code += `    await callback_query.message.answer("Переход к: ${button.text}")`;
          }
        } else if (button.action === 'command') {
          const callbackData = button.target || button.text;
          const handlerId = button.id.replace(/[^a-zA-Z0-9_]/g, '_');
          
          code += `
@dp.callback_query(lambda c: c.data == "${callbackData}")
async def handle_inline_${handlerId}(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # Выполняем команду: ${button.target}
`;
          
          // Find command handler
          const commandNode = nodes.find((n: any) => n.data.command === button.target);
          if (commandNode && commandNode.type === 'start') {
            code += '    await start_handler(callback_query.message)';
          } else if (commandNode) {
            const funcName = (button.target || '').replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
            code += `    await ${funcName}_handler(callback_query.message)`;
          } else {
            code += `    await callback_query.message.answer("Команда: ${button.target}")`;
          }
        }
        // URL buttons don't need callback handlers as they open directly
      });
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

export { generatePythonCode };