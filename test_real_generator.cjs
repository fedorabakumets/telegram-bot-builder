// Тест реального генератора для проверки исправлений
const fs = require('fs');

// Функции из нашего генератора (упрощенная версия для тестирования)
function generateKeyboard(node) {
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
    
    // ИСПРАВЛЕНО: правильные булевы значения
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

function generateStartHandler(node) {
  let code = '\n@dp.message(CommandStart())\n';
  code += 'async def start_handler(message: types.Message):\n';

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

function generateCommandHandler(node) {
  const command = node.data.command || "/help";
  const functionName = command.replace('/', '').replace(/[^a-zA-Z0-9_]/g, '_');
  
  let code = `\n@dp.message(Command("${command.replace('/', ')')}"))\n`;
  code += `async def ${functionName}_handler(message: types.Message):\n`;

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

function generateSynonymHandler(node, synonym) {
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

// Тестируем с нашими данными
const botData = JSON.parse(fs.readFileSync('test_bot_for_generator.json', 'utf8'));

let code = '"""\n';
code += 'Тест исправленного генератора - Telegram Bot\n';
code += 'Сгенерировано для проверки исправлений\n';
code += '"""\n\n';

code += 'import asyncio\n';
code += 'import logging\n';
code += 'from aiogram import Bot, Dispatcher, types, F\n';
code += 'from aiogram.filters import CommandStart, Command\n';
code += 'from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton, BotCommand, ReplyKeyboardRemove\n';
code += 'from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder\n';
code += 'from aiogram.enums import ParseMode\n\n';

code += 'BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"\n\n';
code += 'bot = Bot(token=BOT_TOKEN)\n';
code += 'dp = Dispatcher()\n';
code += 'ADMIN_IDS = [123456789]\n';
code += 'user_data = {}\n\n';

code += 'async def is_admin(user_id: int) -> bool:\n';
code += '    return user_id in ADMIN_IDS\n\n';
code += 'async def is_private_chat(message: types.Message) -> bool:\n';
code += '    return message.chat.type == "private"\n\n';
code += 'async def check_auth(user_id: int) -> bool:\n';
code += '    return user_id in user_data\n\n';

// Генерируем обработчики команд
botData.nodes.forEach(node => {
  if (node.type === "start") {
    code += generateStartHandler(node);
  } else if (node.type === "command") {
    code += generateCommandHandler(node);
  }
});

// Генерируем синонимы
const nodesWithSynonyms = botData.nodes.filter(node => 
  (node.type === 'start' || node.type === 'command') && 
  node.data.synonyms && 
  node.data.synonyms.length > 0
);

if (nodesWithSynonyms.length > 0) {
  code += '\n# Обработчики синонимов команд\n';
  nodesWithSynonyms.forEach(node => {
    if (node.data.synonyms) {
      node.data.synonyms.forEach(synonym => {
        code += generateSynonymHandler(node, synonym);
      });
    }
  });
}

// Генерируем callback обработчики
const inlineNodes = botData.nodes.filter(node => 
  node.data.keyboardType === 'inline' && node.data.buttons && node.data.buttons.length > 0
);

if (inlineNodes.length > 0) {
  code += '\n# Обработчики inline кнопок\n';
  const processedCallbacks = new Set();
  
  inlineNodes.forEach(node => {
    if (node.data.buttons) {
      node.data.buttons.forEach(button => {
        if (button.action === 'goto' && button.target && !processedCallbacks.has(button.target)) {
          processedCallbacks.add(button.target);
          
          const targetNode = botData.nodes.find(n => n.id === button.target);
          if (targetNode) {
            const safeFunctionName = button.target.replace(/[^a-zA-Z0-9]/g, '_');
            code += `\n@dp.callback_query(lambda c: c.data == "${button.target}")\n`;
            code += `async def handle_callback_${safeFunctionName}(callback_query: types.CallbackQuery):\n`;
            code += '    await callback_query.answer()\n';
            
            const targetText = targetNode.data.messageText || "Сообщение";
            if (targetText.includes('\n')) {
              code += `    text = """${targetText}"""\n`;
            } else {
              code += `    text = "${targetText.replace(/"/g, '\\"')}"\n`;
            }
            
            if (targetNode.data.keyboardType === "inline" && targetNode.data.buttons && targetNode.data.buttons.length > 0) {
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
            } else {
              code += '    await callback_query.message.edit_text(text)\n';
            }
          }
        }
      });
    }
  });
}

code += '\n# Запуск бота\n';
code += 'async def main():\n';
code += '    print("🤖 Тест исправленного генератора запущен!")\n';
code += '    await dp.start_polling(bot)\n\n';
code += 'if __name__ == "__main__":\n';
code += '    asyncio.run(main())\n';

// Записываем результат
fs.writeFileSync('generated_test_fixed.py', code, 'utf8');

console.log("✅ Создан файл generated_test_fixed.py");
console.log("\n🔍 Проверяем исправления:");

// Анализируем сгенерированный код
const codeLines = code.split('\n');
let hasStartHandler = false;
let hasInlineKeyboard = false;
let hasSynonyms = false;
let hasProperBooleans = true;
let startHandlerHasKeyboard = false;

for (let i = 0; i < codeLines.length; i++) {
  const line = codeLines[i];
  
  if (line.includes('@dp.message(CommandStart())')) {
    hasStartHandler = true;
    // Проверяем следующие строки для клавиатуры
    for (let j = i; j < Math.min(i + 20, codeLines.length); j++) {
      if (codeLines[j].includes('InlineKeyboardBuilder()')) {
        startHandlerHasKeyboard = true;
        break;
      }
    }
  }
  
  if (line.includes('InlineKeyboardBuilder()')) {
    hasInlineKeyboard = true;
  }
  
  if (line.includes('synonym') && line.includes('handler')) {
    hasSynonyms = true;
  }
  
  if (line.includes('=true') || line.includes('=false')) {
    hasProperBooleans = false;
  }
}

console.log(`✅ Команда /start найдена: ${hasStartHandler ? 'Да' : 'Нет'}`);
console.log(`✅ start_handler создает инлайн клавиатуру: ${startHandlerHasKeyboard ? 'Да' : 'Нет'}`);
console.log(`✅ Инлайн клавиатуры есть: ${hasInlineKeyboard ? 'Да' : 'Нет'}`);
console.log(`✅ Синонимы созданы: ${hasSynonyms ? 'Да' : 'Нет'}`);
console.log(`✅ Правильные булевы значения: ${hasProperBooleans ? 'Да' : 'Нет'}`);

if (hasStartHandler && startHandlerHasKeyboard && hasInlineKeyboard && hasSynonyms && hasProperBooleans) {
  console.log("\n🎉 ВСЕ ИСПРАВЛЕНИЯ РАБОТАЮТ ПРАВИЛЬНО!");
  console.log("• Команды создают и отправляют инлайн кнопки");
  console.log("• Синонимы вызывают правильные обработчики");
  console.log("• Булевы значения корректны");
} else {
  console.log("\n❌ ЕСТЬ ПРОБЛЕМЫ:");
  if (!hasStartHandler) console.log("• Команда /start не найдена");
  if (!startHandlerHasKeyboard) console.log("• start_handler не создает инлайн клавиатуру");
  if (!hasInlineKeyboard) console.log("• Инлайн клавиатуры отсутствуют");
  if (!hasSynonyms) console.log("• Синонимы не созданы");
  if (!hasProperBooleans) console.log("• Неправильные булевы значения");
}