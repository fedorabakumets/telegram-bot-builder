#!/usr/bin/env python3
"""
Тест: пользовательская команда с инлайн кнопками
Этот тест проверяет работу кастомных команд с случайными ID
"""

import json
import requests
import sys
import os

# Добавляем путь к клиентской части для импорта
sys.path.append('./client/src')

def generatePythonCode(botData, botName):
    """Генерируем код через API экспорта"""
    try:
        # Сначала создаем временный проект с нашими данными
        project_data = {
            "name": botName,
            "description": "Тестовый проект",
            "data": botData
        }
        
        # Создаем проект
        create_response = requests.post('http://localhost:5000/api/projects', 
                                      json=project_data)
        if create_response.status_code != 201:
            print(f"Ошибка создания проекта: {create_response.status_code}")
            return None
            
        project_id = create_response.json()['id']
        
        # Генерируем код через API экспорта
        export_response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export')
        if export_response.status_code == 200:
            return export_response.json()['code']
        else:
            print(f"Ошибка экспорта: {export_response.status_code}")
            return None
    except Exception as e:
        print(f"Ошибка запроса: {e}")
        return None

def create_custom_command_test():
    """Создает тестовый бот с пользовательской командой и случайными ID"""
    
    bot_data = {
        "nodes": [
            {
                "id": "start-1",  # Стандартный ID шаблона
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {
                    "command": "/start",
                    "messageText": "🎉 Добро пожаловать!\n\nЭто тест пользовательских команд с инлайн кнопками.",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-custom-help",
                            "text": "📋 Помощь",
                            "action": "goto",
                            "target": "9vy4sGAbnibg4TYr9Xs72"  # Случайный ID пользовательской команды
                        }
                    ]
                }
            },
            {
                "id": "9vy4sGAbnibg4TYr9Xs72",  # Случайный ID как в реальной системе
                "type": "command",
                "position": {"x": 300, "y": 100},
                "data": {
                    "command": "/help",
                    "messageText": "❓ Это пользовательская команда помощи\n\nСоздана с случайным ID!",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-back-to-start",
                            "text": "🔙 Назад в меню",
                            "action": "goto",
                            "target": "start-1"
                        }
                    ]
                }
            }
        ],
        "connections": [
            {
                "id": "conn1",
                "from": "start-1",
                "to": "9vy4sGAbnibg4TYr9Xs72"
            }
        ]
    }
    
    return bot_data

def test_custom_command_generation():
    """Тестирует генерацию кода для пользовательской команды"""
    print("🧪 ТЕСТ: Пользовательская команда с инлайн кнопками")
    print("=" * 50)
    
    # Создаем тестовые данные
    bot_data = create_custom_command_test()
    
    # Генерируем код
    generated_code = generatePythonCode(bot_data, "Тест пользовательской команды")
    
    # Сохраняем в файл для проверки
    with open('generated_custom_command_test.py', 'w', encoding='utf-8') as f:
        f.write(generated_code)
    
    print("✅ Код сгенерирован и сохранен в 'generated_custom_command_test.py'")
    
    # Анализируем код
    print("\n📊 АНАЛИЗ СГЕНЕРИРОВАННОГО КОДА:")
    print("-" * 30)
    
    # Проверяем наличие обработчиков
    issues = []
    
    # 1. Проверяем обработчик команды /start
    if '@dp.message(CommandStart())' in generated_code:
        print("✅ Обработчик команды /start найден")
    else:
        issues.append("❌ Отсутствует обработчик команды /start")
    
    # 2. Проверяем обработчик команды /help
    if '@dp.message(Command("help"))' in generated_code:
        print("✅ Обработчик команды /help найден")
    else:
        issues.append("❌ Отсутствует обработчик команды /help")
    
    # 3. Проверяем callback обработчик для случайного ID
    callback_pattern = 'lambda c: c.data == "9vy4sGAbnibg4TYr9Xs72"'
    if callback_pattern in generated_code:
        print("✅ Callback обработчик для случайного ID найден")
    else:
        issues.append("❌ Отсутствует callback обработчик для случайного ID")
    
    # 4. Проверяем функцию обработчика
    function_pattern = 'async def handle_callback_9vy4sGAbnibg4TYr9Xs72'
    if function_pattern in generated_code:
        print("✅ Функция callback обработчика найдена")
    else:
        issues.append("❌ Отсутствует функция callback обработчика")
    
    # 5. Проверяем InlineKeyboardButton с правильным callback_data
    button_pattern = 'callback_data="9vy4sGAbnibg4TYr9Xs72"'
    if button_pattern in generated_code:
        print("✅ Inline кнопка с правильным callback_data найдена")
    else:
        issues.append("❌ Inline кнопка с неправильным callback_data")
    
    # 6. Проверяем обратную кнопку
    back_button_pattern = 'callback_data="start-1"'
    if back_button_pattern in generated_code:
        print("✅ Обратная кнопка с правильным callback_data найдена")
    else:
        issues.append("❌ Обратная кнопка с неправильным callback_data")
    
    print(f"\n📈 РЕЗУЛЬТАТ: {6 - len(issues)}/6 проверок прошли успешно")
    
    if issues:
        print("\n🚨 НАЙДЕННЫЕ ПРОБЛЕМЫ:")
        for issue in issues:
            print(f"  {issue}")
        return False
    else:
        print("\n🎉 ВСЕ ПРОВЕРКИ ПРОШЛИ УСПЕШНО!")
        print("Пользовательские команды с инлайн кнопками должны работать корректно")
        return True

def main():
    """Основная функция тестирования"""
    success = test_custom_command_generation()
    
    if not success:
        print("\n💡 РЕКОМЕНДАЦИИ:")
        print("1. Проверьте функцию generatePythonCode в client/src/lib/bot-generator.ts")
        print("2. Убедитесь что callback_data правильно генерируется для случайных ID")
        print("3. Проверьте что функции обработчиков создаются с правильными именами")

if __name__ == "__main__":
    main()