#!/usr/bin/env python3
"""
Тест проблемы с интерфейсом: почему inline кнопки не работают в пользовательских командах
"""

import requests
import json

def test_template_vs_custom_difference():
    """Сравниваем шаблонные команды с пользовательскими"""
    print("🔍 СРАВНЕНИЕ ШАБЛОННЫХ И ПОЛЬЗОВАТЕЛЬСКИХ КОМАНД")
    print("=" * 55)
    
    # 1. Создаем бот с шаблонной командой (работает)
    template_bot = {
        "nodes": [
            {
                "id": "start-1",  # Шаблонный ID
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {
                    "command": "/start",
                    "messageText": "Привет! Это шаблонная команда",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-help",
                            "text": "📋 Помощь",
                            "action": "goto",
                            "target": "help-1"  # Шаблонный ID
                        }
                    ]
                }
            },
            {
                "id": "help-1",  # Шаблонный ID
                "type": "command",
                "position": {"x": 300, "y": 100},
                "data": {
                    "command": "/help",
                    "messageText": "Это помощь от шаблона",
                    "keyboardType": "none",
                    "buttons": []
                }
            }
        ],
        "connections": []
    }
    
    # 2. Создаем бот с пользовательской командой (не работает?)
    custom_bot = {
        "nodes": [
            {
                "id": "start-1",  # Шаблонный ID  
                "type": "start",
                "position": {"x": 100, "y": 100},
                "data": {
                    "command": "/start",
                    "messageText": "Привет! Это пользовательская команда",
                    "keyboardType": "inline",
                    "buttons": [
                        {
                            "id": "btn-custom-help",
                            "text": "📋 Помощь",
                            "action": "goto",
                            "target": "AbC123XyZ789Random"  # Случайный ID
                        }
                    ]
                }
            },
            {
                "id": "AbC123XyZ789Random",  # Случайный ID
                "type": "command",
                "position": {"x": 300, "y": 100},
                "data": {
                    "command": "/help",
                    "messageText": "Это помощь от пользователя",
                    "keyboardType": "none", 
                    "buttons": []
                }
            }
        ],
        "connections": []
    }
    
    # Тестируем оба варианта
    results = {}
    
    for name, bot_data in [("Шаблонный", template_bot), ("Пользовательский", custom_bot)]:
        print(f"\n🧪 Тестируем {name.lower()} бот...")
        
        try:
            # Создаем проект
            response = requests.post('http://localhost:5000/api/projects', 
                                   json={
                                       "name": f"Тест {name.lower()} команд",
                                       "description": f"Тест {name.lower()} inline кнопок",
                                       "data": bot_data
                                   })
            
            if response.status_code == 201:
                project_id = response.json()['id']
                
                # Генерируем код
                export_response = requests.post(f'http://localhost:5000/api/projects/{project_id}/export')
                
                if export_response.status_code == 200:
                    code = export_response.json()['code']
                    
                    # Анализируем код
                    analysis = analyze_generated_code(code, name)
                    results[name] = analysis
                    
                    # Сохраняем код для проверки
                    filename = f"generated_{name.lower()}_test.py"
                    with open(filename, 'w', encoding='utf-8') as f:
                        f.write(code)
                    print(f"✅ Код сохранен: {filename}")
                    
                else:
                    print(f"❌ Ошибка экспорта: {export_response.status_code}")
            else:
                print(f"❌ Ошибка создания проекта: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Ошибка: {e}")
    
    # Сравниваем результаты
    print(f"\n📊 СРАВНЕНИЕ РЕЗУЛЬТАТОВ:")
    print("-" * 30)
    
    if len(results) == 2:
        template_result = results["Шаблонный"]
        custom_result = results["Пользовательский"]
        
        print(f"Шаблонный бот:")
        print(f"  - Inline кнопки: {template_result['inline_buttons']}")
        print(f"  - Callback обработчики: {template_result['callback_handlers']}")
        print(f"  - Валидные callback_data: {template_result['valid_callbacks']}")
        print(f"  - Пустые callback_data: {template_result['empty_callbacks']}")
        
        print(f"Пользовательский бот:")
        print(f"  - Inline кнопки: {custom_result['inline_buttons']}")
        print(f"  - Callback обработчики: {custom_result['callback_handlers']}")
        print(f"  - Валидные callback_data: {custom_result['valid_callbacks']}")
        print(f"  - Пустые callback_data: {custom_result['empty_callbacks']}")
        
        # Проверяем различия
        if (template_result['callback_handlers'] > 0 and 
            custom_result['callback_handlers'] > 0 and
            template_result['empty_callbacks'] == 0 and
            custom_result['empty_callbacks'] == 0):
            print(f"\n✅ ОБА ВАРИАНТА ВЫГЛЯДЯТ ПРАВИЛЬНО!")
            print("Проблема может быть не в генераторе кода")
        else:
            print(f"\n❌ НАЙДЕНЫ РАЗЛИЧИЯ!")
            if custom_result['empty_callbacks'] > 0:
                print("  - Пользовательский бот имеет пустые callback_data")
            if custom_result['callback_handlers'] == 0:
                print("  - Пользовательский бот не имеет callback обработчиков")

def analyze_generated_code(code, bot_type):
    """Анализирует сгенерированный код"""
    return {
        'inline_buttons': code.count('InlineKeyboardBuilder()'),
        'callback_handlers': code.count('@dp.callback_query'),
        'empty_callbacks': code.count('callback_data=""'),
        'valid_callbacks': len([line for line in code.split('\n') 
                               if 'callback_data=' in line and 'callback_data=""' not in line]),
        'syntax_valid': check_syntax(code)
    }

def check_syntax(code):
    """Проверяет синтаксис Python кода"""
    try:
        compile(code, '<string>', 'exec')
        return True
    except SyntaxError as e:
        print(f"❌ Синтаксическая ошибка: {e}")
        return False

def main():
    """Основная функция"""
    test_template_vs_custom_difference()

if __name__ == "__main__":
    main()