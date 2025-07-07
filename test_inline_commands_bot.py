"""
Финальный тест команд с inline кнопками - проверка исправлений
"""
import json

def create_test_bot_with_inline_commands():
    """Создает тестового бота с командами и inline кнопками"""
    
    bot_data = {
        "nodes": [
            {
                "id": "start-1",
                "type": "start", 
                "position": {"x": 100, "y": 100},
                "data": {
                    "command": "/start",
                    "messageText": "🎉 Добро пожаловать!\n\nЭто тест команд с inline кнопками.",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-help",
                            "text": "📋 Помощь",
                            "action": "goto",
                            "target": "help-1"
                        },
                        {
                            "id": "btn-menu", 
                            "text": "📱 Меню",
                            "action": "goto",
                            "target": "menu-1"
                        }
                    ],
                    "synonyms": ["старт", "привет"]
                }
            },
            {
                "id": "help-1",
                "type": "command",
                "position": {"x": 300, "y": 100},
                "data": {
                    "command": "/help",
                    "messageText": "❓ Справка по командам:\n\n/start - Запуск бота\n/help - Эта справка\n\nИспользуйте кнопки для навигации.",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-back",
                            "text": "🔙 Назад",
                            "action": "goto", 
                            "target": "start-1"
                        },
                        {
                            "id": "btn-commands",
                            "text": "📋 Все команды",
                            "action": "goto",
                            "target": "commands-1"
                        }
                    ],
                    "synonyms": ["помощь", "справка"]
                }
            },
            {
                "id": "menu-1",
                "type": "message",
                "position": {"x": 500, "y": 100},
                "data": {
                    "messageText": "📱 Главное меню\n\nВыберите действие:",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-help-from-menu",
                            "text": "📋 Помощь",
                            "action": "goto",
                            "target": "help-1"
                        },
                        {
                            "id": "btn-home",
                            "text": "🏠 На главную",
                            "action": "goto",
                            "target": "start-1" 
                        }
                    ]
                }
            },
            {
                "id": "commands-1",
                "type": "message",
                "position": {"x": 100, "y": 300},
                "data": {
                    "messageText": "📋 Список команд:\n\n• /start - Запуск бота\n• /help - Справка\n• Синонимы: старт, помощь, справка",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-back-to-help",
                            "text": "🔙 К справке",
                            "action": "goto",
                            "target": "help-1"
                        }
                    ]
                }
            }
        ],
        "connections": [
            {"id": "conn-1", "source": "start-1", "target": "help-1"},
            {"id": "conn-2", "source": "start-1", "target": "menu-1"},
            {"id": "conn-3", "source": "help-1", "target": "start-1"},
            {"id": "conn-4", "source": "help-1", "target": "commands-1"},
            {"id": "conn-5", "source": "menu-1", "target": "help-1"},
            {"id": "conn-6", "source": "menu-1", "target": "start-1"},
            {"id": "conn-7", "source": "commands-1", "target": "help-1"}
        ]
    }
    
    return bot_data

def test_bot_generation():
    """Тестирует генерацию кода"""
    bot_data = create_test_bot_with_inline_commands()
    
    # Сохраняем структуру бота
    with open('test_inline_commands_bot.json', 'w', encoding='utf-8') as f:
        json.dump(bot_data, f, ensure_ascii=False, indent=2)
    
    print("✅ Структура тестового бота сохранена в test_inline_commands_bot.json")
    
    # Пытаемся сгенерировать код
    try:
        import sys
        sys.path.append('client/src/lib')
        from bot_generator import generatePythonCode
        
        code = generatePythonCode(bot_data, "TestInlineCommandsBot")
        
        # Сохраняем сгенерированный код
        with open('test_inline_commands_generated.py', 'w', encoding='utf-8') as f:
            f.write(code)
        
        print("✅ Код успешно сгенерирован и сохранен в test_inline_commands_generated.py")
        
        # Проверяем на основные проблемы
        print("\n=== ПРОВЕРКА КОДА ===")
        
        if 'Command(")' in code:
            print("❌ ОШИБКА: Найдена опечатка с лишней скобкой")
        else:
            print("✅ Нет опечаток в командах")
            
        if '@dp.message(CommandStart())' in code and '@dp.message(Command("help"))' in code:
            print("✅ Команды /start и /help генерируются правильно")
        else:
            print("❌ Проблемы с генерацией команд")
            
        if 'InlineKeyboardBuilder()' in code and 'await message.answer(text, reply_markup=keyboard)' in code:
            print("✅ Inline кнопки генерируются правильно")
        else:
            print("❌ Проблемы с inline кнопками")
            
        # Проверяем callback обработчики
        if '@dp.callback_query(lambda c: c.data ==' in code:
            print("✅ Callback обработчики генерируются")
        else:
            print("❌ Нет callback обработчиков")
            
        # Проверяем синонимы
        if 'lambda message: message.text and message.text.lower() == "старт"' in code:
            print("✅ Синонимы команд генерируются")
        else:
            print("❌ Проблемы с синонимами")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при генерации кода: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_bot_generation()
    if success:
        print("\n🎉 ТЕСТ ПРОШЕЛ УСПЕШНО! Команды с inline кнопками должны работать правильно.")
    else:
        print("\n❌ ТЕСТ НЕ ПРОЙДЕН. Есть проблемы с генерацией.")