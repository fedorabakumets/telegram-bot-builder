import { BotData, Node } from '@/types/bot';

export function generatePythonCode(botData: BotData, botName: string = "MyBot"): string {
  const { nodes } = botData;
  
  let code = `"""
${botName} - Telegram Bot
Сгенерировано с помощью TelegramBot Builder
"""

import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart, Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton
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
    code += `
# Обработчики inline кнопок
`;
    inlineNodes.forEach(node => {
      node.data.buttons.forEach(button => {
        if (button.action === 'goto') {
          code += `
@dp.callback_query(lambda c: c.data == "${button.target || button.text}")
async def handle_${button.id}(callback_query: types.CallbackQuery):
    await callback_query.answer()
    # TODO: Implement navigation to ${button.target}
    await callback_query.message.answer("Переход к: ${button.text}")
`;
        }
      });
    });
  }

  code += `

# Запуск бота
async def main():
    print("Бот запущен!")
    await dp.start_polling(bot)

if __name__ == '__main__':
    asyncio.run(main())
`;

  return code;
}

function generateStartHandler(node: Node): string {
  let code = `
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    text = "${node.data.messageText || "Привет! Добро пожаловать!"}"
`;
  
  return code + generateKeyboard(node);
}

function generateCommandHandler(node: Node): string {
  const command = node.data.command || "/help";
  let code = `
@dp.message(Command("${command.replace('/', '')}"))
async def ${command.replace('/', '')}_handler(message: types.Message):
    text = "${node.data.messageText || "Команда выполнена"}"
`;
  
  return code + generateKeyboard(node);
}

function generateMessageHandler(node: Node): string {
  let code = `
# Обработчик для сообщения: ${node.id}
async def handle_${node.id}(message: types.Message):
    text = "${node.data.messageText || "Сообщение"}"
`;
  
  return code + generateKeyboard(node);
}

function generateKeyboard(node: Node): string {
  let code = '';
  
  if (node.data.keyboardType === "reply" && node.data.buttons.length > 0) {
    code += `    
    builder = ReplyKeyboardBuilder()
`;
    node.data.buttons.forEach(button => {
      code += `    builder.add(KeyboardButton(text="${button.text}"))
`;
    });
    
    code += `    keyboard = builder.as_markup(resize_keyboard=${node.data.resizeKeyboard}, one_time_keyboard=${node.data.oneTimeKeyboard})
    await message.answer(text, reply_markup=keyboard)
`;
  } else if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
    code += `    
    builder = InlineKeyboardBuilder()
`;
    node.data.buttons.forEach(button => {
      if (button.action === "url") {
        code += `    builder.add(InlineKeyboardButton(text="${button.text}", url="${button.url || '#'}"))
`;
      } else {
        code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target || button.text}"))
`;
      }
    });
    
    code += `    keyboard = builder.as_markup()
    await message.answer(text, reply_markup=keyboard)
`;
  } else {
    code += `    await message.answer(text)
`;
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
