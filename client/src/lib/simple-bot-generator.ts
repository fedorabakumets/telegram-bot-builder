import { BotData, Node, Connection } from '@shared/schema';

// Функция для правильного экранирования строк в Python коде
function escapeForPython(text: string): string {
  return text.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}

// Функция для правильного форматирования текста с поддержкой многострочности
function formatTextForPython(text: string): string {
  if (!text) return '""';
  
  // Для многострочного текста используем тройные кавычки
  if (text.includes('\n')) {
    return `"""${text}"""`;
  } else {
    // Для однострочного текста экранируем только кавычки
    return `"${text.replace(/"/g, '\\"')}"`;
  }
}

// Функция для получения режима парсинга
function getParseMode(formatMode: string): string {
  if (formatMode === 'html') {
    return ', parse_mode=ParseMode.HTML';
  } else if (formatMode === 'markdown') {
    return ', parse_mode=ParseMode.MARKDOWN';
  }
  return '';
}

export function generateSimplePythonCode(botData: BotData, botToken?: string): string {
  if (!botData || !botData.nodes || !botData.connections) {
    throw new Error('Некорректные данные бота');
  }

  const { nodes, connections } = botData;
  let code = '';

  // Базовые импорты
  code += '#!/usr/bin/env python3\n';
  code += '# -*- coding: utf-8 -*-\n';
  code += '"""\n';
  code += 'Telegram Bot - Сгенерировано автоматически\n';
  code += '"""\n\n';
  
  code += 'import asyncio\n';
  code += 'import logging\n';
  code += 'import os\n';
  code += 'from aiogram import Bot, Dispatcher, types, F\n';
  code += 'from aiogram.filters import CommandStart, Command\n';
  code += 'from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton\n';
  code += 'from aiogram.utils.keyboard import InlineKeyboardBuilder\n';
  code += 'from aiogram.enums import ParseMode\n';
  code += 'import json\n\n';
  
  // Токен бота
  const token = botToken || 'YOUR_BOT_TOKEN_HERE';
  code += `BOT_TOKEN = "${token}"\n\n`;
  
  code += '# Настройка логирования\n';
  code += 'logging.basicConfig(level=logging.INFO)\n\n';
  
  code += '# Создание бота и диспетчера\n';
  code += 'bot = Bot(token=BOT_TOKEN)\n';
  code += 'dp = Dispatcher()\n\n';
  
  code += '# Хранилище пользовательских данных\n';
  code += 'user_data = {}\n\n';

  // Утилитарные функции
  code += '# Утилитарные функции\n';
  code += 'def save_user_variable(user_id: int, variable_name: str, value: str):\n';
  code += '    """Сохраняет переменную пользователя"""\n';
  code += '    if user_id not in user_data:\n';
  code += '        user_data[user_id] = {}\n';
  code += '    user_data[user_id][variable_name] = value\n';
  code += '    logging.info(f"Переменная {variable_name} сохранена: {value} (пользователь {user_id})")\n\n';

  code += 'def get_user_variable(user_id: int, variable_name: str, default_value: str = ""):\n';
  code += '    """Получает переменную пользователя"""\n';
  code += '    return user_data.get(user_id, {}).get(variable_name, default_value)\n\n';

  // Генерируем обработчики команд
  const commandNodes = nodes.filter(node => node.type === 'start' || node.type === 'command');
  
  commandNodes.forEach(node => {
    const command = node.data.command || '/start';
    const commandName = command.replace('/', '');
    const handlerName = commandName === 'start' ? 'start_handler' : `${commandName}_handler`;
    
    if (commandName === 'start') {
      code += '@dp.message(CommandStart())\n';
    } else {
      code += `@dp.message(Command("${commandName}"))\n`;
    }
    
    code += `async def ${handlerName}(message: types.Message):\n`;
    code += '    user_id = message.from_user.id\n';
    code += '    \n';
    
    // Основное сообщение узла
    const messageText = node.data.messageText || 'Привет!';
    const formattedText = formatTextForPython(messageText);
    code += `    text = ${formattedText}\n`;
    
    // Проверяем условные сообщения
    if (node.data.enableConditionalMessages && node.data.conditionalMessages) {
      code += '    \n';
      code += '    # Проверяем условные сообщения\n';
      
      const sortedConditions = [...node.data.conditionalMessages].sort((a, b) => (b.priority || 0) - (a.priority || 0));
      
      sortedConditions.forEach((condition, index) => {
        const conditionKeyword = index === 0 ? 'if' : 'elif';
        const variableName = condition.variableName;
        const variableValue = condition.variableValue;
        
        if (variableName) {
          if (variableValue) {
            // Конкретное значение переменной
            code += `    ${conditionKeyword} get_user_variable(user_id, "${variableName}") == "${variableValue}":\n`;
          } else {
            // Просто существование переменной
            code += `    ${conditionKeyword} get_user_variable(user_id, "${variableName}"):\n`;
          }
          
          const conditionText = formatTextForPython(condition.messageText);
          code += `        text = ${conditionText}\n`;
          
          // Кнопки для условного сообщения
          if (condition.buttons && condition.buttons.length > 0) {
            code += '        builder = InlineKeyboardBuilder()\n';
            condition.buttons.forEach(btn => {
              if (btn.action === 'goto') {
                code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${btn.target || btn.id}"))\n`;
              } else if (btn.action === 'url') {
                code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
              }
            });
            code += '        keyboard = builder.as_markup()\n';
            code += '        await message.answer(text, reply_markup=keyboard)\n';
            code += '        return\n';
          }
        }
      });
      
      code += '    \n';
    }
    
    // Основные кнопки узла
    if (node.data.keyboardType === 'inline' && node.data.buttons && node.data.buttons.length > 0) {
      code += '    builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(btn => {
        if (btn.action === 'goto') {
          code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${btn.target || btn.id}"))\n`;
        } else if (btn.action === 'url') {
          code += `    builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
        }
      });
      code += '    keyboard = builder.as_markup()\n';
      code += '    await message.answer(text, reply_markup=keyboard)\n';
    } else {
      code += '    await message.answer(text)\n';
    }
    
    code += '\n';
  });

  // Генерируем обработчики callback-кнопок для каждого узла
  const callbackNodes = nodes.filter(node => node.id !== 'start_store'); // Исключаем стартовый узел, он уже обработан
  
  callbackNodes.forEach(node => {
    code += `@dp.callback_query(F.data == "${node.id}")\n`;
    const safeFunctionName = node.id.replace(/[^a-zA-Z0-9]/g, '_');
    code += `async def handle_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
    code += '    await callback_query.answer()\n';
    code += '    user_id = callback_query.from_user.id\n';
    code += '    \n';
    
    // Сохраняем нажатие кнопки
    code += '    # Находим кнопку, которая привела к этому узлу\n';
    const sourceNode = nodes.find(n => 
      n.data.buttons && n.data.buttons.some(btn => btn.target === node.id)
    );
    
    if (sourceNode) {
      const button = sourceNode.data.buttons.find(btn => btn.target === node.id);
      if (button) {
        code += `    button_text = "${button.text}"\n`;
        code += '    save_user_variable(user_id, "button_click", button_text)\n';
        
        // Если у родительского узла есть переменная для сохранения
        if (sourceNode.data.inputVariable) {
          code += `    save_user_variable(user_id, "${sourceNode.data.inputVariable}", button_text)\n`;
        }
      }
    }
    
    code += '    \n';
    
    // Основное сообщение узла
    const messageText = node.data.messageText || `Узел ${node.id}`;
    const formattedText = formatTextForPython(messageText);
    code += `    text = ${formattedText}\n`;
    
    // Проверяем условные сообщения
    if (node.data.enableConditionalMessages && node.data.conditionalMessages) {
      code += '    \n';
      code += '    # Проверяем условные сообщения\n';
      
      const sortedConditions = [...node.data.conditionalMessages].sort((a, b) => (b.priority || 0) - (a.priority || 0));
      
      sortedConditions.forEach((condition, index) => {
        const conditionKeyword = index === 0 ? 'if' : 'elif';
        const variableName = condition.variableName;
        const variableValue = condition.variableValue;
        
        if (variableName) {
          if (variableValue) {
            // Конкретное значение переменной
            code += `    ${conditionKeyword} get_user_variable(user_id, "${variableName}") == "${variableValue}":\n`;
          } else {
            // Просто существование переменной
            code += `    ${conditionKeyword} get_user_variable(user_id, "${variableName}"):\n`;
          }
          
          const conditionText = formatTextForPython(condition.messageText);
          code += `        text = ${conditionText}\n`;
          
          // Кнопки для условного сообщения
          if (condition.buttons && condition.buttons.length > 0) {
            code += '        builder = InlineKeyboardBuilder()\n';
            condition.buttons.forEach(btn => {
              if (btn.action === 'goto') {
                code += `        builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${btn.target || btn.id}"))\n`;
              } else if (btn.action === 'url') {
                code += `        builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
              }
            });
            code += '        keyboard = builder.as_markup()\n';
            code += '        await callback_query.message.edit_text(text, reply_markup=keyboard)\n';
            code += '        return\n';
          }
        }
      });
      
      code += '    \n';
    }
    
    // Основные кнопки узла
    if (node.data.keyboardType === 'inline' && node.data.buttons && node.data.buttons.length > 0) {
      code += '    builder = InlineKeyboardBuilder()\n';
      node.data.buttons.forEach(btn => {
        if (btn.action === 'goto') {
          code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${btn.target || btn.id}"))\n`;
        } else if (btn.action === 'url') {
          code += `    builder.add(InlineKeyboardButton(text="${btn.text}", url="${btn.url || '#'}"))\n`;
        }
      });
      code += '    keyboard = builder.as_markup()\n';
      code += '    await callback_query.message.edit_text(text, reply_markup=keyboard)\n';
    } else {
      code += '    await callback_query.message.edit_text(text)\n';
    }
    
    code += '\n';
  });

  // Основная функция
  code += 'async def main():\n';
  code += '    logging.info("Бот запущен")\n';
  code += '    await dp.start_polling(bot)\n\n';

  code += 'if __name__ == "__main__":\n';
  code += '    asyncio.run(main())\n';

  return code;
}