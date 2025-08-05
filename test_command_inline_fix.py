#!/usr/bin/env python3
"""
Тестирование исправления команд с inline кнопками
"""
import sys
sys.path.append('client/src/lib')

def test_command_generation():
    """Тест генерации кода команды с inline кнопками"""
    
    # Создаем тестовые данные
    bot_data = {
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "data": {
                    "command": "/start",
                    "messageText": "Добро пожаловать!",
                    "keyboardType": "inline",
                    "buttons": [
                        {"text": "📋 Помощь", "action": "goto", "target": "help-1"}
                    ]
                }
            },
            {
                "id": "help-1", 
                "type": "command",
                "data": {
                    "command": "/help",
                    "messageText": "Справка по боту",
                    "keyboardType": "inline",
                    "buttons": [
                        {"text": "🔙 Назад", "action": "goto", "target": "start-1"}
                    ]
                }
            }
        ],
        "connections": []
    }
    
    # Проверяем генерацию с клиентского генератора
    try:
        from bot_generator import generatePythonCode
        code = generatePythonCode(bot_data, "TestBot")
        
        print("=== СГЕНЕРИРОВАННЫЙ КОД ===")
        print(code)
        print("\n=== ПРОВЕРКА НА ОШИБКИ ===")
        
        # Проверяем на наличие опечаток
        if 'Command(")' in code:
            print("❌ ОШИБКА: Найдена опечатка с лишней скобкой в Command")
        else:
            print("✅ Нет опечаток в генерации команд")
            
        # Проверяем корректность inline кнопок
        if 'InlineKeyboardBuilder()' in code and 'await message.answer(text, reply_markup=keyboard)' in code:
            print("✅ Inline кнопки генерируются правильно")
        else:
            print("❌ Проблемы с генерацией inline кнопок")
            
        # Сохраняем код для тестирования
        with open('test_generated_bot.py', 'w', encoding='utf-8') as f:
            f.write(code)
        print("✅ Код сохранен в test_generated_bot.py")
        
    except Exception as e:
        print(f"❌ Ошибка при генерации: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_command_generation()