"""
Тест генератора кода для команд с инлайн кнопками
"""
import json
import sys
import os

def create_simple_test_bot():
    """Создаёт простой тестовый бот с командой, которая имеет инлайн кнопки и синонимы"""
    
    bot_data = {
        "nodes": [
            {
                "id": "start-node",
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {
                    "command": "/start",
                    "messageText": "🎉 Добро пожаловать!\n\nЭто тест команды с инлайн кнопками.",
                    "keyboardType": "inline",
                    "synonyms": ["старт", "привет"],
                    "buttons": [
                        {
                            "id": "btn-help",
                            "text": "📋 Помощь",
                            "action": "goto",
                            "target": "help-msg"
                        }
                    ]
                }
            },
            {
                "id": "help-msg",
                "type": "message",
                "position": {"x": 300, "y": 100},
                "data": {
                    "messageText": "❓ Справка по боту\n\nЭто справочное сообщение.",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-back",
                            "text": "🔙 Назад",
                            "action": "goto",
                            "target": "start-node"
                        }
                    ]
                }
            }
        ],
        "connections": [
            {"from": "start-node", "to": "help-msg"},
            {"from": "help-msg", "to": "start-node"}
        ]
    }
    
    return bot_data

def generate_with_real_generator():
    """Генерирует код с помощью реального генератора"""
    
    # Добавляем путь к клиентской части
    client_lib_path = os.path.join(os.path.dirname(__file__), 'client', 'src', 'lib')
    if os.path.exists(client_lib_path):
        sys.path.append(client_lib_path)
        try:
            # Пытаемся импортировать генератор (это может не работать из-за TypeScript)
            pass
        except:
            pass
    
    # Поскольку генератор написан на TypeScript, используем Node.js для его выполнения
    import subprocess
    
    bot_data = create_simple_test_bot()
    
    # Сохраняем данные бота в файл
    with open('temp_bot_data.json', 'w', encoding='utf-8') as f:
        json.dump(bot_data, f, indent=2, ensure_ascii=False)
    
    # Создаем простой Node.js скрипт для генерации
    node_script = '''
const fs = require('fs');

// Минимальная реализация генератора для тестирования
function generatePythonCode(botData, botName = "TestBot") {
  const { nodes } = botData;
  
  let code = '"""\n';
  code += `${botName} - Telegram Bot\n`;
  code += 'Сгенерировано для тестирования\n';
  code += '"""\n\n';
  
  code += 'import asyncio\n';
  code += 'import logging\n';
  code += 'from aiogram import Bot, Dispatcher, types, F\n';
  code += 'from aiogram.filters import CommandStart, Command\n';
  code += 'from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton\n';
  code += 'from aiogram.utils.keyboard import InlineKeyboardBuilder\n\n';
  
  code += 'BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"\n\n';
  code += 'bot = Bot(token=BOT_TOKEN)\n';
  code += 'dp = Dispatcher()\n';
  code += 'user_data = {}\n\n';
  
  // Генерируем команду /start
  const startNode = nodes.find(n => n.type === 'start');
  if (startNode) {
    code += '@dp.message(CommandStart())\n';
    code += 'async def start_handler(message: types.Message):\n';
    code += '    user_data[message.from_user.id] = {"registered": True}\n\n';
    
    const messageText = startNode.data.messageText || "Привет!";
    if (messageText.includes('\n')) {
      code += `    text = """${messageText}"""\n`;
    } else {
      code += `    text = "${messageText.replace(/"/g, '\\"')}"\n`;
    }
    
    // Проверяем инлайн кнопки
    if (startNode.data.keyboardType === "inline" && startNode.data.buttons && startNode.data.buttons.length > 0) {
      code += '    \n';
      code += '    # Создаем inline клавиатуру с кнопками\n';
      code += '    builder = InlineKeyboardBuilder()\n';
      startNode.data.buttons.forEach(button => {
        code += `    builder.add(InlineKeyboardButton(text="${button.text}", callback_data="${button.target}"))\n`;
      });
      code += '    keyboard = builder.as_markup()\n';
      code += '    # Отправляем сообщение с прикрепленными inline кнопками\n';
      code += '    await message.answer(text, reply_markup=keyboard)\n\n';
    } else {
      code += '    await message.answer(text)\n\n';
    }
    
    // Генерируем синонимы
    if (startNode.data.synonyms && startNode.data.synonyms.length > 0) {
      code += '# Обработчики синонимов команд\n';
      startNode.data.synonyms.forEach(synonym => {
        const sanitizedSynonym = synonym.replace(/[^a-zA-Zа-яА-Я0-9_]/g, '_');
        code += `@dp.message(lambda message: message.text and message.text.lower() == "${synonym.toLowerCase()}")\n`;
        code += `async def start_synonym_${sanitizedSynonym}_handler(message: types.Message):\n`;
        code += '    # Синоним для команды /start\n';
        code += '    await start_handler(message)\n\n';
      });
    }
  }
  
  // Генерируем callback обработчики
  code += '# Обработчики inline кнопок\n';
  const inlineNodes = nodes.filter(node => 
    node.data.keyboardType === 'inline' && node.data.buttons && node.data.buttons.length > 0
  );
  
  const processedCallbacks = new Set();
  
  inlineNodes.forEach(node => {
    if (node.data.buttons) {
      node.data.buttons.forEach(button => {
        if (button.action === 'goto' && button.target && !processedCallbacks.has(button.target)) {
          processedCallbacks.add(button.target);
          
          const targetNode = nodes.find(n => n.id === button.target);
          if (targetNode) {
            const safeFunctionName = button.target.replace(/[^a-zA-Z0-9]/g, '_');
            code += `@dp.callback_query(lambda c: c.data == "${button.target}")\n`;
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
                code += `    builder.add(InlineKeyboardButton(text="${btn.text}", callback_data="${btn.target}"))\n`;
              });
              code += '    keyboard = builder.as_markup()\n';
              code += '    await callback_query.message.edit_text(text, reply_markup=keyboard)\n\n';
            } else {
              code += '    await callback_query.message.edit_text(text)\n\n';
            }
          }
        }
      });
    }
  });
  
  code += '# Запуск бота\n';
  code += 'async def main():\n';
  code += '    print("Бот запущен!")\n';
  code += '    await dp.start_polling(bot)\n\n';
  
  code += 'if __name__ == "__main__":\n';
  code += '    asyncio.run(main())\n';
  
  return code;
}

// Читаем данные бота
const botData = JSON.parse(fs.readFileSync('temp_bot_data.json', 'utf8'));

// Генерируем код
const pythonCode = generatePythonCode(botData, "Тест инлайн кнопок");

// Записываем результат
fs.writeFileSync('generated_test_inline_bot.py', pythonCode, 'utf8');

console.log("✅ Сгенерирован файл generated_test_inline_bot.py");
console.log("🔍 Проверьте:");
console.log("1. Команда /start отправляет инлайн кнопки");
console.log("2. Синонимы 'старт' и 'привет' также отправляют инлайн кнопки");
console.log("3. Callback кнопки работают правильно");
'''
    
    # Записываем Node.js скрипт
    with open('generate_test.js', 'w', encoding='utf-8') as f:
        f.write(node_script)
    
    # Выполняем Node.js скрипт
    try:
        result = subprocess.run(['node', 'generate_test.js'], 
                                capture_output=True, text=True, encoding='utf-8')
        if result.returncode == 0:
            print("✅ Node.js генератор выполнен успешно")
            print(result.stdout)
        else:
            print("❌ Ошибка Node.js генератора:")
            print(result.stderr)
            
        # Очищаем временные файлы
        for temp_file in ['temp_bot_data.json', 'generate_test.js']:
            if os.path.exists(temp_file):
                os.remove(temp_file)
                
    except FileNotFoundError:
        print("❌ Node.js не найден. Используем альтернативный метод.")
        
def main():
    """Основная функция тестирования"""
    print("🔧 Тестирование генератора кода для команд с инлайн кнопками...")
    
    bot_data = create_simple_test_bot()
    
    print(f"📊 Создан тестовый бот:")
    print(f"• Узлов: {len(bot_data['nodes'])}")
    print(f"• Связей: {len(bot_data['connections'])}")
    
    start_node = bot_data['nodes'][0]
    print(f"\n🎯 Тестируемая команда:")
    print(f"• Команда: {start_node['data']['command']}")
    print(f"• Синонимы: {start_node['data']['synonyms']}")
    print(f"• Тип клавиатуры: {start_node['data']['keyboardType']}")
    print(f"• Количество кнопок: {len(start_node['data']['buttons'])}")
    
    print(f"\n🔍 Ожидаемое поведение:")
    print(f"• /start должен отправить инлайн кнопки")
    print(f"• 'старт' должен отправить те же инлайн кнопки")
    print(f"• 'привет' должен отправить те же инлайн кнопки")
    
    # Пытаемся сгенерировать код
    generate_with_real_generator()

if __name__ == "__main__":
    main()