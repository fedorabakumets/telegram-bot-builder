"""
Тест выходного кода генератора для проверки исправления проблемы
"""
import json

def create_test_bot_data():
    """Создает тестовые данные бота с командами и инлайн кнопками"""
    return {
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
                            "target": "help-cmd"
                        },
                        {
                            "id": "btn-menu",
                            "text": "📱 Меню",
                            "action": "goto",
                            "target": "menu-msg"
                        }
                    ]
                }
            },
            {
                "id": "help-cmd",
                "type": "command",
                "position": {"x": 300, "y": 100},
                "data": {
                    "command": "/help",
                    "messageText": "❓ Справка:\n\n/start - Запуск\n/help - Справка",
                    "keyboardType": "inline", 
                    "synonyms": ["помощь", "справка"],
                    "buttons": [
                        {
                            "id": "btn-back",
                            "text": "🔙 Назад",
                            "action": "goto",
                            "target": "start-node"
                        }
                    ]
                }
            },
            {
                "id": "menu-msg",
                "type": "message",
                "position": {"x": 100, "y": 300},
                "data": {
                    "messageText": "📱 Меню бота",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-info",
                            "text": "ℹ️ Информация", 
                            "action": "goto",
                            "target": "start-node"
                        }
                    ]
                }
            }
        ],
        "connections": [
            {"from": "start-node", "to": "help-cmd"},
            {"from": "start-node", "to": "menu-msg"},
            {"from": "help-cmd", "to": "start-node"},
            {"from": "menu-msg", "to": "start-node"}
        ]
    }

def test_current_generator():
    """Тестирует текущий генератор кода через веб-интерфейс"""
    
    bot_data = create_test_bot_data()
    
    print("🔧 Создание тестового бота для проверки генератора...")
    print(f"📊 Узлов: {len(bot_data['nodes'])}")
    print(f"🔗 Связей: {len(bot_data['connections'])}")
    
    # Анализируем структуру
    start_node = bot_data['nodes'][0]
    help_node = bot_data['nodes'][1]
    
    print(f"\n🎯 Анализ команд:")
    print(f"Start команда: {start_node['data']['command']}")
    print(f"  • Тип клавиатуры: {start_node['data']['keyboardType']}")
    print(f"  • Кнопок: {len(start_node['data']['buttons'])}")
    print(f"  • Синонимы: {start_node['data']['synonyms']}")
    
    print(f"Help команда: {help_node['data']['command']}")
    print(f"  • Тип клавиатуры: {help_node['data']['keyboardType']}")
    print(f"  • Кнопок: {len(help_node['data']['buttons'])}")
    print(f"  • Синонимы: {help_node['data']['synonyms']}")
    
    # Сохраняем для использования в веб-интерфейсе
    with open('test_bot_for_generator.json', 'w', encoding='utf-8') as f:
        json.dump(bot_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Сохранен test_bot_for_generator.json")
    print(f"\n🧪 Следующие шаги:")
    print(f"1. Откройте веб-интерфейс конструктора ботов")
    print(f"2. Загрузите данные из test_bot_for_generator.json")
    print(f"3. Экспортируйте Python код")
    print(f"4. Проверьте, что:")
    print(f"   • Команда /start создает и отправляет инлайн кнопки")
    print(f"   • Команда /help создает и отправляет инлайн кнопки") 
    print(f"   • Синонимы 'старт', 'привет' вызывают start_handler")
    print(f"   • Синонимы 'помощь', 'справка' вызывают help_handler")
    print(f"   • В коде нет 'true'/'false', только 'True'/'False'")
    
    return bot_data

def analyze_code_pattern():
    """Анализирует ожидаемый паттерн кода"""
    
    print(f"\n📝 ОЖИДАЕМЫЙ ПАТТЕРН КОДА:")
    print(f"=" * 50)
    
    expected_start = """
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    # Регистрация пользователя...
    
    text = \"\"\"🎉 Добро пожаловать!

Это тест команды с инлайн кнопками.\"\"\"
    
    # Создаем inline клавиатуру с кнопками
    builder = InlineKeyboardBuilder()
    builder.add(InlineKeyboardButton(text="📋 Помощь", callback_data="help-cmd"))
    builder.add(InlineKeyboardButton(text="📱 Меню", callback_data="menu-msg"))
    keyboard = builder.as_markup()
    # Отправляем сообщение с прикрепленными inline кнопками
    await message.answer(text, reply_markup=keyboard)
"""
    
    expected_synonym = """
@dp.message(lambda message: message.text and message.text.lower() == "старт")
async def start_synonym_старт_handler(message: types.Message):
    # Синоним для команды /start
    await start_handler(message)  # ← КЛЮЧЕВОЕ: вызывает основной обработчик
"""
    
    print("✅ ПРАВИЛЬНО - команда /start:")
    print(expected_start)
    
    print("✅ ПРАВИЛЬНО - синоним 'старт':")
    print(expected_synonym)
    
    print("\n❌ НЕПРАВИЛЬНО было бы:")
    print("• Синоним НЕ вызывает start_handler")
    print("• Команда НЕ создает InlineKeyboardBuilder")
    print("• Команда НЕ отправляет reply_markup=keyboard")
    print("• В коде есть resize_keyboard=true (должно быть True)")

def main():
    """Основная функция тестирования"""
    print("🧪 ТЕСТ ИСПРАВЛЕНИЯ ПРОБЛЕМЫ С КОМАНДАМИ И ИНЛАЙН КНОПКАМИ")
    print("=" * 60)
    
    bot_data = test_current_generator()
    analyze_code_pattern()
    
    print(f"\n🔍 Что проверить в сгенерированном коде:")
    print(f"1. ✅ start_handler создает InlineKeyboardBuilder")
    print(f"2. ✅ start_handler отправляет reply_markup=keyboard")
    print(f"3. ✅ help_handler создает InlineKeyboardBuilder") 
    print(f"4. ✅ help_handler отправляет reply_markup=keyboard")
    print(f"5. ✅ Синонимы вызывают await start_handler(message)")
    print(f"6. ✅ Синонимы вызывают await help_handler(message)")
    print(f"7. ✅ Нет 'true'/'false', только 'True'/'False'")
    print(f"8. ✅ Callback обработчики работают правильно")

if __name__ == "__main__":
    main()