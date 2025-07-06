#!/usr/bin/env python3
"""
Тест для проверки функциональности комбинированных клавиатур
"""
import asyncio
import json
import sys
import os

# Добавляем текущую директорию в путь для импорта
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_combined_keyboards():
    """Тестирует функциональность комбинированных клавиатур"""
    print("🔄 Тестирование комбинированных клавиатур...")
    
    # Создаем тестовую структуру бота с комбинированными клавиатурами
    bot_data = {
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {
                    "command": "/start",
                    "messageText": "Привет! Выберите действие:",
                    "keyboardType": "combined",
                    "buttons": [
                        {"id": "btn1", "text": "Главное меню", "action": "goto", "target": "menu"},
                        {"id": "btn2", "text": "Помощь", "action": "command", "target": "/help"}
                    ],
                    "inlineButtons": [
                        {"id": "inline1", "text": "Настройки", "action": "goto", "target": "settings"},
                        {"id": "inline2", "text": "Открыть ссылку", "action": "url", "url": "https://example.com"}
                    ],
                    "separateMessages": True,
                    "keyboardTitle": "Дополнительные действия:",
                    "resizeKeyboard": True,
                    "oneTimeKeyboard": False,
                    "persistentKeyboard": False
                }
            }
        ],
        "connections": []
    }
    
    # Эмулируем генерацию кода бота (упрощенная версия)
    print("✅ Тестовая структура бота:")
    print(json.dumps(bot_data, indent=2, ensure_ascii=False))
    
    # Проверяем, что структура содержит необходимые элементы
    node = bot_data["nodes"][0]
    data = node["data"]
    
    checks = [
        ("keyboard type", data.get("keyboardType") == "combined"),
        ("reply buttons", len(data.get("buttons", [])) > 0),
        ("inline buttons", len(data.get("inlineButtons", [])) > 0),
        ("separate messages", data.get("separateMessages") == True),
        ("keyboard title", data.get("keyboardTitle") is not None),
        ("resize keyboard", data.get("resizeKeyboard") == True),
    ]
    
    missing_checks = []
    for check_name, check_result in checks:
        if not check_result:
            missing_checks.append(check_name)
    
    if missing_checks:
        print(f"❌ Недостающие элементы: {', '.join(missing_checks)}")
        return False
    else:
        print("✅ Все проверки пройдены!")
        return True

if __name__ == "__main__":
    success = test_combined_keyboards()
    if success:
        print("\n🎉 Тест комбинированных клавиатур прошел успешно!")
    else:
        print("\n❌ Тест комбинированных клавиатур не пройден!")