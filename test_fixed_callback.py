"""
Тест исправленного генератора callback обработчиков
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_fixed_callback_generator():
    """Тест с минимальным ботом для проверки callback обработчиков"""
    
    # Создаем простую структуру бота
    from client.src.lib.bot_generator import generatePythonCode
    
    # Минимальная структура с start узлом и двумя message узлами
    bot_data = {
        "nodes": [
            {
                "id": "start-node-1",
                "type": "start",
                "data": {
                    "messageText": "Привет! Выберите действие:",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-1",
                            "text": "📊 Информация",
                            "action": "goto",
                            "target": "info-node-2"
                        },
                        {
                            "id": "btn-2", 
                            "text": "⚙️ Настройки",
                            "action": "goto",
                            "target": "settings-node-3"
                        }
                    ]
                }
            },
            {
                "id": "info-node-2",
                "type": "message",
                "data": {
                    "messageText": "Информация о боте:\n\nЭто тестовый бот для проверки callback обработчиков.",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-back-1",
                            "text": "🔙 Назад",
                            "action": "goto",
                            "target": "start-node-1"
                        }
                    ]
                }
            },
            {
                "id": "settings-node-3",
                "type": "message", 
                "data": {
                    "messageText": "Настройки:\n\nЗдесь будут настройки бота.",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-back-2",
                            "text": "🔙 Назад",
                            "action": "goto",
                            "target": "start-node-1"
                        }
                    ]
                }
            }
        ],
        "connections": []
    }
    
    # Генерируем код
    generated_code = generatePythonCode(bot_data, "Тестовый Бот")
    
    # Сохраняем для проверки
    with open("test_fixed_bot.py", "w", encoding="utf-8") as f:
        f.write(generated_code)
    
    print("✅ Код сгенерирован и сохранен в test_fixed_bot.py")
    print("\nПроверим ключевые элементы:")
    
    # Проверяем основные элементы
    checks = [
        ('callback_data="info-node-2"', "Кнопка использует ID узла как callback_data"),
        ('callback_data="settings-node-3"', "Кнопка использует ID узла как callback_data"),
        ('callback_data="start-node-1"', "Кнопка назад использует ID узла как callback_data"),
        ('c.data == "info-node-2"', "Обработчик проверяет правильный callback_data"),
        ('c.data == "settings-node-3"', "Обработчик проверяет правильный callback_data"),
        ('c.data == "start-node-1"', "Обработчик проверяет правильный callback_data"),
        ('await callback_query.answer()', "Обработчик отвечает на callback")
    ]
    
    for check, description in checks:
        if check in generated_code:
            print(f"✅ {description}")
        else:
            print(f"❌ {description}")
    
    return generated_code

if __name__ == "__main__":
    test_fixed_callback_generator()